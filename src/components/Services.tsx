import type { ServiceItem } from '../types';
import { ArrowUpRightIcon } from './icons';

interface ServicesProps {
  services: ServiceItem[];
  heading?: string;
  disabledLabel?: string;
}

/**
 * Services block — always visible beneath the primary links.
 * - When all enabled services are disabled: shows the heading + a restrained
 *   "Coming soon" label (clearly intentional, not clickable).
 * - When service rows become enabled in the CMS: shows each service as a link
 *   with an up-right arrow to its destination URL.
 */
export function Services({ services, heading, disabledLabel }: ServicesProps) {
  const visible = services
    .filter((s) => s.publish && s.state !== 'hidden')
    .sort((a, b) => a.order - b.order);

  const anyEnabled = visible.some((s) => s.state === 'enabled');
  const enabledServices = visible.filter((s) => s.state === 'enabled');

  // When the section heading is unpublished and no enabled services remain,
  // the entire section is omitted — no heading, no label, no empty space.
  if (!heading && !anyEnabled) return null;

  return (
    <section aria-labelledby={heading ? 'services-heading' : undefined} className="mt-2 sm:mt-0">
      {heading && (
        <h2
          id="services-heading"
          className="font-serif text-[1.15rem] leading-[1.3] text-ink"
        >
          {heading}
        </h2>
      )}

      {!anyEnabled && disabledLabel && (
        <p className="mt-2 text-[0.95rem] text-ink-faint">{disabledLabel}</p>
      )}

      {anyEnabled && (
        <ul className="mt-3 flex flex-col divide-y divide-paper-300 border-y border-paper-300">
          {enabledServices.map((s) => (
            <li key={s.id} className="py-3.5">
              <a
                href={s.url}
                target={s.openInNewTab ? '_blank' : undefined}
                rel={s.openInNewTab ? 'noopener noreferrer' : undefined}
                className="group flex items-center justify-between transition-colors duration-150 hover:text-sage"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-sans text-[1rem] font-medium text-ink">
                    {s.title}
                    {s.openInNewTab && (
                      <span className="sr-only"> (opens in a new tab)</span>
                    )}
                  </span>
                  {s.description && (
                    <span className="max-w-[34rem] text-[0.9rem] leading-[1.5] text-ink-muted">
                      {s.description}
                    </span>
                  )}
                </span>
                <ArrowUpRightIcon className="ml-3 h-4 w-4 shrink-0 text-ink-faint transition-colors duration-150 group-hover:text-sage" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
