
'use server';

/**
 * @fileOverview A Genkit flow for performing an advanced plant diagnosis with annotated regions.
 *
 * - diagnosePlantWithRegions - A function that identifies regions of interest on a plant photo.
 * - DiagnosePlantWithRegionsInput - The input type for the function.
 * - DiagnosePlantWithRegionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { RegionOfInterestSchema } from '@/lib/types';
import { z } from 'genkit';

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
    try {
      const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
      return output!;
    } catch (error) {
      console.warn('Flash model failed, trying Pro model', error);
      const { output } = await prompt(input, { model: 'googleai/gemini-2.5-pro' });
      return output!;
    }
  }
);
