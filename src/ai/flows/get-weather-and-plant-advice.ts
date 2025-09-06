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

const ForecastDaySchema = z.object({
  day: z.string().describe("The day of the week (e.g., 'Monday')."),
  temperature: z.number().describe('The forecasted temperature in Celsius.'),
  condition: z.string().describe('The forecasted weather condition.'),
});

const PlantAdviceSchema = z.object({
  customName: z.string(),
  advice: z.string().describe('Specific, actionable advice for this plant based on the weather forecast.'),
});

const GetWeatherAndPlantAdviceOutputSchema = z.object({
  currentWeather: WeatherSchema.describe('The current weather conditions.'),
  forecast: z.array(ForecastDaySchema).describe('A 3-day weather forecast.'),
  plantAdvice: z.array(PlantAdviceSchema).describe('A list of advice for each plant.'),
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
        // Mock data generation
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorms', 'Windy'];
        const randomCondition = () => conditions[Math.floor(Math.random() * conditions.length)];
        
        const currentWeather = {
            temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
            condition: randomCondition(),
            humidity: Math.floor(Math.random() * 50) + 40, // 40-90%
            windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        };

        const forecast = Array.from({ length: 3 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                temperature: Math.floor(Math.random() * 15) + 15,
                condition: randomCondition(),
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
3. Consider the plant type and the upcoming weather. For example, if it's going to be very hot, advise moving sun-sensitive plants to the shade. If heavy rain is forecast, suggest moving potted plants under cover. Be creative and helpful.
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
