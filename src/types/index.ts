export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type ColumnId = 'backlog' | 'proposed' | 'design' | 'specced' | 'in-progress' | 'done';

export type EpicId =
  | 'security-foundation'
  | 'detection-visibility'
  | 'platform-intelligence'
  | 'advanced-security'
  | 'supply-chain'
  | 'infrastructure'
  | 'governance'
  | 'connectors'
  | 'refactoring';

export interface Epic {
  id: EpicId;
  title: string;
  color: string;
  phase: string | null;
}

export interface SpecArtifact {
  name: string;
  path: string;
  exists: boolean;
}

export interface SubSpec {
  id: string;
  name: string;
  path: string;
}

export interface OpenSpecCard {
  id: string;
  title: string;
  slug: string;
  column: ColumnId;
  priority: Priority;
  epic: EpicId;
  phase: string | null;
  dependencies: string[];
  artifacts: {
    proposal: boolean;
    design: boolean;
    workPlan: boolean;
    testSpec: boolean;
    tasks: boolean;
  };
  specs: SubSpec[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  icon: string;
  color: string;
}

export interface BoardState {
  cards: OpenSpecCard[];
  version: number;
  dataVersion: number;
  lastSaved: string;
}
