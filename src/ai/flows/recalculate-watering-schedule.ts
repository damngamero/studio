
'use server';

/**
 * @fileOverview A Genkit flow for recalculating a plant's watering schedule based on user feedback.
 *
 * - recalculateWateringSchedule - A function that handles the schedule recalculation.
 * - RecalculateWateringScheduleInput - The input type for the function.
 * - RecalculateWateringScheduleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/get-weather';

const RecalculateWateringScheduleInputSchema = z.object({
  plantCommonName: z.string().describe("The plant's common name."),
  currentWateringFrequency: z.number().describe('The current watering frequency in days.'),
  feedback: z.string().describe('The user\'s feedback, e.g., "The soil was dry." or "Watering was overdue, but the plant seems fine." or "Skipping watering, soil is still wet."'),
  timingDiscrepancy: z.string().describe('How much earlier or later the user watered the plant, or if they are skipping it (e.g., "1 day, 4 hours early", "2 days late", "skipping").'),
  location: z.string().describe("The user's location for weather context."),
  environmentNotes: z.string().optional().describe('Notes about the plant\'s specific environment.'),
});
export type RecalculateWateringScheduleInput = z.infer<typeof RecalculateWateringScheduleInputSchema>;

const RecalculateWateringScheduleOutputSchema = z.object({
  newWateringFrequency: z.number().describe("The AI's new recommended watering frequency in days, adjusted based on the feedback and weather. If no change is needed, return the original frequency."),
  reasoning: z.string().describe("A brief explanation of why the schedule was changed or why it wasn't."),
});
export type RecalculateWateringScheduleOutput = z.infer<typeof RecalculateWateringScheduleOutputSchema>;

export async function recalculateWateringSchedule(
  input: RecalculateWateringScheduleInput
): Promise<RecalculateWateringScheduleOutput> {
  return recalculateWateringScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recalculateWateringSchedulePrompt',
  input: { schema: RecalculateWateringScheduleInputSchema },
  output: { schema: RecalculateWateringScheduleOutputSchema },
  tools: [getWeatherTool],
  prompt: `You are an expert horticulturalist AI. A user has indicated that the watering schedule for their plant might be incorrect. Your task is to analyze their feedback and the weather to recommend a new, more accurate watering frequency.

## Plant & Schedule Details
- **Plant:** {{{plantCommonName}}}
- **Current Schedule:** Water every {{{currentWateringFrequency}}} days.
- **User Feedback:** "{{feedback}}"
- **Timing:** The user is acting **{{{timingDiscrepancy}}}**.

## Environmental Context
- **Location:** {{{location}}}
- **Environment:** {{#if environmentNotes}}"{{{environmentNotes}}}"{{else}}No specific notes provided.{{/if}}

## Your Task
1.  **Get Weather:** First, use the \`getWeatherForLocation\` tool to get the current weather and 3-day forecast for **{{{location}}}**.
2.  **Analyze:** Consider all the information: the user's feedback, the timing discrepancy, the plant species, its environment, and the weather forecast (temperature, rain, humidity).
3.  **Calculate New Frequency:** Based on your analysis, determine a new, more accurate watering frequency in days. 
    - If the user watered *early* because the soil was dry and it's hot/sunny, you should *decrease* the number of days between watering (e.g., from 7 days to 5 days).
    - If the user watered *late* but the plant was fine, you could *increase* the number of days (e.g., from 5 days to 6 days), especially if the weather is mild or humid.
    - If the user is *skipping* a watering because the soil is still wet, you should *increase* the number of days (e.g., from 7 days to 8 or 9 days).
    - If you think the current schedule is still appropriate despite the feedback, return the original frequency.
4.  **Provide Reasoning:** Give a short, clear explanation for your new recommendation or for keeping the schedule the same.

Return the new watering frequency and your reasoning.`,
});

const recalculateWateringScheduleFlow = ai.defineFlow(
  {
    name: 'recalculateWateringScheduleFlow',
    inputSchema: RecalculateWateringScheduleInputSchema,
    outputSchema: RecalculateWateringScheduleOutputSchema,
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
