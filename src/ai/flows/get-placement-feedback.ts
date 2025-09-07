
'use server';

/**
 * @fileOverview A Genkit flow for providing feedback on user's plant placement choice.
 *
 * - getPlacementFeedback - A function that returns feedback.
 * - GetPlacementFeedbackInput - The input type for the function.
 * - GetPlacementFeedbackOutput - The return type for the function.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/weather-tool';

type Placement = 'Indoor' | 'Outdoor' | 'Indoor/Outdoor';

const GetPlacementFeedbackInputSchema = z.object({
  plantSpecies: z.string().describe('The common name of the plant.'),
  recommendedPlacement: z.custom<Placement>().describe("The AI's initial recommended placement for the plant."),
  userChoice: z.custom<'Indoor' | 'Outdoor'>().describe("The user's chosen placement for the plant."),
  location: z.string().optional().describe("The user's location (e.g., 'San Francisco, CA'). This will be used to get the current temperature."),
  apiKey: z.string().optional(),
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
  const ai = await getAi(input.apiKey);

  const prompt = ai.definePrompt({
    name: 'getPlacementFeedbackPrompt',
    input: { schema: GetPlacementFeedbackInputSchema },
    output: { schema: GetPlacementFeedbackOutputSchema },
    tools: [getWeatherTool],
    prompt: `You are a helpful gardening assistant. A user has decided where to place their plant.
Your initial recommendation for a "{{plantSpecies}}" was "{{recommendedPlacement}}".
The user has decided to place it "{{userChoice}}".

{{#if location}}
The user is in {{location}}. Use the getWeatherForLocation tool to check the current temperature. You MUST factor the temperature into your feedback, especially if they chose "Outdoor". For example, if it's cold, warn them about frost. If it's very hot, warn them about scorching.
{{/if}}

Based on this, is the user's choice a good one? Provide a short, encouraging, and helpful feedback message.
If it's a good choice, affirm it. For example: "Great choice! This plant loves being indoors."
If it's a potentially bad choice, offer a gentle warning and a key tip. For example: "That can be tricky, but it's possible! Make sure it gets plenty of shade."
If the recommended placement was "Indoor/Outdoor", then either choice is good, so just be encouraging (but still factor in the weather if they chose Outdoor).`,
  });

  const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
  return output!;
}
