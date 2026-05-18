'use client';

import { useRef, useState, useTransition } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code as CodeBlock,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Loader2,
} from 'lucide-react';
import { uploadBlogImageAction } from '@/app/admin/blog/actions';

type Props = {
  initialContent?: unknown;
  onChange?: (json: unknown) => void;
};

const editorClassName =
  'prose-content min-h-[300px] px-4 py-3 focus:outline-none ' +
  // Tipografia básica replicada inline (sem Tailwind typography plugin instalado)
  '[&_p]:leading-relaxed [&_p:not(:last-child)]:mb-3 ' +
  '[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-3 ' +
  '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 ' +
  '[&_h3]:text-xl  [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 ' +
  '[&_ul]:list-disc  [&_ul]:pl-6 [&_ul]:mb-3 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 ' +
  '[&_li]:mb-1 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-red-600)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--color-charcoal-700)] [&_blockquote]:my-4 ' +
  '[&_code]:bg-[var(--color-charcoal-100)] [&_code]:px-1 [&_code]:rounded [&_code]:text-[0.92em] [&_code]:font-mono ' +
  '[&_pre]:bg-[var(--color-charcoal-900)] [&_pre]:text-white [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:overflow-x-auto ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 ' +
  '[&_a]:text-[var(--color-red-600)] [&_a]:underline ' +
  '[&_img]:my-4 [&_img]:rounded-lg [&_img]:max-w-full ' +
  '[&_p.is-editor-empty:first-child::before]:text-[var(--color-charcoal-400)] [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0';

export default function RichTextEditor({ initialContent, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Lista de extensões que vêm no StarterKit:
        // Document, Paragraph, Text, Bold, Italic, Strike, Code,
        // Heading, BulletList, OrderedList, ListItem, Blockquote,
        // CodeBlock, HardBreak, HorizontalRule, History, Dropcursor, Gapcursor
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever o post…',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noreferrer noopener',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
    ],
    content: normalizeContent(initialContent),
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  if (!editor) {
    return (
      <div className="rounded-lg border border-[var(--color-charcoal-200)] bg-white min-h-[300px] flex items-center justify-center text-sm text-[var(--color-charcoal-500)]">
        Carregando editor…
      </div>
    );
  }

  function triggerImageUpload() {
    fileInputRef.current?.click();
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    setUploadErr(null);
    startUpload(async () => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadBlogImageAction(fd);
      if (!res.ok) {
        setUploadErr(res.error);
        return;
      }
      editor.chain().focus().setImage({ src: res.url, alt: '' }).run();
    });
  }

  function promptLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', previous ?? 'https://');
    if (url === null) return; // cancelado
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      alert('URL precisa começar com http:// ou https://');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="rounded-lg border border-[var(--color-charcoal-200)] bg-white">
      <Toolbar
        editor={editor}
        onImage={triggerImageUpload}
        onLink={promptLink}
        uploading={uploading}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleImageFile}
        className="hidden"
      />
      {uploadErr && (
        <p className="px-4 pb-3 text-xs text-[var(--color-red-700)]">{uploadErr}</p>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  onImage,
  onLink,
  uploading,
}: {
  editor: Editor;
  onImage: () => void;
  onLink: () => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] rounded-t-lg">
      <ToolGroup>
        <ToolButton
          label="Negrito"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolButton>
        <ToolButton
          label="Itálico"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolButton>
        <ToolButton
          label="Tachado"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </ToolButton>
        <ToolButton
          label="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} />
        </ToolButton>
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton
          label="Título 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={15} />
        </ToolButton>
        <ToolButton
          label="Título 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolButton>
        <ToolButton
          label="Título 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolButton>
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton
          label="Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolButton>
        <ToolButton
          label="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolButton>
        <ToolButton
          label="Citação"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolButton>
        <ToolButton
          label="Bloco de código"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeBlock size={15} />
        </ToolButton>
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton
          label="Link"
          active={editor.isActive('link')}
          onClick={onLink}
        >
          <LinkIcon size={15} />
        </ToolButton>
        <ToolButton label="Imagem" onClick={onImage} disabled={uploading}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </ToolButton>
      </ToolGroup>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolButton
          label="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo size={15} />
        </ToolButton>
        <ToolButton
          label="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo size={15} />
        </ToolButton>
      </div>
    </div>
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-5 mx-1 bg-[var(--color-charcoal-200)]" />;
}

function ToolButton({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-[var(--color-charcoal-900)] text-white'
          : 'text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-100)]'
      }`}
    >
      {children}
    </button>
  );
}

// Aceita `unknown` (jsonb do banco) e estreita pra estrutura que TipTap aceita.
// TipTap aceita: { type: 'doc', content: [...] } OU HTML string.
function normalizeContent(raw: unknown): JSONContent | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  if (Array.isArray(raw)) {
    // legado de tentativa de BlockNote — array vazio → undefined
    if (raw.length === 0) return undefined;
    // Empacota array num doc TipTap (fallback caso alguém tenha salvo blocos crus).
    return { type: 'doc', content: raw as JSONContent[] };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.type === 'doc' && Array.isArray(obj.content)) {
    return { type: 'doc', content: obj.content as JSONContent[] };
  }
  return undefined;
}
