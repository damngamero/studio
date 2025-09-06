'use server';

/**
 * @fileOverview A Genkit flow for chatting about a plant.
 *
 * - chatAboutPlant - A function that handles the chat.
 * - ChatAboutPlantInput - The input type for the chatAboutPlant function.
 * - ChatAboutPlantOutput - The return type for the chatAboutPlant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatAboutPlantInputSchema = z.object({
  plantName: z.string().describe('The name of the plant.'),
  question: z.string().describe('The user\'s question about the plant.'),
});
export type ChatAboutPlantInput = z.infer<typeof ChatAboutPlantInputSchema>;

const ChatAboutPlantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question.'),
});
export type ChatAboutPlantOutput = z.infer<typeof ChatAboutPlantOutputSchema>;

export async function chatAboutPlant(input: ChatAboutPlantInput): Promise<ChatAboutPlantOutput> {
  return chatAboutPlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAboutPlantPrompt',
  input: { schema: ChatAboutPlantInputSchema },
  output: { schema: ChatAboutPlantOutputSchema },
  prompt: `You are a helpful gardening assistant. A user wants to ask a question about their plant.

Plant Name: {{{plantName}}}
Question: {{{question}}}

Please provide a helpful and concise answer to the user's question.`,
});

const chatAboutPlantFlow = ai.defineFlow(
  {
    name: 'chatAboutPlantFlow',
    inputSchema: ChatAboutPlantInputSchema,
    outputSchema: ChatAboutPlantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
