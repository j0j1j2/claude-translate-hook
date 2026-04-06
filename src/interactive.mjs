import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { select, input, confirm, password } from '@inquirer/prompts';
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

function banner() {
  console.log();
  console.log(chalk.bold.cyan('  claude-translate-hook'));
  console.log(chalk.dim('  Translate non-English prompts for Claude Code'));
  console.log();
}

function statusLine(label, value, ok) {
  const icon = ok ? chalk.green('●') : chalk.dim('○');
  return `  ${icon} ${chalk.dim(label)} ${value}`;
}

export async function interactive() {
  banner();

  const settings = readSettings();
  const installed = isInstalled(settings);
  const config = loadConfig();

  const hasKey = !!(config.apiKey || process.env.GEMINI_API_KEY);
  const keyDisplay = config.apiKey
    ? chalk.green(config.apiKey.slice(0, 8) + '...')
    : process.env.GEMINI_API_KEY
      ? chalk.yellow('env var')
      : chalk.red('not set');

  console.log(statusLine('Hook    ', installed ? chalk.green('installed') : chalk.yellow('not installed'), installed));
  console.log(statusLine('API Key ', keyDisplay, hasKey));
  console.log(statusLine('Mode    ', chalk.white(config.mode), true));
  if (config.mode === 'bidirectional') {
    console.log(statusLine('Language', chalk.white(config.targetLanguage), true));
  }
  console.log();

  const choices = installed
    ? [
        { name: 'Configure settings', value: 'config' },
        { name: 'Uninstall hook', value: 'uninstall' },
        { name: 'Exit', value: 'exit' },
      ]
    : [
        { name: 'Install hook', value: 'install' },
        { name: 'Exit', value: 'exit' },
      ];

  const action = await select({
    message: chalk.bold('What would you like to do?'),
    choices,
    theme: { prefix: chalk.cyan('?') },
  });

  if (action === 'install') await doInstall(settings, config);
  if (action === 'config') await doConfigure(config);
  if (action === 'uninstall') await doUninstall(settings);
}

async function doInstall(settings, config) {
  // API key
  if (!config.apiKey && !process.env.GEMINI_API_KEY) {
    console.log();
    console.log(chalk.dim('  Get your API key at ') + chalk.underline.cyan('https://aistudio.google.com/apikey'));
    console.log();

    const key = await password({
      message: 'Gemini API key',
      mask: '*',
      theme: { prefix: chalk.cyan('?') },
    });

    if (key) {
      config.apiKey = key;
    } else {
      console.log(chalk.yellow('\n  Skipped. Set GEMINI_API_KEY env var or run this again later.\n'));
    }
  }

  // Mode
  config.mode = await select({
    message: 'Translation mode',
    choices: [
      {
        name: 'Input only',
        value: 'input-only',
        description: 'Translate your prompts to English',
      },
      {
        name: 'Bidirectional',
        value: 'bidirectional',
        description: 'Also instruct Claude to respond in your language',
      },
    ],
    theme: { prefix: chalk.cyan('?') },
  });

  // Target language
  if (config.mode === 'bidirectional') {
    const lang = await input({
      message: 'Target language for responses',
      default: config.targetLanguage,
      theme: { prefix: chalk.cyan('?') },
    });
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

  console.log();
  console.log(chalk.green.bold('  Done!') + ' Hook installed successfully.');
  console.log(chalk.dim('  Restart Claude Code for changes to take effect.'));
  console.log();
}

async function doConfigure(config) {
  let done = false;
  while (!done) {
    const field = await select({
      message: chalk.bold('Edit settings'),
      choices: [
        {
          name: `API key  ${chalk.dim(config.apiKey ? config.apiKey.slice(0, 8) + '...' : '(not set)')}`,
          value: 'apiKey',
        },
        {
          name: `Mode     ${chalk.dim(config.mode)}`,
          value: 'mode',
        },
        {
          name: `Language ${chalk.dim(config.targetLanguage)}`,
          value: 'targetLanguage',
        },
        {
          name: chalk.green('Save & exit'),
          value: 'save',
        },
      ],
      theme: { prefix: chalk.cyan('>') },
    });

    if (field === 'apiKey') {
      console.log();
      console.log(chalk.dim('  Get your API key at ') + chalk.underline.cyan('https://aistudio.google.com/apikey'));
      console.log();
      const key = await password({
        message: 'Gemini API key',
        mask: '*',
        theme: { prefix: chalk.cyan('?') },
      });
      if (key) config.apiKey = key;
    } else if (field === 'mode') {
      config.mode = await select({
        message: 'Translation mode',
        choices: [
          { name: 'Input only', value: 'input-only', description: 'Translate your prompts to English' },
          { name: 'Bidirectional', value: 'bidirectional', description: 'Also instruct Claude to respond in your language' },
        ],
        default: config.mode,
        theme: { prefix: chalk.cyan('?') },
      });
    } else if (field === 'targetLanguage') {
      const lang = await input({
        message: 'Target language',
        default: config.targetLanguage,
        theme: { prefix: chalk.cyan('?') },
      });
      if (lang) config.targetLanguage = lang;
    } else {
      done = true;
    }
  }

  saveConfig(config);
  console.log();
  console.log(chalk.green.bold('  Settings saved.'));
  console.log();
}

async function doUninstall(settings) {
  const yes = await confirm({
    message: 'Are you sure you want to uninstall?',
    default: false,
    theme: { prefix: chalk.red('!') },
  });

  if (!yes) return;

  if (settings.hooks?.UserPromptSubmit) {
    settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter(
      (entry) => !entry.hooks?.some((h) => h.command?.includes('claude-translate-hook'))
    );
    if (settings.hooks.UserPromptSubmit.length === 0) {
      delete settings.hooks.UserPromptSubmit;
    }
  }
  writeSettings(settings);

  console.log();
  console.log(chalk.green.bold('  Hook uninstalled.'));
  console.log();
}
