

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
   placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).optional().describe('Where the plant is placed by the user.'),
});
export type GetPlantCareTipsInput = z.infer<typeof GetPlantCareTipsInputSchema>;

const GetPlantCareTipsOutputSchema = z.object({
  careTips: z
    .string()
    .describe('A summary of care tips tailored to the plant species, including watering, sunlight, and pruning. Use Markdown and emojis.'),
  wateringFrequency: z.number().describe('The recommended watering frequency in days (e.g., 7).'),
  wateringTime: z.string().describe('The recommended time of day to water, including a general time and a specific time range (e.g., "Morning (6-9 AM)").'),
  wateringAmount: z.string().describe("The recommended amount of water to use for each watering session (e.g., '250-500ml')."),
});
export type GetPlantCareTipsOutput = z.infer<typeof GetPlantCareTipsOutputSchema>;

export async function getPlantCareTips(input: GetPlantCareTipsInput): Promise<GetPlantCareTipsOutput> {
  return getPlantCareTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlantCareTipsPrompt',
  input: {schema: GetPlantCareTipsInputSchema},
  output: {schema: GetPlantCareTipsOutputSchema},
  prompt: `You are an expert horticulturalist. Provide care tips for the following plant. 
  
Your advice should be general and not based on a specific weather forecast. Focus on the plant's species and the provided environment details.
Use Markdown for formatting and include relevant emojis for each section.

Create a "careTips" response with the following sections:
- 💧 **Watering**: General watering advice. The specific frequency, time, and amount will be returned separately.
- ☀️ **Sunlight**: Ideal sunlight conditions.
- 🌱 **Fertilizing**: When and how to fertilize.
- ✂️ **Pruning**: General pruning and maintenance advice.

Take the user's environment notes, location, and the plant's age into account to provide a tailored watering schedule.

**Crucially, determine the BEST time of day to water the plant (e.g., morning, evening).** As a general rule, morning is best to allow leaves to dry and prevent fungus. Return this as a human-friendly string with a specific time range, like "Morning (6-9 AM)" or "Evening (6-8 PM)".

The user prefers the metric system (ml) for measurements.

## Plant Details
Plant Species: {{{plantSpecies}}}
{{#if placement}}
Placement: **{{{placement}}}**. This is a critical piece of information. Indoor plants are more sheltered than outdoor plants. Your advice MUST reflect this.
{{/if}}
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

const getPlantCareTipsFlow = ai.defineFlow(
  {
    name: 'getPlantCareTipsFlow',
    inputSchema: GetPlantCareTipsInputSchema,
    outputSchema: GetPlantCareTipsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
      return output!;
    } catch (error) {
      console.warn('Flash model failed, trying Pro model', error);
      const {output} = await prompt(input, { model: 'googleai/gemini-2.5-pro' });
      return output!;
    }
  }
);
