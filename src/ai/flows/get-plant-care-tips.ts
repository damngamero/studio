

'use server';

/**
 * @fileOverview A Genkit flow for providing plant care tips based on plant species and environment.
 *
 * - getPlantCareTips - A function that retrieves plant care tips.
 * - GetPlantCareTipsInput - The input type for the getPlantCareTips function.
 * - GetPlantCareTipsOutput - The return type for the getPlantCareTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPlantCareTipsInputSchema = z.object({
  plantSpecies: z
    .string()
    .describe('The identified species of the plant for which to provide care tips.'),
  estimatedAge: z
    .string()
    .optional()
    .describe("The plant's estimated age (e.g., 'Young seedling', 'Mature plant')."),
  location: z
    .string()
    .optional()
    .describe("The user's location (e.g., 'San Francisco, CA') for weather-based advice."),
  environmentNotes: z
    .string()
    .optional()
    .describe('User-provided notes about the plant\'s environment (e.g., "near a sunny window", "in a cool, dry room").'),
  lastWatered: z.string().optional().describe('The ISO date string of when the plant was last watered.'),
});
export type GetPlantCareTipsInput = z.infer<typeof GetPlantCareTipsInputSchema>;

const GetPlantCareTipsOutputSchema = z.object({
  careTips: z
    .string()
    .describe('A summary of care tips tailored to the plant species, including watering, sunlight, and pruning.'),
  wateringFrequency: z.number().describe('The recommended watering frequency in days (e.g., 7).'),
  wateringTime: z.string().describe('The recommended time of day to water (e.g., morning, evening).'),
  wateringAmount: z.string().describe("The recommended amount of water to use for each watering session (e.g., '250-500ml')."),
});
export type GetPlantCareTipsOutput = z.infer<typeof GetPlantCareTipsOutputSchema>;

export async function getPlantCareTips(input: GetPlantCareTipsInput): Promise<GetPlantCareTipsOutput> {
  return getPlantCareTipsFlow(input);
}

const getPlantCareTipsFlow = ai.defineFlow(
  {
    name: 'getPlantCareTipsFlow',
    inputSchema: GetPlantCareTipsInputSchema,
    outputSchema: GetPlantCareTipsOutputSchema,
  },
  async input => {
    const unitSystem = "metric (ml)";

    const prompt = ai.definePrompt({
      name: 'getPlantCareTipsPrompt',
      input: {schema: GetPlantCareTipsInputSchema},
      output: {schema: GetPlantCareTipsOutputSchema},
      prompt: `You are an expert horticulturalist. Provide care tips for the following plant. 
      
Take the user's environment notes, location, and the plant's age into account to provide a tailored watering schedule.
Include details on watering, sunlight, and pruning. 
Also provide a recommended watering frequency in days, the best time of day to water, and the recommended amount of water to give.

The user prefers the ${unitSystem} system for measurements.

Plant Species: {{{plantSpecies}}}
{{#if estimatedAge}}
Estimated Age: {{{estimatedAge}}}
{{/if}}
{{#if location}}
User's Location: {{{location}}}
{{/if}}
{{#if environmentNotes}}
Environment Notes: {{{environmentNotes}}}
{{/if}}
{{#if lastWatered}}
Last Watered: {{{lastWatered}}}
{{/if}}
`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
