import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getLanguageModel() {
  const provider = process.env.LLM_PROVIDER || 'local';

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    const google = createGoogleGenerativeAI({
      ...(apiKey ? { apiKey } : {}),
    });
    return google(process.env.LLM_MODEL || 'gemini-1.5-flash');
  }

  const openai = createOpenAI({
    apiKey: process.env.LLM_API_KEY || 'lm-studio',
    baseURL: process.env.LLM_API_URL || 'http://localhost:11434/v1',
  });

  return openai.chat(process.env.LLM_MODEL || 'default-model');
}

