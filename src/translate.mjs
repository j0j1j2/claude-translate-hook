const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function hasNonEnglish(text) {
  // Strip code blocks and inline code before checking
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
  // Match characters outside basic ASCII range (CJK, Cyrillic, Arabic, etc.)
  return /[^\u0000-\u007F\u00A0-\u00FF]/.test(cleaned);
}

export async function translateToEnglish(text, apiKey, model = 'gemini-3-flash-preview') {
  const prompt = `You are a translator. Translate the following text to English.

Rules:
- Only translate natural language parts that are NOT in English
- Preserve ALL code blocks (\`\`\`...\`\`\`) exactly as-is — do not translate code
- Preserve ALL inline code (\`...\`) exactly as-is
- Preserve ALL quoted text (text in quotes) exactly as-is
- Preserve original formatting, line breaks, and markdown structure
- If the text is already entirely in English, return it unchanged
- Output ONLY the translated text. No explanations, no wrappers.

Text:
${text}`;

  const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}
