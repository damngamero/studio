
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The model is a required parameter for the googleAI plugin.
      model: 'gemini-2.5-flash',
    }),
  ],
  // The 'customize' block has been removed. It was attempting to access
  // client-side settings from the server, which is not possible and was causing errors.
  // The model is now defaulted directly in the googleAI plugin configuration.
});
