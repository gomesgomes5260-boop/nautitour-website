// Three template scenes mirroring WoodNest, recolored for Nautitour.
// Each is a self-contained React component used inside design canvas artboards.

// =============================================================================
// TEMPLATE 1: Featured Tours mobile + "Manhã Perfeita" hero + Booking card
// (3-up grid: phone left, hero top-right, booking card bottom-right)
// =============================================================================

function TemplateOne() {
  const W = 1180, H = 820;
  return (
    <div style={{
      width: W, height: H, position: 'relative',
      background: `linear-gradient(180deg, #B5CDD9 0%, #7FA4B8 60%, #4A6E82 100%)`,
      borderRadius: 24, overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      {/* atmospheric photo overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${NT_PHOTOS.buziosBay})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.55, mixBlendMode: 'multiply',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(181,205,217,0.20), rgba(74,110,130,0.50))',
      }}/>

      {/* layout grid */}
      <div style={{ position: 'relative', height: '100%', display: 'grid',
                    gridTemplateColumns: '1fr 1.2fr', gridTemplateRows: '1fr 1fr',
                    gap: 24, padding: 24 }}>
        {/* left phone (spans both rows) */}
        <div style={{ gridRow: '1 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NTPhone scale={0.92}>
            <NTMobileScreen bg={NT_PHOTOS.schoonerSunrise}>
              <NTAppHeader/>
              <div style={{ padding: '4px 22px 18px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600,
                             fontSize: 38, lineHeight: 1.0, margin: '6px 0 4px' }}>
                  Passeios<br/>em Destaque
                </h1>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)',
                              fontFamily: 'var(--font-body)', letterSpacing: '.04em',
                              textTransform: 'uppercase', marginBottom: 4 }}>
                  Featured Tours
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  Os mais reservados desta semana
                </div>
              </div>
              <div style={{ padding: '0 16px' }}>
                <NTTourCard
                  title="Escuna 12 Praias"
                  en="12-Beach Schooner Tour"
                  price="R$60" priceEn="$12" unit="/pessoa"
                  taxes="+R$8 taxas" cta="Reservar · Reserve"
                  bg={NT_PHOTOS.schoonerSunrise}
                />
              </div>
              <div style={{ padding: '12px 16px 0', opacity: 0.85 }}>
                <div style={{ height: 96, borderRadius: 18, overflow:'hidden',
                              backgroundImage: `url(${NT_PHOTOS.speedboatBlue})`,
                              backgroundSize:'cover', backgroundPosition:'center' }}/>
              </div>
            </NTMobileScreen>
          </NTPhone>
        </div>

        {/* hero top-right */}
        <NTGlass tone="light" style={{ padding: '32px 36px', display:'flex',
                  flexDirection:'column', justifyContent:'space-between', minHeight: 0 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <NTRating score="4.9" subtitle={<>de 2.300+ avaliações<br/><span style={{opacity:0.6}}>from 2,300+ reviews</span></>} tone="light"/>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600,
                         fontSize: 76, lineHeight: 0.95, color: '#fff', margin: 0 }}>
              Manhã <span style={{ color: 'rgba(255,255,255,0.45)' }}>Perfeita</span><br/>
              em <span style={{ color: 'rgba(255,255,255,0.45)' }}>Búzios</span>
            </h2>
            <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)',
                          fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
              Perfect Mornings in Búzios
            </div>
          </div>
        </NTGlass>

        {/* booking card bottom-right */}
        <NTBookingCard
          name="Lancha Família — Tartaruga"
          en="Family Speedboat — Tartaruga Cove"
          price="R$1.200" priceEn="$240" priceUnit="/dia · /day"
          dateOut="Sáb · 15 Fev" dateBack="Sáb · 15 Fev"
          checkIn="A partir 09h" checkOut="Retorno 17h"
          guests="2–8 pessoas"
          style={{ alignSelf: 'end' }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// TEMPLATE 2: Triple-phone composition
// =============================================================================

function TemplateTwo() {
  const W = 1180, H = 820;
  return (
    <div style={{
      width: W, height: H, position: 'relative', borderRadius: 24, overflow: 'hidden',
      backgroundImage: `linear-gradient(180deg, rgba(74,110,130,0.55), rgba(31,31,31,0.78)), url(${NT_PHOTOS.beachAerial})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      {/* faint pattern overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.10,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '36px 36px' }}/>

      <div style={{ position: 'relative', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 28, padding: 36 }}>
        {/* Left phone — Featured Tours, slightly recessed */}
        <div style={{ transform: 'translateY(40px)' }}>
          <NTPhone scale={0.78}>
            <NTMobileScreen bg={NT_PHOTOS.schoonerSunrise}>
              <NTAppHeader/>
              <div style={{ padding: '4px 22px 18px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36,
                             fontWeight: 600, lineHeight: 1, margin: '6px 0 4px' }}>
                  Passeios<br/>em Destaque
                </h1>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)',
                              letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Featured Tours
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  Mais amados desta semana
                </div>
              </div>
              <div style={{ padding: '0 16px' }}>
                <NTTourCard
                  title="Escuna 12 Praias"
                  en="12-Beach Schooner"
                  price="R$60" priceEn="$12" unit="/pessoa"
                  taxes="+R$8 taxas"
                  bg={NT_PHOTOS.schoonerSunrise}
                />
              </div>
            </NTMobileScreen>
          </NTPhone>
        </div>

        {/* Center phone — Headline */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <NTPhone scale={0.86}>
            <NTMobileScreen bg={NT_PHOTOS.morningHero}>
              <NTAppHeader/>
              <div style={{ padding: '12px 22px 16px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600,
                             fontSize: 50, lineHeight: 0.95, margin: '4px 0' }}>
                  12 praias.<br/>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>3 ilhas.</span><br/>
                  Um dia<br/>inesquecível.
                </h1>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)',
                              letterSpacing: '.04em', textTransform: 'uppercase',
                              marginTop: 10, fontFamily: 'var(--font-body)' }}>
                  12 beaches · 3 islands · one unforgettable day
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)',
                            lineHeight: 1.45, marginTop: 16, marginBottom: 20 }}>
                  Saia do cais às 9h, volte com história pra contar.
                  Lanchas privativas, escunas e pôr-do-sol — tudo a um clique.
                </p>
                <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ color: 'var(--red-600)', display:'inline-flex' }}><NTIcon name="star" size={20}/></span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 700 }}>4.9</span>
                  <span style={{ fontSize: 12, color:'rgba(255,255,255,0.7)' }}>de 2.300+ avaliações</span>
                </div>
                <NTReserveBtn>Reservar agora · Book Now</NTReserveBtn>
              </div>
            </NTMobileScreen>
          </NTPhone>
        </div>

        {/* Right phone — Reserve confirmation */}
        <div style={{ transform: 'translateY(40px)' }}>
          <NTPhone scale={0.78}>
            <NTMobileScreen bg={NT_PHOTOS.schoonerDeck}>
              <NTAppHeader/>
              <div style={{ padding: '4px 22px 18px' }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize: 36,
                             fontWeight: 600, lineHeight: 1, margin:'6px 0 4px' }}>
                  Reserve<br/>seu Passeio
                </h1>
                <div style={{ fontSize: 11, color:'rgba(255,255,255,0.65)',
                              letterSpacing:'.04em', textTransform:'uppercase' }}>
                  Reserve Your Tour
                </div>
              </div>
              <div style={{ padding: '0 16px' }}>
                <div style={{ height: 130, borderRadius: 18, overflow:'hidden', marginBottom: 14,
                              backgroundImage:`url(${NT_PHOTOS.speedboatBlue})`,
                              backgroundSize:'cover', backgroundPosition:'center' }}/>
                <NTBookingCard
                  name="Lancha Família"
                  en="Family Speedboat"
                  price="R$1.200" priceEn="$240" priceUnit="/dia"
                  dateOut="Sáb 15 Fev" dateBack="Sáb 15 Fev"
                  checkIn="09h" checkOut="17h"
                  guests="2–8 pessoas"
                  style={{ minWidth: 0 }}
                />
              </div>
            </NTMobileScreen>
          </NTPhone>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TEMPLATE 3: Web hero — "12 praias. 3 ilhas. Um dia inesquecível."
// =============================================================================

function TemplateThree() {
  const W = 1280, H = 820;
  return (
    <div style={{
      width: W, height: H, position: 'relative', borderRadius: 24, overflow: 'hidden',
      backgroundImage: `linear-gradient(180deg, rgba(181,205,217,0.30), rgba(31,31,31,0.55)), url(${NT_PHOTOS.morningHero})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: 'var(--font-body)', color: '#fff',
    }}>
      <NTGlass tone="light" style={{ position: 'absolute', inset: 24, padding: '32px 48px',
                display:'flex', flexDirection:'column' }}>
        {/* nav */}
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <NTLogo tone="white" size={24} label={false}/>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '.06em' }}>
              NAUTI<span style={{ color: 'var(--red-300)' }}>TOUR</span>
            </span>
          </div>
          <nav style={{ display:'flex', gap: 32, alignItems:'center', fontSize: 13, fontWeight: 600 }}>
            <a style={{ color:'rgba(255,255,255,0.85)', textDecoration:'none' }}>Passeios <span style={{opacity:0.5}}>· Tours</span></a>
            <a style={{ color:'rgba(255,255,255,0.85)', textDecoration:'none' }}>Lanchas <span style={{opacity:0.5}}>· Boats</span></a>
            <a style={{ color:'rgba(255,255,255,0.85)', textDecoration:'none' }}>Experiências <span style={{opacity:0.5}}>· Experiences</span></a>
            <a style={{ color:'rgba(255,255,255,0.85)', textDecoration:'none' }}>Contato</a>
            <NTReserveBtn full={false} style={{ padding: '10px 20px', fontSize: 13 }}>Reservar · Book</NTReserveBtn>
          </nav>
        </header>

        {/* hero copy + booking card */}
        <div style={{ flex: 1, display:'grid', gridTemplateColumns: '1.4fr 1fr', alignItems: 'center', gap: 40, marginTop: 16 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight: 600,
                         fontSize: 108, lineHeight: 0.92, margin: 0,
                         letterSpacing: '-0.02em' }}>
              12 praias.<br/>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>3 ilhas.</span><br/>
              Um dia<br/>inesquecível.
            </h1>
            <div style={{ marginTop: 12, fontSize: 16, color: 'rgba(255,255,255,0.72)',
                          fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
              12 beaches. 3 islands. One unforgettable day.
            </div>
            <div style={{ display:'flex', gap: 32, marginTop: 32, alignItems:'flex-end' }}>
              <p style={{ maxWidth: 320, fontSize: 13, lineHeight: 1.55,
                          color: 'rgba(255,255,255,0.78)', margin: 0 }}>
                Saia do cais às 9h, volte com história pra contar.
                Escunas, lanchas privativas e o pôr-do-sol mais bem avaliado de Búzios — tudo a um clique.
                <br/><br/>
                <span style={{ opacity: 0.6, fontSize: 12 }}>
                  Leave the dock at 9am, come back with stories. Schooners, private speedboats,
                  and the highest-rated sunset in Búzios — one click away.
                </span>
              </p>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{ color: 'var(--red-600)', display:'inline-flex' }}><NTIcon name="star" size={22}/></span>
                <span style={{ fontFamily:'var(--font-display)', fontSize: 38, fontWeight: 700, lineHeight: 1 }}>4.9</span>
                <span style={{ fontSize: 12, color:'rgba(255,255,255,0.7)', maxWidth: 110, lineHeight:1.3 }}>
                  de 2.300+<br/>avaliações
                </span>
              </div>
            </div>
          </div>

          <NTBookingCard
            name="Lancha Família — Tartaruga"
            en="Family Speedboat — Tartaruga"
            price="R$1.200" priceEn="$240" priceUnit="/dia · /day"
            dateOut="Sáb · 15 Fev" dateBack="Sáb · 15 Fev"
            checkIn="A partir 09h" checkOut="Retorno 17h"
            guests="2–8 pessoas"
          />
        </div>
      </NTGlass>
    </div>
  );
}

// =============================================================================
// VARIATION A: Instagram square post
// =============================================================================

function InstagramPost() {
  const S = 720;
  return (
    <div style={{ width: S, height: S, borderRadius: 18, overflow:'hidden', position:'relative',
                  fontFamily:'var(--font-body)', color:'#fff',
                  backgroundImage: `linear-gradient(180deg, rgba(74,110,130,0.20) 0%, rgba(31,31,31,0.78) 100%), url(${NT_PHOTOS.morningHero})`,
                  backgroundSize:'cover', backgroundPosition:'center' }}>
      <div style={{ position:'absolute', top: 24, left: 24, display:'flex', alignItems:'center', gap: 10 }}>
        <NTLogo tone="white" size={24} label={false}/>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '.06em' }}>
          NAUTI<span style={{ color: 'var(--red-300)' }}>TOUR</span>
        </span>
      </div>

      <div style={{ position:'absolute', top: 24, right: 24,
                    background: 'var(--red-600)', color:'#fff', borderRadius: 999,
                    padding: '6px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '.06em' }}>
        DESTAQUE · FEATURED
      </div>

      <div style={{ position:'absolute', bottom: 28, left: 28, right: 28 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontWeight: 600,
                     fontSize: 64, lineHeight: 0.92, margin: 0 }}>
          12 praias.<br/>
          <span style={{ color:'rgba(255,255,255,0.5)' }}>3 ilhas.</span><br/>
          Um dia<br/>inesquecível.
        </h2>
        <div style={{ fontSize: 12, color:'rgba(255,255,255,0.65)', marginTop: 10,
                      fontStyle: 'italic', fontFamily:'var(--font-display)' }}>
          12 beaches · 3 islands · one unforgettable day
        </div>
        <div style={{ marginTop: 24, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <span style={{ color:'var(--red-400)', display:'inline-flex' }}><NTIcon name="star" size={18}/></span>
            <span style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 700 }}>4.9</span>
            <span style={{ fontSize: 11, color:'rgba(255,255,255,0.6)' }}>· 2.300+ reviews</span>
          </div>
          <NTReserveBtn full={false} style={{ padding: '12px 22px', fontSize: 13 }}>
            Reservar · Book Now
          </NTReserveBtn>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VARIATION B: Instagram Story (9:16)
// =============================================================================

function InstagramStory() {
  const W = 540, H = 960;
  return (
    <div style={{ width: W, height: H, borderRadius: 18, overflow:'hidden', position:'relative',
                  fontFamily:'var(--font-body)', color:'#fff',
                  backgroundImage: `linear-gradient(180deg, rgba(74,110,130,0.10) 0%, rgba(31,31,31,0.85) 100%), url(${NT_PHOTOS.schoonerSunrise})`,
                  backgroundSize:'cover', backgroundPosition:'center' }}>
      {/* progress bars */}
      <div style={{ position:'absolute', top: 14, left: 14, right: 14, display:'flex', gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999,
                  background: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}/>
        ))}
      </div>
      <div style={{ position:'absolute', top: 30, left: 18, display:'flex', alignItems:'center', gap: 8 }}>
        <NTLogo tone="white" size={22} label={false}/>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '.06em' }}>
          NAUTI<span style={{ color: 'var(--red-300)' }}>TOUR</span>
        </span>
        <span style={{ fontSize: 11, color:'rgba(255,255,255,0.6)', marginLeft: 6 }}>· agora</span>
      </div>

      <div style={{ position:'absolute', top: '38%', left: 24, right: 24 }}>
        <div style={{ fontSize: 13, color:'var(--red-300)', fontWeight: 800,
                      letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 12 }}>
          Domingo · Sunday
        </div>
        <h2 style={{ fontFamily:'var(--font-display)', fontWeight: 600,
                     fontSize: 72, lineHeight: 0.92, margin: 0 }}>
          12 praias.<br/>
          <span style={{ color:'rgba(255,255,255,0.5)' }}>3 ilhas.</span><br/>
          Um dia<br/>inesquecível.
        </h2>
      </div>

      <div style={{ position:'absolute', bottom: 64, left: 24, right: 24 }}>
        <NTGlass tone="dark" style={{ padding: '14px 18px', display:'flex',
                  alignItems:'center', justifyContent:'space-between', borderRadius: 999 }}>
          <div>
            <div style={{ fontSize: 11, color:'rgba(255,255,255,0.6)' }}>A partir de</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
              R$60 <span style={{ fontSize: 11, color:'rgba(255,255,255,0.55)', fontWeight: 400 }}>/pessoa</span>
            </div>
          </div>
          <NTReserveBtn full={false} style={{ padding:'10px 20px', fontSize: 12 }}>
            Arraste pra reservar
          </NTReserveBtn>
        </NTGlass>
      </div>
    </div>
  );
}

// =============================================================================
// VARIATION C: Checkout / Confirmation screen
// =============================================================================

function CheckoutScreen() {
  return (
    <NTPhone scale={1}>
      <NTMobileScreen bg={NT_PHOTOS.islandView}>
        <NTAppHeader rightLabel="3 de 3"/>
        <div style={{ padding: '4px 22px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 999,
                          background: 'var(--red-600)', display:'grid', placeItems:'center', color:'#fff' }}>
              <NTIcon name="mark" size={16}/>
            </span>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
                Quase lá!
              </div>
              <div style={{ fontSize: 11, color:'rgba(255,255,255,0.6)' }}>Almost there · Checkout</div>
            </div>
          </div>

          <NTGlass tone="dark" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display:'flex', gap: 12, alignItems:'center', marginBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                            backgroundImage:`url(${NT_PHOTOS.schoonerSunrise})`,
                            backgroundSize:'cover', backgroundPosition:'center' }}/>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
                  Escuna 12 Praias
                </div>
                <div style={{ fontSize: 11, color:'rgba(255,255,255,0.6)' }}>
                  Sáb · 15 Fev · 09h–17h
                </div>
                <div style={{ fontSize: 11, color:'rgba(255,255,255,0.6)' }}>
                  4 adultos · 2 crianças
                </div>
              </div>
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.10)', paddingTop: 10,
                          display:'grid', gap: 6, fontSize: 12 }}>
              <Row label="6 ingressos" value="R$360,00"/>
              <Row label="Taxa serviço · Service" value="R$48,00"/>
              <Row label="Total" value="R$408,00" bold/>
            </div>
          </NTGlass>

          <div style={{ fontSize: 12, color:'rgba(255,255,255,0.85)', marginBottom: 10, fontWeight: 700 }}>
            Pagamento · Payment
          </div>
          <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <PayOption icon="pix" label="Pix" sub="5% off" selected/>
            <PayOption icon="card" label="Cartão" sub="até 6x"/>
          </div>

          <NTReserveBtn>Confirmar reserva · Confirm</NTReserveBtn>
          <div style={{ textAlign:'center', fontSize: 10, color:'rgba(255,255,255,0.5)', marginTop: 10 }}>
            Cancelamento grátis até 24h antes · Free cancellation up to 24h before
          </div>
        </div>
      </NTMobileScreen>
    </NTPhone>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between',
                  fontWeight: bold ? 800 : 500,
                  color: bold ? '#fff' : 'rgba(255,255,255,0.78)',
                  fontSize: bold ? 14 : 12 }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function PayOption({ icon, label, sub, selected }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 14,
      background: selected ? 'rgba(192,0,16,0.18)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${selected ? 'var(--red-600)' : 'rgba(255,255,255,0.12)'}`,
      color: '#fff', display:'flex', alignItems:'center', gap: 10,
    }}>
      <span style={{ color: selected ? 'var(--red-400)' : 'rgba(255,255,255,0.7)' }}>
        <NTIcon name={icon} size={18}/>
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 10, color:'rgba(255,255,255,0.6)' }}>{sub}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TemplateOne, TemplateTwo, TemplateThree, InstagramPost, InstagramStory, CheckoutScreen });
