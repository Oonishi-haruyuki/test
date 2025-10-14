
'use client';

import { useState } from 'react';
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

export function CollectionCardEditor({ card, onSave, onCancel }: CollectionCardEditorProps) {
    const [editedCard, setEditedCard] = useState<CardData>(card);
    const [charCount, setCharCount] = useState(0);

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
            <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={onCancel}>キャンセル</Button>
                <Button onClick={handleSave}>変更を保存</Button>
            </div>
        </div>
    );
}

