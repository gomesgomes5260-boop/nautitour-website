// Renderer server-side de JSON do TipTap/ProseMirror. Não usa o pacote
// @tiptap/* (evita shipar ~150KB + happy-dom no public bundle) — só
// percorre a estrutura JSON conhecida. Blocos suportados: paragraph,
// heading (1-6), bulletList, orderedList, listItem, blockquote, codeBlock,
// image, horizontalRule, hardBreak. Marks: bold, italic, strike, code, link.

import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';

// === Tipos ===
type Mark = {
  type: string;
  attrs?: { href?: string; target?: string };
};

type Node = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  marks?: Mark[];
  text?: string;
};

type Doc = {
  type?: string;
  content?: Node[];
};

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

function renderTextNode(node: Node, key: string): ReactNode {
  if (typeof node.text !== 'string') return null;
  let out: ReactNode = node.text;
  const marks = node.marks ?? [];

  // Aplicação de marks de fora pra dentro (code primeiro, bold/italic/etc por cima).
  for (const mark of marks) {
    switch (mark.type) {
      case 'code':
        out = (
          <code className="px-1 py-0.5 rounded bg-[var(--color-charcoal-100)] text-[0.92em] font-mono">
            {out}
          </code>
        );
        break;
      case 'bold':
        out = <strong>{out}</strong>;
        break;
      case 'italic':
        out = <em>{out}</em>;
        break;
      case 'strike':
        out = <s>{out}</s>;
        break;
      case 'underline':
        out = <u>{out}</u>;
        break;
      case 'link': {
        const href = mark.attrs?.href;
        if (typeof href === 'string' && isHttpUrl(href)) {
          const isExternal = /^https?:\/\//i.test(href);
          out = (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noreferrer noopener' : undefined}
              className="text-[var(--color-red-600)] hover:underline"
            >
              {out}
            </a>
          );
        }
        break;
      }
    }
  }
  return <Fragment key={key}>{out}</Fragment>;
}

function renderInline(nodes: Node[] | undefined, keyPrefix: string): ReactNode {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.type === 'text') return renderTextNode(node, key);
    if (node.type === 'hardBreak') return <br key={key} />;
    return null;
  });
}

function renderBlock(node: Node, key: string): ReactNode {
  switch (node.type) {
    case 'paragraph': {
      const inline = renderInline(node.content, key);
      const isEmpty =
        !node.content ||
        node.content.length === 0 ||
        node.content.every((n) => n.type === 'text' && !n.text);
      if (isEmpty) {
        return (
          <p key={key} className="leading-relaxed">
            &nbsp;
          </p>
        );
      }
      return (
        <p key={key} className="leading-relaxed">
          {inline}
        </p>
      );
    }

    case 'heading': {
      const level = Number(node.attrs?.level ?? 1);
      const cls = 'font-display tracking-tight text-[var(--color-charcoal-900)] mt-10 mb-4';
      const inline = renderInline(node.content, key);
      if (level === 1)
        return (
          <h1 key={key} className={`${cls} text-3xl sm:text-4xl font-semibold`}>
            {inline}
          </h1>
        );
      if (level === 2)
        return (
          <h2 key={key} className={`${cls} text-2xl sm:text-3xl font-semibold`}>
            {inline}
          </h2>
        );
      return (
        <h3 key={key} className={`${cls} text-xl sm:text-2xl font-semibold`}>
          {inline}
        </h3>
      );
    }

    case 'bulletList':
      return (
        <ul key={key} className="list-disc list-outside pl-6 space-y-2 my-4">
          {(node.content ?? []).map((child, i) => renderBlock(child, `${key}-${i}`))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} className="list-decimal list-outside pl-6 space-y-2 my-4">
          {(node.content ?? []).map((child, i) => renderBlock(child, `${key}-${i}`))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key}>
          {(node.content ?? []).map((child, i) => renderBlock(child, `${key}-${i}`))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-[var(--color-red-600)] pl-5 my-6 italic text-[var(--color-charcoal-700)]"
        >
          {(node.content ?? []).map((child, i) => renderBlock(child, `${key}-${i}`))}
        </blockquote>
      );

    case 'codeBlock': {
      const text = (node.content ?? [])
        .map((n) => (n.type === 'text' ? n.text ?? '' : ''))
        .join('');
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
      const src = node.attrs?.src;
      if (typeof src !== 'string' || !isHttpUrl(src)) return null;
      const alt = (node.attrs?.alt as string | undefined) ?? '';
      return (
        <figure key={key} className="my-8">
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[var(--color-charcoal-100)]">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
              unoptimized
            />
          </div>
          {alt && (
            <figcaption className="text-xs text-[var(--color-charcoal-500)] text-center mt-2">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'horizontalRule':
      return <hr key={key} className="my-8 border-[var(--color-charcoal-200)]" />;

    default:
      return null;
  }
}

export function RichTextRenderer({ content }: { content: unknown }) {
  // Aceita doc-form { type:'doc', content:[...] } ou array cru de blocos (legado).
  let blocks: Node[] = [];
  if (Array.isArray(content)) {
    blocks = content as Node[];
  } else if (
    content &&
    typeof content === 'object' &&
    (content as Doc).type === 'doc' &&
    Array.isArray((content as Doc).content)
  ) {
    blocks = (content as Doc).content!;
  }
  if (blocks.length === 0) return null;

  return (
    <div className="text-[var(--color-charcoal-800)] text-base sm:text-[17px] [&>:first-child]:mt-0">
      {blocks.map((b, i) => renderBlock(b, `b-${i}`))}
    </div>
  );
}

