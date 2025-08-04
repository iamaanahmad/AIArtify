/**
 * @fileOverview A flow for generating images from a text prompt.
 *
 * - generateArt - A function that handles the image generation process.
 * - GenerateArtInput - The input type for the generateArt function.
 * - GenerateArtOutput - The return type for the generateArt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArtInputSchema = z.object({
  prompt: z.string().describe('The text prompt for the image to be generated.'),
});
export type GenerateArtInput = z.infer<typeof GenerateArtInputSchema>;

const GenerateArtOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateArtOutput = z.infer<typeof GenerateArtOutputSchema>;

export async function generateArt(input: GenerateArtInput): Promise<GenerateArtOutput> {
  return generateArtFlow(input);
}

const generateArtFlow = ai.defineFlow(
  {
    name: 'generateArtFlow',
    inputSchema: GenerateArtInputSchema,
    outputSchema: GenerateArtOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!media.url) {
      throw new Error('Image generation failed.');
    }
    
    return { imageUrl: media.url };
  }
);
