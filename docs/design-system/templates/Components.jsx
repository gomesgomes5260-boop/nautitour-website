// Shared components for Nautitour templates — mirroring WoodNest structure
// but recolored to charcoal+red, with Búzios morning photography.

const NT_LOGO_WHITE = '../assets/logo-white.png';
const NT_LOGO_FULL = '../assets/logo-fullcolor.png';

// Real Nautitour photos — curated from the company archive.
// Available pools (use directly via NT_PHOTOS.<key>):
const P = '../assets/photos';
const NT_PHOTOS = {
  // Heros / aerial — wide horizontal beauty
  morningHero:     `${P}/aerea/drone-joao-fernandes-01.jpg`,
  buziosBay:       `${P}/aerea/drone-tartaruga-01.jpg`,
  beachAerial:     `${P}/aerea/drone-praia-01.jpg`,
  islandAerial:    `${P}/aerea/drone-ilha-feia-01.jpg`,
  pierAerial:      `${P}/aerea/drone-pier-buzios-01.jpg`,
  // Schooner & boat
  schoonerSunrise: `${P}/escuna/escuna-pier-01.jpg`,
  schoonerDeck:    `${P}/escuna/rede-proa-01.jpg`,
  schoonerTransit: `${P}/escuna/escuna-transito-01.jpg`,
  schoonerMast:    `${P}/escuna/mastros-pier-01.jpg`,
  speedboatBlue:   `${P}/aerea/drone-tartaruga-01.jpg`, // until lancha photos arrive
  // Islands & snorkel
  islandView:      `${P}/ilhas/ilha-rochosa-01.jpg`,
  snorkelGroup:    `${P}/ilhas/grupo-snorkel-01.jpg`,
  snorkelClose:    `${P}/ilhas/snorkel-ilha-01.jpg`,
  islandFalesia:   `${P}/ilhas/ilha-falesia-01.jpg`,
  trampolim:       `${P}/ilhas/trampolim-01.jpg`,
  // People aboard
  couple:          `${P}/clientes/casal-proa-01.jpg`,
  family:          `${P}/clientes/familia-bordo-01.jpg`,
  groupDeck:       `${P}/clientes/clientes-deck-01.jpg`,
  groupDeck2:      `${P}/clientes/clientes-deck-02.jpg`,
  jump:            `${P}/clientes/pulo-bordo-01.jpg`,
  modelView:       `${P}/clientes/modelo-vista-01.jpg`,
  euBuziosGroup:   `${P}/clientes/grupo-eu-buzios-01.jpg`,
  // Drinks
  barOnBoard:      `${P}/drinks-bordo/bar-bordo-01.jpg`,
  drinkView:       `${P}/drinks-bordo/drink-vista-01.jpg`,
  drinkStrawberry: `${P}/drinks-bordo/morango-vodka-01.jpg`,
  // Crew
  captainWheel:    `${P}/equipe/capitao-leme-01.jpg`,
  crewRopes:       `${P}/equipe/tripulacao-cordas-01.jpg`,
  storeFront:      `${P}/equipe/atendimento-loja-01.jpg`,
  // Búzios context
  pierWide:        `${P}/buzios/porto-buzios-01.jpg`,
  pierDeparture:   `${P}/buzios/pier-saida-01.jpg`,
  euBuziosSign:    `${P}/buzios/eu-buzios-placa-01.jpg`,
  // Material
  cruiseView:      `${P}/misc/cruzeiro-vista-01.jpg`,
  printedFolder:   `${P}/misc/folder-roteiro-01.jpg`,
  buziosMap:       `${P}/misc/mapa-buzios-01.jpg`,
};

// ----- Tiny iconography (inline SVG, currentColor, 1.5px stroke) ---------------------------

function NTIcon({ name, size = 18, ...rest }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
                   stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest };
  switch (name) {
    case 'star':    return <svg {...common}><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L12 16.7 6.6 19.6l1.2-6.1L3.3 9.3l6.1-.7z" fill="currentColor" stroke="none"/></svg>;
    case 'menu':    return <svg {...common}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg>;
    case 'close':   return <svg {...common}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>;
    case 'edit':    return <svg {...common}><path d="M14 4l6 6L8 22H2v-6z"/></svg>;
    case 'cal':     return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>;
    case 'chev':    return <svg {...common}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'arrow':   return <svg {...common}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>;
    case 'mark':    return <svg {...common}><polyline points="5 12 10 17 19 8"/></svg>;
    case 'heart':   return <svg {...common}><path d="M12 21s-7-4.5-9.3-9C1.3 9 3 5 7 5c2 0 4 1.5 5 3 1-1.5 3-3 5-3 4 0 5.7 4 4.3 7-2.3 4.5-9.3 9-9.3 9z"/></svg>;
    case 'share':   return <svg {...common}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><line x1="8" y1="11" x2="16" y2="7"/><line x1="8" y1="13" x2="16" y2="17"/></svg>;
    case 'pin':     return <svg {...common}><path d="M12 22s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'pix':     return <svg {...common} viewBox="0 0 24 24"><path d="M5 12l4-4 3 3 3-3 4 4-4 4-3-3-3 3z" fill="currentColor" stroke="none"/></svg>;
    case 'card':    return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/></svg>;
    case 'plus':    return <svg {...common}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'minus':   return <svg {...common}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    default:        return null;
  }
}

// ----- Brand logo (real .ai-derived PNGs) ---------------------------------------------------

function NTLogo({ tone = 'white', size = 28, label = true }) {
  const src = tone === 'white' ? NT_LOGO_WHITE : NT_LOGO_FULL;
  if (label === false) {
    // Just the wheel+boat mark — crop the logo image to its mark portion
    return (
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: tone === 'white' ? 'rgba(255,255,255,0.18)' : 'var(--charcoal-50)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}>
        <span style={{ color: tone === 'white' ? '#fff' : 'var(--red-600)', fontWeight: 900, fontSize: size*0.5, fontFamily: 'var(--font-body)', letterSpacing: '.02em' }}>NT</span>
      </div>
    );
  }
  return <img src={src} alt="Nautitour" style={{ height: size, width: 'auto', display: 'block' }} />;
}

// ----- Glass card (subtle, per user's request: less blur than WoodNest) ---------------------

function NTGlass({ tone = 'light', children, style, ...rest }) {
  // tone: 'light' (white-tint, for use on photo) | 'dark' (charcoal-tint, for use anywhere)
  const styles = tone === 'light' ? {
    background: 'rgba(255, 255, 255, 0.14)',
    border: '1px solid rgba(255, 255, 255, 0.28)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
  } : {
    background: 'rgba(31, 31, 31, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(10px) saturate(140%)',
    WebkitBackdropFilter: 'blur(10px) saturate(140%)',
  };
  return (
    <div style={{ borderRadius: 22, ...styles, ...style }} {...rest}>
      {children}
    </div>
  );
}

// ----- iPhone bezel (simplified, framed in glass) -------------------------------------------

function NTPhone({ children, style, scale = 1, glass = true }) {
  const W = 320, H = 660;
  const inner = (
    <div style={{
      width: W, height: H, borderRadius: 44,
      background: '#000', padding: 6, position: 'relative',
      boxShadow: '0 30px 80px rgba(31,31,31,0.30), 0 8px 20px rgba(31,31,31,0.20)',
      transform: `scale(${scale})`, transformOrigin: 'top center',
    }}>
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 96, height: 28, background: '#000', borderRadius: 999, zIndex: 5,
      }}/>
      <div style={{
        width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden',
        position: 'relative', background: '#0E1E2A',
      }}>
        {children}
      </div>
    </div>
  );
  if (!glass) return <div style={style}>{inner}</div>;
  return (
    <NTGlass tone="light" style={{ padding: 14, ...style }}>
      {inner}
    </NTGlass>
  );
}

// ----- Status bar ---------------------------------------------------------------------------

function NTStatus({ tone = 'light' }) {
  const c = tone === 'light' ? '#fff' : '#000';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 26px 0', color: c, fontFamily: 'var(--font-body)',
      fontSize: 14, fontWeight: 700, zIndex: 4,
    }}>
      <span>9:41</span>
      <span style={{ display:'flex', gap: 5, alignItems: 'center', fontSize: 11 }}>
        <span>•••</span><span>􀙇</span><span style={{
          width: 22, height: 11, border: `1.2px solid ${c}`, borderRadius: 3, position: 'relative',
        }}>
          <span style={{ position: 'absolute', inset: 1, background: c, borderRadius: 1, width: '85%' }}/>
        </span>
      </span>
    </div>
  );
}

// ----- Reserve button (rounded, white pill on dark like template) --------------------------

function NTReserveBtn({ children = 'Reservar', style, full = true, ...rest }) {
  return (
    <button style={{
      width: full ? '100%' : undefined,
      background: '#fff', color: 'var(--charcoal-700)',
      border: 0, borderRadius: 999, padding: '14px 22px',
      fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14,
      letterSpacing: '.02em', cursor: 'pointer',
      transition: 'transform 120ms var(--ease-default), box-shadow 120ms',
      boxShadow: '0 1px 2px rgba(31,31,31,0.18)',
      ...style,
    }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
      {...rest}>
      {children}
    </button>
  );
}

// ----- Rating ------------------------------------------------------------------------------

function NTRating({ score = '4.9', subtitle = 'de 2.300+ avaliações', tone = 'light' }) {
  const c1 = tone === 'light' ? '#fff' : 'var(--charcoal-700)';
  const c2 = tone === 'light' ? 'rgba(255,255,255,0.78)' : 'var(--charcoal-400)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 10, color: c1, fontFamily: 'var(--font-body)' }}>
      <span style={{ color: 'var(--red-600)', display:'inline-flex' }}><NTIcon name="star" size={28}/></span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, fontWeight: 600 }}>{score}</span>
      <span style={{ fontSize: 13, color: c2, maxWidth: 110, lineHeight: 1.3 }}>{subtitle}</span>
    </div>
  );
}

// ----- Booking card (the dark glass card from template 1 + 3) ------------------------------

function NTBookingCard({ name = 'Lancha Privativa Família', en = 'Family Private Boat',
                       price = 'R$1.200', priceEn = '$240', priceUnit = '/dia',
                       dateOut = 'Sáb 15 fev', dateBack = 'Sáb 15 fev',
                       checkIn = 'A partir das 09h', checkOut = 'Retorno até 17h',
                       guests = '2–8 pessoas', style, ...rest }) {
  return (
    <NTGlass tone="dark" style={{ padding: 20, color: '#fff', minWidth: 320, ...style }} {...rest}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, lineHeight: 1.15 }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{en}</div>
        </div>
        <button style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          width: 32, height: 32, borderRadius: 999, display: 'grid', placeItems:'center',
          color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
        }}><NTIcon name="edit" size={14}/></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <NTPill icon="cal" label={dateOut} />
        <NTPill icon="cal" label={dateBack} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8, background: 'rgba(255,255,255,0.06)', padding: 10, borderRadius: 14, marginBottom: 14 }}>
        <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Saída · Departure</div><div style={{ fontWeight: 700, fontSize: 13 }}>{checkIn}</div></div>
        <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Retorno · Return</div><div style={{ fontWeight: 700, fontSize: 13 }}>{checkOut}</div></div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12 }}>
        <div>
          <span style={{ fontFamily:'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{price}</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}> {priceUnit}</span>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{priceEn} {priceUnit}</div>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{guests}</span>
      </div>

      <NTReserveBtn>Reservar · Reserve</NTReserveBtn>
    </NTGlass>
  );
}

function NTPill({ icon, label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 12, padding: '8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between',
      color: '#fff', fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)'}}><NTIcon name={icon} size={14}/></span>
        {label}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}><NTIcon name="chev" size={14}/></span>
    </div>
  );
}

// ----- Tour photo card (used inside featured-lodges screen) ---------------------------------

function NTTourCard({ title = 'Escuna 12 Praias', en = '12-Beach Schooner',
                    price = 'R$60', priceEn = '$12', unit = '/pessoa',
                    bg = NT_PHOTOS.schoonerSunrise, taxes = '+R$8 taxas', cta = 'Reservar' }) {
  return (
    <div style={{
      borderRadius: 22, overflow: 'hidden', background: '#0E1E2A',
      boxShadow: '0 20px 50px rgba(31,31,31,0.35)',
    }}>
      <div style={{
        height: 160, backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center',
      }}/>
      <div style={{ padding: 16, color: '#fff' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>{en}</div>
        <div style={{ display:'flex', alignItems:'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{price}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{unit}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{taxes}</span>
        </div>
        <NTReserveBtn>{cta}</NTReserveBtn>
      </div>
    </div>
  );
}

// ----- Mobile screen wrapper (full-bleed photo + content) -----------------------------------

function NTMobileScreen({ bg = NT_PHOTOS.morningHero, children, overlay = true }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      backgroundImage: `linear-gradient(180deg, rgba(14,30,42,0.10) 0%, rgba(14,30,42,0.55) 100%), url(${bg})`,
      backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff',
      fontFamily: 'var(--font-body)',
    }}>
      <NTStatus tone="light"/>
      <div style={{ paddingTop: 56 }}>{children}</div>
    </div>
  );
}

// ----- Phone top bar (logo + menu) ----------------------------------------------------------

function NTAppHeader({ rightLabel = '' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 22px 12px',
    }}>
      <NTLogo tone="white" size={20} label={false}/>
      <span style={{ marginRight: 'auto', marginLeft: 10, fontWeight: 800, fontSize: 14, letterSpacing: '.06em' }}>
        NAUTI<span style={{ color: 'var(--red-300)' }}>TOUR</span>
      </span>
      {rightLabel && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{rightLabel}</span>}
      <button style={{ background:'transparent', border:0, color:'#fff', padding: 0, cursor:'pointer' }}>
        <NTIcon name="menu" size={20}/>
      </button>
    </div>
  );
}

Object.assign(window, {
  NT_PHOTOS, NT_LOGO_WHITE, NT_LOGO_FULL,
  NTIcon, NTLogo, NTGlass, NTPhone, NTStatus, NTReserveBtn, NTRating,
  NTBookingCard, NTTourCard, NTMobileScreen, NTAppHeader, NTPill,
});
