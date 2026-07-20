import { useState, useEffect } from 'react';
import type { CmsData } from '../types';
import { fallback } from '../lib/fallback';
import { fetchCms, mergeCms, type CmsUpdate } from '../lib/cms';
import { readCache, writeCache } from '../lib/cache';
import { applySeo } from '../lib/seo';
// Bundled build-time snapshot (generated/refreshed by CI; falls back to fallback.ts).
import snapshot from '../cms-snapshot.json';

type Status = 'snapshot' | 'live' | 'error';

export interface UseCmsResult {
  data: CmsData;
  status: Status;
}

/**
 * Three-layer CMS resolution:
 *  1. Render bundled snapshot immediately (no network wait).
 *  2. Fetch live Google Sheet in the background; replace on success.
 *  3. Cache the live result (stale-while-revalidate): on the next visit,
 *     render cached values instantly and refresh in the background.
 * Snapshot/fallback always keep the page usable if the Sheet is unreachable.
 */
export function useCms(): UseCmsResult {
  const snapshotData = (snapshot as CmsData) ?? fallback;

  const cached = readCache();
  const initial: CmsData = cached
    ? mergeCms(snapshotData, cached as CmsUpdate)
    : snapshotData;

  const [result, setResult] = useState<UseCmsResult>({ data: initial, status: 'snapshot' });

  // Apply SEO from initial data on first paint so crawlers/no-JS see correct metadata.
  useEffect(() => {
    applySeo(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background live fetch; non-blocking.
  useEffect(() => {
    let cancelled = false;
    fetchCms().then((live) => {
      if (cancelled) return;
      if (!live) {
        setResult({ data: initial, status: 'error' });
        return;
      }
      const merged = mergeCms(initial, live);
      writeCache(live);
      applySeo(merged);
      setResult({ data: merged, status: 'live' });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return result;
}
