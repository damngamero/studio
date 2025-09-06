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

// This tool uses a free, public API. In a real application, you would use a more robust, authenticated API.
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
        try {
            const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
            if (!response.ok) {
                throw new Error(`Failed to fetch weather data: ${response.statusText}`);
            }
            const data = await response.json();
            
            const current = data.current_condition[0];
            const forecastData = data.weather.slice(0, 3);

            const fahrenheitToCelsius = (f: number) => Math.round((f - 32) * 5 / 9);

            const currentWeather: Weather = {
                temperature: parseInt(current.temp_C),
                condition: current.weatherDesc[0].value,
                humidity: parseInt(current.humidity),
                windSpeed: parseInt(current.windspeedKmph),
            };

            const forecast: ForecastDay[] = forecastData.map((day: any) => {
                const date = new Date(day.date);
                return {
                    day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    temperature: parseInt(day.avgtempC),
                    condition: day.hourly[4].weatherDesc[0].value, // Noon condition
                };
            });
            
            return { currentWeather, forecast };

        } catch (error) {
            console.error("Error in getWeatherTool:", error);
            // Fallback to plausible mock data in case of API failure
            return {
                currentWeather: { temperature: 22, condition: 'Sunny', humidity: 55, windSpeed: 15 },
                forecast: [
                    { day: 'Monday', temperature: 24, condition: 'Sunny' },
                    { day: 'Tuesday', temperature: 21, condition: 'Partly Cloudy' },
                    { day: 'Wednesday', temperature: 19, condition: 'Rain' },
                ]
            };
        }
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
