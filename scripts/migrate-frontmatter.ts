/**
 * One-shot migration script: injects YAML frontmatter into proposal.md files
 * based on existing card data in sampleData.ts.
 *
 * Usage: npx tsx scripts/migrate-frontmatter.ts [openspec-path]
 *
 * Safe to delete after migration is verified.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLE_CARDS } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENSPEC_PATH =
  process.argv[2] ??
  process.env.OPENSPEC_PATH ??
  path.resolve(__dirname, '../../agentscan/openspec/changes/');

function formatDate(iso: string): string {
  // Extract YYYY-MM-DD from ISO string
  return iso.split('T')[0];
}

function buildFrontmatter(card: (typeof SAMPLE_CARDS)[number]): string {
  const lines: string[] = ['---'];

  lines.push(`epic: ${card.epic}`);
  if (card.phase !== null) {
    lines.push(`phase: "${card.phase}"`);
  }
  lines.push(`priority: ${card.priority}`);
  lines.push(`column: ${card.column}`);

  if (card.dependencies.length > 0) {
    lines.push('dependencies:');
    for (const dep of card.dependencies) {
      lines.push(`  - ${dep}`);
    }
  }

  if (card.tags.length > 0) {
    lines.push('tags:');
    for (const tag of card.tags) {
      lines.push(`  - ${tag}`);
    }
  }

  lines.push(`createdAt: ${formatDate(card.createdAt)}`);

  if (card.notes) {
    lines.push(`notes: "${card.notes.replace(/"/g, '\\"')}"`);
  }

  lines.push('---');
  return lines.join('\n');
}

function main(): void {
  console.log(`Openspec path: ${OPENSPEC_PATH}`);

  if (!fs.existsSync(OPENSPEC_PATH)) {
    console.error(`Error: openspec path does not exist: ${OPENSPEC_PATH}`);
    process.exit(1);
  }

  let migrated = 0;
  let skipped = 0;
  let missing = 0;

  for (const card of SAMPLE_CARDS) {
    const proposalPath = path.join(OPENSPEC_PATH, card.id, 'proposal.md');

    if (!fs.existsSync(proposalPath)) {
      console.warn(`  MISSING: ${card.id}/proposal.md`);
      missing++;
      continue;
    }

    const content = fs.readFileSync(proposalPath, 'utf-8');

    // Skip if already has frontmatter
    if (content.startsWith('---')) {
      console.log(`  SKIP (has frontmatter): ${card.id}`);
      skipped++;
      continue;
    }

    const frontmatter = buildFrontmatter(card);
    const newContent = frontmatter + '\n\n' + content;
    fs.writeFileSync(proposalPath, newContent, 'utf-8');
    console.log(`  MIGRATED: ${card.id}`);
    migrated++;
  }

  console.log(`\nDone.`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped (already had frontmatter): ${skipped}`);
  console.log(`  Missing proposal.md: ${missing}`);
}

main();
