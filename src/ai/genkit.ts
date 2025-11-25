
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

configureGenkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { googleAI };

export const ai = genkit({
  model: 'googleai/gemini-1.5-pro-latest',
});
