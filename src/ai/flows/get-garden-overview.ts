
'use server';

/**
 * @fileOverview A Genkit flow for providing a daily garden overview.
 *
 * - getGardenOverview - A function that generates a summary of the garden's status.
 * - GetGardenOverviewInput - The input type for the function.
 * - GetGardenOverviewOutput - The return type for the function.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/get-weather';

const PlantStatusSchema = z.object({
    customName: z.string(),
    commonName: z.string(),
    isWateringOverdue: z.boolean(),
    placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).optional(),
});

const GetGardenOverviewInputSchema = z.object({
  location: z.string().describe("The user's location (e.g., 'San Francisco, CA')."),
  plants: z.array(PlantStatusSchema).describe('A list of the user\'s plants and their watering status.'),
  apiKey: z.string().optional(),
});
export type GetGardenOverviewInput = z.infer<typeof GetGardenOverviewInputSchema>;

const GetGardenOverviewOutputSchema = z.object({
    overview: z.string().describe("A friendly, one or two sentence summary of the garden's overall status for the day. Use Markdown for emphasis."),
});
export type GetGardenOverviewOutput = z.infer<
  typeof GetGardenOverviewOutputSchema
>;

export async function getGardenOverview(
  input: GetGardenOverviewInput
): Promise<GetGardenOverviewOutput> {
  // Do not run if there's no location or no plants
  if (!input.location || input.plants.length === 0) {
      return { overview: "Set your location and add a plant to get your daily garden overview from Sage!" };
  }

  const ai = await getAi(input.apiKey);

  const prompt = ai.definePrompt({
      name: 'getGardenOverviewPrompt',
      input: { schema: GetGardenOverviewInputSchema },
      output: { schema: GetGardenOverviewOutputSchema },
      tools: [getWeatherTool],
      prompt: `You are Sage, an AI gardening assistant. Your goal is to provide a quick, helpful "daily digest" for the user's garden.

1. First, use the getWeatherForLocation tool to get the weather for the user's location: {{{location}}}.
2. Look at the list of the user's plants and see which ones are overdue for watering.
3. **Crucially, consider the placement of each plant (Indoor vs. Outdoor).** Outdoor plants are affected by rain and sun, while indoor plants are not. Your advice MUST reflect this.
4. Based on the weather, watering status, and placement, create a friendly, encouraging, and actionable summary for the user. 

For example, if it's hot and an *outdoor* plant needs water, say something like: "It's a hot day! Your garden is thirsty. Your *Outdoor Ficus* might need a drink."
If it's going to rain and an *outdoor* plant needs water, you could say: "Good news! Rain is on the way, so you can hold off on watering the *Monstera* for now."
If all is well, say something like: "Everything looks great in your garden today! Enjoy the sunshine."

Keep the summary to two or three sentences. Be warm and encouraging.

User's Plants:
{{#each plants}}
- {{customName}} ({{commonName}}). Placement: {{#if placement}}{{placement}}{{else}}Unknown{{/if}}. Watering Overdue: {{isWateringOverdue}}
{{/each}}
`,
  });

  const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
  return output!;
}
