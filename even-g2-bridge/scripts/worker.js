/**
 * Even Realities G2 → OpenClaw Gateway Bridge v5 (Cloudflare Worker)
 * 
 * Smart routing:
 * - Short tasks: proxy to Gateway, wait for reply, return to G2
 *   Uses stable session (user: 'g2-glasses') for conversation context
 * - Long tasks: immediately ack G2, background Gateway call with
 *   isolated session, result delivered to Telegram
 * - Image gen: DALL-E → Telegram (G2 can't show images)
 * 
 * Secrets:
 *   GATEWAY_URL, GATEWAY_TOKEN, G2_TOKEN,
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY (fallback)
 */

const LONG_TASK_PATTERNS = /寫.*文章|寫.*blog|寫.*部落格|寫.*程式|寫.*code|寫.*script|寫.*報告|寫.*計畫|寫.*proposal|寫一[篇個段]|幫我寫|幫我做|幫我整理|幫我分析|幫我翻譯|幫我改|建一個|做一個|create.*file|write.*code|write.*article|修改.*程式|改.*code|review.*code|重構|refactor|寫.*函式|寫.*function|草擬|draft|research|研究|寫.*md|寫.*markdown|寫.*email|寫.*貼文|寫.*tweet|部署|deploy|commit|push/i;

const SHORT_TIMEOUT = 22000;  // 22s for short tasks (CF limit ~30s)

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return json(null, 204);
    if (request.method === 'GET') {
      return json({ status: 'ok', agent: 'G2 Bridge', version: '5.0.0',
        gateway: !!env.GATEWAY_URL, telegram: !!env.TELEGRAM_BOT_TOKEN });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    // Auth: G2 → Worker
    if (env.G2_TOKEN) {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.G2_TOKEN}`) return json({ error: 'Unauthorized' }, 401);
    }

    try {
      const body = await request.json();
      const userMsg = (body.messages || []).filter(m => m.role === 'user').pop();
      if (!userMsg?.content) return json({ error: 'No message' }, 400);
      const content = userMsg.content;

      // Route 1: Image generation → Gateway (agent has avatar refs) + Telegram
      if (isImageGenRequest(content)) {
        return handleLongTask(env, ctx, content, '🦞 收到！正在生成圖片，完成後傳到 Telegram 📱');
      }

      // Route 2: Long task → ack G2 + background Gateway + Telegram
      if (isLongTask(content)) {
        return handleLongTask(env, ctx, content);
      }

      // Route 3: Short task → proxy to Gateway with timeout
      return await handleShortTask(env, content);

    } catch (e) {
      return chatResponse(`抱歉，發生錯誤：${e.message}`);
    }
  }
};

// ─── Classification ─────────────────────────────────────────────

function isImageGenRequest(content) {
  return /生成.*圖|畫.*圖|做.*圖|產生.*圖|generate.*image|create.*image|draw.*picture|畫一|幫我畫|幫我生成.*圖|設計.*圖|make.*image|生成.*照片|生成.*海報|做一張/i.test(content);
}

function isLongTask(content) {
  return LONG_TASK_PATTERNS.test(content);
}

// ─── Short Task: proxy → Gateway → G2 ──────────────────────────

async function handleShortTask(env, content) {
  try {
    const reply = await callGateway(env, content, {
      user: 'g2-glasses',  // stable session for context
      timeout: SHORT_TIMEOUT
    });

    // Filter non-displayable content
    if (hasNonDisplayable(reply)) {
      // Can't send to TG in short task (no ctx), just clean it
      return chatResponse(cleanForG2(reply));
    }

    return chatResponse(truncate(reply, 500));
  } catch (e) {
    // Fallback to direct Claude
    if (env.ANTHROPIC_API_KEY) {
      const fallback = await directClaude(env, content);
      return chatResponse(truncate(fallback, 500));
    }
    return chatResponse(`⚡ Gateway 暫時無法連線：${e.message}`);
  }
}

// ─── Long Task: ack G2 + background Gateway → Telegram ─────────

function handleLongTask(env, ctx, content, customAck) {
  // Determine task description for G2 ack
  let taskDesc = '處理任務';
  if (/文章|blog|部落格|貼文/.test(content)) taskDesc = '寫文章';
  else if (/程式|code|script|function|函式/.test(content)) taskDesc = '寫程式';
  else if (/報告|計畫|proposal|draft/.test(content)) taskDesc = '撰寫文件';
  else if (/翻譯/.test(content)) taskDesc = '翻譯';
  else if (/分析|研究|research/.test(content)) taskDesc = '分析研究';
  else if (/整理/.test(content)) taskDesc = '整理資料';
  else if (/deploy|部署|commit|push/.test(content)) taskDesc = '部署';
  else if (/圖|image|draw|picture/.test(content)) taskDesc = '生成圖片';

  // Background: send to Gateway with isolated session + deliver to Telegram
  ctx.waitUntil(executeLongTask(env, content, taskDesc));

  // Immediately respond to G2
  const ackMsg = customAck || `🦞 收到！正在${taskDesc}中... 完成後會傳到 Telegram 📱`;
  return chatResponse(ackMsg);
}

async function executeLongTask(env, content, taskDesc) {
  const taskId = `g2-task-${Date.now()}`;
  
  try {
    // Use isolated session so it doesn't block G2 conversations
    const reply = await callGateway(env, content, {
      user: taskId,
      timeout: 120000  // 2 min for long tasks
    });

    // Send result to Telegram
    await sendToTelegram(env,
      `🦞🕶️ G2 任務完成 ✅\n\n📋 任務: ${content}\n\n💬 結果:\n${reply}`
    );
  } catch (e) {
    // Notify failure
    await sendToTelegram(env,
      `🦞🕶️ G2 任務失敗 ❌\n\n📋 任務: ${content}\n⚠️ 錯誤: ${e.message}\n\n請到 Telegram 重新下達指令。`
    );
  }
}

// ─── Gateway Call ───────────────────────────────────────────────

async function callGateway(env, content, opts = {}) {
  const url = env.GATEWAY_URL;
  const token = env.GATEWAY_TOKEN;
  if (!url || !token) throw new Error('Gateway not configured');

  const res = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-openclaw-agent-id': 'main'
    },
    body: JSON.stringify({
      model: 'openclaw:main',
      messages: [{ role: 'user', content }],
      user: opts.user || 'g2-glasses'
    }),
    signal: AbortSignal.timeout(opts.timeout || SHORT_TIMEOUT)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gateway ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

// ─── Direct Claude (fallback) ───────────────────────────────────

async function directClaude(env, content) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: '你是雲龍蝦 🦞，寶博的 AI 助手。透過 G2 眼鏡對話，回答簡短（2-3句）。繁體中文。不放連結或程式碼。',
      messages: [{ role: 'user', content }]
    })
  });
  const data = await res.json();
  if (data.content?.[0]?.text) return data.content[0].text;
  if (data.error) throw new Error(data.error.message);
  return 'No response';
}

// ─── Image Generation ───────────────────────────────────────────

function handleImageGen(env, ctx, content) {
  if (!env.OPENAI_API_KEY || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return chatResponse('🦞 圖片生成需要額外設定，請到 Telegram 找我！');
  }
  ctx.waitUntil(generateAndSend(env, content));
  return chatResponse('🦞 收到！正在生成圖片，完成後傳到 Telegram 📱');
}

async function generateAndSend(env, prompt) {
  try {
    const enhanced = await directClaude(env,
      `Turn this into a concise DALL-E prompt in English. Output ONLY the prompt.\n\n${prompt}`);
    const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt: enhanced, n: 1, size: '1024x1024' })
    });
    const imgData = await imgRes.json();
    if (imgData.data?.[0]?.url) {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, photo: imgData.data[0].url,
          caption: `🦞🕶️ G2 生圖\n🎨 「${prompt}」` })
      });
    } else throw new Error(imgData.error?.message || 'Failed');
  } catch (e) {
    await sendToTelegram(env, `🦞🕶️ G2 生圖失敗: ${e.message}`);
  }
}

// ─── Telegram ───────────────────────────────────────────────────

async function sendToTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const chunks = splitMsg(text, 4000);
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: chunk, disable_web_page_preview: true })
    }).catch(() => {});
  }
}

function splitMsg(text, max) {
  if (text.length <= max) return [text];
  const chunks = [];
  let r = text;
  while (r.length > 0) {
    if (r.length <= max) { chunks.push(r); break; }
    let i = r.lastIndexOf('\n', max);
    if (i < max * 0.3) i = max;
    chunks.push(r.substring(0, i));
    r = r.substring(i);
  }
  return chunks;
}

// ─── Content Filtering ─────────────────────────────────────────

function hasNonDisplayable(text) {
  return /https?:\/\/\S+|```|\[.*\]\(.*\)/.test(text) || text.length > 600;
}

function cleanForG2(text) {
  return text
    .replace(/```[\s\S]*?```/g, '[程式碼]')
    .replace(/https?:\/\/\S+/gi, '[連結]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .substring(0, 400);
}

function truncate(text, max) {
  return text.length > max ? text.substring(0, max - 3) + '...' : text;
}

// ─── Helpers ────────────────────────────────────────────────────

function chatResponse(content) {
  return json({
    id: `g2-${Date.now()}`, object: 'chat.completion',
    created: Math.floor(Date.now() / 1000), model: 'g2-bridge',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 0, completion_tokens: content.length, total_tokens: content.length }
  });
}

function json(data, status = 200) {
  return new Response(data ? JSON.stringify(data) : null, {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
  });
}
