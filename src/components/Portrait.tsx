interface PortraitProps {
  alt: string;
  src?: string;
}

/**
 * Contained editorial 4:5 portrait. Served as <picture> with AVIF → WebP → JPEG.
 * Explicit width/height reserves layout space (zero CLS). Eager + high priority
 * because this is the LCP element. Never used as background, hero, banner,
 * or with text overlaid.
 */
// Prefix root-relative paths with the Vite base so assets resolve under a
// project subpath (e.g. /meg-feil/). Absolute URLs pass through unchanged.
function resolveAsset(path: string): string {
  return /^https?:\/\//.test(path) ? path : path.replace(/^\//, import.meta.env.BASE_URL);
}

export function Portrait({ alt, src }: PortraitProps) {
  const imgSrc = resolveAsset(src && src.trim() ? src : '/images/megan-feil-homepage.jpg');
  const avifSrc = imgSrc.replace(/\.jpe?g$/i, '.avif');
  const webpSrc = imgSrc.replace(/\.jpe?g$/i, '.webp');

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[2px] bg-paper-200 shadow-[0_1px_2px_rgba(28,26,24,0.04),0_8px_30px_rgba(28,26,24,0.07)]">
        <picture>
          <source srcSet={avifSrc} type="image/avif" />
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={imgSrc}
            alt={alt}
            width={340}
            height={425}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </picture>
      </div>
    </div>
  );
}
