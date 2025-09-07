'use server';

/**
 * @fileOverview A server action for fetching weather data.
 * This file acts as a bridge between client components and the weather tool.
 */
import { getAi } from '@/ai/genkit';
import { getWeatherTool } from './weather-tool';

/**
 * An async server action that wraps the getWeatherTool execution.
 * @param input - The location to get weather for.
 * @returns The weather data.
 */
export async function getWeather(input: { location: string }) {
  const ai = await getAi(); // Uses default key for this server-to-server action
  return await getWeatherTool(ai)(input);
}
