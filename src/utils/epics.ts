import type { Epic, EpicId } from '../types';

export const EPICS: Epic[] = [
  { id: 'security-foundation',    title: 'Security Foundation',       color: '#ef4444', phase: 'Phase 4' },
  { id: 'detection-visibility',   title: 'Detection & Visibility',    color: '#f97316', phase: 'Phase 5' },
  { id: 'platform-intelligence',  title: 'Platform Intelligence',     color: '#3b82f6', phase: null },
  { id: 'advanced-security',      title: 'Advanced Security',         color: '#8b5cf6', phase: null },
  { id: 'supply-chain',           title: 'Supply Chain Security',     color: '#ec4899', phase: null },
  { id: 'infrastructure',         title: 'Infrastructure & Platform', color: '#06b6d4', phase: null },
  { id: 'governance',             title: 'Governance & Compliance',   color: '#10b981', phase: null },
  { id: 'connectors',             title: 'Connectors',                color: '#eab308', phase: null },
  { id: 'refactoring',            title: 'Refactoring & Cleanup',     color: '#6b7280', phase: null },
];

export function getEpic(id: EpicId): Epic {
  return EPICS.find((e) => e.id === id)!;
}
