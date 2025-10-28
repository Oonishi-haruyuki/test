
'use server';

import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export interface CreateTournamentOptions {
    name: string;
    startTime: string;
    entryFee: number;
    deckType: 'user-created' | 'ai-generated';
}

export async function createTournament(
    organizerId: string, 
    organizerLoginId: string, 
    options: CreateTournamentOptions
): Promise<{ success: boolean; message: string; tournamentId?: string }> {
    const { firestore } = initializeFirebase();
    
    const newTournamentRef = doc(collection(firestore, 'tournaments'));
    const tournamentId = newTournamentRef.id;

    const firstParticipant = {
        userId: organizerId,
        userLoginId: organizerLoginId,
        deckId: null, // Organizer must also register a deck
        deckName: null,
        deckCards: [],
    };

    const tournamentData = {
        ...options,
        organizerId,
        organizerLoginId,
        startTime: new Date(options.startTime),
        status: 'registering',
        prizePool: options.entryFee, // Initial prize pool is the organizer's fee
        participants: [firstParticipant],
        bracket: {}, // To be generated later
        createdAt: serverTimestamp(),
    };

    // Use .catch() to handle potential permission errors from setDoc
    setDoc(newTournamentRef, tournamentData)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: newTournamentRef.path,
                operation: 'create',
                requestResourceData: tournamentData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });

    return { success: true, message: '大会が作成されました。', tournamentId };
}
