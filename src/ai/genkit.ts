
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {getSettings} from '@/hooks/use-settings-store';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v2',
    }),
  ],
  customize: async (config, context) => {
    const settings = await getSettings();
    
    // Use the API key from settings if it exists, otherwise it will fallback
    // to the default configuration (e.g., environment variables).
    if (settings.geminiApiKey) {
        config.apiKey = settings.geminiApiKey;
    }
    
    // Use the model from settings, otherwise default to gemini-2.5-flash.
    const model = settings.model || 'gemini-2.5-flash';
    return {...config, model: `googleai/${model}`};
  },
});
