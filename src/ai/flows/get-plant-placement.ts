
'use server';

/**
 * @fileOverview A Genkit flow for determining if a plant is best suited for indoors or outdoors.
 *
 * - getPlantPlacement - A function that returns placement advice.
 * - GetPlantPlacementInput - The input type for the function.
 * - GetPlantPlacementOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getSettings } from '@/hooks/use-settings-store.tsx';

const GetPlantPlacementInputSchema = z.object({
  plantSpecies: z.string().describe('The common name of the plant.'),
});
export type GetPlantPlacementInput = z.infer<
  typeof GetPlantPlacementInputSchema
>;

const GetPlantPlacementOutputSchema = z.object({
  placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).describe("The recommended placement for the plant: 'Indoor', 'Outdoor', or 'Indoor/Outdoor' if both are suitable."),
});
export type GetPlantPlacementOutput = z.infer<
  typeof GetPlantPlacementOutputSchema
>;

export async function getPlantPlacement(
  input: GetPlantPlacementInput
): Promise<GetPlantPlacementOutput> {
  return getPlantPlacementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlantPlacementPrompt',
  input: { schema: GetPlantPlacementInputSchema },
  output: { schema: GetPlantPlacementOutputSchema },
  prompt: `Based on the plant species "{{plantSpecies}}", is it typically grown indoors, outdoors, or both?`,
});

const getPlantPlacementFlow = ai.defineFlow(
  {
    name: 'getPlantPlacementFlow',
    inputSchema: GetPlantPlacementInputSchema,
    outputSchema: GetPlantPlacementOutputSchema,
  },
  async (input) => {
    const settings = getSettings();
    const { output } = await prompt(input, { model: `googleai/${settings.model}` });
    return output!;
  }
);
