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
