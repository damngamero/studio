
'use server';

/**
 * @fileOverview A server action for fetching weather data.
 * This file acts as a bridge between client components and the weather tool.
 */

import { getWeatherTool } from './weather-tool';

/**
 * An async server action that wraps the getWeatherTool execution.
 * @param input - The location to get weather for.
 * @returns The weather data.
 */
export async function getWeather(input: { location: string }) {
  return await getWeatherTool(input);
}
