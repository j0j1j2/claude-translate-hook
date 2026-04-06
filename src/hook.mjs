import { translateToEnglish, hasNonEnglish } from './translate.mjs';
import { loadConfig } from './config.mjs';

export async function runHook() {
  const input = await readStdin();
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.stdout.write('{}');
    return;
  }

  const prompt = data.prompt || '';
  const config = loadConfig();

  // API key priority: config > env var
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    process.stderr.write('claude-translate-hook: No API key. Run `npx claude-translate-hook` to configure.\n');
    process.stdout.write('{}');
    return;
  }

  const needsTranslation = hasNonEnglish(prompt);

  // If no translation needed and no bidirectional mode, pass through
  if (!needsTranslation && config.mode !== 'bidirectional') {
    process.stdout.write('{}');
    return;
  }

  try {
    const parts = [];

    if (needsTranslation) {
      const translated = await translateToEnglish(prompt, apiKey, config.model);
      parts.push(`[Translated to English]:\n${translated}`);
    }

    if (config.mode === 'bidirectional' && config.targetLanguage) {
      parts.push(`[System instruction]: Please respond in ${config.targetLanguage}.`);
    } else if (needsTranslation) {
      parts.push(`[System instruction]: The user's message was in a non-English language. Use the English translation above to understand the request. Respond in English.`);
    }

    if (parts.length === 0) {
      process.stdout.write('{}');
      return;
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: parts.join('\n\n'),
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    process.stderr.write(`claude-translate-hook error: ${e.message}\n`);
    process.stdout.write('{}');
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}
