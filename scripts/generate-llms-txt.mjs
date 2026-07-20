/**
 * Build-time llms.txt generator.
 * Reads the bundled CMS snapshot and writes public/llms.txt with:
 *   - one H1 (site name / greeting)
 *   - a blockquote summary (short bio)
 *   - a "Primary links" H2 with Markdown links for UX portfolio, LinkedIn, Substack
 * Links whose CMS row is unpublished (publish=false) or not enabled
 * (state !== 'enabled') are omitted.
 *
 * Run: node scripts/generate-llms-txt.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = resolve(__dirname, '..', 'src', 'cms-snapshot.json');
const OUT_DIR = resolve(__dirname, '..', 'public');
const OUT = resolve(OUT_DIR, 'llms.txt');

const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));

const siteName = snapshot.site?.site_name || 'Megan Feil';
const greeting = snapshot.homepage?.greeting || '';
const bio = snapshot.homepage?.bio || snapshot.site?.seo_description || '';

const WANTED = ['ux_portfolio', 'linkedin', 'substack'];
const links = (snapshot.links || [])
  .filter(
    (l) =>
      WANTED.includes(l.id) &&
      l.publish !== false &&
      l.state === 'enabled' &&
      l.url
  )
  .sort((a, b) => WANTED.indexOf(a.id) - WANTED.indexOf(b.id));

const lines = [];

// H1 — use greeting if available, otherwise site name.
lines.push(`# ${greeting || siteName}`);
lines.push('');

// Blockquote summary — short bio.
if (bio) {
  lines.push(`> ${bio.replace(/\n+/g, ' ')}`);
  lines.push('');
}

// Primary links.
lines.push('## Primary links');
lines.push('');
for (const link of links) {
  const label = link.label || link.id;
  lines.push(`- [${label}](${link.url})`);
}

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log('✓ llms.txt written to', OUT);
