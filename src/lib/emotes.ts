
import { Handshake, ThumbsUp, Frown, Sparkles, type LucideIcon } from 'lucide-react';

export interface Emote {
    id: string;
    label: string;
    icon: LucideIcon;
}

export const emotes: Emote[] = [
    { id: 'hello', label: 'よろしく！', icon: Handshake },
    { id: 'gg', label: 'すごい！', icon: ThumbsUp },
    { id: 'oops', label: 'しまった…', icon: Frown },
    { id: 'thanks', label: 'ありがとう', icon: Sparkles },
];
