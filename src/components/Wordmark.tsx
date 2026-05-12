import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

type Props = {
  size?: Size;
  href?: string | null;
  variant?: 'default' | 'inverse';
  showTagline?: boolean;
};

// Wordmark "NAUTI" + "TOUR" conforme brand guide.
// Montserrat 900 · NAUTI charcoal-700 · TOUR red-600
// Tagline opcional "PASSEIOS" em letter-spacing alto.
export default function Wordmark({
  size = 'md',
  href = '/',
  variant = 'default',
  showTagline = false,
}: Props) {
  const sizeClass = SIZE_CLASSES[size];
  const nautiColor =
    variant === 'inverse'
      ? 'text-white'
      : 'text-[var(--color-charcoal-700)]';
  const tourColor = 'text-[var(--color-red-600)]';
  const taglineColor =
    variant === 'inverse'
      ? 'text-white/70'
      : 'text-[var(--color-charcoal-500)]';

  const content = (
    <span className="inline-flex flex-col items-start leading-none font-sans">
      <span className={`${sizeClass} font-black tracking-wide`}>
        <span className={nautiColor}>NAUTI</span>
        <span className={tourColor}>TOUR</span>
      </span>
      {showTagline && (
        <span className={`mt-1 text-[10px] tracking-[0.3em] font-semibold ${taglineColor}`}>
          PASSEIOS
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="Nautitour Passeios — Home">
      {content}
    </Link>
  );
}
