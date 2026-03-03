# OpenClaw Agent Skills

A collection of **agent skills** compatible with the [Agent Skills](https://agentskills.io/) format. Works with 40+ AI agents including Claude Code, Codex, Cursor, Gemini CLI, OpenClaw, and more.

## Quick Install

```bash
npx skills add dAAAb/openclaw-skills
```

Or install individual skills:

```bash
npx skills add dAAAb/openclaw-skills --skill weather
npx skills add dAAAb/openclaw-skills --skill github
```

## Available Skills

| Skill | Description | Requirements |
|-------|-------------|-------------|
| **[weather](./weather/)** | 🌤️ Weather forecasts via wttr.in / Open-Meteo | `curl` |
| **[github](./github/)** | 🐙 GitHub operations via `gh` CLI | `gh` |
| **[summarize](./summarize/)** | 📝 Summarize URLs, videos, podcasts | `curl` |
| **[nano-banana-pro](./nano-banana-pro/)** | 🎨 Generate/edit images via Gemini | `uv`, Google AI API key |
| **[nano-pdf](./nano-pdf/)** | 📄 Edit PDFs with natural language | `nano-pdf` (pip) |
| **[openai-whisper-api](./openai-whisper-api/)** | 🎤 Transcribe audio via OpenAI Whisper | OpenAI API key |
| **[sag](./sag/)** | 🔊 Text-to-speech via ElevenLabs | `sag` CLI, ElevenLabs API key |
| **[blogwatcher](./blogwatcher/)** | 📡 Monitor blogs and RSS/Atom feeds | `blogwatcher` CLI |
| **[switchbot](./switchbot/)** | 🏠 Control SwitchBot smart home devices | Python 3, SwitchBot API key |
| **[base-wallet](./base-wallet/)** | 🔐 Crypto wallet for AI agents (Base chain) | Node.js, ethers.js |

## What are Agent Skills?

Skills are packaged instructions (`SKILL.md`) and optional scripts that extend AI agent capabilities. They follow the open [Agent Skills specification](https://agentskills.io/specification.md).

Each skill contains:
- `SKILL.md` — Instructions for the agent (required)
- `scripts/` — Helper scripts for automation (optional)

## For OpenClaw Users

These skills are also available via [ClawHub](https://clawhub.com):

```bash
clawhub install weather
clawhub install github
```

## Contributing

1. Fork this repo
2. Add your skill as a new directory with a `SKILL.md`
3. Follow the [Agent Skills specification](https://agentskills.io/specification.md)
4. Submit a PR

## License

MIT

---

Built with 🦞 by [OpenClaw](https://openclaw.ai) — the AI agent platform.
