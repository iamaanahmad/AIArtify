// src/ai/flows/alith-prompt-helper.ts

/**
 * @fileOverview Uses the real LazAI Agent to help users improve their text prompts for generating AI art.
 * 
 * BONUS TRACK INTEGRATION: This now uses the official LazAI SDK instead of just mimicking the logic.
 * Real API calls are made to LazAI endpoints and reasoning is stored on-chain.
 *
 * - alithPromptHelper - A function that helps refine user prompts using real LazAI integration.
 * - AlithPromptHelperInput - The input type for the alithPromptHelper function.
 * - AlithPromptHelperOutput - The return type for the alithPromptHelper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { createLazAIAgent, isLazAIAvailable } from '@/lib/lazai-client';

const AlithPromptHelperInputSchema = z.object({
  prompt: z.string().describe('The original text prompt provided by the user.'),
});
export type AlithPromptHelperInput = z.infer<typeof AlithPromptHelperInputSchema>;

const AlithPromptHelperOutputSchema = z.object({
  title: z.string().describe('A short, creative title for the artwork based on the refined prompt.'),
  refinedPrompt: z.string().describe('The refined text prompt suggested by Alith.'),
  reasoning: z.string().optional().describe('Alith reasoning for why the prompt was changed, can be omitted.'),
  qualityScore: z.number().optional().describe('Predicted quality score for the refined prompt (0-1).'),
  lazaiReasoning: z.string().optional().describe('Deep reasoning provided by LazAI SDK integration.'),
  lazaiConfidence: z.number().optional().describe('Confidence score from LazAI reasoning (0-1).'),
  lazaiModel: z.string().optional().describe('The LazAI model used for reasoning.'),
  lazaiTxHash: z.string().optional().describe('Transaction hash for on-chain reasoning storage.'),
});
export type AlithPromptHelperOutput = z.infer<typeof AlithPromptHelperOutputSchema>;

export async function alithPromptHelper(input: AlithPromptHelperInput): Promise<AlithPromptHelperOutput> {
  // First, get the basic refined prompt using the existing Genkit flow
  const basicResult = await alithPromptHelperFlow(input);
  
  // BONUS TRACK: Enhance with real LazAI SDK integration
  if (isLazAIAvailable()) {
    try {
      console.log('🚀 BONUS TRACK: Using real LazAI SDK integration');
      
      const lazaiAgent = createLazAIAgent();
      
      // Call the actual LazAI reasoning endpoint
      const lazaiResult = await lazaiAgent.reason({
        prompt: input.prompt,
        context: `Basic refinement: ${basicResult.refinedPrompt}`,
      });
      
      console.log('✅ LazAI reasoning completed:', {
        model: lazaiResult.model,
        confidence: lazaiResult.confidence,
        txHash: lazaiResult.transactionHash,
      });
      
      return {
        ...basicResult,
        lazaiReasoning: lazaiResult.reasoning,
        lazaiConfidence: lazaiResult.confidence,
        lazaiModel: lazaiResult.model,
        lazaiTxHash: lazaiResult.transactionHash,
      };
    } catch (error) {
      console.error('❌ LazAI integration failed, falling back to basic:', error);
      // Fall back to basic result if LazAI fails
    }
  } else {
    console.log('⚠️ LazAI SDK not configured, using basic implementation');
  }
  
  return basicResult;
}

const alithPrompt = ai.definePrompt({
  name: 'alithPrompt',
  input: {schema: AlithPromptHelperInputSchema},
  output: {schema: AlithPromptHelperOutputSchema},
  prompt: `You are Alith, an AI art prompt engineer. You are helping a user refine their prompt so it can produce a better image.

Original Prompt: {{{prompt}}}

Based on the original prompt, suggest a refined prompt that would generate a more creative and higher quality AI art. Also, create a short, creative title for the artwork. Explain why you are suggesting the changes. Return only the title, the refined prompt, and your explanation. If the prompt is already perfect, simply return it as is along with a fitting title.`, config: {
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
