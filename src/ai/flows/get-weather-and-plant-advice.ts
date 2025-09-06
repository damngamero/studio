
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
import { getSettings } from '@/hooks/use-settings-store';

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
  temperature: z.number().describe('The current temperature.'),
  condition: z.string().describe('A brief description of the weather (e.g., Sunny, Cloudy, Rain).'),
  humidity: z.number().describe('The current humidity percentage (0-100).'),
  windSpeed: z.number().describe('The current wind speed.'),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
  windSpeedUnit: z.enum(['kmh', 'mph']),
});
export type Weather = z.infer<typeof WeatherSchema>;

const ForecastDaySchema = z.object({
  day: z.string().describe("The day of the week (e.g., 'Monday')."),
  temperature: z.number().describe('The forecasted temperature.'),
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
        // 1. Geocode location string to get latitude and longitude
        const geocodeResponse = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(location)}`);
        if (!geocodeResponse.ok) {
            throw new Error(`Geocoding failed for location: ${location}`);
        }
        const geocodeData = await geocodeResponse.json();
        if (!geocodeData || geocodeData.length === 0) {
            throw new Error(`No coordinates found for location: ${location}`);
        }
        const { lat, lon } = geocodeData[0];
        
        const { metricUnits } = getSettings();
        const tempUnit = metricUnits ? 'celsius' : 'fahrenheit';
        const windUnit = metricUnits ? 'kmh' : 'mph';

        // 2. Fetch weather using the retrieved coordinates
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=3`);
        if (!weatherResponse.ok) {
            throw new Error(`Failed to fetch weather data: ${weatherResponse.statusText}`);
        }
        const data = await weatherResponse.json();

        // Simple mapping from WMO weather codes to our condition strings
        const codeToCondition = (code: number) => {
            if (code <= 1) return 'Sunny';
            if (code <= 3) return 'Partly cloudy';
            if (code >= 51 && code <= 67) return 'Rain';
            if (code >= 95) return 'Thunderstorms';
            return 'Cloudy';
        };

        const currentWeather: Weather = {
            temperature: Math.round(data.current.temperature_2m),
            condition: codeToCondition(data.current.weather_code),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            temperatureUnit: tempUnit,
            windSpeedUnit: windUnit,
        };
        
        const forecast: ForecastDay[] = data.daily.time.map((dateStr: string, index: number) => {
            const date = new Date(dateStr);
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                temperature: Math.round(data.daily.temperature_2m_max[index]),
                condition: codeToCondition(data.daily.weather_code[index]),
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
