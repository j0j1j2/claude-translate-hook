#!/usr/bin/env node

const command = process.argv[2];

switch (command) {
  case 'hook': {
    const { runHook } = await import('../src/hook.mjs');
    await runHook();
    break;
  }
  case 'install': {
    const { install } = await import('../src/install.mjs');
    await install();
    break;
  }
  case 'uninstall': {
    const { uninstall } = await import('../src/install.mjs');
    await uninstall();
    break;
  }
  case 'config': {
    const { configure } = await import('../src/config.mjs');
    await configure(process.argv.slice(3));
    break;
  }
  default:
    console.log(`claude-translate-hook - Translate non-English prompts for Claude Code

Usage:
  claude-translate-hook install       Install the hook into Claude Code
  claude-translate-hook uninstall     Remove the hook from Claude Code
  claude-translate-hook config        Show current configuration
  claude-translate-hook config set <key> <value>

Config options:
  mode             "input-only" or "bidirectional" (default: input-only)
                   input-only: translate user prompt to English
                   bidirectional: also instruct Claude to respond in your language
  targetLanguage   Language for Claude's responses (e.g. "Korean", "Japanese")
  apiKey           Gemini API key (overrides GEMINI_API_KEY env var)

Examples:
  claude-translate-hook config set mode bidirectional
  claude-translate-hook config set targetLanguage Korean
`);
}
