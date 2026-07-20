/**
 * Build-time CMS snapshot fetcher.
 * Fetches the public Google Sheet via the gviz endpoint and writes
 * src/cms-snapshot.json. If the Sheet is unreachable, logs a warning
 * and leaves the existing snapshot in place (the build does not fail).
 *
 * Run: node scripts/fetch-cms-snapshot.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SPREADSHEET_ID = '1p12hJNlK9encdzXgbbtAJ7dsEQ3-mUmg-E_xE3lzy6s';
const GVIZ = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'cms-snapshot.json');

function cellString(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return '';
  return String(cell.v).trim();
}

function cellBool(cell) {
  if (!cell || cell.v === null) return false;
  if (typeof cell.v === 'boolean') return cell.v;
  const s = String(cell.v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
}

function col(table, label) {
  return table.cols.findIndex((c) => c.label.toLowerCase() === label.toLowerCase());
}

async function fetchTab(tab) {
  const url = `${GVIZ}?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  const text = await res.text();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  return JSON.parse(text.slice(start, end + 1)).table;
}

function parseSiteSettings(table) {
  if (!table || !table.rows) return null;
  const map = {};
  for (const row of table.rows) {
    if (!row.c || row.c.length < 3) continue;
    const id = cellString(row.c[0]);
    if (!id || id.toLowerCase() === 'id') continue;
    map[id] = cellString(row.c[2]);
  }
  return {
    site_name: map.site_name,
    canonical: map.site_domain,
    seo_title: map.page_title,
    seo_description: map.meta_description,
    location: map.location,
    portrait_path: map.portrait_path,
    portrait_alt: map.portrait_alt,
  };
}

function parseHomepage(table) {
  if (!table || !table.rows) return null;
  const iId = col(table, 'ID');
  const iContent = col(table, 'Content');
  const iPublish = col(table, 'Publish');
  if (iId < 0 || iContent < 0) return null;
  const map = {};
  for (const row of table.rows) {
    if (!row.c) continue;
    const id = cellString(row.c[iId]);
    if (!id || id.toLowerCase() === 'id') continue;
    map[id] = {
      content: cellString(row.c[iContent]),
      publish: iPublish >= 0 ? cellBool(row.c[iPublish]) : true,
    };
  }
  const pick = (id) => (map[id] && map[id].publish ? map[id].content : undefined);
  return {
    greeting: pick('home_greeting'),
    bio: pick('home_bio'),
    location: pick('home_location'),
    services_heading: pick('services_heading'),
    services_disabled_label: pick('services_disabled_label'),
    footer_note: pick('footer_note'),
  };
}

function asLinkType(s) {
  return s && s.toLowerCase() === 'external' ? 'external' : 'mailto';
}

function asState(s) {
  const v = (s || '').toLowerCase();
  if (v === 'enabled' || v === 'disabled' || v === 'hidden') return v;
  return 'enabled';
}

function parseLinks(table) {
  if (!table || !table.rows) return null;
  const iId = col(table, 'ID');
  const iOrder = col(table, 'Order');
  const iLabel = col(table, 'Label');
  const iSecondary = col(table, 'Secondary label');
  const iUrl = col(table, 'URL');
  const iType = col(table, 'Link type');
  const iState = col(table, 'State');
  const iPublish = col(table, 'Publish');
  const iNewTab = col(table, 'Open in new tab');
  const items = [];
  for (const row of table.rows) {
    if (!row.c) continue;
    const id = iId >= 0 ? cellString(row.c[iId]) : '';
    const label = iLabel >= 0 ? cellString(row.c[iLabel]) : '';
    if (!id && !label) continue;
    const publish = iPublish >= 0 ? cellBool(row.c[iPublish]) : true;
    if (!publish) continue;
    const rawUrl = iUrl >= 0 ? cellString(row.c[iUrl]) : '';
    const type = iType >= 0 ? asLinkType(cellString(row.c[iType])) : 'mailto';
    let url = rawUrl.replace(/\s*\n\s*/g, '');
    if (type === 'mailto' && rawUrl.includes('\n') && !url.includes('?') && url.includes('subject=')) {
      url = url.replace(/mailto:([^&?]*)subject=/, 'mailto:$1?subject=');
    }
    const secondary = iSecondary >= 0 ? cellString(row.c[iSecondary]) : '';
    let email_subject, email_body;
    if (type === 'mailto' && url.includes('?')) {
      try {
        const q = new URLSearchParams(url.split('?')[1]);
        email_subject = q.get('subject') || undefined;
        email_body = q.get('body') || undefined;
      } catch {}
    }
    items.push({
      id,
      order: iOrder >= 0 ? Number(cellString(row.c[iOrder])) || items.length + 1 : items.length + 1,
      label,
      ...(secondary ? { secondary_label: secondary } : {}),
      url,
      type,
      state: iState >= 0 ? asState(cellString(row.c[iState])) : 'enabled',
      publish,
      openInNewTab: iNewTab >= 0 ? cellBool(row.c[iNewTab]) : type === 'external',
      ...(email_subject ? { email_subject } : {}),
      ...(email_body ? { email_body } : {}),
    });
  }
  return items.sort((a, b) => a.order - b.order);
}

function parseServices(table) {
  if (!table || !table.rows) return null;
  const iId = col(table, 'ID');
  const iOrder = col(table, 'Order');
  const iTitle = col(table, 'Service name');
  const iAudience = col(table, 'Audience');
  const iDesc = col(table, 'Short description');
  const iUrl = col(table, 'Destination URL');
  const iState = col(table, 'State');
  const iPublish = col(table, 'Publish');
  const iNewTab = col(table, 'Open in new tab');
  const items = [];
  for (const row of table.rows) {
    if (!row.c) continue;
    const id = iId >= 0 ? cellString(row.c[iId]) : '';
    const title = iTitle >= 0 ? cellString(row.c[iTitle]) : '';
    if (!id && !title) continue;
    const publish = iPublish >= 0 ? cellBool(row.c[iPublish]) : true;
    if (!publish) continue;
    items.push({
      id,
      order: iOrder >= 0 ? Number(cellString(row.c[iOrder])) || items.length + 1 : items.length + 1,
      title,
      audience: iAudience >= 0 ? cellString(row.c[iAudience]) : '',
      description: iDesc >= 0 ? cellString(row.c[iDesc]) : '',
      url: iUrl >= 0 ? cellString(row.c[iUrl]) : '',
      state: iState >= 0 ? asState(cellString(row.c[iState])) : 'disabled',
      publish,
      openInNewTab: iNewTab >= 0 ? cellBool(row.c[iNewTab]) : true,
    });
  }
  return items.sort((a, b) => a.order - b.order);
}

async function main() {
  try {
    const [siteT, homeT, linksT, servicesT] = await Promise.all([
      fetchTab('Site Settings'),
      fetchTab('Homepage'),
      fetchTab('links'),
      fetchTab('services'),
    ]);
    const site = parseSiteSettings(siteT);
    const homepage = parseHomepage(homeT);
    const links = parseLinks(linksT);
    const services = parseServices(servicesT);
    if (!site && !homepage && !links && !services) {
      console.warn('⚠ CMS snapshot: no data fetched; keeping existing snapshot.');
      return;
    }
    const snapshot = {};
    if (site) snapshot.site = site;
    if (homepage) snapshot.homepage = homepage;
    if (links) snapshot.links = links;
    if (services) snapshot.services = services;

    // Replace the sheet's REPLACE_WITH_EMAIL placeholder with a working default
    // so the bundled snapshot is always usable, even before Megan edits the sheet.
    const EMAIL = 'hello@megfeil.com';
    if (snapshot.links) {
      snapshot.links = snapshot.links.map((l) => ({
        ...l,
        url: l.url.replace(/REPLACE_WITH_EMAIL/g, EMAIL),
      }));
    }

    writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
    console.log('✓ CMS snapshot written to', OUT);
  } catch (err) {
    console.warn('⚠ CMS snapshot fetch failed; keeping existing snapshot.', err?.message ?? err);
  }
}

main();
