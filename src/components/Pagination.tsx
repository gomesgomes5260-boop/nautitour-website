import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  buildHref: (page: number) => string;
  itemLabel?: { singular: string; plural: string };
};

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  buildHref,
  itemLabel = { singular: 'item', plural: 'itens' },
}: Props) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const noun = totalItems === 1 ? itemLabel.singular : itemLabel.plural;
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 mt-4"
    >
      <p className="text-xs text-[var(--color-charcoal-500)]">
        Mostrando <strong className="text-[var(--color-charcoal-900)]">{from}</strong>–
        <strong className="text-[var(--color-charcoal-900)]">{to}</strong> de{' '}
        <strong className="text-[var(--color-charcoal-900)]">{totalItems}</strong> {noun}
      </p>

      <div className="flex items-center gap-2">
        <NavButton
          href={prevDisabled ? null : buildHref(currentPage - 1)}
          label="Anterior"
          icon={<ChevronLeft size={14} />}
          iconLeft
        />
        <span className="text-xs font-medium text-[var(--color-charcoal-700)] px-2">
          Página <strong className="text-[var(--color-charcoal-900)]">{currentPage}</strong> de{' '}
          <strong className="text-[var(--color-charcoal-900)]">{totalPages}</strong>
        </span>
        <NavButton
          href={nextDisabled ? null : buildHref(currentPage + 1)}
          label="Próximo"
          icon={<ChevronRight size={14} />}
        />
      </div>
    </nav>
  );
}

function NavButton({
  href,
  label,
  icon,
  iconLeft,
}: {
  href: string | null;
  label: string;
  icon: React.ReactNode;
  iconLeft?: boolean;
}) {
  const base =
    'inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors';

  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={`${base} border-[var(--color-charcoal-100)] text-[var(--color-charcoal-300)] cursor-not-allowed`}
      >
        {iconLeft && icon}
        {label}
        {!iconLeft && icon}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] hover:border-[var(--color-charcoal-300)]`}
    >
      {iconLeft && icon}
      {label}
      {!iconLeft && icon}
    </Link>
  );
}
