import type { BoardState, OpenSpecCard } from '../types';
import { SAMPLE_CARDS, DATA_VERSION } from '../data/sampleData';

const STORAGE_KEY = 'openspec-board-state';

export function loadBoardState(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BoardState;
  } catch {
    return null;
  }
}

export function saveBoardState(cards: OpenSpecCard[], dataVersion: number): void {
  const state: BoardState = {
    cards,
    version: 1,
    dataVersion,
    lastSaved: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Merge saved user state with latest SAMPLE_CARDS definitions.
 *
 * - Cards in SAMPLE_CARDS but not saved → added as-is
 * - Cards saved but not in SAMPLE_CARDS → dropped
 * - Cards in both → definition fields from SAMPLE_CARDS, user state from saved
 */
export function mergeBoardState(saved: BoardState): OpenSpecCard[] {
  const savedById = new Map<string, OpenSpecCard>();
  for (const card of saved.cards) {
    savedById.set(card.id, card);
  }

  const now = new Date().toISOString();

  return SAMPLE_CARDS.map((sourceCard) => {
    const savedCard = savedById.get(sourceCard.id);
    if (!savedCard) return sourceCard;

    // Start from source (definition fields), overlay user state
    const merged: OpenSpecCard = {
      ...sourceCard,
      column: savedCard.column,
      priority: savedCard.priority,
      notes: savedCard.notes,
    };

    // Check if any definition field actually changed
    const definitionChanged =
      sourceCard.title !== savedCard.title ||
      sourceCard.slug !== savedCard.slug ||
      sourceCard.epic !== savedCard.epic ||
      sourceCard.phase !== savedCard.phase ||
      JSON.stringify(sourceCard.dependencies) !== JSON.stringify(savedCard.dependencies) ||
      JSON.stringify(sourceCard.artifacts) !== JSON.stringify(savedCard.artifacts) ||
      JSON.stringify(sourceCard.specs) !== JSON.stringify(savedCard.specs) ||
      JSON.stringify(sourceCard.tags) !== JSON.stringify(savedCard.tags) ||
      sourceCard.createdAt !== savedCard.createdAt;

    if (definitionChanged) {
      merged.updatedAt = now;
    } else {
      merged.updatedAt = savedCard.updatedAt;
    }

    return merged;
  });
}

export function exportBoardState(cards: OpenSpecCard[]): void {
  const state: BoardState = {
    cards,
    version: 1,
    dataVersion: DATA_VERSION,
    lastSaved: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `openspec-board-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBoardState(file: File): Promise<BoardState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const state = JSON.parse(reader.result as string) as BoardState;
        resolve(state);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
