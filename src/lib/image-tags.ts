// Tags de imagens da biblioteca (/admin/imagens) — constantes compartilhadas
// entre server actions e componentes (não podem morar num módulo 'use server',
// que só exporta funções async).

// Mesmo formato do CHECK da migration 043.
export const TAG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

// Tags de galeria: cada página pública tem a sua — tagueou, apareceu no site.
export const GALLERY_TAGS = [
  'galeria-home',
  'galeria-escuna',
  'galeria-lancha',
  'galeria-locacao',
] as const;

export type GalleryTag = (typeof GALLERY_TAGS)[number];

// Sugestões do input de tag no admin (o campo aceita qualquer slug válido).
export const SUGGESTED_TAGS: string[] = [
  'lancha',
  'escuna',
  'bar',
  'drone-lancha',
  'drone-escuna',
  ...GALLERY_TAGS,
];

// Alt genérico contextual por galeria — não temos alt por foto no banco e
// não inventamos descrições; o índice é concatenado pelo loader.
export const GALLERY_ALT: Record<GalleryTag, string> = {
  'galeria-home': 'Passeios de barco em Búzios',
  'galeria-escuna': 'Passeio de escuna em Búzios',
  'galeria-lancha': 'Passeio de lancha privativa em Búzios',
  'galeria-locacao': 'Locação privativa da escuna em Búzios',
};

/** Sanitiza tag digitada pro padrão slug (minúsculas, sem acento, hífens). */
export function sanitizeTag(raw: string): string | null {
  const tag = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return TAG_RE.test(tag) ? tag : null;
}
