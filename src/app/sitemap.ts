import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nautitour-website.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/passeio-escuna`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/passeio-lancha`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/locacao-escuna`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${SITE_URL}/sobre-nos`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/contato`, lastModified: now, priority: 0.5 },
    {
      url: `${SITE_URL}/politica-de-privacidade`,
      lastModified: now,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/politica-de-cancelamento`,
      lastModified: now,
      priority: 0.3,
    },
  ];
}
