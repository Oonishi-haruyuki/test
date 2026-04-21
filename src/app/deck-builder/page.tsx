
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droppable, Draggable, DragDropContext, DropResult } from '@hello-pangea/dnd';
import { analyzeDeck } from '@/ai/flows/analyze-deck';
import { generateDeckClient } from '@/lib/generate-deck-client';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DECK_SIZE = 20;

type Deck = {
  id: string;
  name: string;
  cards: CardData[];
};

export default function DeckBuilderPage() {
  const [collection, setCollection] = useState<CardData[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newDeckTheme, setNewDeckTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const savedDecks = JSON.parse(localStorage.getItem('cardDecks') || '[]');
      setCollection(savedCollection);
      setDecks(savedDecks);
      if (savedDecks.length > 0) {
        setSelectedDeck(savedDecks[0]);
      } else {
        // If no decks, create a new empty one to start
        const newDeck = { id: `deck-${Date.now()}`, name: '新しいデッキ', cards: [] };
        setDecks([newDeck]);
        setSelectedDeck(newDeck);
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      toast({ variant: "destructive", title: "データの読み込みに失敗しました" });
    }
  }, [toast]);

  const saveDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    localStorage.setItem('cardDecks', JSON.stringify(newDecks));
  };
  
  const handleCreateDeck = () => {
    if (!newDeckName.trim()) {
      toast({ variant: 'destructive', title: 'デッキ名を入力してください' });
      return;
    }
    const newDeck: Deck = { id: `deck-${Date.now()}`, name: newDeckName, cards: [] };
    const updatedDecks = [...decks, newDeck];
    saveDecks(updatedDecks);
    setSelectedDeck(newDeck);
    setNewDeckName('');
    toast({ title: '新しいデッキを作成しました' });
  };
  
  const handleDeleteDeck = (deckId: string) => {
      const updatedDecks = decks.filter(d => d.id !== deckId);
      saveDecks(updatedDecks);
      if (selectedDeck?.id === deckId) {
          setSelectedDeck(updatedDecks.length > 0 ? updatedDecks[0] : null);
      }
      toast({ title: "デッキを削除しました"});
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || !selectedDeck) return;
    
    const sourceIsDeck = source.droppableId === 'deck';
    const destIsDeck = destination.droppableId === 'deck';
    const sourceIsCollection = source.droppableId === 'collection';
    const destIsCollection = destination.droppableId === 'collection';

    const currentDeckCards = selectedDeck.cards;
    const currentCollectionCards = availableCollection;

    // Moving from Collection to Deck
    if (sourceIsCollection && destIsDeck) {
      if (currentDeckCards.length >= DECK_SIZE) {
        toast({ variant: 'destructive', title: `デッキは${DECK_SIZE}枚までです`});
        return;
      }
      const cardToAdd = currentCollectionCards[source.index];
      const newDeckCards = [...currentDeckCards];
      newDeckCards.splice(destination.index, 0, cardToAdd);
      
      const updatedDeck = { ...selectedDeck, cards: newDeckCards };
      const newDecks = decks.map(d => d.id === selectedDeck.id ? updatedDeck : d);
      saveDecks(newDecks);
      setSelectedDeck(updatedDeck);
    }
    // Moving from Deck to Collection (or out of deck)
    else if (sourceIsDeck && (destIsCollection || !destination)) {
        const newDeckCards = [...currentDeckCards];
        newDeckCards.splice(source.index, 1);
        
        const updatedDeck = { ...selectedDeck, cards: newDeckCards };
        const newDecks = decks.map(d => d.id === selectedDeck.id ? updatedDeck : d);
        saveDecks(newDecks);
        setSelectedDeck(updatedDeck);
    }
    // Reordering within the deck
    else if (sourceIsDeck && destIsDeck) {
        const newDeckCards = [...currentDeckCards];
        const [removed] = newDeckCards.splice(source.index, 1);
        newDeckCards.splice(destination.index, 0, removed);
        
        const updatedDeck = { ...selectedDeck, cards: newDeckCards };
        const newDecks = decks.map(d => d.id === selectedDeck.id ? updatedDeck : d);
        saveDecks(newDecks);
        setSelectedDeck(updatedDeck);
    }
  };

  const availableCollection = useMemo(() => {
    if (!selectedDeck) return collection;
    const deckCardIds = new Set(selectedDeck.cards.map(c => c.id));
    return collection.filter(card => 
      !deckCardIds.has(card.id) && 
      card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collection, selectedDeck, searchTerm]);

  const handleAnalyzeDeck = async () => {
    if (!selectedDeck || selectedDeck.cards.length === 0) {
      toast({ variant: 'destructive', title: '分析するカードがありません' });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
        const deckForAnalysis = selectedDeck.cards.map(c => ({
            name: c.name,
            manaCost: c.manaCost,
            attack: c.attack,
            defense: c.defense,
            cardType: c.cardType,
            creatureType: c.creatureType,
            abilities: c.abilities,
        }));
        const result = await analyzeDeck({ deck: deckForAnalysis });
        setAnalysisResult(result);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'デッキの分析に失敗しました' });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerateDeck = async () => {
    if (!newDeckTheme.trim()) {
      toast({ variant: 'destructive', title: 'デッキのテーマを入力してください' });
      return;
    }
    setIsGenerating(true);
    try {
            const result = await generateDeckClient({ theme: newDeckTheme, cardCount: DECK_SIZE });
      
      // Add IDs to the generated cards
      const newCards = result.deck.map(card => ({
        ...card,
        id: `card-${Date.now()}-${Math.random()}` 
      }));

      // Add new cards to the collection
      const updatedCollection = [...collection, ...newCards];
      setCollection(updatedCollection);
      localStorage.setItem('cardCollection', JSON.stringify(updatedCollection));

      // Add new cards to the current deck
      if (selectedDeck) {
        const combinedCards = [...selectedDeck.cards, ...newCards];
        const newDeckCards = combinedCards.slice(0, DECK_SIZE);
        
        const updatedDeck = { ...selectedDeck, cards: newDeckCards };
        const newDecks = decks.map(d => d.id === selectedDeck.id ? updatedDeck : d);
        saveDecks(newDecks);
        setSelectedDeck(updatedDeck);
      }

      toast({ title: '新しいデッキが生成されました！', description: `${newCards.length}枚のカードがコレクションと現在のデッキに追加されました。` });
      setNewDeckTheme('');

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'デッキの生成に失敗しました' });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div>
            <h1 className="text-3xl font-bold mb-2">デッキ構築</h1>
            <p className="text-muted-foreground mb-6">ドラッグ＆ドロップでデッキを構築・編集します。</p>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={selectedDeck?.id || ''} onValueChange={(deckId) => setSelectedDeck(decks.find(d => d.id === deckId) || null)}>
                    <SelectTrigger className="w-full md:w-[250px]">
                        <SelectValue placeholder="デッキを選択" />
                    </SelectTrigger>
                    <SelectContent>
                        {decks.map(deck => (
                            <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Input 
                        placeholder="新しいデッキ名" 
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                    />
                    <Button onClick={handleCreateDeck}>新規作成</Button>
                </div>
                 {selectedDeck && (
                     <Button variant="destructive" onClick={() => handleDeleteDeck(selectedDeck.id)}>
                        「{selectedDeck.name}」を削除
                    </Button>
                 )}
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>AIデッキ自動生成</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-2">
                    <Input 
                        placeholder="デッキのテーマ（例：ドラゴン, 忍者, 宇宙海賊）" 
                        value={newDeckTheme}
                        onChange={(e) => setNewDeckTheme(e.target.value)}
                        disabled={isGenerating}
                    />
                    <Button onClick={handleGenerateDeck} disabled={isGenerating} className="w-full md:w-auto">
                        {isGenerating ? <Loader2 className="animate-spin"/> : <Wand2/>}
                        {DECK_SIZE}枚のカードを生成
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Collection */}
                <Card>
                    <CardHeader>
                        <CardTitle>マイカード ({availableCollection.length})</CardTitle>
                        <Input 
                            placeholder="カードを検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-2"
                        />
                    </CardHeader>
                    <CardContent>
                        <Droppable droppableId="collection">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[400px] p-2 rounded-lg bg-secondary/50 transition-colors ${snapshot.isDraggingOver ? 'bg-secondary' : ''}`}
                                >
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {availableCollection.map((card, index) => (
                                            <Draggable key={card.id} draggableId={card.id!} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <CardPreview {...card} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    </div>
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </CardContent>
                </Card>

                {/* Deck */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{selectedDeck?.name || "デッキ"} ({selectedDeck?.cards.length || 0} / {DECK_SIZE})</span>
                            <Button onClick={handleAnalyzeDeck} disabled={isAnalyzing}>
                                {isAnalyzing ? <Loader2 className="animate-spin"/> : <Wand2/>}
                                AIデッキ評価
                            </Button>
                        </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <Droppable droppableId="deck">
                            {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`min-h-[400px] p-2 rounded-lg bg-primary/10 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/20' : ''}`}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {selectedDeck?.cards.map((card, index) => (
                                    <Draggable key={card.id} draggableId={card.id!} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <CardPreview {...card} />
                                        </div>
                                    )}
                                    </Draggable>
                                ))}
                                </div>
                                {provided.placeholder}
                            </div>
                            )}
                        </Droppable>
                        </CardContent>
                    </Card>

                    {isAnalyzing && <p className="text-center">AIがデッキを評価中...</p>}
                    
                    {analysisResult && (
                        <Alert>
                            <AlertTitle className="font-bold text-lg">AIによるデッキ評価</AlertTitle>
                            <AlertDescription>
                                <div className="space-y-4 mt-2">
                                    <div>
                                        <h4 className="font-semibold">戦術</h4>
                                        <p>{analysisResult.strategy}</p>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold">長所</h4>
                                        <p>{analysisResult.strengths}</p>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold">弱点</h4>
                                        <p>{analysisResult.weaknesses}</p>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold">カウンター戦略</h4>
                                        <p>{analysisResult.counterStrategy}</p>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    </DragDropContext>
  );
}
