
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

configureGenkit({
  plugins: [googleAI()],
});

export { googleAI };

export const ai = genkit({
  model: 'googleai/gemini-pro',
});
