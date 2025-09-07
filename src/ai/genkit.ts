
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { Plugin } from 'genkit/plugin';

// Store plugins in a map to avoid re-initializing them
const pluginMap = new Map<string, Plugin<any>>();

export async function getAi(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY || '';

  if (pluginMap.has(key)) {
    // If we've already configured a plugin with this key, reuse it.
    return genkit({
      plugins: [pluginMap.get(key)!],
    });
  }

  const newPlugin = googleAI({ apiKey: key });
  pluginMap.set(key, newPlugin);

  return genkit({
    plugins: [newPlugin],
  });
}

// Keep a default export for any code that might not be updated yet.
export const ai = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY || ''})]
});
