# claude-translate-hook

Claude Code hook that automatically translates non-English prompts to English using Gemini Flash API.

- Translates user input (non-English -> English) before sending to Claude
- Optionally instructs Claude to respond in your language (bidirectional mode)
- Preserves code blocks, inline code, and quoted text as-is
- Cross-platform: macOS, Linux, Windows

## Install

```bash
npx claude-translate-hook install
```

The installer will:
1. Prompt for your Gemini API key (if not already set)
2. Ask which translation mode you want
3. Add the hook to `~/.claude/settings.json`

## Uninstall

```bash
npx claude-translate-hook uninstall
```

## Configuration

```bash
# Show current config
npx claude-translate-hook config

# Set Gemini API key (takes priority over GEMINI_API_KEY env var)
npx claude-translate-hook config set apiKey YOUR_KEY

# Translation mode: "input-only" or "bidirectional"
npx claude-translate-hook config set mode bidirectional

# Target language for Claude's responses (used in bidirectional mode)
npx claude-translate-hook config set targetLanguage Korean
```

### Config options

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `input-only` | `input-only`: translate input to English. `bidirectional`: also ask Claude to respond in your language |
| `targetLanguage` | `Korean` | Language for Claude's responses (bidirectional mode) |
| `apiKey` | _(empty)_ | Gemini API key. Falls back to `GEMINI_API_KEY` env var |

### API Key priority

1. Config file key (`~/.claude/translate-hook.json` → `apiKey`)
2. Environment variable `GEMINI_API_KEY`

## How it works

This tool registers a `UserPromptSubmit` hook in Claude Code. When you submit a prompt:

1. Checks if the prompt contains non-English characters (ignoring code blocks/inline code)
2. If yes, calls Gemini Flash API to translate to English
3. Injects the translation as additional context via `additionalContext`
4. In bidirectional mode, also adds an instruction for Claude to respond in your target language

The original prompt is preserved — the translation is added alongside it.

## Requirements

- Node.js >= 18
- Claude Code CLI
- Gemini API key ([get one here](https://aistudio.google.com/apikey))
