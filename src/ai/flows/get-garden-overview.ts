
'use server';

/**
 * @fileOverview A Genkit flow for providing a daily garden overview.
 *
 * - getGardenOverview - A function that generates a summary of the garden's status.
 * - GetGardenOverviewInput - The input type for the function.
 * - GetGardenOverviewOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/get-weather';

const PlantStatusSchema = z.object({
    customName: z.string(),
    commonName: z.string(),
    isWateringOverdue: z.boolean(),
});

const GetGardenOverviewInputSchema = z.object({
  location: z.string().describe("The user's location (e.g., 'San Francisco, CA')."),
  plants: z.array(PlantStatusSchema).describe('A list of the user\'s plants and their watering status.'),
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
  return getGardenOverviewFlow(input);
}


const prompt = ai.definePrompt({
    name: 'getGardenOverviewPrompt',
    input: { schema: GetGardenOverviewInputSchema },
    output: { schema: GetGardenOverviewOutputSchema },
    tools: [getWeatherTool],
    prompt: `You are Sage, an AI gardening assistant. Your goal is to provide a quick, helpful "daily digest" for the user's garden.

1. First, use the getWeatherForLocation tool to get the weather for the user's location: {{{location}}}.
2. Look at the list of the user's plants and see which ones are overdue for watering.
3. Based on the weather and the watering status, create a friendly, encouraging, and actionable summary for the user. 

For example, if it's hot and plants need water, say something like: "It's a hot day! Your garden is thirsty. Let's start with the *Fiddle Leaf Fig*."
If it's going to rain and plants need water, you could say: "Good news! Rain is on the way, so you can hold off on watering the *Monstera* for now."
If all is well, say something like: "Everything looks great in your garden today! Enjoy the sunshine."

Keep the summary to one or two sentences. Be warm and encouraging.

User's Plants:
{{#each plants}}
- {{customName}} ({{commonName}}). Watering Overdue: {{isWateringOverdue}}
{{/each}}
`,
});

const getGardenOverviewFlow = ai.defineFlow(
  {
    name: 'getGardenOverviewFlow',
    inputSchema: GetGardenOverviewInputSchema,
    outputSchema: GetGardenOverviewOutputSchema,
  },
  async (input) => {
    // Do not run if there's no location or no plants
    if (!input.location || input.plants.length === 0) {
        return { overview: "Set your location and add a plant to get your daily garden overview from Sage!" };
    }
    const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
    return output!;
  }
);
