/**
 * @fileOverview Enhanced art generation flow with multi-node consensus validation
 * Integrates consensus engine for higher quality AI art generation
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MultiNodeConsensus, ConsensusRequest } from '@/ai/consensus-engine';

const EnhancedGenerateArtInputSchema = z.object({
  prompt: z.string().describe('The text prompt for the image to be generated.'),
  style: z.string().optional().describe('Art style preference (e.g., realistic, abstract, digital art)'),
  qualityLevel: z.enum(['standard', 'high', 'premium']).default('standard').describe('Quality level affecting consensus validation'),
  enhancePrompt: z.boolean().default(true).describe('Whether to enhance the prompt using consensus'),
  validateResult: z.boolean().default(true).describe('Whether to validate the result using consensus'),
  metadata: z.record(z.any()).optional().describe('Additional metadata for the generation'),
});

export type EnhancedGenerateArtInput = z.infer<typeof EnhancedGenerateArtInputSchema>;

const EnhancedGenerateArtOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a data URI with MIME type and Base64 encoding."),
  enhancedPrompt: z.string().describe("The enhanced prompt used for generation"),
  qualityScore: z.number().describe("Quality score from consensus validation (0-1)"),
  confidence: z.number().describe("Consensus confidence level (0-1)"),
  consensusData: z.object({
    participatingNodes: z.number(),
    agreementLevel: z.string(),
    processingTime: z.number(),
    reasoning: z.string()
  }).describe("Consensus validation metadata"),
  metadata: z.record(z.any()).optional().describe("Additional metadata about the generation"),
});

export type EnhancedGenerateArtOutput = z.infer<typeof EnhancedGenerateArtOutputSchema>;

// Initialize consensus engine
const consensusEngine = new MultiNodeConsensus();

export async function enhancedGenerateArt(input: EnhancedGenerateArtInput): Promise<EnhancedGenerateArtOutput> {
  return enhancedGenerateArtFlow(input);
}

const enhancedGenerateArtFlow = ai.defineFlow(
  {
    name: 'enhancedGenerateArtFlow',
    inputSchema: EnhancedGenerateArtInputSchema,
    outputSchema: EnhancedGenerateArtOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    console.log('[Enhanced Art] Starting enhanced generation with consensus validation');

    let finalPrompt = input.prompt;
    let consensusData = {
      participatingNodes: 1,
      agreementLevel: 'high' as string,
      processingTime: 0,
      reasoning: 'Standard generation without consensus'
    };

    // Step 1: Enhance prompt using consensus (if enabled and quality level allows)
    if (input.enhancePrompt && input.qualityLevel !== 'standard') {
      try {
        console.log('[Enhanced Art] Enhancing prompt with consensus...');
        
        const enhanceRequest: ConsensusRequest = {
          type: 'enhance',
          prompt: input.prompt,
          metadata: { 
            style: input.style,
            originalPrompt: input.prompt 
          },
          requiredConfidence: input.qualityLevel === 'premium' ? 0.8 : 0.7,
          maxNodes: input.qualityLevel === 'premium' ? 4 : 3,
          timeout: 15000
        };

        const enhanceResult = await consensusEngine.executeConsensus(enhanceRequest);
        
        if (enhanceResult.confidence >= enhanceRequest.requiredConfidence) {
          finalPrompt = enhanceResult.finalResult.text || enhanceResult.finalResult.response || finalPrompt;
          console.log('[Enhanced Art] Prompt enhanced successfully');
        } else {
          console.log('[Enhanced Art] Prompt enhancement below threshold, using original');
        }

        consensusData = {
          participatingNodes: enhanceResult.participatingNodes,
          agreementLevel: enhanceResult.metadata.agreementLevel,
          processingTime: enhanceResult.metadata.totalProcessingTime,
          reasoning: `Prompt enhancement: ${enhanceResult.reasoning}`
        };

      } catch (error) {
        console.error('[Enhanced Art] Prompt enhancement failed:', error);
        // Continue with original prompt
      }
    }

    // Step 2: Generate the image
    console.log('[Enhanced Art] Generating image with prompt:', finalPrompt);
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: finalPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!media?.url) {
      throw new Error('Image generation failed.');
    }

    let qualityScore = 0.8; // Default quality score
    let confidence = 0.8; // Default confidence

    // Step 3: Validate result using consensus (if enabled and quality level allows)
    if (input.validateResult && input.qualityLevel !== 'standard') {
      try {
        console.log('[Enhanced Art] Validating result with consensus...');
        
        const validateRequest: ConsensusRequest = {
          type: 'validate',
          prompt: `Evaluate this AI-generated art based on the prompt: "${finalPrompt}". Consider artistic quality, prompt adherence, and overall aesthetic appeal.`,
          image: media.url,
          metadata: { 
            originalPrompt: input.prompt,
            enhancedPrompt: finalPrompt,
            style: input.style 
          },
          requiredConfidence: input.qualityLevel === 'premium' ? 0.8 : 0.7,
          maxNodes: input.qualityLevel === 'premium' ? 4 : 3,
          timeout: 20000
        };

        const validateResult = await consensusEngine.executeConsensus(validateRequest);
        
        qualityScore = validateResult.metadata.qualityScore;
        confidence = validateResult.confidence;

        // Update consensus data with validation info
        consensusData = {
          participatingNodes: Math.max(consensusData.participatingNodes, validateResult.participatingNodes),
          agreementLevel: validateResult.metadata.agreementLevel,
          processingTime: consensusData.processingTime + validateResult.metadata.totalProcessingTime,
          reasoning: `${consensusData.reasoning}. Validation: ${validateResult.reasoning}`
        };

        console.log(`[Enhanced Art] Validation complete - Quality: ${(qualityScore * 100).toFixed(1)}%, Confidence: ${(confidence * 100).toFixed(1)}%`);

      } catch (error) {
        console.error('[Enhanced Art] Result validation failed:', error);
        // Continue with default scores
      }
    }

    const totalTime = Date.now() - startTime;
    consensusData.processingTime = totalTime;

    console.log(`[Enhanced Art] Generation complete in ${totalTime}ms`);

    return {
      imageUrl: media.url,
      enhancedPrompt: finalPrompt,
      qualityScore,
      confidence,
      consensusData,
      metadata: {
        originalPrompt: input.prompt,
        style: input.style,
        qualityLevel: input.qualityLevel,
        totalGenerationTime: totalTime,
        enhancePromptUsed: input.enhancePrompt,
        validateResultUsed: input.validateResult,
        timestamp: new Date().toISOString()
      }
    };
  }
);

// Quality-based generation presets
export const QUALITY_PRESETS = {
  standard: {
    enhancePrompt: false,
    validateResult: false,
    qualityLevel: 'standard' as const,
    description: 'Fast generation with basic quality'
  },
  high: {
    enhancePrompt: true,
    validateResult: true,
    qualityLevel: 'high' as const,
    description: 'Enhanced prompt and result validation'
  },
  premium: {
    enhancePrompt: true,
    validateResult: true,
    qualityLevel: 'premium' as const,
    description: 'Full consensus validation for maximum quality'
  }
} as const;

// Utility function to get preset configuration
export function getQualityPreset(level: keyof typeof QUALITY_PRESETS) {
  return QUALITY_PRESETS[level];
}

// Batch generation with consensus optimization
export async function batchGenerateArt(
  prompts: string[], 
  options: Partial<EnhancedGenerateArtInput> = {}
): Promise<EnhancedGenerateArtOutput[]> {
  console.log(`[Enhanced Art] Starting batch generation of ${prompts.length} images`);
  
  const results: EnhancedGenerateArtOutput[] = [];
  
  // Process in smaller batches to avoid overwhelming the consensus engine
  const batchSize = 3;
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    
    const batchPromises = batch.map(prompt => 
      enhancedGenerateArt({
        prompt,
        qualityLevel: options.qualityLevel || 'standard',
        enhancePrompt: options.enhancePrompt !== false,
        validateResult: options.validateResult !== false,
        style: options.style,
        metadata: options.metadata
      })
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`[Enhanced Art] Batch generation failed for prompt ${i + index}:`, result.reason);
      }
    });
    
    // Small delay between batches to prevent rate limiting
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`[Enhanced Art] Batch generation complete: ${results.length}/${prompts.length} successful`);
  return results;
}

// Export consensus engine for direct access
export { consensusEngine };
