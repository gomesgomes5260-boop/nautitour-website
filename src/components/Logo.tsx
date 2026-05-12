import Image from 'next/image';
import Link from 'next/link';

// Sizes em px, aspect-ratio nativo do PNG é 170:125 ≈ 1.36:1
const HEIGHTS: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

type Props = {
  size?: keyof typeof HEIGHTS;
  href?: string | null;
  /** 'charcoal' pra fundos claros (default), 'white' pra escuros */
  variant?: 'charcoal' | 'white';
  priority?: boolean;
  className?: string;
};

// Componente único de logo. Usa os PNGs extraídos via
// scripts/extract-logo-variants.mjs em public/brand/.
export default function Logo({
  size = 'md',
  href = '/',
  variant = 'charcoal',
  priority = false,
  className = '',
}: Props) {
  const h = HEIGHTS[size];
  const w = Math.round((h * 170) / 125);
  const src = variant === 'white' ? '/brand/logo-white.png' : '/brand/logo-charcoal.png';

  const img = (
    <Image
      src={src}
      alt="Nautitour Passeios"
      width={170}
      height={125}
      priority={priority}
      style={{ height: h, width: w }}
      className={className}
    />
  );

  if (!href) return img;
  return (
    <Link href={href} aria-label="Nautitour Passeios — Home" className="inline-flex">
      {img}
    </Link>
  );
}
