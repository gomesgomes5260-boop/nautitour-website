// Builders de JSON-LD (Schema.org) compartilhados entre as páginas públicas.
// Renderizar com <JsonLd data={...} /> (src/components/JsonLd.tsx).

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nautitour.com.br';

export const BUSINESS_PHONES = [
  '+55 22 99773-4466',
  '+55 22 99996-3664',
  '+55 22 98805-2238',
  '+55 22 99908-7800',
];

/** Cadastro da empresa — habilita rich results locais (mapa/painel). */
export function localBusinessJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#business`,
    name: 'Nautitour Passeios',
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-charcoal.png`,
    image: `${SITE_URL}/images/photos/escuna/escuna-pier-01.jpg`,
    description:
      'Passeios de escuna e lancha privativa em Armação dos Búzios — RJ. Reserva online com Pix ou cartão.',
    email: 'contato@nautitour.com.br',
    telephone: BUSINESS_PHONES[0],
    priceRange: 'R$60 - R$1200',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Travessa dos Pescadores, 326',
      addressLocality: 'Armação dos Búzios',
      addressRegion: 'RJ',
      postalCode: '28950-000',
      addressCountry: 'BR',
    },
    areaServed: {
      '@type': 'City',
      name: 'Armação dos Búzios',
    },
  };
}

/** FAQPage — concorre à caixa de perguntas nos resultados do Google. */
export function faqPageJsonLd(
  faqs: Array<{ q: string; a: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/** Trilha de navegação (Home > Página > ...). Paths relativos ao site. */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
