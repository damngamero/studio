
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
import type { JournalEntry } from '@/lib/types';

const JournalEntrySchema = z.object({
  date: z.string(),
  notes: z.string(),
});

const ChatAboutPlantInputSchema = z.object({
  plantName: z.string().describe('The name of the plant.'),
  question: z.string().describe("The user's question about the plant."),
  context: z.string().optional().describe('Additional context for the conversation, like the current care tips.'),
  journal: z.array(JournalEntrySchema).optional().describe('A list of journal entries for the plant, including date and notes.'),
  placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).optional().describe('Where the plant is placed.'),
  photoDataUri: z.string().optional().describe("An optional photo provided by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ChatAboutPlantInput = z.infer<typeof ChatAboutPlantInputSchema>;

const ChatAboutPlantOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question."),
  updatedWateringAmount: z.string().optional().describe("If the user's question led to a new watering amount recommendation (e.g., they mentioned pot size or soil being too dry/wet), return the new amount here (e.g., '250-500ml'). Otherwise, leave empty."),
});
export type ChatAboutPlantOutput = z.infer<typeof ChatAboutPlantOutputSchema>;

export async function chatAboutPlant(input: ChatAboutPlantInput): Promise<ChatAboutPlantOutput> {
  return chatAboutPlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAboutPlantPrompt',
  input: { schema: ChatAboutPlantInputSchema },
  output: { schema: ChatAboutPlantOutputSchema },
  prompt: `You are Sage, a helpful and friendly gardening assistant AI. A user wants to ask a question about their plant.

Plant Name: {{{plantName}}}
Question: {{{question}}}

{{#if placement}}
The plant is placed: **{{{placement}}}**. Take this into account.
{{/if}}

{{#if photoDataUri}}
The user has also provided this photo for context. Analyze it as part of your answer.
Photo: {{media url=photoDataUri}}
{{/if}}

{{#if context}}
The user has the following context. Your answer should be related to this context.

## Context
{{{context}}}
{{/if}}


{{#if journal}}
To help answer the question, here are the user's journal entries for this plant. You can analyze them for trends, past events, or health notes.

## Plant Journal
{{#each journal}}
- **{{date}}**: {{{notes}}}
{{/each}}
{{/if}}

Please provide a helpful and concise answer to the user's question. If you use information from the journal or the context, be sure to mention it.

**Crucially**, if your answer includes a new, specific watering amount (e.g., because the user mentioned their pot size, environment, or that the soil is too dry/wet), you MUST populate the 'updatedWateringAmount' field in your response with the new recommended amount (e.g., "250-500ml"). Otherwise, leave it empty.`,
});

const chatAboutPlantFlow = ai.defineFlow(
  {
    name: 'chatAboutPlantFlow',
    inputSchema: ChatAboutPlantInputSchema,
    outputSchema: ChatAboutPlantOutputSchema,
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
