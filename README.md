# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.


## Database setup (Firebase Firestore)

This app stores user data in Cloud Firestore and uses Firebase Authentication.

### 1. Create Firebase resources

In the Firebase Console:

1. Create or select a Firebase project.
2. Create a Cloud Firestore database with:
   - Database ID: `(default)`
   - Location: `us-central1`
3. Enable Firebase Authentication providers used by the app:
   - Google sign-in
   - Anonymous sign-in

### 2. Configure local environment variables

Copy the example environment file and fill in your Firebase Web App config:

```bash
cp .env.local.example .env.local
```

Firebase values are available in Firebase Console > Project settings > General > Your apps > Web app config.

### 3. Run Firestore and Auth locally

Use the Firebase emulators when developing locally:

```bash
npm run firebase:emulators
```

If npm reports `Missing script: "firebase:emulators"`, your checkout does not include the script added in this setup. Pull or switch to the branch that contains this README change, or run the equivalent command directly:

```bash
npx -y firebase-tools@latest emulators:start --only firestore,auth
```

The app connects to the local emulators when opened on `localhost`:

- Firestore: `localhost:8080`
- Auth: `localhost:9099`

### 4. Deploy Firestore rules and indexes

After selecting the correct Firebase project with the Firebase CLI, deploy Firestore configuration:

```bash
npm run firebase:deploy:firestore
```

### 5. Start the app

```bash
npm run dev
```

The first time a signed-in user loads deck-builder data, the app creates `users/{userId}/appData/deckBuilder` with the starter Goblin deck automatically.

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

Optional development fallback when Gemini quota/auth fails:

```env
ENABLE_DECK_MOCK_FALLBACK=true
```

When this is enabled, `/api/generate-deck` returns a mock deck instead of an error for upstream rate-limit/auth failures.

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
