
'use server';

/**
 * @fileOverview A Genkit flow for recalculating a plant's watering schedule based on user feedback.
 *
 * - recalculateWateringSchedule - A function that handles the schedule recalculation.
 * - RecalculateWateringScheduleInput - The input type for the function.
 * - RecalculateWateringScheduleOutput - The return type for the function.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/weather-tool';

const RecalculateWateringScheduleInputSchema = z.object({
  plantCommonName: z.string().describe("The plant's common name."),
  currentWateringFrequency: z.number().describe('The current watering frequency in days.'),
  feedback: z.string().describe('The user\'s feedback, e.g., "The soil was bone dry." or "Skipping watering, soil is still soaking wet."'),
  timingDiscrepancy: z.string().describe('How much earlier or later the user watered the plant, or if they are skipping it (e.g., "1 day, 4 hours early", "2 days late", "skipping").'),
  location: z.string().describe("The user's location for weather context."),
  environmentNotes: z.string().optional().describe('Notes about the plant\'s specific environment.'),
  apiKey: z.string().optional(),
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
  const ai = await getAi(input.apiKey);

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
2.  **Analyze:** Consider all the information: the user's feedback (note the nuance: "bone dry" is more severe than "slightly dry"), the timing discrepancy, the plant species, its environment, and the weather forecast.
3.  **Calculate New Frequency:** Based on your analysis, determine a new, more accurate watering frequency in days. 
    - If the user watered *early* because the soil was dry, you should *decrease* the number of days between watering. A "bone dry" report should lead to a larger decrease than a "slightly dry" report. "Medium dry" should be in between.
    - If the user watered *late* but the plant was fine, you could *increase* the number of days, especially if the weather is mild or humid.
    - If the user is *skipping* a watering because the soil is still wet, you should *increase* the number of days. "Soaking wet" should lead to a larger increase than "slightly damp". "Medium wet" should be in between.
    - If you think the current schedule is still appropriate despite the feedback, return the original frequency.
4.  **Provide Reasoning:** Give a short, clear explanation for your new recommendation or for keeping the schedule the same.

Return the new watering frequency and your reasoning.`,
  });

  const { output } = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
  return output!;
}
