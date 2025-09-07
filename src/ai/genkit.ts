
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {getSettings} from '@/hooks/use-settings-store';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v2',
      // Provide a default model to prevent errors when settings aren't available server-side.
      // This will be overridden by the model from settings in each flow.
      model: 'gemini-2.5-flash',
    }),
  ],
  // The 'customize' block is removed because it cannot reliably access localStorage
  // in the server-side context where flows are executed.
});
