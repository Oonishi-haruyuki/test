# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Google AI Studio setup (Genkit)

This project uses Genkit with `@genkit-ai/google-genai`.

1. Create `.env.local` in the project root.
2. Copy values from `.env.local.example`.
3. Set your API key from Google AI Studio:

```env
GEMINI_API_KEY=your_api_key_here
```

You can also use `GOOGLE_API_KEY` or `GOOGLE_GENAI_API_KEY`.

Optional model override:

```env
GENKIT_MODEL=googleai/gemini-2.0-flash
```

Run Genkit:

```bash
npm run genkit:dev
```

Run app:

```bash
npm run dev
```

Quick key check:

```bash
printenv | grep -E "GEMINI_API_KEY|GOOGLE_API_KEY|GOOGLE_GENAI_API_KEY"
```

If you update `.env.local`, restart the process.
