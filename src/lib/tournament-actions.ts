
'use server';

import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export interface CreateTournamentOptions {
    name: string;
    startTime: string;
    entryFee: number;
    deckType: 'user-created' | 'ai-generated';
}

interface SuccessResponse {
    success: true;
    message: string;
    tournamentId?: string;
}

interface ErrorResponse {
    success: false;
    message: string;
    error?: {
        name: string;
        message: string;
        details: any;
    };
}


export async function createTournament(
    organizerId: string, 
    organizerLoginId: string, 
    options: CreateTournamentOptions
): Promise<SuccessResponse | ErrorResponse> {
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

    try {
        await setDoc(newTournamentRef, tournamentData);
        return { success: true, message: '大会が作成されました。', tournamentId };
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const context = {
                path: newTournamentRef.path,
                operation: 'create',
                requestResourceData: tournamentData,
            };
            return {
                success: false,
                message: 'Firestoreの権限がありません。',
                error: {
                    name: 'FirestorePermissionError',
                    message: `The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`,
                    details: context,
                }
            };
        }
        return { 
            success: false, 
            message: '不明なサーバーエラーが発生しました。',
            error: { name: error.name, message: error.message, details: {} }
        };
    }
}
