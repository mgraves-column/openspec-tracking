import type { ColumnId, Priority, OpenSpecCard } from '../types';

export function slugToTitle(slug: string): string {
  return slug
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/^(add|remove|update|fix|refactor|extract|integrate|unify|enhance)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(Ui|Api|Aws|Ai|Ml|Iga|Sod|Mcp|Uba|Scim)\b/gi, (m) => m.toUpperCase());
}

export function inferColumn(card: {
  artifacts: OpenSpecCard['artifacts'];
  specs: { length: number };
}): ColumnId {
  const { artifacts, specs } = card;
  if (artifacts.workPlan || artifacts.tasks) return 'in-progress';
  if (specs.length > 0 && artifacts.design) return 'specced';
  if (artifacts.design) return 'design';
  if (artifacts.proposal) return 'proposed';
  return 'backlog';
}

export function priorityColor(priority: Priority): string {
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#6b7280';
  }
}

export function priorityGlow(priority: Priority): string {
  switch (priority) {
    case 'critical': return '0 0 20px rgba(239, 68, 68, 0.3)';
    case 'high': return '0 0 15px rgba(249, 115, 22, 0.2)';
    case 'medium': return '0 0 10px rgba(234, 179, 8, 0.15)';
    case 'low': return 'none';
  }
}
