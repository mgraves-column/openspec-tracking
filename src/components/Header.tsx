import { useRef } from 'react';
import type { Priority, EpicId } from '../types';
import { EPICS } from '../utils/epics';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: Priority | 'all';
  onPriorityFilterChange: (p: Priority | 'all') => void;
  epicFilter: EpicId | 'all';
  onEpicFilterChange: (e: EpicId | 'all') => void;
  totalCards: number;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

const PRIORITIES: { value: Priority | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#9ca3af' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#6b7280' },
];

export function Header({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  epicFilter,
  onEpicFilterChange,
  totalCards,
  onExport,
  onImport,
  onReset,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  const selectedEpic = epicFilter !== 'all' ? EPICS.find((e) => e.id === epicFilter) : null;

  return (
    <header className="glass-panel px-6 py-4 mx-4 mt-4 mb-2 relative z-10">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Logo / Title */}
        <div className="flex items-center gap-3 mr-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.3))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)' }}>O</span>
          </div>
          <div>
            <h1
              className="font-[family-name:var(--font-display)] text-base font-semibold text-white/90 leading-none"
              style={{ letterSpacing: '-0.02em' }}
            >
              OpenSpec Tracker
            </h1>
            <p className="text-[11px] text-white/30 mt-0.5">{totalCards} specs tracked</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search specs, tags, epics..."
            className="glass-input w-full px-4 py-2 text-sm"
          />
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => onPriorityFilterChange(p.value)}
              className="glass-btn text-[11px] px-2.5 py-1.5 flex items-center gap-1.5 transition-all"
              style={{
                background:
                  priorityFilter === p.value
                    ? `${p.color}20`
                    : undefined,
                borderColor:
                  priorityFilter === p.value
                    ? `${p.color}40`
                    : undefined,
                color:
                  priorityFilter === p.value
                    ? p.color
                    : undefined,
              }}
            >
              {p.value !== 'all' && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              )}
              {p.label}
            </button>
          ))}
        </div>

        {/* Epic filter dropdown */}
        <div className="relative">
          <select
            value={epicFilter}
            onChange={(e) => onEpicFilterChange(e.target.value as EpicId | 'all')}
            className="glass-btn text-[11px] px-3 py-1.5 appearance-none pr-6 cursor-pointer"
            style={{
              background: selectedEpic ? `${selectedEpic.color}15` : undefined,
              borderColor: selectedEpic ? `${selectedEpic.color}30` : undefined,
              color: selectedEpic ? `${selectedEpic.color}cc` : undefined,
            }}
          >
            <option value="all">All Epics</option>
            {EPICS.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-white/30 pointer-events-none">▼</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={onExport} className="glass-btn text-[11px] px-3 py-1.5">
            Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="glass-btn text-[11px] px-3 py-1.5"
          >
            Import
          </button>
          <button
            onClick={onReset}
            className="glass-btn text-[11px] px-3 py-1.5 text-red-400/60 hover:text-red-400"
          >
            Reset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>
    </header>
  );
}
