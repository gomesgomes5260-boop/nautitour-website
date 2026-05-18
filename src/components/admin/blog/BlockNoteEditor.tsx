'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { pt as ptDictionary } from '@blocknote/core/locales';
import type { Block, PartialBlock } from '@blocknote/core';
import { uploadBlogImageAction } from '@/app/admin/blog/actions';

type Props = {
  initialContent?: unknown;
  onChange?: (content: Block[]) => void;
};

// Upload usado pelo BlockNote sempre que o usuário insere uma imagem inline.
// Retorna a URL pública do storage. Erros são re-thrown pra BlockNote mostrar
// o estado de "falha" no bloco.
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await uploadBlogImageAction(fd);
  if (!res.ok) throw new Error(res.error);
  return res.url;
}

export default function BlockNoteEditorClient({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: normalizeContent(initialContent),
    dictionary: ptDictionary,
    uploadFile: uploadImage,
  });

  return (
    <div className="bn-shell rounded-lg border border-[var(--color-charcoal-200)] bg-white py-3">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => onChange?.(editor.document)}
      />
    </div>
  );
}

// BlockNote exige PartialBlock[] não-vazio se passado, ou undefined pra default.
// Aceitamos `unknown` (jsonb do banco) e estreitamos.
function normalizeContent(raw: unknown): PartialBlock[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw as PartialBlock[];
}
