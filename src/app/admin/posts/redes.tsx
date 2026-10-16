// Rótulos, cores e ícones das redes do Material de posts.
// Lucide v1.8 não tem ícones de marca (regra do CLAUDE.md) — SVGs inline.
import type { Database } from '@/lib/supabase/database.types';

export type SocialRede = Database['public']['Enums']['social_rede'];
export type SocialStatus = Database['public']['Enums']['social_status'];
export type SocialTipo = Database['public']['Enums']['social_tipo'];

export const SOCIAL_BUCKET = 'social-posts';

export const REDE_LABEL: Record<SocialRede, string> = {
  instagram_feed: 'Instagram · Feed',
  instagram_story: 'Instagram · Story',
  instagram_reels: 'Instagram · Reels',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube_shorts: 'YouTube Shorts',
  whatsapp_status: 'Status WhatsApp',
  meta_ads: 'Meta Ads',
};

export const STATUS_META: Record<SocialStatus, { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  aprovado: { label: 'Aprovado', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  publicado: { label: 'Publicado', cls: 'bg-sky-50 border-sky-200 text-sky-800' },
  descartado: { label: 'Descartado', cls: 'bg-[var(--color-charcoal-100)] border-[var(--color-charcoal-200)] text-[var(--color-charcoal-500)]' },
};

export const TIPO_LABEL: Record<SocialTipo, string> = {
  imagem: 'Imagem',
  video: 'Vídeo',
  carrossel: 'Carrossel',
};

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.62 2.2 15.24 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.52 0-4.76.07-1.08.05-1.46.22-1.8.36-.45.18-.77.39-1.1.73-.34.33-.55.65-.73 1.1-.14.34-.31.72-.36 1.8C3.2 8.48 3.2 8.85 3.2 12s0 3.52.06 4.76c.05 1.08.22 1.46.36 1.8.18.45.39.77.73 1.1.33.34.65.55 1.1.73.34.14.72.31 1.8.36 1.24.06 1.61.06 4.76.06s3.52 0 4.76-.06c1.08-.05 1.46-.22 1.8-.36.45-.18.77-.39 1.1-.73.34-.33.55-.65.73-1.1.14-.34.31-.72.36-1.8.06-1.24.06-1.61.06-4.76s0-3.52-.06-4.76c-.05-1.08-.22-1.46-.36-1.8a2.9 2.9 0 0 0-.73-1.1 2.9 2.9 0 0 0-1.1-.73c-.34-.14-.72-.31-1.8-.36C15.52 4 15.15 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-3.1a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
    </svg>
  );
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 2h3.03c.1 1.03.56 2.1 1.33 2.95.78.86 1.84 1.46 3.04 1.6v3.06a7.9 7.9 0 0 1-4.37-1.5v6.6c0 4.03-3.27 7.29-7.3 7.29A7.29 7.29 0 0 1 5.05 9.6c.55-.09 1.12-.11 1.68-.05v3.13a4.22 4.22 0 1 0 5.5 4.03V2h4.37Z" transform="scale(0.85) translate(1.5,1.5)" />
    </svg>
  );
}

function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81ZM10 15.2V8.8L15.6 12 10 15.2Z" />
    </svg>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.56 2 2.1 6.46 2.1 11.94c0 1.75.46 3.46 1.33 4.97L2 22l5.22-1.37a9.9 9.9 0 0 0 4.82 1.23c5.48 0 9.94-4.46 9.94-9.94S17.52 2 12.04 2Zm0 18.17c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.1.81.83-3.02-.2-.31a8.2 8.2 0 1 1 7.02 3.86Zm4.52-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22a7.5 7.5 0 0 1-1.37-1.71c-.14-.25-.02-.38.1-.5.12-.11.25-.3.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.9 2.4 1.02 2.57.12.17 1.76 2.68 4.25 3.76.6.26 1.06.41 1.42.52.6.19 1.14.17 1.57.1.48-.07 1.46-.6 1.67-1.18.2-.57.2-1.07.14-1.17-.06-.1-.23-.17-.48-.3Z" />
    </svg>
  );
}

function MegaphoneGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

const REDE_GLYPH: Record<SocialRede, (p: { className?: string }) => React.ReactElement> = {
  instagram_feed: InstagramGlyph,
  instagram_story: InstagramGlyph,
  instagram_reels: InstagramGlyph,
  facebook: FacebookGlyph,
  tiktok: TikTokGlyph,
  youtube_shorts: YouTubeGlyph,
  whatsapp_status: WhatsAppGlyph,
  meta_ads: MegaphoneGlyph,
};

export function RedeBadge({ rede, compact = false }: { rede: SocialRede; compact?: boolean }) {
  const Glyph = REDE_GLYPH[rede];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-charcoal-900)] text-white px-2.5 py-1 text-[10px] font-bold">
      <Glyph className="w-3 h-3" />
      {compact ? null : REDE_LABEL[rede]}
    </span>
  );
}

export function StatusBadge({ status }: { status: SocialStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}
