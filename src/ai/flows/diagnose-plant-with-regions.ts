'use server';

/**
 * @fileOverview A Genkit flow for performing an advanced plant diagnosis with annotated regions.
 *
 * - diagnosePlantWithRegions - A function that identifies regions of interest on a plant photo.
 * - DiagnosePlantWithRegionsInput - The input type for the function.
 * - DiagnosePlantWithRegionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

const DiagnosePlantWithRegionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type DiagnosePlantWithRegionsInput = z.infer<
  typeof DiagnosePlantWithRegionsInputSchema
>;

const DiagnosePlantWithRegionsOutputSchema = z.object({
  regions: z.array(RegionOfInterestSchema).describe('A list of identified regions of interest on the plant photo.'),
});
export type DiagnosePlantWithRegionsOutput = z.infer<
  typeof DiagnosePlantWithRegionsOutputSchema
>;

export async function diagnosePlantWithRegions(
  input: DiagnosePlantWithRegionsInput
): Promise<DiagnosePlantWithRegionsOutput> {
  return diagnosePlantWithRegionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnosePlantWithRegionsPrompt',
  input: { schema: DiagnosePlantWithRegionsInputSchema },
  output: { schema: DiagnosePlantWithRegionsOutputSchema },
  prompt: `You are an expert botanist. Analyze the provided photo of a plant. 
  
Your task is to identify key regions of interest on the plant, such as leaves, stems, flowers, or any visible signs of distress (e.g., yellowing leaves, spots, pests). 
  
For each region, provide a label, a brief description of its condition, and a normalized bounding box (coordinates from 0 to 1). 
  
If you identify a problem, be specific in the description (e.g., "Leaf with signs of powdery mildew," "Stem showing aphid infestation"). If a region is healthy, state that.
  
Photo: {{media url=photoDataUri}}
  
Return an array of all identified regions.`,
});

const diagnosePlantWithRegionsFlow = ai.defineFlow(
  {
    name: 'diagnosePlantWithRegionsFlow',
    inputSchema: DiagnosePlantWithRegionsInputSchema,
    outputSchema: DiagnosePlantWithRegionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
