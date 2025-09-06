'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/get-plant-care-tips.ts';
import '@/ai/flows/identify-plant-from-photo.ts';
import '@/ai/flows/chat-about-plant.ts';
import '@/ai/flows/check-plant-health.ts';
import '@/ai/flows/diagnose-plant-with-regions.ts';
import '@/ai/flows/get-weather-and-plant-advice.ts';
import '@/ai/flows/get-watering-advice.ts';
