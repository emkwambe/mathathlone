type BrandSurface = 'white' | 'indigo' | 'gold' | 'print';
type BrandSize = 'sm' | 'md' | 'lg';

type MathAthloneBrandProps = {
  /** The surface behind the full lockup; determines its approved colorway. */
  surface?: BrandSurface;
  size?: BrandSize;
  className?: string;
};

const SIZE_STYLES: Record<BrandSize, { mark: string; wordmark: string; gap: string }> = {
  sm: { mark: 'h-6 w-6', wordmark: 'text-lg', gap: 'gap-2' },
  md: { mark: 'h-7 w-7', wordmark: 'text-2xl', gap: 'gap-2.5' },
  lg: { mark: 'h-8 w-8', wordmark: 'text-[18pt]', gap: 'gap-3' },
};

/**
 * Approved wordmark variants by background—not a generic light/dark switch.
 *
 *  • white: the existing blue Math / competition-gold Athlone lockup.
 *  • indigo: white Math / competition-gold Athlone for the hero and Heat field.
 *  • gold: black Math / MathAthlone-indigo Athlone, retaining a two-tone
 *    wordmark with sufficient contrast on the competition-gold surface.
 *  • print: all-black, low-ink treatment.
 */
const SURFACE_STYLES: Record<BrandSurface, { wordmark: string; accent: string }> = {
  white: { wordmark: 'text-[#2563eb]', accent: 'text-[#fbbf24]' },
  indigo: { wordmark: 'text-white', accent: 'text-[#fbbf24]' },
  gold: { wordmark: 'text-black', accent: 'text-[#312e81]' },
  print: { wordmark: 'text-black', accent: 'text-black' },
};

/**
 * Canonical brand lockup. The Heat symbol is the exact owner-selected PNG on
 * white surfaces. Worksheets/PDFs use the all-black print colorway. The
 * indigo/violet surface uses the owner-directed ink-base,
 * brown-tip/gold-base colorway; the gold surface uses the black-flame
 * colorway. All colorways preserve the supplied symbol geometry.
 */
export default function MathAthloneBrand({
  surface = 'white',
  size = 'md',
  className = '',
}: MathAthloneBrandProps) {
  const dimensions = SIZE_STYLES[size];
  const colors = SURFACE_STYLES[surface];
  const markSrc = surface === 'gold'
    ? '/brand/mathathlone-heat-flame-gold-bg.png'
    : surface === 'indigo'
      ? '/brand/mathathlone-heat-flame-violet-contrast.png'
      : surface === 'print'
        ? '/brand/mathathlone-heat-flame-print-black.png'
        : '/brand/mathathlone-heat-flame.png';

  return (
    <span
      className={`inline-flex items-center ${dimensions.gap} whitespace-nowrap ${className}`}
      aria-label="MathAthlone"
    >
      <img
        src={markSrc}
        alt=""
        aria-hidden="true"
        className={`${dimensions.mark} shrink-0 object-contain`}
      />
      <span className={`${dimensions.wordmark} font-bold leading-none tracking-tight ${colors.wordmark}`}>
        Math<span className={colors.accent}>Athlone</span>
      </span>
    </span>
  );
}
