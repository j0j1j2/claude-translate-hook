import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';
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

async function promptInput(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function install() {
  const settings = readSettings();

  if (isInstalled(settings)) {
    console.log('Hook is already installed.');
    return;
  }

  // Check & prompt for API key
  const config = loadConfig();
  if (!config.apiKey && !process.env.GEMINI_API_KEY) {
    const key = await promptInput('Enter your Gemini API key (or press Enter to set later): ');
    if (key) {
      config.apiKey = key;
      saveConfig(config);
      console.log('API key saved to config.');
    } else {
      console.log('No API key set. Set later via:');
      console.log('  claude-translate-hook config set apiKey <your-key>');
      console.log('  or export GEMINI_API_KEY=<your-key>');
    }
  }

  // Ask for mode
  const mode = await promptInput('Translation mode - input-only or bidirectional? [input-only]: ');
  if (mode === 'bidirectional') {
    config.mode = 'bidirectional';
    const lang = await promptInput('Target language for Claude responses? [Korean]: ');
    config.targetLanguage = lang || 'Korean';
    saveConfig(config);
  }

  // Add hook to settings
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];

  settings.hooks.UserPromptSubmit.push({
    hooks: [
      {
        command: HOOK_COMMAND,
        timeout: 15,
        type: 'command',
      },
    ],
  });

  writeSettings(settings);
  console.log('\nHook installed successfully.');
  console.log('Restart Claude Code for changes to take effect.');
}

export async function uninstall() {
  const settings = readSettings();

  if (!isInstalled(settings)) {
    console.log('Hook is not installed.');
    return;
  }

  settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter(
    (entry) => !entry.hooks?.some((h) => h.command?.includes('claude-translate-hook'))
  );

  if (settings.hooks.UserPromptSubmit.length === 0) {
    delete settings.hooks.UserPromptSubmit;
  }

  writeSettings(settings);
  console.log('Hook uninstalled.');
}
