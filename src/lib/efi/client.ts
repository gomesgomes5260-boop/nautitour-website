import 'server-only';
import https from 'https';

/**
 * EFÍ Bank PIX API — usado APENAS para PIX de saída (payout de comissão ao
 * vendedor) e devolução. Cobrança de clientes continua 100% Pagar.me.
 *
 * Env vars:
 *   EFI_CLIENT_ID       — OAuth2 client ID
 *   EFI_CLIENT_SECRET   — OAuth2 client secret
 *   EFI_PIX_KEY         — chave PIX da empresa (pagadora do payout)
 *   EFI_CERTIFICATE     — certificado .p12 em base64 (mTLS)
 *   EFI_SANDBOX         — 'true' pra homologação (default produção)
 *
 * Sem env vars, isEfiConfigured() = false e o payout fica 'pending' pra
 * retry manual — erro EFÍ nunca bloqueia o check-in.
 */

const SANDBOX = process.env.EFI_SANDBOX === 'true';
const BASE_URL = SANDBOX
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br';

// Cache de token em memória (limpa em cold start; ok em instância warm)
let _tokenCache: { token: string; expiresAt: number } | null = null;

function getCertBuffer(): Buffer {
  const b64 = process.env.EFI_CERTIFICATE;
  if (!b64) throw new Error('EFI_CERTIFICATE não configurado');
  return Buffer.from(b64, 'base64');
}

type HttpsResponse = { statusCode: number; data: unknown };

function efiRequest(
  path: string,
  method: string,
  body: object | null,
  extraHeaders: Record<string, string> = {}
): Promise<HttpsResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    };

    try {
      options.pfx = getCertBuffer();
      options.passphrase = '';
    } catch (e) {
      return reject(e);
    }

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode || 0, data: JSON.parse(raw) });
        } catch {
          resolve({ statusCode: res.statusCode || 0, data: raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('EFI_CLIENT_ID ou EFI_CLIENT_SECRET não configurado');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const { data, statusCode } = await efiRequest(
    '/oauth/token',
    'POST',
    { grant_type: 'client_credentials' },
    { Authorization: `Basic ${credentials}` }
  );

  const token = (data as { access_token?: string; expires_in?: number }) ?? {};
  if (statusCode >= 400 || !token.access_token) {
    throw new Error(`EFÍ auth error ${statusCode}: ${JSON.stringify(data)}`);
  }

  _tokenCache = {
    token: token.access_token,
    expiresAt: Date.now() + ((token.expires_in ?? 3600) - 60) * 1000,
  };

  return token.access_token;
}

async function api(path: string, method: string, body?: object): Promise<HttpsResponse> {
  const token = await getToken();
  return efiRequest(path, method, body ?? null, { Authorization: `Bearer ${token}` });
}

// ─── Helpers públicos ───────────────────────────────────────────────────────

/**
 * Envia PIX pra chave externa (comissão do vendedor). Exige o escopo
 * "pix.send" (Pix Saída) habilitado na conta EFÍ.
 *
 * API: PUT /v2/gn/pix/:idEnvio — pagador = chave da empresa (EFI_PIX_KEY),
 * favorecido = chave do vendedor.
 */
export async function sendPixOut(params: {
  pixKey: string;
  amountCents: number;
  idEnvio: string;
}): Promise<{ e2eId: string }> {
  const companyKey = process.env.EFI_PIX_KEY;
  if (!companyKey) throw new Error('EFI_PIX_KEY não configurado');

  const body = {
    valor: (params.amountCents / 100).toFixed(2),
    pagador: { chave: companyKey },
    favorecido: { chave: params.pixKey },
  };

  const { data, statusCode } = await api(
    `/v2/gn/pix/${encodeURIComponent(params.idEnvio)}`,
    'PUT',
    body
  );
  const res = (data as { e2eId?: string; endToEndId?: string }) ?? {};
  const e2eId = res.e2eId ?? res.endToEndId;
  if (statusCode >= 400 || !e2eId) {
    throw new Error(`Erro ao enviar PIX (${statusCode}): ${JSON.stringify(data)}`);
  }
  return { e2eId };
}

/**
 * Devolução total/parcial de um PIX recebido.
 * (Sem uso no V1 — cobrança é Pagar.me — mas mantido pro V2 de cobrança EFÍ.)
 */
export async function refundPix(
  e2eId: string,
  refundId: string,
  amountCents: number
): Promise<void> {
  const { data, statusCode } = await api(
    `/v2/pix/${encodeURIComponent(e2eId)}/devolucao/${encodeURIComponent(refundId)}`,
    'PUT',
    { valor: (amountCents / 100).toFixed(2) }
  );
  if (statusCode >= 400) {
    throw new Error(`Erro ao estornar PIX (${statusCode}): ${JSON.stringify(data)}`);
  }
}

/** idEnvio válido pra EFÍ: alfanumérico, até 35 chars, único por envio. */
export function generateIdEnvio(bookingCode: string): string {
  const clean = bookingCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `COM${clean}${ts}`.replace(/[^A-Z0-9]/g, '').substring(0, 35);
}

/** true quando todas as env vars necessárias estão presentes. */
export function isEfiConfigured(): boolean {
  return !!(
    process.env.EFI_CLIENT_ID &&
    process.env.EFI_CLIENT_SECRET &&
    process.env.EFI_PIX_KEY &&
    process.env.EFI_CERTIFICATE
  );
}
