'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating card ideas based on a user-provided theme or prompt.
 *
 * The flow takes a theme or prompt as input and generates a card idea, including the card's name, abilities, and flavor text.
 *
 * @file         src/ai/flows/generate-card-ideas.ts
 * @exports    generateCardIdeas - The main function to generate card ideas.
 * @exports    GenerateCardIdeasInput - The input type for the generateCardIdeas function.
 * @exports    GenerateCardIdeasOutput - The output type for the generateCardIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCardIdeasInputSchema = z.object({
  theme: z
    .string()
    .describe('A theme or prompt to generate card ideas from.'),
});
export type GenerateCardIdeasInput = z.infer<typeof GenerateCardIdeasInputSchema>;

const GenerateCardIdeasOutputSchema = z.object({
  cardName: z.string().describe('The name of the card.'),
  abilities: z.string().describe('The abilities of the card.'),
  flavorText: z.string().describe('Flavor text for the card.'),
});
export type GenerateCardIdeasOutput = z.infer<typeof GenerateCardIdeasOutputSchema>;

export async function generateCardIdeas(input: GenerateCardIdeasInput): Promise<GenerateCardIdeasOutput> {
  return generateCardIdeasFlow(input);
}

const generateCardIdeasPrompt = ai.definePrompt({
  name: 'generateCardIdeasPrompt',
  input: {schema: GenerateCardIdeasInputSchema},
  output: {schema: GenerateCardIdeasOutputSchema},
  prompt: `You are a creative card game designer. Generate a unique card idea based on the given theme or prompt.

Theme/Prompt: {{{theme}}}

Consider the following:
- The card name should be evocative and relevant to the theme.
- The abilities should be interesting and balanced.
- The flavor text should add character and depth to the card.

Output the card idea in the following format:
{
  "cardName": "[Card Name]",
  "abilities": "[Card Abilities]",
  "flavorText": "[Card Flavor Text]"
}
`,
});

const generateCardIdeasFlow = ai.defineFlow(
  {
    name: 'generateCardIdeasFlow',
    inputSchema: GenerateCardIdeasInputSchema,
    outputSchema: GenerateCardIdeasOutputSchema,
  },
  async input => {
    const {output} = await generateCardIdeasPrompt(input);
    return output!;
  }
);
