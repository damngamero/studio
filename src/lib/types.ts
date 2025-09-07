
import { z } from 'zod';

export const RegionOfInterestSchema = z.object({
  label: z.string().describe('The name of the plant part (e.g., Leaf, Stem, Flower).'),
  description: z.string().describe('A brief diagnosis or note about this specific region.'),
  box: z.object({
    x1: z.number().describe('The x-coordinate of the top-left corner of the bounding box (0-1).'),
    y1: z.number().describe('The y-coordinate of the top-left corner of the bounding box (0-1).'),
    x2: z.number().describe('The x-coordinate of the bottom-right corner of the bounding box (0-1).'),
    y2: z.number().describe('The y-coordinate of the bottom-right corner of the bounding box (0-1).'),
  }),
});
export type RegionOfInterest = z.infer<typeof RegionOfInterestSchema>;

export interface PlantHealthState {
  isHealthy: boolean;
  diagnosis: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  notes: string;
  photoUrl?: string; // data URI
}

export interface Plant {
  id: string;
  customName: string;
  photoUrl: string; // data URI
  commonName: string;
  latinName:string;
  estimatedAge?: string;
  notes?: string;
  environmentNotes?: string;
  careTips?: string;
  health?: PlantHealthState;
  wateringFrequency?: number; // in days
  wateringTime?: string; // e.g. "morning"
  wateringAmount?: string; // e.g. "1-2 cups" or "250-500ml"
  lastWatered: string; // ISO date string
  annotatedRegions: RegionOfInterest[];
  journal?: JournalEntry[];
  placement?: 'Indoor' | 'Outdoor' | 'Indoor/Outdoor';
  recommendedPlacement?: 'Indoor' | 'Outdoor' | 'Indoor/Outdoor';
}

// Weather Schemas
export const WeatherSchema = z.object({
    temperature: z.number().describe('The current temperature.'),
    condition: z.string().describe('A brief description of the weather (e.g., Sunny, Cloudy, Rain).'),
    humidity: z.number().describe('The current humidity percentage (0-100).'),
    windSpeed: z.number().describe('The current wind speed.'),
    temperatureUnit: z.enum(['celsius', 'fahrenheit']),
    windSpeedUnit: z.enum(['kmh', 'mph']),
  });
export type Weather = z.infer<typeof WeatherSchema>;

export const ForecastDaySchema = z.object({
  day: z.string().describe("The day of the week (e.g., 'Monday')."),
  temperature: z.number().describe('The forecasted temperature.'),
  condition: z.string().describe('The forecasted weather condition.'),
});
export type ForecastDay = z.infer<typeof ForecastDaySchema>;
