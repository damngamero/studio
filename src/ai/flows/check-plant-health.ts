
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
  currentCommonName: z.string().optional().describe("The plant's current common name, for context."),
});
export type CheckPlantHealthInput = z.infer<typeof CheckPlantHealthInputSchema>;

const CheckPlantHealthOutputSchema = z.object({
  isHealthy: z.boolean().describe('Whether or not the plant is healthy.'),
  diagnosis: z.string().describe("The AI's diagnosis of the plant's health and any potential issues."),
  regions: z.array(RegionOfInterestSchema).describe('A list of identified regions of interest on the plant photo, such as leaves, stems, flowers, or any visible signs of distress (e.g., yellowing leaves, spots, pests). If a region is healthy, state that.'),
  commonName: z.string().describe('The common name of the identified plant. If not confident, return the original name if provided.'),
  latinName: z.string().describe('The Latin name of the identified plant. If not confident, return the original name if provided.'),
  confidence: z.number().describe('The confidence level of the plant re-identification (0-1).'),
});
export type CheckPlantHealthOutput = z.infer<typeof CheckPlantHealthOutputSchema>;

export async function checkPlantHealth(input: CheckPlantHealthInput): Promise<CheckPlantHealthOutput> {
  return checkPlantHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkPlantHealthPrompt',
  input: { schema: CheckPlantHealthInputSchema },
  output: { schema: CheckPlantHealthOutputSchema },
  prompt: `You are an expert botanist specializing in diagnosing plant illnesses and identifying species from photos.

Analyze the provided photo and notes to determine the health of the plant.

Photo: {{media url=photoDataUri}}
{{#if notes}}
User Notes: {{{notes}}}
{{/if}}
{{#if currentCommonName}}
The plant is currently named: **{{{currentCommonName}}}**.
{{/if}}

1.  **Identify the plant species.** Return its common and Latin names, along with a confidence score (0-1) for your identification.
    **CRUCIAL RULE:** If the user has provided a `currentCommonName` and your new identification is just a broader category or a less common synonym (e.g., changing 'Corn Plant' to 'Dracaena', or 'Snake Plant' to 'Dracaena trifasciata'), you **MUST** return the original `currentCommonName` the user provided. Only change the name if you are confident it's a completely different species.

2.  **Assess the plant's health.** Based on your analysis, determine if the plant is healthy and provide a concise diagnosis. 
3.  **Identify key regions of interest.** For each region, provide a label, a brief description of its condition, and a normalized bounding box. If you identify a problem, be specific. If the plant is generally healthy, your diagnosis should state that, and the regions should reflect healthy parts.`,
});

const checkPlantHealthFlow = ai.defineFlow(
  {
    name: 'checkPlantHealthFlow',
    inputSchema: CheckPlantHealthInputSchema,
    outputSchema: CheckPlantHealthOutputSchema,
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
