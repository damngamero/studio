
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {getSettings} from '@/hooks/use-settings-store';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v2',
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
  customize: async (config, context) => {
    const settings = await getSettings();
    
    // Use the API key from settings if it exists, otherwise it will fallback
    // to the default configuration (e.g., environment variables).
    if (settings.geminiApiKey) {
        config.apiKey = settings.geminiApiKey;
    }
    
    return {...config, model: googleAI(settings.model)};
  },
});

