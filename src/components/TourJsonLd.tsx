import { SITE_URL } from '@/lib/site-jsonld';

type Props = {
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number | null;
  durationMinutes: number | null;
  maxCapacity: number | null;
  url: string;
};

// JSON-LD para Google Rich Results / Schema.org.
// Tipo TouristTrip + Offer pra preço base. Renderizado no head pra
// search engines pegarem.
export default function TourJsonLd({
  name,
  description,
  imageUrl,
  priceCents,
  durationMinutes,
  maxCapacity,
  url,
}: Props) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    image: imageUrl,
    url,
    touristType: 'Casais, famílias e grupos',
    itinerary: {
      '@type': 'Place',
      name: 'Armação dos Búzios',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Armação dos Búzios',
        addressRegion: 'RJ',
        addressCountry: 'BR',
      },
    },
    provider: {
      '@type': 'TravelAgency',
      '@id': `${SITE_URL}/#business`,
      name: 'Nautitour Passeios',
      url: SITE_URL,
    },
  };

  if (priceCents != null) {
    data.offers = {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: (priceCents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      url,
    };
  }

  if (durationMinutes != null) {
    // ISO 8601 duration (PT2H30M etc)
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    data.duration = `PT${hours > 0 ? `${hours}H` : ''}${mins > 0 ? `${mins}M` : ''}`;
  }

  if (maxCapacity != null) {
    data.maximumAttendeeCapacity = maxCapacity;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
