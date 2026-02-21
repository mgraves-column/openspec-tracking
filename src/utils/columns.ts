import type { Column } from '../types';

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: '◇', color: '#6b7280' },
  { id: 'proposed', title: 'Proposed', icon: '◆', color: '#8b5cf6' },
  { id: 'design', title: 'In Design', icon: '△', color: '#3b82f6' },
  { id: 'specced', title: "Spec'd", icon: '⬡', color: '#06b6d4' },
  { id: 'in-progress', title: 'In Progress', icon: '▶', color: '#f59e0b' },
  { id: 'done', title: 'Done', icon: '✓', color: '#10b981' },
];
