export type LinkType = 'mailto' | 'external';
export type ItemState = 'enabled' | 'disabled' | 'hidden';

/** Site Settings tab — key/value pairs from the first data column. */
export interface SiteSettings {
  site_name: string;
  canonical: string;
  seo_title: string;
  seo_description: string;
  location: string;
  portrait_path: string;
  portrait_alt: string;
}

/** Homepage tab — one row per content field, keyed by the ID column. */
export interface HomepageCopy {
  greeting: string;
  bio: string;
  location: string;
  services_heading?: string;
  services_disabled_label?: string;
  footer_note: string;
}

export interface LinkItem {
  id: string;
  order: number;
  label: string;
  /** Optional smaller label shown beneath the primary label (e.g. "Request access"). */
  secondary_label?: string;
  url: string;
  type: LinkType;
  state: ItemState;
  publish: boolean;
  openInNewTab: boolean;
  /** Optional prefilled email subject/body for mailto links. */
  email_subject?: string;
  email_body?: string;
}

export interface ServiceItem {
  id: string;
  order: number;
  title: string;
  audience: string;
  description: string;
  url: string;
  state: ItemState;
  publish: boolean;
  openInNewTab: boolean;
}

export interface CmsData {
  site: SiteSettings;
  homepage: HomepageCopy;
  links: LinkItem[];
  services: ServiceItem[];
}
