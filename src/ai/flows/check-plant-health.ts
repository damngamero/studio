
'use server';
/**
 * @fileOverview A Genkit flow for checking the health of a plant.
 *
 * - checkPlantHealth - A function that handles the plant health check.
 * - CheckPlantHealthInput - The input type for the checkPlantHealth function.
 * - CheckPlantHealthOutput - The return type for the checkPlantHealth function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { RegionOfInterestSchema } from '@/lib/types';

const CheckPlantHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  notes: z.string().optional().describe('User-provided notes about the plant\'s condition.'),
});
export type CheckPlantHealthInput = z.infer<typeof CheckPlantHealthInputSchema>;

const CheckPlantHealthOutputSchema = z.object({
  isHealthy: z.boolean().describe('Whether or not the plant is healthy.'),
  diagnosis: z.string().describe("The AI's diagnosis of the plant's health and any potential issues."),
  regions: z.array(RegionOfInterestSchema).describe('A list of identified regions of interest on the plant photo, such as leaves, stems, flowers, or any visible signs of distress (e.g., yellowing leaves, spots, pests). If a region is healthy, state that.'),
});
export type CheckPlantHealthOutput = z.infer<typeof CheckPlantHealthOutputSchema>;

export async function checkPlantHealth(input: CheckPlantHealthInput): Promise<CheckPlantHealthOutput> {
  return checkPlantHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkPlantHealthPrompt',
  input: { schema: CheckPlantHealthInputSchema },
  output: { schema: CheckPlantHealthOutputSchema },
  prompt: `You are an expert botanist specializing in diagnosing plant illnesses from photos and descriptions.

Analyze the provided photo and notes to determine the health of the plant.

Photo: {{media url=photoDataUri}}
{{#if notes}}
User Notes: {{{notes}}}
{{/if}}

Based on your analysis, determine if the plant is healthy and provide a concise diagnosis. 
Also, identify key regions of interest on the plant. For each region, provide a label, a brief description of its condition, and a normalized bounding box. If you identify a problem, be specific.
If the plant is generally healthy, your diagnosis should state that, and the regions should reflect healthy parts.`,
});

const checkPlantHealthFlow = ai.defineFlow(
  {
    name: 'checkPlantHealthFlow',
    inputSchema: CheckPlantHealthInputSchema,
    outputSchema: CheckPlantHealthOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
