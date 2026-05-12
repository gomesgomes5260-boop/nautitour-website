// Scrub PII de eventos Sentry antes de enviar.
// Lista de keys redactadas + regex pra CPF/email/telefone em strings.
// Roda tanto em client quanto server — não usar `server-only`.

const SENSITIVE_KEY_REGEX =
  /^(email|phone|telefone|cpf|document|card|card_token|holder_name|number|cvv|password|token|secret|authorization|cookie)$/i;

const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_BR_REGEX = /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g;
const CARD_REGEX = /\b\d{13,19}\b/g;

function redactString(s: string): string {
  if (!s) return s;
  return s
    .replace(CPF_REGEX, '[CPF]')
    .replace(EMAIL_REGEX, '[EMAIL]')
    .replace(PHONE_BR_REGEX, '[PHONE]')
    .replace(CARD_REGEX, '[CARD]');
}

function deepScrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return value;
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => deepScrub(v, depth + 1));

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(k)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = deepScrub(v, depth + 1);
    }
  }
  return out;
}

export function scrubSentryEvent<T>(event: T): T {
  return deepScrub(event) as T;
}
