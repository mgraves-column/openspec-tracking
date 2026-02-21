import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENSPEC_PATH = process.env.OPENSPEC_PATH ?? path.resolve(__dirname, '../../agentscan/openspec/changes/');
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/sampleData.ts');

const VALID_EPICS = [
  'security-foundation',
  'detection-visibility',
  'platform-intelligence',
  'advanced-security',
  'supply-chain',
  'infrastructure',
  'governance',
  'connectors',
  'refactoring',
] as const;

const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const VALID_COLUMNS = ['backlog', 'proposed', 'design', 'specced', 'in-progress', 'done'] as const;

interface Frontmatter {
  epic: string;
  priority: string;
  column: string;
  phase?: string | null;
  dependencies?: string[];
  tags?: string[];
  createdAt: string;
  notes?: string;
}

interface CardData {
  id: string;
  title: string;
  slug: string;
  column: string;
  priority: string;
  epic: string;
  phase: string | null;
  dependencies: string[];
  artifacts: {
    proposal: boolean;
    design: boolean;
    workPlan: boolean;
    testSpec: boolean;
    tasks: boolean;
  };
  specs: { id: string; name: string; path: string }[];
  tags: string[];
  notes: string;
  progress: { done: number; total: number } | null;
  createdAt: string;
  updatedAt: string;
}

function kebabToTitle(kebab: string): string {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) return null;
  let title = match[1].trim();
  // Strip common prefixes from proposal headings
  title = title.replace(/^(?:Change|Proposal|RFC|Feature|Enhancement):\s*/i, '');
  return title;
}

function validateFrontmatter(fm: Record<string, unknown>, specId: string): Frontmatter {
  const errors: string[] = [];

  if (!fm.epic || !VALID_EPICS.includes(fm.epic as typeof VALID_EPICS[number])) {
    errors.push(`invalid or missing epic: "${fm.epic}"`);
  }
  if (!fm.priority || !VALID_PRIORITIES.includes(fm.priority as typeof VALID_PRIORITIES[number])) {
    errors.push(`invalid or missing priority: "${fm.priority}"`);
  }
  if (!fm.column || !VALID_COLUMNS.includes(fm.column as typeof VALID_COLUMNS[number])) {
    errors.push(`invalid or missing column: "${fm.column}"`);
  }
  if (!fm.createdAt) {
    errors.push('missing createdAt');
  }

  if (errors.length > 0) {
    throw new Error(`[${specId}] frontmatter validation failed: ${errors.join(', ')}`);
  }

  return {
    epic: fm.epic as string,
    priority: fm.priority as string,
    column: fm.column as string,
    phase: (fm.phase as string) ?? null,
    dependencies: (fm.dependencies as string[]) ?? [],
    tags: (fm.tags as string[]) ?? [],
    createdAt: fm.createdAt instanceof Date
      ? fm.createdAt.toISOString().split('T')[0]
      : String(fm.createdAt).split('T')[0],
    notes: (fm.notes as string) ?? '',
  };
}

function detectArtifacts(dirPath: string): CardData['artifacts'] {
  const exists = (name: string) => fs.existsSync(path.join(dirPath, name));
  return {
    proposal: exists('proposal.md'),
    design: exists('design.md'),
    workPlan: exists('work-plan.md') || exists('WORK_PLAN.md'),
    testSpec: exists('test-spec.md') || exists('TEST_SPECIFICATION.md'),
    tasks: exists('tasks.md'),
  };
}

function listSpecs(dirPath: string): CardData['specs'] {
  const specsDir = path.join(dirPath, 'specs');
  if (!fs.existsSync(specsDir)) return [];

  return fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      id: d.name,
      name: kebabToTitle(d.name),
      path: `specs/${d.name}/spec.md`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function parseTaskProgress(dirPath: string): { done: number; total: number } | null {
  const tasksPath = path.join(dirPath, 'tasks.md');
  if (!fs.existsSync(tasksPath)) return null;

  const content = fs.readFileSync(tasksPath, 'utf-8');
  const done = (content.match(/- \[x\]/gi) ?? []).length;
  const incomplete = (content.match(/- \[ \]/g) ?? []).length;
  const total = done + incomplete;

  return total > 0 ? { done, total } : null;
}

function processSpec(dirPath: string, specId: string): CardData | null {
  const proposalPath = path.join(dirPath, 'proposal.md');
  if (!fs.existsSync(proposalPath)) {
    console.warn(`  WARN: ${specId}/ has no proposal.md, skipping`);
    return null;
  }

  const raw = fs.readFileSync(proposalPath, 'utf-8');
  const { data, content } = matter(raw);

  if (Object.keys(data).length === 0) {
    throw new Error(`[${specId}] proposal.md has no YAML frontmatter`);
  }

  const fm = validateFrontmatter(data, specId);
  const title = extractTitle(content) ?? kebabToTitle(specId);

  const createdAt = fm.createdAt;

  const now = new Date().toISOString().split('T')[0];

  return {
    id: specId,
    title,
    slug: specId,
    column: fm.column,
    priority: fm.priority,
    epic: fm.epic,
    phase: fm.phase,
    dependencies: fm.dependencies ?? [],
    artifacts: detectArtifacts(dirPath),
    specs: listSpecs(dirPath),
    tags: fm.tags ?? [],
    notes: fm.notes ?? '',
    progress: parseTaskProgress(dirPath),
    createdAt: `${createdAt}T00:00:00Z`,
    updatedAt: `${now}T00:00:00Z`,
  };
}

function formatValue(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  if (value === null) return 'null';
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (typeof value[0] === 'string') {
      const items = value.map((v) => `'${String(v).replace(/'/g, "\\'")}'`).join(', ');
      return `[${items}]`;
    }
    // Array of objects (specs)
    const items = value.map((v) => {
      const entries = Object.entries(v as Record<string, unknown>)
        .map(([k, val]) => `${k}: ${formatValue(val, 0)}`)
        .join(', ');
      return `${pad}  { ${entries} }`;
    });
    return `[\n${items.join(',\n')},\n${pad}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v, 0)}`)
      .join(', ');
    return `{ ${entries} }`;
  }
  return String(value);
}

function formatCard(card: CardData): string {
  const lines: string[] = [];
  lines.push('  {');
  lines.push(`    id: ${formatValue(card.id, 2)},`);
  lines.push(`    title: ${formatValue(card.title, 2)},`);
  lines.push(`    slug: ${formatValue(card.slug, 2)},`);
  lines.push(`    column: ${formatValue(card.column, 2)},`);
  lines.push(`    priority: ${formatValue(card.priority, 2)},`);
  lines.push(`    epic: ${formatValue(card.epic, 2)},`);
  lines.push(`    phase: ${formatValue(card.phase, 2)},`);
  lines.push(`    dependencies: ${formatValue(card.dependencies, 2)},`);
  lines.push(`    artifacts: ${formatValue(card.artifacts, 2)},`);
  lines.push(`    specs: ${formatValue(card.specs, 2)},`);
  lines.push(`    tags: ${formatValue(card.tags, 2)},`);
  lines.push(`    notes: ${formatValue(card.notes, 2)},`);
  lines.push(`    progress: ${formatValue(card.progress, 2)},`);
  lines.push(`    createdAt: ${formatValue(card.createdAt, 2)},`);
  lines.push(`    updatedAt: ${formatValue(card.updatedAt, 2)},`);
  lines.push('  }');
  return lines.join('\n');
}

function main(): void {
  console.log(`Reading openspec directory: ${OPENSPEC_PATH}`);

  if (!fs.existsSync(OPENSPEC_PATH)) {
    console.error(`Error: openspec path does not exist: ${OPENSPEC_PATH}`);
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(OPENSPEC_PATH, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'archive')
    .map((d) => d.name)
    .sort();

  console.log(`Found ${dirs.length} spec directories`);

  const cards: CardData[] = [];
  const errors: string[] = [];

  for (const dir of dirs) {
    try {
      const card = processSpec(path.join(OPENSPEC_PATH, dir), dir);
      if (card) cards.push(card);
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  if (errors.length > 0) {
    console.error(`\nErrors processing ${errors.length} specs:`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  cards.sort((a, b) => a.id.localeCompare(b.id));

  const cardsBlock = cards.map(formatCard).join(',\n');

  const body = `import type { OpenSpecCard } from '../types';

// Auto-generated — do not edit manually.
// Run \`npm run generate\` to regenerate from openspec frontmatter.
export const DATA_VERSION = __DATA_VERSION__;

export const SAMPLE_CARDS: OpenSpecCard[] = [
${cardsBlock},
];
`;

  const hash = crypto.createHash('sha256').update(cardsBlock).digest('hex').slice(0, 8);
  const version = parseInt(hash, 16) % 1_000_000;
  const output = body.replace('__DATA_VERSION__', String(version));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');

  console.log(`\nGenerated ${OUTPUT_PATH}`);
  console.log(`  Cards: ${cards.length}`);
  console.log(`  DATA_VERSION: ${version}`);
}

main();
