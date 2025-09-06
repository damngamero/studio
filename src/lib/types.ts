import type { RegionOfInterest } from "@/ai/flows/diagnose-plant-with-regions";

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
  lastWatered?: string; // ISO date string
  annotatedRegions?: RegionOfInterest[];
}
