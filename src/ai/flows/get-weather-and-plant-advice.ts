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

const PlantInfoSchema = z.object({
  customName: z.string(),
  commonName: z.string(),
});

const GetWeatherAndPlantAdviceInputSchema = z.object({
  location: z.string().describe("The user's location (e.g., 'San Francisco, CA')."),
  plants: z.array(PlantInfoSchema).describe('A list of plants the user owns.'),
});
export type GetWeatherAndPlantAdviceInput = z.infer<typeof GetWeatherAndPlantAdviceInputSchema>;

const WeatherSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  condition: z.string().describe('A brief description of the weather (e.g., Sunny, Cloudy, Rain).'),
  humidity: z.number().describe('The current humidity percentage (0-100).'),
  windSpeed: z.number().describe('The current wind speed in km/h.'),
});
export type Weather = z.infer<typeof WeatherSchema>;

const ForecastDaySchema = z.object({
  day: z.string().describe("The day of the week (e.g., 'Monday')."),
  temperature: z.number().describe('The forecasted temperature in Celsius.'),
  condition: z.string().describe('The forecasted weather condition.'),
});
export type ForecastDay = z.infer<typeof ForecastDaySchema>;


const PlantAdviceSchema = z.object({
  customName: z.string(),
  advice: z.string().describe('Specific, actionable advice for this plant based on the weather forecast. Use Markdown for emphasis.'),
});

const GetWeatherAndPlantAdviceOutputSchema = z.object({
  currentWeather: WeatherSchema.describe('The current weather conditions.'),
  forecast: z.array(ForecastDaySchema).describe('A 3-day weather forecast.'),
  plantAdvice: z.array(PlantAdviceSchema).describe('A list of advice for each of our plants.'),
});
export type GetWeatherAndPlantAdviceOutput = z.infer<typeof GetWeatherAndPlantAdviceOutputSchema>;

// This is a mock tool. In a real application, this would call a real weather API.
const getWeatherTool = ai.defineTool(
    {
      name: 'getWeatherForLocation',
      description: 'Gets the current weather and a 3-day forecast for a specific location.',
      inputSchema: z.object({ location: z.string() }),
      outputSchema: z.object({
        currentWeather: WeatherSchema,
        forecast: z.array(ForecastDaySchema),
      }),
    },
    async ({ location }) => {
        // Mock data that is consistent but plausible.
        const seed = location.length;
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Windy'];
        
        const currentWeather = {
            temperature: 22 + (seed % 5) - 2, // 20-24°C
            condition: conditions[seed % conditions.length],
            humidity: 50 + (seed % 20), // 50-70%
            windSpeed: 10 + (seed % 10), // 10-20 km/h
        };

        const forecast: ForecastDay[] = Array.from({ length: 3 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            const daySeed = seed + i + 1;
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                temperature: 20 + (daySeed % 7) - 3, // 17-26°C
                condition: conditions[daySeed % conditions.length],
            };
        });

        return { currentWeather, forecast };
    }
  );


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
3. Consider the plant type and the upcoming weather. For example, if it's going to be very hot, advise moving sun-sensitive plants to the shade. If heavy rain is forecast, suggest moving potted plants under cover. Be creative and helpful. Use **markdown** for emphasis on key words.
4. Return the current weather, the forecast, and the specific advice for each plant.

User's Plants:
{{#each plants}}
- {{customName}} ({{commonName}})
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
    const { output } = await prompt(input);
    return output!;
  }
);
