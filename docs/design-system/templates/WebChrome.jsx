// Shared web page chrome: top navigation and footer for the marketing site.
// All pages are framed at 1280px width inside design canvas artboards.

function NTWebNav({ active = 'passeios' }) {
  const items = [
    { id: 'passeios', label: 'Passeios' },
    { id: 'lancha',   label: 'Lancha privativa' },
    { id: 'como',     label: 'Como funciona' },
    { id: 'sobre',    label: 'Sobre' },
    { id: 'contato',  label: 'Contato' },
  ];
  return (
    <header style={{
      height: 88, background: '#fff', display: 'flex', alignItems: 'center',
      padding: '0 32px', gap: 40, borderBottom: '1px solid rgba(64,64,64,0.08)',
    }}>
      <img src={NT_LOGO_FULL} alt="Nautitour" style={{ height: 60, display: 'block' }}/>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 32, flex: 1 }}>
        {items.map(it => (
          <li key={it.id}>
            <a href="#" style={{
              color: active === it.id ? 'var(--charcoal-700)' : 'var(--charcoal-500)',
              fontWeight: active === it.id ? 600 : 500, fontSize: 14,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
            }}>{it.label}</a>
          </li>
        ))}
      </ul>
      <span style={{ color: 'var(--charcoal-400)', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
        <strong style={{ color: 'var(--charcoal-700)', fontWeight: 600 }}>PT</strong> · EN · ES
      </span>
      <a href="#" style={{
        background: 'var(--red-600)', color: '#fff', padding: '10px 20px',
        borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
        fontFamily: 'var(--font-body)',
      }}>Reservar</a>
    </header>
  );
}

function NTWebFooter() {
  return (
    <footer style={{
      background: 'var(--charcoal-700)', color: 'rgba(255,255,255,0.78)',
      fontFamily: 'var(--font-body)', padding: '48px 48px 24px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 40, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div>
          <img src={NT_LOGO_WHITE} alt="Nautitour" style={{ height: 40, marginBottom: 16 }}/>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0, color: 'rgba(255,255,255,0.65)' }}>
            Passeios náuticos em Búzios desde 2008.<br/>
            Saídas diárias do Píer Centro.
          </p>
        </div>
        <div>
          <h4 style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: '#fff', margin: '0 0 14px', fontWeight: 700 }}>Contato</h4>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'rgba(255,255,255,0.7)' }}>
            Píer Centro · Búzios/RJ<br/>
            (22) 99876-5432<br/>
            ola@nautitour.com.br
          </p>
        </div>
        <div>
          <h4 style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: '#fff', margin: '0 0 14px', fontWeight: 700 }}>Horário</h4>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'rgba(255,255,255,0.7)' }}>
            Loja: 8h–20h diariamente<br/>
            Saídas: 9h e 14h<br/>
            Pôr-do-sol: 16h30
          </p>
        </div>
        <div>
          <h4 style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: '#fff', margin: '0 0 14px', fontWeight: 700 }}>Siga</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['IG', 'FB', 'TA'].map(s => (
              <span key={s} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.10)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{s}</span>
            ))}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: '#0E1E2A', color: '#FFC700', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900 }}>★</span>
            CADASTUR · 12.345.678
          </div>
        </div>
      </div>
      <div style={{ paddingTop: 18, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>
        <span>© 2026 Nautitour Passeios. Todos os direitos reservados.</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <a href="#" style={{ color: 'inherit' }}>Privacidade</a>
          <a href="#" style={{ color: 'inherit' }}>Termos</a>
          <a href="#" style={{ color: 'inherit' }}>Cookies</a>
        </span>
      </div>
    </footer>
  );
}

// Page wrapper — fixed-width 1280, scrollable artboard with white bg
function NTPage({ children, height = 1800 }) {
  return (
    <div style={{
      width: 1280, height,
      background: '#fff', overflow: 'hidden',
      fontFamily: 'var(--font-body)', color: 'var(--charcoal-700)',
      borderRadius: 16,
    }}>
      {children}
    </div>
  );
}

// Eyebrow / kicker label (red, uppercase)
function NTEyebrow({ children, style }) {
  return (
    <div style={{
      fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase',
      fontWeight: 700, color: 'var(--red-600)', marginBottom: 12, ...style,
    }}>{children}</div>
  );
}

// Section heading — Fraunces
function NTH2({ children, style }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)', fontWeight: 600,
      fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em',
      color: 'var(--charcoal-700)', margin: 0, textWrap: 'balance', ...style,
    }}>{children}</h2>
  );
}

// Body lead
function NTLead({ children, style }) {
  return (
    <p style={{
      fontSize: 18, lineHeight: 1.55, color: 'var(--charcoal-500)',
      margin: 0, textWrap: 'pretty', ...style,
    }}>{children}</p>
  );
}

// Stat block (vertical pair: number + label)
function NTStat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 600, lineHeight: 1, color: 'var(--charcoal-700)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--charcoal-400)', marginTop: 8 }}>{label}</div>
    </div>
  );
}

// Inline button
function NTButton({ children, kind = 'primary', size = 'md', style, ...rest }) {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 22px', fontSize: 14 },
    lg: { padding: '16px 28px', fontSize: 15 },
  };
  const kinds = {
    primary: { background: 'var(--red-600)', color: '#fff', border: 0 },
    secondary: { background: 'var(--charcoal-700)', color: '#fff', border: 0 },
    ghost: { background: 'transparent', color: 'var(--charcoal-700)', border: '1px solid var(--charcoal-200)' },
    white: { background: '#fff', color: 'var(--charcoal-700)', border: 0 },
  };
  return (
    <button style={{
      ...sizes[size], ...kinds[kind],
      borderRadius: 8, fontFamily: 'var(--font-body)', fontWeight: 700,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
      ...style,
    }} {...rest}>{children}</button>
  );
}

Object.assign(window, { NTWebNav, NTWebFooter, NTPage, NTEyebrow, NTH2, NTLead, NTStat, NTButton });
