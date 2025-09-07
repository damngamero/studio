
'use server';

/**
 * @fileOverview A Genkit flow for generating creative plant nicknames.
 *
 * - getPlantNicknames - A function that suggests nicknames.
 * - GetPlantNicknamesInput - The input type for the function.
 * - GetPlantNicknamesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getSettings } from '@/hooks/use-settings-store.tsx';

const GetPlantNicknamesInputSchema = z.object({
  commonName: z.string().describe('The common name of the plant.'),
  latinName: z.string().describe('The Latin name of the plant.'),
});
export type GetPlantNicknamesInput = z.infer<
  typeof GetPlantNicknamesInputSchema
>;

const GetPlantNicknamesOutputSchema = z.object({
  nicknames: z.array(z.string()).describe('A list of 3-4 creative and fun nicknames for the plant.'),
});
export type GetPlantNicknamesOutput = z.infer<
  typeof GetPlantNicknamesOutputSchema
>;

export async function getPlantNicknames(
  input: GetPlantNicknamesInput
): Promise<GetPlantNicknamesOutput> {
  return getPlantNicknamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlantNicknamesPrompt',
  input: { schema: GetPlantNicknamesInputSchema },
  output: { schema: GetPlantNicknamesOutputSchema },
  prompt: `You are a creative AI assistant. A user has identified a new plant and needs help naming it. 
  
Based on the plant's common and latin name, generate a list of 3 or 4 short, fun, and creative nicknames.

Common Name: {{{commonName}}}
Latin Name: {{{latinName}}}

Return a list of nicknames.`,
});

const getPlantNicknamesFlow = ai.defineFlow(
  {
    name: 'getPlantNicknamesFlow',
    inputSchema: GetPlantNicknamesInputSchema,
    outputSchema: GetPlantNicknamesOutputSchema,
  },
  async (input) => {
    const settings = getSettings();
    const { output } = await prompt(input, { model: `googleai/${settings.model}` });
    return output!;
  }
);
