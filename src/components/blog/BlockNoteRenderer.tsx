// Renderer server-side de conteúdo BlockNote. Não usa o pacote @blocknote/*
// (que pesa ~200KB) — só percorre a estrutura JSON conhecida. Lista de tipos
// suportados em V1: paragraph, heading 1-3, listas (bullet/numbered/check),
// quote, codeBlock, image. Estilos inline: bold, italic, underline, strike,
// code, link, textColor, backgroundColor.

import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';

// === Tipos (forma do JSON emitido pelo BlockNote) ===
type InlineText = {
  type: 'text';
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    code?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };
};

type InlineLink = {
  type: 'link';
  content: InlineText[];
  href: string;
};

type Inline = InlineText | InlineLink;

type BlockProps = {
  level?: 1 | 2 | 3;
  textAlignment?: 'left' | 'center' | 'right' | 'justify';
  url?: string;
  caption?: string;
  name?: string;
  previewWidth?: number;
  showPreview?: boolean;
  checked?: boolean;
  language?: string;
};

type Block = {
  id?: string;
  type?: string;
  props?: BlockProps;
  content?: Inline[] | string;
  children?: Block[];
};

// === Helpers ===
function alignmentClass(alignment: BlockProps['textAlignment']) {
  switch (alignment) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'justify':
      return 'text-justify';
    default:
      return '';
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

function renderInline(content: Inline[] | string | undefined, keyPrefix: string): ReactNode {
  if (!content) return null;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;

  return content.map((piece, i) => {
    const key = `${keyPrefix}-${i}`;
    if (piece.type === 'link') {
      const safeHref = isHttpUrl(piece.href) ? piece.href : '#';
      const isExternal = /^https?:\/\//i.test(safeHref);
      return (
        <a
          key={key}
          href={safeHref}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noreferrer noopener' : undefined}
          className="text-[var(--color-red-600)] hover:underline"
        >
          {renderInline(piece.content, key)}
        </a>
      );
    }

    // type === 'text'
    let node: ReactNode = piece.text;
    const styles = piece.styles ?? {};
    if (styles.code) {
      node = (
        <code className="px-1 py-0.5 rounded bg-[var(--color-charcoal-100)] text-[0.92em] font-mono">
          {node}
        </code>
      );
    }
    if (styles.bold) node = <strong>{node}</strong>;
    if (styles.italic) node = <em>{node}</em>;
    if (styles.underline) node = <u>{node}</u>;
    if (styles.strike) node = <s>{node}</s>;
    return <Fragment key={key}>{node}</Fragment>;
  });
}

function renderBlock(block: Block, key: string): ReactNode {
  const align = alignmentClass(block.props?.textAlignment);
  const inline = renderInline(block.content, key);
  const children = block.children ?? [];

  switch (block.type) {
    case 'heading': {
      const level = block.props?.level ?? 1;
      const cls = `font-display tracking-tight text-[var(--color-charcoal-900)] mt-10 mb-4 ${align}`;
      if (level === 1) {
        return (
          <h1 key={key} className={`${cls} text-3xl sm:text-4xl font-semibold`}>
            {inline}
          </h1>
        );
      }
      if (level === 2) {
        return (
          <h2 key={key} className={`${cls} text-2xl sm:text-3xl font-semibold`}>
            {inline}
          </h2>
        );
      }
      return (
        <h3 key={key} className={`${cls} text-xl sm:text-2xl font-semibold`}>
          {inline}
        </h3>
      );
    }

    case 'bulletListItem':
      return (
        <li key={key} className={align}>
          {inline}
          {children.length > 0 && (
            <ul className="list-disc list-outside pl-6 mt-2 space-y-1">
              {children.map((c, i) => renderBlock(c, `${key}-c${i}`))}
            </ul>
          )}
        </li>
      );

    case 'numberedListItem':
      return (
        <li key={key} className={align}>
          {inline}
          {children.length > 0 && (
            <ol className="list-decimal list-outside pl-6 mt-2 space-y-1">
              {children.map((c, i) => renderBlock(c, `${key}-c${i}`))}
            </ol>
          )}
        </li>
      );

    case 'checkListItem':
      return (
        <li key={key} className={`flex items-start gap-2 list-none ${align}`}>
          <input
            type="checkbox"
            checked={!!block.props?.checked}
            readOnly
            disabled
            className="mt-1 cursor-default"
          />
          <span>{inline}</span>
        </li>
      );

    case 'quote':
      return (
        <blockquote
          key={key}
          className={`border-l-4 border-[var(--color-red-600)] pl-5 my-6 italic text-[var(--color-charcoal-700)] ${align}`}
        >
          {inline}
        </blockquote>
      );

    case 'codeBlock': {
      const text =
        typeof block.content === 'string'
          ? block.content
          : Array.isArray(block.content)
            ? block.content
                .map((p) => (p.type === 'text' ? p.text : ''))
                .join('')
            : '';
      return (
        <pre
          key={key}
          className="bg-[var(--color-charcoal-900)] text-white text-sm rounded-lg p-4 overflow-x-auto my-6"
        >
          <code>{text}</code>
        </pre>
      );
    }

    case 'image': {
      const url = block.props?.url;
      if (!url || !isHttpUrl(url)) return null;
      const caption = block.props?.caption ?? '';
      return (
        <figure key={key} className={`my-8 ${align}`}>
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[var(--color-charcoal-100)]">
            <Image
              src={url}
              alt={caption}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
              unoptimized
            />
          </div>
          {caption && (
            <figcaption className="text-xs text-[var(--color-charcoal-500)] text-center mt-2">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'paragraph':
    default: {
      // Paragrafo vazio gera espaço; consumidor pode esperar isso (BlockNote inclui paragráfos vazios).
      const isEmpty =
        !inline ||
        (Array.isArray(inline) && inline.length === 0) ||
        (Array.isArray(block.content) && block.content.every((p) => p.type === 'text' && !p.text));
      if (isEmpty) {
        return <p key={key} className={`leading-relaxed ${align}`}>&nbsp;</p>;
      }
      return (
        <p key={key} className={`leading-relaxed ${align}`}>
          {inline}
        </p>
      );
    }
  }
}

// Agrupa list items consecutivos em <ul>/<ol>, já que BlockNote emite list
// items como blocos top-level irmãos.
type Group =
  | { kind: 'list'; listType: 'bullet' | 'numbered' | 'check'; blocks: Block[] }
  | { kind: 'block'; block: Block };

function groupBlocks(blocks: Block[]): Group[] {
  const out: Group[] = [];
  for (const b of blocks) {
    const listType =
      b.type === 'bulletListItem'
        ? ('bullet' as const)
        : b.type === 'numberedListItem'
          ? ('numbered' as const)
          : b.type === 'checkListItem'
            ? ('check' as const)
            : null;
    if (listType) {
      const last = out[out.length - 1];
      if (last && last.kind === 'list' && last.listType === listType) {
        last.blocks.push(b);
      } else {
        out.push({ kind: 'list', listType, blocks: [b] });
      }
    } else {
      out.push({ kind: 'block', block: b });
    }
  }
  return out;
}

export function BlockNoteRenderer({ content }: { content: unknown }) {
  if (!Array.isArray(content) || content.length === 0) return null;
  const blocks = content as Block[];
  const groups = groupBlocks(blocks);

  return (
    <div className="text-[var(--color-charcoal-800)] text-base sm:text-[17px] [&_p+p]:mt-4 [&>:first-child]:mt-0">
      {groups.map((g, i) => {
        if (g.kind === 'block') return renderBlock(g.block, `b-${i}`);
        const listClass =
          g.listType === 'bullet'
            ? 'list-disc list-outside pl-6 space-y-2 my-4'
            : g.listType === 'numbered'
              ? 'list-decimal list-outside pl-6 space-y-2 my-4'
              : 'space-y-2 my-4';
        if (g.listType === 'numbered') {
          return (
            <ol key={`g-${i}`} className={listClass}>
              {g.blocks.map((b, j) => renderBlock(b, `g${i}-${j}`))}
            </ol>
          );
        }
        return (
          <ul key={`g-${i}`} className={listClass}>
            {g.blocks.map((b, j) => renderBlock(b, `g${i}-${j}`))}
          </ul>
        );
      })}
    </div>
  );
}
