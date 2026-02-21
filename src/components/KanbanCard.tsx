import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import type { OpenSpecCard, Priority } from '../types';
import { priorityColor } from '../utils/helpers';
import { getEpic } from '../utils/epics';

interface Props {
  card: OpenSpecCard;
  allCards: OpenSpecCard[];
  onUpdateCard: (id: string, updates: Partial<OpenSpecCard>) => void;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'CRIT',
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

export function KanbanCard({ card, allCards, onUpdateCard }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(card.notes);

  const epic = getEpic(card.epic);

  // Check if any dependency is not done
  const blockedByCards = card.dependencies
    .map((depId) => allCards.find((c) => c.id === depId))
    .filter(Boolean) as OpenSpecCard[];
  const unresolvedDeps = blockedByCards.filter((c) => c.column !== 'done');
  const isBlocked = unresolvedDeps.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    borderLeft: `3px solid ${epic.color}40`,
  };

  const artifactIcons = [
    { key: 'proposal', label: 'Proposal', icon: 'P', has: card.artifacts.proposal },
    { key: 'design', label: 'Design', icon: 'D', has: card.artifacts.design },
    { key: 'workPlan', label: 'Work Plan', icon: 'W', has: card.artifacts.workPlan },
    { key: 'testSpec', label: 'Test Spec', icon: 'T', has: card.artifacts.testSpec },
    { key: 'tasks', label: 'Tasks', icon: 'K', has: card.artifacts.tasks },
  ];

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = PRIORITY_ORDER.indexOf(card.priority);
    const next = PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
    onUpdateCard(card.id, { priority: next });
  };

  const saveNotes = () => {
    onUpdateCard(card.id, { notes: notesDraft });
    setEditingNotes(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-3.5 cursor-grab select-none ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Priority + Title row */}
      <div className="flex items-start gap-2.5 mb-2">
        <button
          onClick={cyclePriority}
          className="mt-0.5 shrink-0 flex items-center gap-1 group"
          title={`Priority: ${card.priority} (click to cycle)`}
        >
          <span
            className={`block w-2 h-2 rounded-full ${card.priority === 'critical' ? 'priority-pulse' : ''}`}
            style={{ backgroundColor: priorityColor(card.priority) }}
          />
          <span
            className="text-[10px] font-medium tracking-wider opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: priorityColor(card.priority) }}
          >
            {PRIORITY_LABELS[card.priority]}
          </span>
        </button>
        <h3
          className="font-[family-name:var(--font-display)] text-[13px] font-medium leading-snug text-white/90 flex-1"
          style={{ letterSpacing: '-0.01em' }}
        >
          {card.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {isBlocked && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'rgba(239, 68, 68, 0.7)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
              title={`Blocked by: ${unresolvedDeps.map((c) => c.title).join(', ')}`}
            >
              blocked
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-5 h-5 flex items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all text-xs"
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Artifact indicators */}
      <div className="flex items-center gap-1 mb-2">
        {artifactIcons.map((a) => (
          <span
            key={a.key}
            className="text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-md transition-all"
            style={{
              background: a.has ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: a.has ? 'rgba(228,228,237,0.7)' : 'rgba(228,228,237,0.15)',
              border: a.has ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)',
            }}
            title={`${a.label}: ${a.has ? 'exists' : 'missing'}`}
          >
            {a.icon}
          </span>
        ))}
        {card.specs.length > 0 && (
          <span className="text-[10px] text-white/30 ml-1">
            {card.specs.length} spec{card.specs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {card.tags.slice(0, expanded ? undefined : 3).map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
          {!expanded && card.tags.length > 3 && (
            <span className="tag-pill opacity-50">+{card.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 mt-2 border-t border-white/5">
              {/* Epic & Phase */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{
                    background: `${epic.color}15`,
                    color: `${epic.color}cc`,
                    border: `1px solid ${epic.color}25`,
                  }}
                >
                  {epic.title}
                </span>
                {card.phase && (
                  <span className="text-[10px] text-white/30">{card.phase}</span>
                )}
              </div>

              {/* Dependencies / Blocked by */}
              {blockedByCards.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5 font-medium">
                    Depends on
                  </div>
                  {blockedByCards.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center gap-2 py-1 px-2 -mx-1 rounded-md"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: dep.column === 'done' ? '#10b981' : '#ef4444',
                        }}
                      />
                      <span className="text-xs text-white/60 flex-1">{dep.title}</span>
                      <span className="text-[9px] text-white/20">
                        {dep.column === 'done' ? 'done' : dep.column}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-specs */}
              {card.specs.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5 font-medium">
                    Specifications
                  </div>
                  {card.specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="flex items-center gap-2 py-1 px-2 -mx-1 rounded-md hover:bg-white/3 transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-xs text-white/60">{spec.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5 font-medium">
                  Notes
                </div>
                {editingNotes ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="glass-input w-full p-2 text-xs resize-none h-16"
                      placeholder="Add notes..."
                      autoFocus
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); saveNotes(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="glass-btn text-[10px] px-2.5 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingNotes(false); setNotesDraft(card.notes); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="glass-btn text-[10px] px-2.5 py-1 opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={(e) => { e.stopPropagation(); setEditingNotes(true); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="text-xs text-white/40 hover:text-white/60 cursor-text p-1.5 -m-1.5 rounded-md hover:bg-white/3 transition-colors min-h-[24px]"
                  >
                    {card.notes || 'Click to add notes...'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
