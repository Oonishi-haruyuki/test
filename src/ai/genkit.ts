
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {genkitEval} from '@genkit-ai/eval';
import {googleCloud} from '@genkit-ai/google-cloud';

configureGenkit({
  plugins: [
    googleAI(),
    googleCloud(),
    genkitEval(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { googleAI };

export const ai = genkit({
  model: 'googleai/gemini-pro',
});
