import { useState, useCallback, useEffect } from 'react';
import type { OpenSpecCard, ColumnId, Priority, EpicId } from '../types';
import { SAMPLE_CARDS } from '../data/sampleData';
import { loadBoardState, saveBoardState } from '../utils/persistence';
import { getEpic } from '../utils/epics';

export function useBoard() {
  const [cards, setCards] = useState<OpenSpecCard[]>(() => {
    const saved = loadBoardState();
    return saved ? saved.cards : SAMPLE_CARDS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [epicFilter, setEpicFilter] = useState<EpicId | 'all'>('all');

  useEffect(() => {
    saveBoardState(cards);
  }, [cards]);

  const moveCard = useCallback((cardId: string, toColumn: ColumnId) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, column: toColumn, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<OpenSpecCard>) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const reorderCards = useCallback((columnId: ColumnId, orderedIds: string[]) => {
    setCards((prev) => {
      const otherCards = prev.filter((c) => c.column !== columnId);
      const columnCards = orderedIds
        .map((id) => prev.find((c) => c.id === id))
        .filter(Boolean) as OpenSpecCard[];
      return [...otherCards, ...columnCards];
    });
  }, []);

  const filteredCards = cards.filter((card) => {
    const q = searchQuery.toLowerCase();
    const epic = getEpic(card.epic);
    const matchesSearch =
      searchQuery === '' ||
      card.title.toLowerCase().includes(q) ||
      card.tags.some((t) => t.toLowerCase().includes(q)) ||
      card.specs.some((s) => s.name.toLowerCase().includes(q)) ||
      epic.title.toLowerCase().includes(q) ||
      (card.phase?.toLowerCase().includes(q) ?? false);

    const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
    const matchesEpic = epicFilter === 'all' || card.epic === epicFilter;

    return matchesSearch && matchesPriority && matchesEpic;
  });

  const getColumnCards = useCallback(
    (columnId: ColumnId) => filteredCards.filter((c) => c.column === columnId),
    [filteredCards]
  );

  const resetBoard = useCallback(() => {
    setCards(SAMPLE_CARDS);
  }, []);

  const importCards = useCallback((imported: OpenSpecCard[]) => {
    setCards(imported);
  }, []);

  return {
    cards: filteredCards,
    allCards: cards,
    getColumnCards,
    moveCard,
    updateCard,
    reorderCards,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    epicFilter,
    setEpicFilter,
    resetBoard,
    importCards,
  };
}
