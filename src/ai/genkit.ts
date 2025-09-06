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
  customize: async (config) => {
    const settings = await getSettings();
    return {...config, model: googleAI(settings.model)};
  },
});
