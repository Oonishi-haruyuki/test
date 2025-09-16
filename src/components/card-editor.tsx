
'use client';

import { generateCardIdeas, type GenerateCardIdeasOutput } from '@/ai/flows/generate-card-ideas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Wand2 } from 'lucide-react';
import type React from 'react';
import { useState, useTransition } from 'react';

// Type definitions
export type Theme = 'fantasy' | 'sci-fi' | 'modern';
export type CardType = 'creature' | 'spell' | 'artifact' | 'land';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';

export interface CardData {
  theme: Theme;
  name: string;
  manaCost: number;
  attack: number;
  defense: number;
  cardType: CardType;
  rarity: Rarity;
  abilities: string;
  flavorText: string;
  imageUrl: string;
  imageHint: string;
}

interface CardEditorProps {
  cardData: CardData;
  setCardData: React.Dispatch<React.SetStateAction<CardData>>;
}

export function CardEditor({ cardData, setCardData }: CardEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [aiTheme, setAiTheme] = useState('a powerful mystic dragon');
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: name === 'manaCost' || name === 'attack' || name === 'defense' ? Number(value) : value }));
  };

  const handleSelectChange = (name: keyof CardData) => (value: string) => {
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (value: string) => {
    setCardData(prev => ({ ...prev, theme: value as Theme }));
  };

  const handleGenerate = async () => {
    if (!aiTheme.trim()) {
        toast({
            variant: 'destructive',
            title: 'Theme is empty',
            description: 'Please enter a theme or prompt to generate a card.',
        });
        return;
    }
    startTransition(async () => {
      try {
        const result: GenerateCardIdeasOutput = await generateCardIdeas({ theme: aiTheme });
        setCardData(prev => ({
          ...prev,
          name: result.cardName,
          abilities: result.abilities.replace(/\\n/g, '\n'),
          flavorText: result.flavorText,
        }));
        toast({
          title: 'Card Idea Generated!',
          description: `Created "${result.cardName}".`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Could not generate card ideas. Please try again.',
        });
      }
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Generate with AI</CardTitle>
            <CardDescription>Describe a theme and let AI create a card for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="ai-theme">Theme or Prompt</Label>
              <Input
                id="ai-theme"
                placeholder="e.g., a futuristic cyborg ninja"
                value={aiTheme}
                onChange={e => setAiTheme(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
              Generate Idea
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Customize Card</CardTitle>
            <CardDescription>Fine-tune every detail of your card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Card Name</Label>
              <Input id="name" name="name" value={cardData.name} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manaCost">Mana</Label>
                <Input id="manaCost" name="manaCost" type="number" value={cardData.manaCost} onChange={handleInputChange} min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attack">Attack</Label>
                <Input id="attack" name="attack" type="number" value={cardData.attack} onChange={handleInputChange} min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defense">Defense</Label>
                <Input id="defense" name="defense" type="number" value={cardData.defense} onChange={handleInputChange} min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select name="cardType" value={cardData.cardType} onValueChange={handleSelectChange('cardType')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creature">Creature</SelectItem>
                    <SelectItem value="spell">Spell</SelectItem>
                    <SelectItem value="artifact">Artifact</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select name="rarity" value={cardData.rarity} onValueChange={handleSelectChange('rarity')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="uncommon">Uncommon</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="mythic">Mythic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="abilities">Abilities</Label>
              <Textarea id="abilities" name="abilities" value={cardData.abilities} onChange={handleInputChange} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flavorText">Flavor Text</Label>
              <Textarea id="flavorText" name="flavorText" value={cardData.flavorText} onChange={handleInputChange} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Visual Theme</CardTitle>
            <CardDescription>Select a visual style for your card.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={cardData.theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="fantasy" id="fantasy" className="peer sr-only" />
                <Label htmlFor="fantasy" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Fantasy
                </Label>
              </div>
              <div>
                <RadioGroupItem value="sci-fi" id="sci-fi" className="peer sr-only" />
                <Label htmlFor="sci-fi" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Sci-Fi
                </Label>
              </div>
              <div>
                <RadioGroupItem value="modern" id="modern" className="peer sr-only" />
                <Label htmlFor="modern" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Modern
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Export</CardTitle>
            <CardDescription>Download your finished card design.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="w-full" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Download as PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export functionality coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
