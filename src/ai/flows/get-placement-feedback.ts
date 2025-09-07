
'use server';

/**
 * @fileOverview A Genkit flow for providing feedback on user's plant placement choice.
 *
 * - getPlacementFeedback - A function that returns feedback.
 * - GetPlacementFeedbackInput - The input type for the function.
 * - GetPlacementFeedbackOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

type Placement = 'Indoor' | 'Outdoor' | 'Indoor/Outdoor';

const GetPlacementFeedbackInputSchema = z.object({
  plantSpecies: z.string().describe('The common name of the plant.'),
  recommendedPlacement: z.custom<Placement>().describe("The AI's initial recommended placement for the plant."),
  userChoice: z.custom<'Indoor' | 'Outdoor'>().describe("The user's chosen placement for the plant."),
});
export type GetPlacementFeedbackInput = z.infer<
  typeof GetPlacementFeedbackInputSchema
>;

const GetPlacementFeedbackOutputSchema = z.object({
  isGoodChoice: z.boolean().describe("Whether the user's choice is generally a good one."),
  feedback: z.string().describe("A short, helpful message for the user explaining the choice. e.g., 'Great choice! Monsteras thrive indoors.' or 'That could be tricky! Be sure to protect it from direct sun.'"),
});
export type GetPlacementFeedbackOutput = z.infer<
  typeof GetPlacementFeedbackOutputSchema
>;

export async function getPlacementFeedback(
  input: GetPlacementFeedbackInput
): Promise<GetPlacementFeedbackOutput> {
  return getPlacementFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlacementFeedbackPrompt',
  input: { schema: GetPlacementFeedbackInputSchema },
  output: { schema: GetPlacementFeedbackOutputSchema },
  prompt: `You are a helpful gardening assistant. A user has decided where to place their plant.
Your initial recommendation for a "{{plantSpecies}}" was "{{recommendedPlacement}}".
The user has decided to place it "{{userChoice}}".

Based on this, is the user's choice a good one? Provide a short, encouraging, and helpful feedback message.
If it's a good choice, affirm it. For example: "Great choice! This plant loves being indoors."
If it's a potentially bad choice, offer a gentle warning and a key tip. For example: "That can be tricky, but it's possible! Make sure it gets plenty of shade."
If the recommended placement was "Indoor/Outdoor", then either choice is good, so just be encouraging.`,
});

const getPlacementFeedbackFlow = ai.defineFlow(
  {
    name: 'getPlacementFeedbackFlow',
    inputSchema: GetPlacementFeedbackInputSchema,
    outputSchema: GetPlacementFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
    return output!;
  }
);
