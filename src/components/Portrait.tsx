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
export function Portrait({ alt, src }: PortraitProps) {
  // src is configurable via CMS portrait_path; defaults to the bundled image.
  const imgSrc = src && src.trim() ? src : '/images/megan-feil-homepage.jpg';
  const avifSrc = imgSrc.replace(/\.jpe?g$/i, '.avif');
  const webpSrc = imgSrc.replace(/\.jpe?g$/i, '.webp');
  const mobileWebp = imgSrc.replace(/\.jpe?g$/i, '-544.webp');
  const mobileJpg = imgSrc.replace(/\.jpe?g$/i, '-544.jpg');

  // Mobile (≤640px) gets the 544px-wide variant (~2x for a ~272px display);
  // desktop gets the full 901px source. AVIF is already 37KB at full res so
  // both breakpoints share it.
  const webpSrcSet = `${mobileWebp} 544w, ${webpSrc} 901w`;
  const jpgSrcSet = `${mobileJpg} 544w, ${imgSrc} 901w`;
  const sizes = '(max-width: 640px) 544px, 272px';

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[2px] bg-paper-200 shadow-[0_1px_2px_rgba(28,26,24,0.04),0_8px_30px_rgba(28,26,24,0.07)]">
        <picture>
          <source srcSet={avifSrc} type="image/avif" />
          <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
          <img
            src={imgSrc}
            srcSet={jpgSrcSet}
            sizes={sizes}
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
