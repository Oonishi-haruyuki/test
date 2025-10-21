
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating an image from a text prompt.
 *
 * @file         src/ai/flows/generate-image.ts
 * @exports    generateImage - The main function to generate an image.
 * @exports    GenerateImageInput - The input type for the generateImage function.
 * @exports    GenerateImageOutput - The output type for the generateImage function.
 */

import {ai, googleAI} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
        model: googleAI.model('imagen-4.0-fast-generate-001'),
        prompt: `Generate a card game artwork with the following theme: ${prompt}. Fantasy art style.`,
    });
    
    if (!media?.url) {
        throw new Error('Image generation failed.');
    }
    const imageUrl = media.url;

    return { imageUrl };
  }
);
