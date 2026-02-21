import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OpenSpecCard, EpicId } from '../types';
import { EPICS } from '../utils/epics';

interface Props {
  allCards: OpenSpecCard[];
  epicFilter: EpicId | 'all';
  onEpicFilterChange: (epic: EpicId | 'all') => void;
}

export function EpicSidebar({ allCards, epicFilter, onEpicFilterChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const epicStats = EPICS.map((epic) => {
    const cards = allCards.filter((c) => c.epic === epic.id);
    const done = cards.filter((c) => c.column === 'done').length;
    const inProgress = cards.filter((c) => c.column === 'in-progress').length;
    const specced = cards.filter((c) => c.column === 'specced').length;
    const total = cards.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...epic, cards, done, inProgress, specced, total, pct };
  }).filter((e) => e.total > 0);

  const toggle = (id: EpicId) => {
    onEpicFilterChange(epicFilter === id ? 'all' : id);
  };

  return (
    <div className="relative z-10 flex flex-col shrink-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="glass-btn text-[10px] px-2 py-1 mx-4 mb-2 self-start"
        title={collapsed ? 'Show epics' : 'Hide epics'}
      >
        {collapsed ? '▶ Epics' : '◀ Epics'}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="glass-panel mx-4 p-3 flex flex-col gap-1.5 w-[220px]">
              <div className="text-[10px] uppercase tracking-widest text-white/25 font-medium mb-1">
                Epics
              </div>

              {epicStats.map((epic) => {
                const isActive = epicFilter === epic.id;
                return (
                  <button
                    key={epic.id}
                    onClick={() => toggle(epic.id)}
                    className="text-left rounded-lg px-2.5 py-2 transition-all"
                    style={{
                      background: isActive ? `${epic.color}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? `${epic.color}30` : 'rgba(255,255,255,0.04)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: epic.color }}
                      />
                      <span className="text-[11px] font-medium text-white/80 truncate flex-1">
                        {epic.title}
                      </span>
                      <span className="text-[10px] text-white/30">{epic.total}</span>
                    </div>

                    {epic.phase && (
                      <div className="text-[9px] text-white/25 ml-4 mb-1">{epic.phase}</div>
                    )}

                    {/* Progress bar */}
                    <div className="ml-4 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${epic.pct}%`,
                          backgroundColor: epic.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>

                    {/* Status breakdown */}
                    <div className="ml-4 mt-1 text-[9px] text-white/20 flex gap-2">
                      {epic.done > 0 && <span>{epic.done} done</span>}
                      {epic.inProgress > 0 && <span>{epic.inProgress} active</span>}
                      {epic.specced > 0 && <span>{epic.specced} specced</span>}
                    </div>
                  </button>
                );
              })}

              {epicFilter !== 'all' && (
                <button
                  onClick={() => onEpicFilterChange('all')}
                  className="glass-btn text-[10px] px-2 py-1 mt-1 text-white/40"
                >
                  Clear filter
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
