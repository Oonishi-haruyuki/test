import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CardData } from '@/components/card-editor';
import { goblinDeck } from '@/lib/decks';

export const MAX_USER_DECKS = 20;

export class UserDataStoreError extends Error {
  code: 'DECK_LIMIT_REACHED';

  constructor(code: 'DECK_LIMIT_REACHED', message: string) {
    super(message);
    this.name = 'UserDataStoreError';
    this.code = code;
  }
}

export type UserDeck = {
  id: string;
  name: string;
  cards: CardData[];
};

type DeckBuilderData = {
  collection: CardData[];
  decks: UserDeck[];
};

type SessionData = {
  storyModeDeck?: CardData[];
};

const STARTER_DECK_ID = 'starter-goblin-v1';
const STARTER_DECK_NAME = '初期配布デッキ: ゴブリン突撃';

function deckBuilderDocRef(userId: string) {
  return doc(db, 'users', userId, 'appData', 'deckBuilder');
}

function sessionDocRef(userId: string) {
  return doc(db, 'users', userId, 'appData', 'session');
}

function sanitizeForFirestore<T>(value: T): T {
  // Firestore rejects undefined values. JSON serialization strips them.
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneCards(cards: CardData[]): CardData[] {
  return cards.map((card) => ({ ...card }));
}

function createStarterDeckBuilderData(): DeckBuilderData {
  const starterCards = cloneCards(goblinDeck);
  return {
    collection: cloneCards(starterCards),
    decks: [
      {
        id: STARTER_DECK_ID,
        name: STARTER_DECK_NAME,
        cards: starterCards,
      },
    ],
  };
}

export async function loadDeckBuilderData(userId: string): Promise<DeckBuilderData> {
  try {
    const snap = await getDoc(deckBuilderDocRef(userId));
    if (!snap.exists()) {
      const starterData = createStarterDeckBuilderData();
      try {
        await saveDeckBuilderData(userId, starterData);
      } catch (saveErr) {
        console.warn('Failed to save initial starter deck to Firestore, using local fallback:', saveErr);
      }
      return starterData;
    }

    const data = snap.data() as Partial<DeckBuilderData>;
    const loadedData: DeckBuilderData = {
      collection: (data.collection ?? []) as CardData[],
      decks: (data.decks ?? []) as UserDeck[],
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`deckbuilder_${userId}`, JSON.stringify(loadedData));
      } catch {}
    }
    return loadedData;
  } catch (err) {
    console.warn('Firestore loadDeckBuilderData failed, attempting localStorage fallback:', err);
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`deckbuilder_${userId}`);
        if (local) {
          return JSON.parse(local) as DeckBuilderData;
        }
      } catch {}
    }
    return createStarterDeckBuilderData();
  }
}

export async function saveDeckBuilderData(userId: string, data: DeckBuilderData): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`deckbuilder_${userId}`, JSON.stringify(data));
    } catch {}
  }
  try {
    await setDoc(
      deckBuilderDocRef(userId),
      {
        ...sanitizeForFirestore(data),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore saveDeckBuilderData failed (local fallback persisted):', err);
  }
}

export async function loadUserDecks(userId: string): Promise<UserDeck[]> {
  const data = await loadDeckBuilderData(userId);
  return data.decks;
}

export async function loadUserCollection(userId: string): Promise<CardData[]> {
  const data = await loadDeckBuilderData(userId);
  return data.collection;
}

export async function saveUserCollection(userId: string, collection: CardData[]): Promise<void> {
  const data = await loadDeckBuilderData(userId);
  await saveDeckBuilderData(userId, {
    collection,
    decks: data.decks,
  });
}

export async function appendUserCard(userId: string, card: CardData): Promise<CardData[]> {
  const data = await loadDeckBuilderData(userId);
  const nextCollection = [...data.collection, card];
  await saveDeckBuilderData(userId, {
    collection: nextCollection,
    decks: data.decks,
  });
  return nextCollection;
}

export async function appendUserDeck(userId: string, deck: UserDeck): Promise<UserDeck[]> {
  const data = await loadDeckBuilderData(userId);

  if (data.decks.length >= MAX_USER_DECKS) {
    throw new UserDataStoreError('DECK_LIMIT_REACHED', `デッキは最大${MAX_USER_DECKS}個までです。`);
  }

  const nextDecks = [...data.decks, deck];
  await saveDeckBuilderData(userId, {
    collection: data.collection,
    decks: nextDecks,
  });
  return nextDecks;
}

export async function saveStoryModeDeck(userId: string, deck: CardData[]): Promise<void> {
  const safeData: SessionData = { storyModeDeck: sanitizeForFirestore(deck) };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`storyModeDeck_${userId}`, JSON.stringify(deck));
    } catch {}
  }
  try {
    await setDoc(
      sessionDocRef(userId),
      {
        ...safeData,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore saveStoryModeDeck failed (local fallback persisted):', err);
  }
}

export async function loadStoryModeDeck(userId: string): Promise<CardData[] | null> {
  try {
    const snap = await getDoc(sessionDocRef(userId));
    if (!snap.exists()) {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`storyModeDeck_${userId}`);
        if (local) return JSON.parse(local);
      }
      return null;
    }
    const data = snap.data() as SessionData;
    return data.storyModeDeck ?? null;
  } catch (err) {
    console.warn('Firestore loadStoryModeDeck failed, attempting localStorage fallback:', err);
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`storyModeDeck_${userId}`);
        if (local) return JSON.parse(local);
      } catch {}
    }
    return null;
  }
}
