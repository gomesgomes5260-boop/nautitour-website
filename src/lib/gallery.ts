// Loader server-side das galerias públicas por tag (tabela site_image_tags,
// migration 043). Usa supabase-js puro sem cookies — chamável de qualquer
// server component sem forçar leitura de sessão. NÃO importar em client
// components.

import { createClient } from '@supabase/supabase-js';
import type { Photo } from '@/lib/photo-gallery';
import { TAG_RE, GALLERY_ALT, type GalleryTag } from '@/lib/image-tags';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** URL pública de um path do bucket site-images. */
export function publicImageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/site-images/${path}`;
}

/**
 * Fotos da galeria de uma página, na ordem de tagueamento. Qualquer falha
 * (env ausente, erro de rede, tag sem fotos) cai no fallback estático de
 * src/lib/photo-gallery.ts — galeria nunca fica vazia.
 */
export async function getGalleryPhotos(
  tag: GalleryTag,
  fallback: Photo[]
): Promise<Photo[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TAG_RE.test(tag)) return fallback;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .from('site_image_tags')
      .select('path')
      .eq('tag', tag)
      .order('tagged_at', { ascending: true })
      .order('path', { ascending: true })
      .limit(24);
    if (error || !data || data.length === 0) return fallback;
    return data.map((row, i) => ({
      src: publicImageUrl(row.path),
      alt: `${GALLERY_ALT[tag]} — foto ${i + 1}`,
    }));
  } catch {
    return fallback;
  }
}
