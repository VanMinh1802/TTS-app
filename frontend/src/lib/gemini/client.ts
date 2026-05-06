import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  code?: 'MISSING_KEY' | 'API_ERROR';
}

let genAI: GoogleGenerativeAI | null = null;
let lastApiKey = '';

const resultCache = new Map<string, GeminiResult>();
const MAX_CACHE_SIZE = 20;

function getClient(apiKey: string): GoogleGenerativeAI {
  if (!genAI || apiKey !== lastApiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    lastApiKey = apiKey;
  }
  return genAI;
}

function cacheKey(prompt: string, text: string): string {
  // Simple hash: length + first/last 20 chars
  const head = text.slice(0, 20).trim();
  const tail = text.slice(-20).trim();
  return `${prompt.slice(0, 30)}|${text.length}|${head}|${tail}`;
}

export async function callGemini(prompt: string, text: string): Promise<GeminiResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, code: 'API_ERROR', error: 'Văn bản trống.' };
  }

  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  if (!apiKey) {
    return { success: false, code: 'MISSING_KEY', error: 'Vui lòng cấu hình Gemini API Key trong Cài đặt.' };
  }

  // Check cache
  const key = cacheKey(prompt, trimmed);
  const cached = resultCache.get(key);
  if (cached) return cached;

  try {
    const client = getClient(apiKey);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(`${prompt}\n\nTEXT:\n${trimmed}`);
    const response = result.response.text();

    const json = response
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const data: GeminiResult = { success: true, data: JSON.parse(json) };

    // Simple LRU-like cache
    if (resultCache.size >= MAX_CACHE_SIZE) {
      const firstKey = resultCache.keys().next().value;
      if (firstKey) resultCache.delete(firstKey);
    }
    resultCache.set(key, data);

    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini API error';
    return { success: false, code: 'API_ERROR', error: msg };
  }
}
