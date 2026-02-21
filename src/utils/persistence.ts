import type { BoardState, OpenSpecCard } from '../types';

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

export function saveBoardState(cards: OpenSpecCard[]): void {
  const state: BoardState = {
    cards,
    version: 1,
    lastSaved: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportBoardState(cards: OpenSpecCard[]): void {
  const state: BoardState = {
    cards,
    version: 1,
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
