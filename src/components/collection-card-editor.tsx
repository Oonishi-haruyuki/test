
'use client';

import { useState, useMemo } from 'react';
import type { CardData } from './card-editor';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface CollectionCardEditorProps {
    card: CardData;
    onSave: (updatedCard: CardData) => void;
    onCancel: () => void;
}

// Levenshtein distance to calculate the difference between two strings
const levenshtein = (s1: string, s2: string): number => {
    if (s1.length < s2.length) {
      return levenshtein(s2, s1);
    }
    if (s2.length === 0) {
      return s1.length;
    }
    let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
    for (let i = 0; i < s1.length; i++) {
      let currentRow = [i + 1];
      for (let j = 0; j < s2.length; j++) {
        let insertions = previousRow[j + 1] + 1;
        let deletions = currentRow[j] + 1;
        let substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
        currentRow.push(Math.min(insertions, deletions, substitutions));
      }
      previousRow = currentRow;
    }
    return previousRow[previousRow.length - 1];
};


export function CollectionCardEditor({ card, onSave, onCancel }: CollectionCardEditorProps) {
    const [editedCard, setEditedCard] = useState<CardData>(card);
    const EDIT_COST_PER_CHAR = 3;

    const diff = useMemo(() => {
        const nameDiff = levenshtein(card.name, editedCard.name);
        const abilitiesDiff = levenshtein(card.abilities, editedCard.abilities);
        const flavorTextDiff = levenshtein(card.flavorText, editedCard.flavorText);
        return nameDiff + abilitiesDiff + flavorTextDiff;
    }, [card, editedCard]);

    const cost = diff * EDIT_COST_PER_CHAR;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedCard(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(editedCard);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">カード名</Label>
                <Input 
                    id="name" 
                    name="name" 
                    value={editedCard.name} 
                    onChange={handleChange} 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="abilities">能力</Label>
                <Textarea
                    id="abilities"
                    name="abilities"
                    value={editedCard.abilities}
                    onChange={handleChange}
                    rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="flavorText">フレーバーテキスト</Label>
                <Textarea
                    id="flavorText"
                    name="flavorText"
                    value={editedCard.flavorText}
                    onChange={handleChange}
                    rows={2}
                />
            </div>
            <div className="flex justify-between items-center">
                 <div className="text-sm font-semibold">
                    編集コスト: <span className="font-bold text-primary">{cost}G</span> ({diff}文字変更)
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={onCancel}>キャンセル</Button>
                    <Button onClick={handleSave}>変更を保存</Button>
                </div>
            </div>
        </div>
    );
}
