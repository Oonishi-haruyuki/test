
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY;

export { googleAI };

export const ai = genkit({
  plugins: [apiKey ? googleAI({apiKey}) : googleAI()],
  model: process.env.GENKIT_MODEL || 'googleai/gemini-2.0-flash',
});
