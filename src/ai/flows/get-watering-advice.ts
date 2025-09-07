
'use server';

/**
 * @fileOverview A Genkit flow for providing dynamic watering advice based on weather.
 *
 * - getWateringAdvice - A function that provides a watering recommendation.
 * - GetWateringAdviceInput - The input type for the function.
 * - GetWateringAdviceOutput - The return type for the function.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherTool } from '../tools/get-weather';
import { WeatherSchema, ForecastDaySchema } from '@/lib/types';


const GetWateringAdviceInputSchema = z.object({
  plantName: z.string(),
  plantCommonName: z.string(),
  location: z.string(),
  isWateringOverdue: z.boolean(),
  placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).optional(),
  apiKey: z.string().optional(),
});
export type GetWateringAdviceInput = z.infer<
  typeof GetWateringAdviceInputSchema
>;

const GetWateringAdviceOutputSchema = z.object({
    shouldWater: z.enum(['Yes', 'No', 'Wait']).describe("The final recommendation: 'Yes' to water now, 'No' if it's not time, or 'Wait' if conditions suggest delaying."),
    reason: z.string().describe("A brief, user-friendly explanation for the recommendation."),
    newWateringTime: z.string().optional().describe('If shouldWater is "Wait", this will be an ISO string of the new recommended watering time.'),
});
export type GetWateringAdviceOutput = z.infer<
  typeof GetWateringAdviceOutputSchema
>;

const GetWateringAdviceFlowInputSchema = GetWateringAdviceInputSchema.extend({
    currentWeather: WeatherSchema,
    forecast: z.array(ForecastDaySchema),
});

export async function getWateringAdvice(
  input: GetWateringAdviceInput
): Promise<GetWateringAdviceOutput> {
  // If it's not time to water yet, just return "No".
  if (!input.isWateringOverdue) {
      return { shouldWater: 'No', reason: "It's not time to water yet according to the schedule." };
  }

  const ai = await getAi(input.apiKey);
  
  // Get weather data first.
  const weatherData = await getWeatherTool( { location: input.location });

  // Now, ask the LLM to make a final decision based on the weather advice.
  const flowInput = {
      ...input,
      ...weatherData,
  };

  const prompt = ai.definePrompt({
    name: 'wateringDecisionPrompt',
    input: { schema: GetWateringAdviceFlowInputSchema },
    output: { schema: GetWateringAdviceOutputSchema },
    prompt: `You are a plant care expert. A user's plant is due for watering. 
    
    Plant: {{plantCommonName}}
    Placement: {{#if placement}}{{placement}}{{else}}Unknown{{/if}}

    Here is the weather forecast for their location, "{{location}}":
    - Current: {{currentWeather.temperature}}°, {{currentWeather.condition}}
    - Forecast:
    {{#each forecast}}
      - {{day}}: {{temperature}}°, {{condition}}
    {{/each}}

    Based *only* on this weather analysis and the plant's placement, decide if the user should water their plant now, or wait. 
    - If the plant is an **Outdoor** plant and the forecast includes **rain**, you MUST recommend 'Wait'.
    - If the forecast includes **heat**, **sun**, or dry conditions, recommend 'Yes'.
    - If the forecast is mild and the plant is **Indoor**, 'Yes' is usually the safe answer since it's overdue.
    - Provide a very short, clear reason for your decision based on the weather. For example, "Yes, it's going to be hot and sunny." or "Wait, rain is expected tomorrow."
    - **Crucially**, if you recommend 'Wait', you MUST calculate a new watering time based on the forecast (e.g., after the rain passes) and return it as a valid ISO 8601 string in the 'newWateringTime' field.`
  });
  
  const { output } = await prompt(flowInput, { model: 'googleai/gemini-2.5-flash' });
  return output!;
}
