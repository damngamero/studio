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

export interface Plant {
  id: string;
  customName: string;
  photoUrl: string; // data URI
  commonName: string;
  latinName: string;
  notes?: string;
  careTips?: string;
  health?: PlantHealthState;
  wateringFrequency?: number; // in days
  wateringTime?: string; // e.g. "morning"
  lastWatered?: string; // ISO date string
  annotatedRegions?: RegionOfInterest[];
}
