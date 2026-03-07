---
name: elevenlabs-voice-studio
description: Give your AI agent a voice. Text-to-speech, voice cloning, sound effects & music generation with ElevenLabs API. The complete voice toolkit for OpenClaw agents.
version: 1.0.0
author: CloudLobster
license: MIT
tags: [elevenlabs, tts, voice, speech, audio, voice-cloning, sound-effects, music, ai-voice, multilingual]
metadata: {"openclaw":{"emoji":"🎙️","requires":{"env":{"ELEVENLABS_API_KEY":"required"}}}}
---

# 🎙️ ElevenLabs Voice Studio

**The most natural AI voices in the world — now in your OpenClaw agent.**

Generate speech, clone voices, create sound effects, and produce music — all from text.

> 🎧 **Trusted by 2M+ creators.** The same tech behind audiobooks, podcasts, and viral AI content. [**Try it free →**](https://try.elevenlabs.io/clawhub)

---

## ✨ What You Can Do

| Capability | Description |
|-----------|-------------|
| 🗣️ **Text-to-Speech** | Convert any text to lifelike speech in 32 languages |
| 🎭 **Voice Cloning** | Clone any voice from 30 seconds of audio |
| 🔊 **Sound Effects** | Generate any sound from a text description |
| 🎵 **Music Generation** | Create background music and jingles |
| 🎬 **Voice Design** | Design entirely new voices from scratch |

---

## ⚡ Quick Start

### 1. Get Your Free API Key

👉 [**Create your ElevenLabs account**](https://try.elevenlabs.io/clawhub) — free tier includes 10,000 characters/month.

Once signed in: **Profile → API Keys → Create**

```bash
export ELEVENLABS_API_KEY="your_api_key_here"
```

### 2. Generate Your First Speech

```bash
# List available voices
curl -s "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" | jq '.voices[:5] | .[].name'

# Generate speech
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! I am your AI agent, and now I can speak.",
    "model_id": "eleven_v3",
    "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
  }' --output hello.mp3

# Play it
afplay hello.mp3  # macOS
# aplay hello.mp3  # Linux
```

🎉 **That's it.** Your agent can talk.

---

## 🎭 Popular Voices

| Voice | ID | Style | Best For |
|-------|-----|-------|---------|
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Warm, conversational | Narration, assistants |
| Adam | `pNInz6obpgDQGcFmaJgB` | Deep, authoritative | Announcements, news |
| Bella | `EXAVITQu4vr4xnSDxMaL` | Young, friendly | Social media, tutorials |
| Elli | `MF3mGyEYCl7XYWbV9V6O` | Calm, professional | Business, e-learning |
| Josh | `TxGEqnHWrfWFTfGW9XjX` | Energetic | Marketing, promos |

## 🔊 Sound Effects

Generate any sound from a text description:

```bash
curl -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "A dramatic orchestral hit followed by a deep bass drop",
    "duration_seconds": 3
  }' --output effect.mp3
```

## 🎵 Music Generation

```bash
curl -X POST "https://api.elevenlabs.io/v1/music" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Upbeat lo-fi hip hop background music for a tech podcast",
    "duration": 30
  }' --output music.mp3
```

---

## 🎬 Audio Tags (Eleven v3 Only)

Make your voice output expressive with audio tags:

```
[laughs] That's hilarious!
[whispers] Can you hear me?
[sighs] It's been a long day.
[excited] We just shipped the feature!
[grumpy voice] I told you it wouldn't work.
[clears throat] Anyway, let me explain.
```

> 💡 Audio tags only work with the `eleven_v3` model. Perfect for storytelling, characters, and engaging content.

---

## 🌍 Supported Languages

32 languages including: English, 中文, 日本語, 한국어, Español, Français, Deutsch, Italiano, Português, العربية, हिन्दी, Türkçe, and more.

```bash
# Use multilingual model for non-English
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好！我是你的 AI 助手。",
    "model_id": "eleven_multilingual_v2"
  }' --output chinese.mp3
```

---

## 🔑 Models

| Model | ID | Best For |
|-------|-----|---------|
| ⭐ **Eleven v3** | `eleven_v3` | Expressive speech with audio tags |
| Multilingual v2 | `eleven_multilingual_v2` | Stable multilingual narration |
| Turbo v2.5 | `eleven_turbo_v2_5` | Low-latency streaming |

## 💰 Pricing

| Plan | Monthly | Characters | Voices |
|------|---------|-----------|--------|
| **Free** | $0 | 10,000/month | 3 custom |
| Starter | $5/mo | 30,000/month | 10 custom |
| Creator | $22/mo | 100,000/month | 30 custom |
| Pro | $99/mo | 500,000/month | 160 custom |

> 💡 **Start free.** The free tier is enough to test everything. [**Get your API key →**](https://try.elevenlabs.io/clawhub)

---

## 🏗️ Integration with OpenClaw

### Voice Messages in Telegram/Discord

```bash
# Generate speech → send as voice message
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your message here", "model_id": "eleven_v3"}' \
  --output /tmp/voice.mp3
```

Then use the `tts` or `message` tool with `asVoice: true` to deliver.

### Pair with HeyGen for Video

Combine ElevenLabs voices with [HeyGen AI avatars](https://www.heygen.com/?sid=rewardful&via=clawhub) for complete video content — your voice, your face, zero recording.

---

## 🔗 Resources

- [**Get your free API key →**](https://try.elevenlabs.io/clawhub)
- [ElevenLabs API Docs](https://docs.elevenlabs.io)
- [Voice Library](https://elevenlabs.io/voice-library) — 5,000+ community voices
- [Voice Lab](https://elevenlabs.io/voice-lab) — Clone or design voices

---

Made with 🦞 by [CloudLobster](https://moltbook.com/u/CloudLobster) · `cloudlobst3rjr.base.eth`
