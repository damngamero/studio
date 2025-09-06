'use server';
/**
 * @fileOverview Plant identification flow that uses a photo to identify the plant species.
 *
 * - identifyPlantFromPhoto - A function that handles the plant identification process.
 * - IdentifyPlantFromPhotoInput - The input type for the identifyPlantFromPhoto function.
 * - IdentifyPlantFromPhotoOutput - The return type for the identifyPlantFromPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPlantFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPlantFromPhotoInput = z.infer<
  typeof IdentifyPlantFromPhotoInputSchema
>;

const IdentifyPlantFromPhotoOutputSchema = z.object({
  isPlant: z.boolean().describe('Whether or not the input is a plant.'),
  commonName: z.string().describe('The common name of the identified plant.'),
  latinName: z.string().describe('The Latin name of the identified plant.'),
  confidence: z
    .number()
    .describe('The confidence level of the plant identification (0-1).'),
  estimatedAge: z
    .string()
    .describe(
      'An estimation of the plant\'s age based on the photo (e.g., "Young seedling", "Mature plant", "Approximately 6 months old").'
    ),
});
export type IdentifyPlantFromPhotoOutput = z.infer<
  typeof IdentifyPlantFromPhotoOutputSchema
>;

export async function identifyPlantFromPhoto(
  input: IdentifyPlantFromPhotoInput
): Promise<IdentifyPlantFromPhotoOutput> {
  return identifyPlantFromPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPlantFromPhotoPrompt',
  input: {schema: IdentifyPlantFromPhotoInputSchema},
  output: {schema: IdentifyPlantFromPhotoOutputSchema},
  prompt: `You are an expert botanist specializing in plant identification.

You will use this information to identify the plant species in the photo.

Photo: {{media url=photoDataUri}}

Return the common name, latin name, a confidence level of the plant identification, and an estimate of the plant's age.
If the input is not a plant, return isPlant as false.
`,
});

const identifyPlantFromPhotoFlow = ai.defineFlow(
  {
    name: 'identifyPlantFromPhotoFlow',
    inputSchema: IdentifyPlantFromPhotoInputSchema,
    outputSchema: IdentifyPlantFromPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
