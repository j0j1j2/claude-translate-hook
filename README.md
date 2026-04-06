# claude-translate-hook

Claude Code hook that automatically translates non-English prompts to English using Gemini Flash API.

- Translates user input (non-English -> English) before sending to Claude
- Optionally instructs Claude to respond in your language (bidirectional mode)
- Preserves code blocks, inline code, and quoted text as-is
- Cross-platform: macOS, Linux, Windows

## Setup

```bash
npx claude-translate-hook
```

Interactive setup walks you through everything — API key, translation mode, and installation.

Run it again any time to change settings or uninstall.

## How it works

This tool registers a `UserPromptSubmit` hook in Claude Code. When you submit a prompt:

1. Checks if the prompt contains non-English characters (ignoring code blocks/inline code)
2. If yes, calls Gemini Flash API to translate to English
3. Injects the translation as additional context alongside the original prompt
4. In bidirectional mode, also adds an instruction for Claude to respond in your target language

## Modes

| Mode | Description |
|------|-------------|
| `input-only` | Translate your prompts to English |
| `bidirectional` | Translate input + instruct Claude to respond in your language |

## API Key

Provide your Gemini API key during setup, or set the `GEMINI_API_KEY` environment variable.
Config key takes priority over the environment variable.

Get a key at https://aistudio.google.com/apikey

## Requirements

- Node.js >= 18
- Claude Code CLI
