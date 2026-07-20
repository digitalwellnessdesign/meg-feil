import type { LinkItem } from '../types';
import {
  FileTextIcon,
  ExternalLinkIcon,
  LinkedInIcon,
  SubstackIcon,
  ArrowUpRightIcon,
} from './icons';

interface LinkListProps {
  links: LinkItem[];
}

function iconFor(id: string, type: 'mailto' | 'external') {
  if (id === 'ux_portfolio') return FileTextIcon;
  if (id === 'linkedin') return LinkedInIcon;
  if (id === 'substack') return SubstackIcon;
  if (type === 'external') return ExternalLinkIcon;
  return FileTextIcon;
}

export function LinkList({ links }: LinkListProps) {
  const visible = links
    .filter((l) => l.publish && l.state !== 'hidden' && l.state !== 'disabled')
    .sort((a, b) => a.order - b.order);

  return (
    <nav aria-label="Contact and links" className="flex flex-col">
      <ul className="flex flex-col divide-y divide-paper-300 border-y border-paper-300">
        {visible.map((item) => {
          const Icon = iconFor(item.id, item.type);
          const external = item.openInNewTab && item.type === 'external';

          return (
            <li key={item.id} className="py-3.5">
              <a
                href={item.url}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="group flex items-center justify-between rounded-sm transition-colors duration-150 hover:text-sage focus-visible:text-sage"
              >
                <span className="flex flex-col">
                  <span className="flex items-center gap-3 font-sans text-[1rem] font-medium text-ink transition-colors duration-150 group-hover:text-sage group-focus-visible:text-sage">
                    <Icon className="h-5 w-5 text-ink-muted transition-colors duration-150 group-hover:text-sage group-focus-visible:text-sage" />
                    {item.label}
                    {external && (
                      <span className="sr-only"> (opens in a new tab)</span>
                    )}
                  </span>
                  {item.secondary_label && (
                    <span className="ml-8 mt-0.5 text-[0.8125rem] leading-tight text-ink-faint transition-colors duration-150 group-hover:text-sage group-focus-visible:text-sage/80">
                      {item.secondary_label}
                    </span>
                  )}
                </span>
                <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition-colors duration-150 group-hover:text-sage group-focus-visible:text-sage" />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
