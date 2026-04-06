import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.claude');
const CONFIG_PATH = join(CONFIG_DIR, 'translate-hook.json');

const DEFAULTS = {
  mode: 'input-only',
  targetLanguage: 'Korean',
  apiKey: '',
};

export function loadConfig() {
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export async function configure(args) {
  const config = loadConfig();

  if (args[0] === 'set' && args[1]) {
    const key = args[1];
    const value = args.slice(2).join(' ');

    if (!(key in DEFAULTS)) {
      console.error(`Unknown config key: ${key}`);
      console.error(`Valid keys: ${Object.keys(DEFAULTS).join(', ')}`);
      process.exit(1);
    }

    config[key] = value;
    saveConfig(config);
    console.log(`${key} = ${value}`);
    return;
  }

  // Show current config
  console.log('Current configuration:');
  for (const [key, value] of Object.entries(config)) {
    const display = key === 'apiKey' && value
      ? value.slice(0, 8) + '...'
      : value || '(not set)';
    console.log(`  ${key}: ${display}`);
  }
  console.log(`\nConfig file: ${CONFIG_PATH}`);
}
