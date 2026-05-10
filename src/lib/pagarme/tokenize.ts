/**
 * Client-side card tokenization for Pagar.me v5.
 *
 * The PAN, CVV and expiry are POSTed directly from the user's browser to
 * Pagar.me's `/tokens` endpoint using the public key. The token we receive
 * is then sent to our server in place of the raw card data — keeping the
 * PCI scope on Pagar.me's side, not ours.
 *
 * Read NEXT_PUBLIC_PAGARME_PUBLIC_KEY at call time (not module load) so this
 * works inside Server Components without crashing builds.
 */

export type TokenizeCardInput = {
  number: string; // raw digits, will be stripped
  holderName: string;
  expMonth: number; // 1..12
  expYear: number; // 4-digit year
  cvv: string;
};

export type CardTokenResult = {
  id: string;
  expiresAt: string;
  card: {
    brand: string;
    lastFour: string;
    firstSix: string;
    holderName: string;
    expMonth: number;
    expYear: number;
  };
};

export async function tokenizeCard(input: TokenizeCardInput): Promise<CardTokenResult> {
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('NEXT_PUBLIC_PAGARME_PUBLIC_KEY não está configurado');
  }

  const body = {
    type: 'card',
    card: {
      number: input.number.replace(/\D/g, ''),
      holder_name: input.holderName.trim(),
      exp_month: input.expMonth,
      exp_year: input.expYear,
      cvv: input.cvv.replace(/\D/g, ''),
    },
  };

  const res = await fetch(
    `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'message' in json && (json as { message?: string }).message) ||
      'Falha ao validar cartão';
    throw new Error(String(message));
  }

  const data = json as {
    id: string;
    expires_at: string;
    card: {
      brand: string;
      last_four_digits: string;
      first_six_digits: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
    };
  };

  return {
    id: data.id,
    expiresAt: data.expires_at,
    card: {
      brand: data.card.brand,
      lastFour: data.card.last_four_digits,
      firstSix: data.card.first_six_digits,
      holderName: data.card.holder_name,
      expMonth: data.card.exp_month,
      expYear: data.card.exp_year,
    },
  };
}
