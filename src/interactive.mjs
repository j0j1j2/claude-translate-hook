import { createInterface } from 'readline';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { loadConfig, saveConfig } from './config.mjs';

const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');
const HOOK_COMMAND = 'npx -y claude-translate-hook hook';

function readSettings() {
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}

function isInstalled(settings) {
  return settings.hooks?.UserPromptSubmit?.some((entry) =>
    entry.hooks?.some((h) => h.command?.includes('claude-translate-hook'))
  );
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

async function choose(rl, question, options) {
  console.log();
  console.log(question);
  options.forEach((opt, i) => console.log(`  ${i + 1}) ${opt}`));
  while (true) {
    const answer = await prompt(rl, `Select [1-${options.length}]: `);
    const n = parseInt(answer, 10);
    if (n >= 1 && n <= options.length) return n - 1;
  }
}

export async function interactive() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('claude-translate-hook');
  console.log('====================');

  const settings = readSettings();
  const installed = isInstalled(settings);
  const config = loadConfig();

  // Show current status
  console.log();
  console.log(`Hook:     ${installed ? 'installed' : 'not installed'}`);
  console.log(`API key:  ${config.apiKey ? config.apiKey.slice(0, 8) + '...' : process.env.GEMINI_API_KEY ? '(env var)' : 'not set'}`);
  console.log(`Mode:     ${config.mode}`);
  if (config.mode === 'bidirectional') {
    console.log(`Language: ${config.targetLanguage}`);
  }

  const menuOptions = installed
    ? ['Configure settings', 'Uninstall hook', 'Exit']
    : ['Install hook', 'Exit'];

  const choice = await choose(rl, 'What would you like to do?', menuOptions);

  if (!installed) {
    if (choice === 0) await doInstall(rl, settings, config);
    // choice === 1 = Exit
  } else {
    if (choice === 0) await doConfigure(rl, config);
    if (choice === 1) await doUninstall(settings);
    // choice === 2 = Exit
  }

  rl.close();
}

async function doInstall(rl, settings, config) {
  // API key
  if (!config.apiKey && !process.env.GEMINI_API_KEY) {
    console.log();
    const key = await prompt(rl, 'Gemini API key (get one at https://aistudio.google.com/apikey): ');
    if (key) {
      config.apiKey = key;
    } else {
      console.log('Skipped. Set GEMINI_API_KEY env var or run this again later.');
    }
  }

  // Mode
  const modeIdx = await choose(rl, 'Translation mode:', [
    'Input only - translate your prompts to English',
    'Bidirectional - also have Claude respond in your language',
  ]);
  config.mode = modeIdx === 0 ? 'input-only' : 'bidirectional';

  // Target language
  if (config.mode === 'bidirectional') {
    const lang = await prompt(rl, `Target language for Claude responses [${config.targetLanguage}]: `);
    if (lang) config.targetLanguage = lang;
  }

  saveConfig(config);

  // Add hook
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];

  settings.hooks.UserPromptSubmit.push({
    hooks: [{ command: HOOK_COMMAND, timeout: 15, type: 'command' }],
  });

  writeSettings(settings);
  console.log('\nInstalled! Restart Claude Code for changes to take effect.');
}

async function doConfigure(rl, config) {
  while (true) {
    const options = [
      `API key: ${config.apiKey ? config.apiKey.slice(0, 8) + '...' : '(not set)'}`,
      `Mode: ${config.mode}`,
      `Target language: ${config.targetLanguage}`,
      'Save & exit',
    ];

    const choice = await choose(rl, 'Edit settings:', options);

    if (choice === 0) {
      const key = await prompt(rl, 'Gemini API key: ');
      if (key) config.apiKey = key;
    } else if (choice === 1) {
      const modeIdx = await choose(rl, 'Translation mode:', [
        'Input only - translate your prompts to English',
        'Bidirectional - also have Claude respond in your language',
      ]);
      config.mode = modeIdx === 0 ? 'input-only' : 'bidirectional';
    } else if (choice === 2) {
      const lang = await prompt(rl, `Target language [${config.targetLanguage}]: `);
      if (lang) config.targetLanguage = lang;
    } else {
      break;
    }
  }

  saveConfig(config);
  console.log('\nSettings saved.');
}

async function doUninstall(settings) {
  if (settings.hooks?.UserPromptSubmit) {
    settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter(
      (entry) => !entry.hooks?.some((h) => h.command?.includes('claude-translate-hook'))
    );
    if (settings.hooks.UserPromptSubmit.length === 0) {
      delete settings.hooks.UserPromptSubmit;
    }
  }
  writeSettings(settings);
  console.log('\nHook uninstalled.');
}
