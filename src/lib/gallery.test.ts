import { afterEach, describe, expect, it, vi } from 'vitest';

const FALLBACK = [
  { src: '/images/photos/escuna/escuna-pier-01.jpg', alt: 'Escuna no píer' },
];

// Mock do supabase-js: cada teste configura o resultado do select encadeado.
const selectResult = vi.hoisted(() => ({
  value: { data: null as Array<{ path: string }> | null, error: null as unknown },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              limit: () => Promise.resolve(selectResult.value),
            }),
          }),
        }),
      }),
    }),
  }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

const { getGalleryPhotos, publicImageUrl } = await import('./gallery');

afterEach(() => {
  selectResult.value = { data: null, error: null };
});

describe('publicImageUrl', () => {
  it('monta a URL pública do bucket', () => {
    expect(publicImageUrl('escuna/foto-001-abc.webp')).toBe(
      'https://example.supabase.co/storage/v1/object/public/site-images/escuna/foto-001-abc.webp'
    );
  });
});

describe('getGalleryPhotos', () => {
  it('erro do banco → fallback', async () => {
    selectResult.value = { data: null, error: new Error('boom') };
    expect(await getGalleryPhotos('galeria-home', FALLBACK)).toBe(FALLBACK);
  });

  it('tag sem fotos → fallback', async () => {
    selectResult.value = { data: [], error: null };
    expect(await getGalleryPhotos('galeria-lancha', FALLBACK)).toBe(FALLBACK);
  });

  it('fotos tagueadas → mapeia src e alt derivado do arquivo', async () => {
    selectResult.value = {
      data: [
        { path: 'escuna/escuna-pier-001-60965385.webp' },
        { path: 'ilhas/snorkel-ilha-002-87113b7b.webp' },
      ],
      error: null,
    };
    const photos = await getGalleryPhotos('galeria-escuna', FALLBACK);
    expect(photos).toHaveLength(2);
    expect(photos[0].src).toContain('/site-images/escuna/escuna-pier-001-60965385.webp');
    expect(photos[0].alt).toBe('Escuna pier — Passeio de escuna em Búzios');
    expect(photos[1].alt).toBe('Snorkel ilha — Passeio de escuna em Búzios');
  });
});
