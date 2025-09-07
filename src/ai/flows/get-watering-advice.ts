
'use server';

/**
 * @fileOverview A Genkit flow for providing dynamic watering advice based on weather.
 *
 * - getWateringAdvice - A function that provides a watering recommendation.
 * - GetWateringAdviceInput - The input type for the function.
 * - GetWateringAdviceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherAndPlantAdvice } from './get-weather-and-plant-advice';

const GetWateringAdviceInputSchema = z.object({
  plantName: z.string(),
  plantCommonName: z.string(),
  location: z.string(),
  isWateringOverdue: z.boolean(),
});
export type GetWateringAdviceInput = z.infer<
  typeof GetWateringAdviceInputSchema
>;

const GetWateringAdviceOutputSchema = z.object({
    shouldWater: z.enum(['Yes', 'No', 'Wait']).describe("The final recommendation: 'Yes' to water now, 'No' if it's not time, or 'Wait' if conditions suggest delaying."),
    reason: z.string().describe("A brief, user-friendly explanation for the recommendation."),
});
export type GetWateringAdviceOutput = z.infer<
  typeof GetWateringAdviceOutputSchema
>;

export async function getWateringAdvice(
  input: GetWateringAdviceInput
): Promise<GetWateringAdviceOutput> {
  return getWateringAdviceFlow(input);
}

const getWateringAdviceFlow = ai.defineFlow(
  {
    name: 'getWateringAdviceFlow',
    inputSchema: GetWateringAdviceInputSchema,
    outputSchema: GetWateringAdviceOutputSchema,
  },
  async (input) => {
    // If it's not time to water yet, just return "No".
    if (!input.isWateringOverdue) {
        return { shouldWater: 'No', reason: "It's not time to water yet according to the schedule." };
    }
    
    // Get weather-based advice.
    const weatherData = await getWeatherAndPlantAdvice({
        location: input.location,
        plants: [{ customName: input.plantName, commonName: input.plantCommonName }],
    });

    const advice = weatherData.plantAdvice[0]?.advice || "No specific weather advice available.";

    // Now, ask the LLM to make a final decision based on the weather advice.
    const decisionPrompt = ai.definePrompt({
        name: 'wateringDecisionPrompt',
        input: { schema: z.object({ advice: z.string() })},
        output: { schema: GetWateringAdviceOutputSchema },
        prompt: `You are a plant care expert. A user's plant is due for watering. 
        
        Your expert analysis of the weather forecast is: "${advice}"
        
        Based *only* on this weather analysis, decide if the user should water their plant now, or wait. 
        - If the advice mentions heat, sun, or dry conditions, recommend 'Yes'.
        - If the advice mentions upcoming rain, high humidity, or suggests holding off, recommend 'Wait'.
        - Provide a very short, clear reason for your decision based on the advice. For example, "Yes, it's going to be hot and sunny." or "Wait, rain is expected tomorrow."`
    });

    const { output } = await decisionPrompt({ advice });
    return output!;
  }
);
