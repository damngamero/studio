/**
 * @fileOverview Defines the Genkit tool for fetching weather data.
 * This file does NOT use 'use server' as it exports a function that returns a tool object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeatherSchema, ForecastDaySchema, Weather, ForecastDay } from '@/lib/types';

export const getWeatherTool = ai.defineTool(
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
        
        const tempUnit = 'celsius';
        const windUnit = 'kmh';

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
                day: date.toLocaleString('en-US', { weekday: 'long' }),
                temperature: Math.round(data.daily.temperature_2m_max[index]),
                condition: codeToCondition(data.daily.weather_code[index]),
            };
        });
        
        return { currentWeather, forecast };
    }
  );
