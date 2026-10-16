import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

// Markdown → HTML seguro (micromark). HTML cru NÃO é interpretado — sem
// allowDangerousHtml, tags viram texto escapado, então não precisa de
// sanitização extra. GFM habilita tabelas (os docs de brand usam).
export function renderMarkdown(md: string): string {
  return micromark(md ?? '', {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  });
}

// Classes de tipografia pro HTML do renderMarkdown dentro do admin
// (Tailwind v4, seletores arbitrários — evita plugin de prose).
export const MD_PROSE_CLASS = [
  'text-sm leading-relaxed text-[var(--color-charcoal-700)]',
  '[&_h1]:font-display [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-[var(--color-charcoal-900)] [&_h1]:mt-5 [&_h1]:mb-2',
  '[&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--color-charcoal-900)] [&_h2]:mt-5 [&_h2]:mb-1.5',
  '[&_h3]:font-sans [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[var(--color-charcoal-900)] [&_h3]:mt-4 [&_h3]:mb-1',
  '[&_p]:my-2 [&_strong]:text-[var(--color-charcoal-900)]',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5',
  '[&_a]:text-[var(--color-red-600)] [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-[var(--color-charcoal-50)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded',
  '[&_pre]:bg-[var(--color-charcoal-50)] [&_pre]:border [&_pre]:border-[var(--color-charcoal-100)] [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre]:whitespace-pre-wrap',
  '[&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-xs',
  '[&_th]:text-left [&_th]:font-bold [&_th]:border-b [&_th]:border-[var(--color-charcoal-200)] [&_th]:px-2 [&_th]:py-1.5',
  '[&_td]:border-b [&_td]:border-[var(--color-charcoal-100)] [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top',
  '[&_hr]:my-5 [&_hr]:border-[var(--color-charcoal-100)]',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-charcoal-200)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--color-charcoal-500)]',
].join(' ');
