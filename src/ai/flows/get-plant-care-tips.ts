'use server';

/**
 * @fileOverview A Genkit flow for providing plant care tips based on plant species.
 *
 * - getPlantCareTips - A function that retrieves plant care tips.
 * - GetPlantCareTipsInput - The input type for the getPlantCareTips function.
 * - GetPlantCareTipsOutput - The return type for the getPlantCareTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPlantCareTipsInputSchema = z.object({
  plantSpecies: z
    .string()
    .describe('The identified species of the plant for which to provide care tips.'),
});
export type GetPlantCareTipsInput = z.infer<typeof GetPlantCareTipsInputSchema>;

const GetPlantCareTipsOutputSchema = z.object({
  careTips: z
    .string()
    .describe('A summary of care tips tailored to the plant species, including watering, sunlight, and pruning.'),
});
export type GetPlantCareTipsOutput = z.infer<typeof GetPlantCareTipsOutputSchema>;

export async function getPlantCareTips(input: GetPlantCareTipsInput): Promise<GetPlantCareTipsOutput> {
  return getPlantCareTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlantCareTipsPrompt',
  input: {schema: GetPlantCareTipsInputSchema},
  output: {schema: GetPlantCareTipsOutputSchema},
  prompt: `You are an expert horticulturalist. Provide care tips for the following plant species, including watering, sunlight, and pruning:

Plant Species: {{{plantSpecies}}}`,
});

const getPlantCareTipsFlow = ai.defineFlow(
  {
    name: 'getPlantCareTipsFlow',
    inputSchema: GetPlantCareTipsInputSchema,
    outputSchema: GetPlantCareTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
