
'use server';
/**
 * @fileOverview A Genkit flow that fetches weather and provides plant-specific advice.
 *
 * - getWeatherAndPlantAdvice - A function that gets a weather forecast and plant advice.
 * - GetWeatherAndPlantAdviceInput - The input type for the function.
 * - GetWeatherAndPlantAdviceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/get-weather';
import { WeatherSchema, ForecastDaySchema } from '@/lib/types';

const PlantInfoSchema = z.object({
  customName: z.string(),
  commonName: z.string(),
  placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).optional(),
});

const GetWeatherAndPlantAdviceInputSchema = z.object({
  location: z.string().describe("The user's location (e.g., 'San Francisco, CA')."),
  plants: z.array(PlantInfoSchema).describe('A list of plants the user owns.'),
});
export type GetWeatherAndPlantAdviceInput = z.infer<typeof GetWeatherAndPlantAdviceInputSchema>;

const PlantAdviceSchema = z.object({
  customName: z.string(),
  advice: z.string().describe('Specific, actionable advice for this plant based on the weather forecast. Use Markdown and emojis for emphasis.'),
});

const GetWeatherAndPlantAdviceOutputSchema = z.object({
  currentWeather: WeatherSchema.describe('The current weather conditions.'),
  forecast: z.array(ForecastDaySchema).describe('A 3-day weather forecast.'),
  plantAdvice: z.array(PlantAdviceSchema).describe('A list of advice for each of our plants.'),
});
export type GetWeatherAndPlantAdviceOutput = z.infer<typeof GetWeatherAndPlantAdviceOutputSchema>;

export async function getWeatherAndPlantAdvice(
  input: GetWeatherAndPlantAdviceInput
): Promise<GetWeatherAndPlantAdviceOutput> {
  return getWeatherAndPlantAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWeatherAndPlantAdvicePrompt',
  input: { schema: GetWeatherAndPlantAdviceInputSchema },
  output: { schema: GetWeatherAndPlantAdviceOutputSchema },
  tools: [getWeatherTool],
  prompt: `You are Sage, an expert horticulturalist AI. Your goal is to provide proactive, weather-based advice for plant care.

1. First, use the getWeatherForLocation tool to get the weather for the user's location: {{{location}}}.
2. Then, for each of the user's plants listed below, provide specific, actionable advice based on the 3-day forecast.
3. **Crucially, consider the placement of the plant (Indoor/Outdoor).** Outdoor plants are directly affected by weather, while indoor plants are more sheltered. Your advice must reflect this difference. For example, if heavy rain is forecast, you might tell the user to move a potted outdoor plant under cover, but this advice is irrelevant for an indoor plant.
4. Be creative and helpful. Use **markdown** and relevant emojis (e.g., ☀️, 💧, 💨) for emphasis on key words.
5. Return the current weather, the forecast, and the specific advice for each plant.

User's Plants:
{{#each plants}}
- {{customName}} ({{commonName}}). Placement: {{#if placement}}{{placement}}{{else}}Unknown{{/if}}
{{/each}}
`,
});

const getWeatherAndPlantAdviceFlow = ai.defineFlow(
  {
    name: 'getWeatherAndPlantAdviceFlow',
    inputSchema: GetWeatherAndPlantAdviceInputSchema,
    outputSchema: GetWeatherAndPlantAdviceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
    return output!;
  }
);
