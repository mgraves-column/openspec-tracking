import { useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { OpenSpecCard } from '../types';
import { COLUMNS } from '../utils/columns';
import { useBoard } from '../hooks/useBoard';
import { exportBoardState, importBoardState } from '../utils/persistence';
import { Header } from './Header';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { EpicSidebar } from './EpicSidebar';

export function Board() {
  const {
    cards,
    allCards,
    getColumnCards,
    moveCard,
    updateCard,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    epicFilter,
    setEpicFilter,
    resetBoard,
    importCards,
  } = useBoard();

  const [activeCard, setActiveCard] = useState<OpenSpecCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = cards.find((c) => c.id === event.active.id);
      if (card) setActiveCard(card);
    },
    [cards]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if dragging over a column
      const overColumn = COLUMNS.find((c) => c.id === overId);
      if (overColumn) {
        moveCard(activeId, overColumn.id);
        return;
      }

      // Dragging over another card — move to that card's column
      const overCard = cards.find((c) => c.id === overId);
      if (overCard) {
        const draggedCard = cards.find((c) => c.id === activeId);
        if (draggedCard && draggedCard.column !== overCard.column) {
          moveCard(activeId, overCard.column);
        }
      }
    },
    [cards, moveCard]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Final column assignment
      const overColumn = COLUMNS.find((c) => c.id === overId);
      if (overColumn) {
        moveCard(activeId, overColumn.id);
        return;
      }

      const overCard = cards.find((c) => c.id === overId);
      if (overCard) {
        moveCard(activeId, overCard.column);
      }
    },
    [cards, moveCard]
  );

  const handleExport = () => exportBoardState(allCards);

  const handleImport = async (file: File) => {
    try {
      const state = await importBoardState(file);
      importCards(state.cards);
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  // Phase progress summary
  const phaseProgress = useMemo(() => {
    const phases = new Map<string, { total: number; done: number; inProgress: number; specced: number }>();
    for (const card of allCards) {
      if (!card.phase) continue;
      const existing = phases.get(card.phase) ?? { total: 0, done: 0, inProgress: 0, specced: 0 };
      existing.total++;
      if (card.column === 'done') existing.done++;
      if (card.column === 'in-progress') existing.inProgress++;
      if (card.column === 'specced') existing.specced++;
      phases.set(card.phase, existing);
    }
    return Array.from(phases.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([phase, stats]) => {
        const parts: string[] = [];
        if (stats.done > 0) parts.push(`${stats.done}/${stats.total} done`);
        if (stats.inProgress > 0) parts.push(`${stats.inProgress} active`);
        if (stats.specced > 0) parts.push(`${stats.specced} specced`);
        if (parts.length === 0) parts.push(`${stats.total} tracked`);
        return `${phase}: ${parts.join(', ')}`;
      });
  }, [allCards]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="bg-mesh" />
      <div className="bg-noise" />

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        epicFilter={epicFilter}
        onEpicFilterChange={setEpicFilter}
        totalCards={allCards.length}
        onExport={handleExport}
        onImport={handleImport}
        onReset={resetBoard}
      />

      {/* Board + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <EpicSidebar
          allCards={allCards}
          epicFilter={epicFilter}
          onEpicFilterChange={setEpicFilter}
        />

        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full pb-2">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={getColumnCards(column.id)}
                  allCards={allCards}
                  onUpdateCard={updateCard}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeCard ? (
                <div className="w-[280px] opacity-90">
                  <KanbanCard card={activeCard} allCards={allCards} onUpdateCard={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Bottom status bar — phase progress */}
      <div className="relative z-10 px-6 py-2 flex items-center justify-between text-[11px] text-white/20">
        <span>
          {phaseProgress.length > 0
            ? phaseProgress.join('  ·  ')
            : COLUMNS.map((col) => {
                const count = getColumnCards(col.id).length;
                return count > 0 ? `${col.title}: ${count}` : null;
              })
                .filter(Boolean)
                .join('  ·  ')}
        </span>
        <span>Drag cards between columns to update status</span>
      </div>
    </div>
  );
}
