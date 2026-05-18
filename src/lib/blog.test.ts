import { describe, it, expect } from 'vitest';
import { slugify, deriveExcerpt, resolveBlogImageUrl } from './blog';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes diacritics (pt-BR)', () => {
    expect(slugify('Armação dos Búzios')).toBe('armacao-dos-buzios');
    expect(slugify('Passeio à praia')).toBe('passeio-a-praia');
  });

  it('strips special chars but keeps hyphens', () => {
    expect(slugify('What? An! Article.')).toBe('what-an-article');
    expect(slugify('5 melhores praias — guia')).toBe('5-melhores-praias-guia');
  });

  it('collapses repeated whitespace and hyphens', () => {
    expect(slugify('  multiple   spaces  ')).toBe('multiple-spaces');
    expect(slugify('dash--dash')).toBe('dash-dash');
  });

  it('returns empty string for empty/punctuation-only input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!!!')).toBe('');
  });
});

describe('deriveExcerpt', () => {
  it('returns empty string for non-array/non-doc content', () => {
    expect(deriveExcerpt(null)).toBe('');
    expect(deriveExcerpt({})).toBe('');
    expect(deriveExcerpt('plain')).toBe('');
  });

  it('extracts text from TipTap doc form', () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello there' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'second line' }] },
      ],
    };
    expect(deriveExcerpt(content)).toBe('Hello there second line');
  });

  it('also accepts legacy array-of-blocks form', () => {
    const content = [
      { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
    ];
    expect(deriveExcerpt(content)).toBe('one two');
  });

  it('truncates at word boundary near maxLen', () => {
    const long = 'palavra '.repeat(50).trim();
    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: long }] }],
    };
    const out = deriveExcerpt(content, 50);
    expect(out.length).toBeLessThanOrEqual(51); // 50 + ellipsis
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/palavr…$/); // não cortou no meio da palavra
  });

  it('recurses into nested content (lists, blockquotes)', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'outer' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'inner' }] },
              ],
            },
          ],
        },
      ],
    };
    expect(deriveExcerpt(content)).toBe('outer inner');
  });
});

describe('resolveBlogImageUrl', () => {
  it('returns absolute URLs unchanged', () => {
    expect(resolveBlogImageUrl('https://cdn.example.com/x.jpg')).toBe(
      'https://cdn.example.com/x.jpg'
    );
    expect(resolveBlogImageUrl('http://cdn.example.com/x.jpg')).toBe(
      'http://cdn.example.com/x.jpg'
    );
  });

  it('builds Supabase public URL from path when env is set', () => {
    const orig = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    try {
      expect(resolveBlogImageUrl('posts/cover.jpg')).toBe(
        'https://abc.supabase.co/storage/v1/object/public/blog-images/posts/cover.jpg'
      );
      expect(resolveBlogImageUrl('/posts/cover.jpg')).toBe(
        'https://abc.supabase.co/storage/v1/object/public/blog-images/posts/cover.jpg'
      );
    } finally {
      if (orig === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = orig;
    }
  });
});
