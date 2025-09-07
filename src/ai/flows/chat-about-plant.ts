
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
  question: z.string().describe('The user\'s question about the plant.'),
  context: z.string().optional().describe('Additional context for the conversation, like the current care tips.'),
  journal: z.array(JournalEntrySchema).optional().describe('A list of journal entries for the plant, including date and notes.'),
  placement: z.enum(['Indoor', 'Outdoor', 'Indoor/Outdoor']).optional().describe('Where the plant is placed.'),
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
  prompt: `You are Sage, a helpful and friendly gardening assistant AI. A user wants to ask a question about their plant.

Plant Name: {{{plantName}}}
Question: {{{question}}}

{{#if placement}}
The plant is placed: **{{{placement}}}**. Take this into account.
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

Please provide a helpful and concise answer to the user's question. If you use information from the journal or the context, be sure to mention it.`,
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
