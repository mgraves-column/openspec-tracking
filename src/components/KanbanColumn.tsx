import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import type { Column, OpenSpecCard } from '../types';
import { KanbanCard } from './KanbanCard';

interface Props {
  column: Column;
  cards: OpenSpecCard[];
  allCards: OpenSpecCard[];
  onUpdateCard: (id: string, updates: Partial<OpenSpecCard>) => void;
}

export function KanbanColumn({ column, cards, allCards, onUpdateCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col min-w-[280px] w-[280px] shrink-0"
    >
      {/* Column header */}
      <div className="px-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm opacity-50">{column.icon}</span>
          <h2
            className="font-[family-name:var(--font-display)] text-sm font-semibold text-white/80 tracking-tight"
          >
            {column.title}
          </h2>
          <span
            className="text-[11px] font-medium ml-auto px-2 py-0.5 rounded-full"
            style={{
              background: `${column.color}15`,
              color: `${column.color}99`,
            }}
          >
            {cards.length}
          </span>
        </div>
        <div className="column-accent w-full" style={{ background: column.color }} />
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden px-1.5 pb-4 space-y-2.5 transition-all duration-200 rounded-xl ${
          isOver ? 'drop-indicator' : ''
        }`}
        style={{ minHeight: 100 }}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: i * 0.03,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <KanbanCard card={card} allCards={allCards} onUpdateCard={onUpdateCard} />
            </motion.div>
          ))}
        </SortableContext>
        {cards.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 text-xs text-white/15 italic">
            No items
          </div>
        )}
      </div>
    </motion.div>
  );
}
