import type {
  CmsData,
  HomepageCopy,
  LinkItem,
  LinkType,
  ServiceItem,
  SiteSettings,
  ItemState,
} from '../types';

export const SPREADSHEET_ID = '1p12hJNlK9encdzXgbbtAJ7dsEQ3-mUmg-E_xE3lzy6s';
const GVIZ_BASE = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq`;

interface GvizCell {
  v: string | number | boolean | null;
}

interface GvizRow {
  c: (GvizCell | null)[] | null;
}

interface GvizTable {
  cols: { id: string; label: string; type: string }[];
  rows: GvizRow[] | null;
}

interface GvizResponse {
  table: GvizTable;
}

async function fetchTab(tabName: string): Promise<GvizTable | null> {
  const url = `${GVIZ_BASE}?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  const text = await res.text();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  const json = JSON.parse(text.slice(start, end + 1)) as GvizResponse;
  return json?.table ?? null;
}

function cellString(cell: GvizCell | null): string {
  if (!cell || cell.v === null || cell.v === undefined) return '';
  return String(cell.v).trim();
}

function cellBool(cell: GvizCell | null): boolean {
  if (!cell || cell.v === null) return false;
  if (typeof cell.v === 'boolean') return cell.v;
  const s = String(cell.v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
}

function asLinkType(s: string): LinkType {
  return s.toLowerCase() === 'external' ? 'external' : 'mailto';
}

function asState(s: string): ItemState {
  const v = s.toLowerCase();
  if (v === 'enabled' || v === 'disabled' || v === 'hidden') return v;
  return 'enabled';
}

/** Find column index by header label (case-insensitive). */
function colIndex(table: GvizTable, label: string): number {
  return table.cols.findIndex((c) => c.label.toLowerCase() === label.toLowerCase());
}

/**
 * Parse the "Site Settings" tab — a key/value table where the first column
 * is an ID, the third column is the value. A header row is skipped by
 * matching on the ID column (rows whose first cell is "ID" are skipped).
 */
function parseSiteSettings(table: GvizTable | null): Partial<SiteSettings> | null {
  if (!table || !table.rows) return null;
  const map: Record<string, string> = {};
  for (const row of table.rows) {
    if (!row.c || row.c.length < 3) continue;
    const id = cellString(row.c[0]);
    if (!id || id.toLowerCase() === 'id') continue;
    const val = cellString(row.c[2]);
    map[id] = val;
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

/**
 * Parse the "Homepage" tab — one row per content field, keyed by the ID
 * column. Publish column gates whether the value is used.
 */
function parseHomepage(table: GvizTable | null): Partial<HomepageCopy> | null {
  if (!table || !table.rows) return null;
  const iId = colIndex(table, 'ID');
  const iContent = colIndex(table, 'Content');
  const iPublish = colIndex(table, 'Publish');
  if (iId < 0 || iContent < 0) return null;

  const map: Record<string, { content: string; publish: boolean }> = {};
  for (const row of table.rows) {
    if (!row.c) continue;
    const id = cellString(row.c[iId]);
    if (!id || id.toLowerCase() === 'id') continue;
    map[id] = {
      content: cellString(row.c[iContent]),
      publish: iPublish >= 0 ? cellBool(row.c[iPublish]) : true,
    };
  }

  const pick = (id: string) => (map[id]?.publish ? map[id].content : undefined);
  return {
    greeting: pick('home_greeting'),
    bio: pick('home_bio'),
    location: pick('home_location'),
    services_heading: pick('services_heading'),
    services_disabled_label: pick('services_disabled_label'),
    footer_note: pick('footer_note'),
  };
}

function parseLinks(table: GvizTable | null): LinkItem[] | null {
  if (!table || !table.rows) return null;
  const iId = colIndex(table, 'ID');
  const iOrder = colIndex(table, 'Order');
  const iLabel = colIndex(table, 'Label');
  const iSecondary = colIndex(table, 'Secondary label');
  const iUrl = colIndex(table, 'URL');
  const iType = colIndex(table, 'Link type');
  const iState = colIndex(table, 'State');
  const iPublish = colIndex(table, 'Publish');
  const iNewTab = colIndex(table, 'Open in new tab');

  const items: LinkItem[] = [];
  for (const row of table.rows) {
    if (!row.c) continue;
    const id = iId >= 0 ? cellString(row.c[iId]) : '';
    const label = iLabel >= 0 ? cellString(row.c[iLabel]) : '';
    if (!id && !label) continue;
    // Normalize stray newlines inside the URL (gviz can return multi-line
    // cell values). For mailto URLs a newline where the "?" separator should
    // go produces a broken link — restore it.
    const rawUrl = iUrl >= 0 ? cellString(row.c[iUrl]) : '';
    const type = iType >= 0 ? asLinkType(cellString(row.c[iType])) : 'mailto';
    let url = rawUrl.replace(/\s*\n\s*/g, '');
    if (type === 'mailto' && rawUrl.includes('\n') && !url.includes('?') && url.includes('subject=')) {
      url = url.replace(/mailto:([^&?]*)subject=/, 'mailto:$1?subject=');
    }
    const state = iState >= 0 ? asState(cellString(row.c[iState])) : 'enabled';
    const publish = iPublish >= 0 ? cellBool(row.c[iPublish]) : true;
    if (!publish) continue;
    const secondary_label = iSecondary >= 0 ? cellString(row.c[iSecondary]) : '';

    // Extract prefilled subject/body from mailto URL if present.
    let email_subject: string | undefined;
    let email_body: string | undefined;
    if (type === 'mailto' && url.includes('?')) {
      try {
        const q = new URLSearchParams(url.split('?')[1]);
        email_subject = q.get('subject') ?? undefined;
        email_body = q.get('body') ?? undefined;
      } catch {
        // keep undefined
      }
    }

    items.push({
      id,
      order: iOrder >= 0 ? Number(cellString(row.c[iOrder])) || items.length + 1 : items.length + 1,
      label,
      secondary_label: secondary_label || undefined,
      url,
      type,
      state,
      publish,
      openInNewTab: iNewTab >= 0 ? cellBool(row.c[iNewTab]) : type === 'external',
      email_subject,
      email_body,
    });
  }
  return items.sort((a, b) => a.order - b.order);
}

function parseServices(table: GvizTable | null): ServiceItem[] | null {
  if (!table || !table.rows) return null;
  const iId = colIndex(table, 'ID');
  const iOrder = colIndex(table, 'Order');
  const iTitle = colIndex(table, 'Service name');
  const iAudience = colIndex(table, 'Audience');
  const iDesc = colIndex(table, 'Short description');
  const iUrl = colIndex(table, 'Destination URL');
  const iState = colIndex(table, 'State');
  const iPublish = colIndex(table, 'Publish');
  const iNewTab = colIndex(table, 'Open in new tab');

  const items: ServiceItem[] = [];
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

export type CmsUpdate = {
  site?: Partial<SiteSettings>;
  homepage?: Partial<HomepageCopy>;
  links?: LinkItem[];
  services?: ServiceItem[];
};

/** Merge live values over a baseline; undefined fields keep the baseline.
 *  Placeholder values (e.g. REPLACE_WITH_EMAIL) are treated as missing so
 *  the live sheet doesn't overwrite a working snapshot with an unfinished edit. */
export function mergeCms(baseline: CmsData, updates: CmsUpdate | null | undefined): CmsData {
  if (!updates) return baseline;

  const isPlaceholder = (v: string | undefined): boolean =>
    !!v && v.includes('REPLACE_WITH_EMAIL');

  const links = updates.links
    ? updates.links.map((live) => {
        const base = baseline.links.find((l) => l.id === live.id);
        if (!base) return live;
        if (isPlaceholder(live.url)) {
          return { ...live, url: base.url, email_subject: base.email_subject, email_body: base.email_body };
        }
        return live;
      })
    : baseline.links;

  const site = { ...baseline.site, ...(updates.site ?? {}) };
  // Treat placeholder canonical/email as missing.
  if (isPlaceholder(site.canonical)) site.canonical = baseline.site.canonical;

  return {
    site,
    homepage: { ...baseline.homepage, ...(updates.homepage ?? {}) },
    links,
    services: updates.services ?? baseline.services,
  };
}

/** Fetch all four tabs from the public Google Sheet. Returns null on any failure. */
export async function fetchCms(): Promise<CmsUpdate | null> {
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

    if (!site && !homepage && !links && !services) return null;
    const update: CmsUpdate = {};
    if (site) update.site = site;
    if (homepage) update.homepage = homepage;
    if (links) update.links = links;
    if (services) update.services = services;
    return update;
  } catch {
    return null;
  }
}
