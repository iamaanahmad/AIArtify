// src/ai/flows/alith-prompt-helper.ts
'use server';

/**
 * @fileOverview Uses the Alith AI agent to help users improve their text prompts for generating AI art.
 *
 * - alithPromptHelper - A function that helps refine user prompts using Alith.
 * - AlithPromptHelperInput - The input type for the alithPromptHelper function.
 * - AlithPromptHelperOutput - The return type for the alithPromptHelper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AlithPromptHelperInputSchema = z.object({
  prompt: z.string().describe('The original text prompt provided by the user.'),
});
export type AlithPromptHelperInput = z.infer<typeof AlithPromptHelperInputSchema>;

const AlithPromptHelperOutputSchema = z.object({
  refinedPrompt: z.string().describe('The refined text prompt suggested by Alith.'),
  reasoning: z.string().optional().describe('Alith reasoning for why the prompt was changed, can be omitted.'),
});
export type AlithPromptHelperOutput = z.infer<typeof AlithPromptHelperOutputSchema>;

export async function alithPromptHelper(input: AlithPromptHelperInput): Promise<AlithPromptHelperOutput> {
  return alithPromptHelperFlow(input);
}

const alithPrompt = ai.definePrompt({
  name: 'alithPrompt',
  input: {schema: AlithPromptHelperInputSchema},
  output: {schema: AlithPromptHelperOutputSchema},
  prompt: `You are Alith, an AI art prompt engineer. You are helping a user refine their prompt so it can produce a better image.

Original Prompt: {{{prompt}}}

Based on the original prompt, suggest a refined prompt that would generate a more creative and higher quality AI art.  Explain why you are suggesting the changes. Return only the refined prompt and your explanation. If the prompt is already perfect, simply return it as is.`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const alithPromptHelperFlow = ai.defineFlow(
  {
    name: 'alithPromptHelperFlow',
    inputSchema: AlithPromptHelperInputSchema,
    outputSchema: AlithPromptHelperOutputSchema,
  },
  async input => {
    const {output} = await alithPrompt(input);
    return output!;
  }
);
