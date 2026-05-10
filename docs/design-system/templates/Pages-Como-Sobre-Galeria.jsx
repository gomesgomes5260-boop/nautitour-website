// Pages: Como Funciona + Sobre/História + Galeria

function ComoFuncionaPage() {
  const steps = [
    { n: '01', t: 'Escolha o passeio', s: 'Tour das ilhas, pôr-do-sol, lancha privativa — tudo no site, sem precisar ligar.', photo: NT_PHOTOS.morningHero },
    { n: '02', t: 'Reserve em 2 minutos', s: 'Pix com 5% off, cartão em até 6x. Confirmação imediata no e-mail e WhatsApp.', photo: NT_PHOTOS.printedFolder },
    { n: '03', t: 'Chegue ao Píer Centro', s: 'Embarque 30 min antes da saída. Loja aberta, banheiros, equipe esperando.', photo: NT_PHOTOS.storeFront },
    { n: '04', t: 'Aproveite o dia', s: 'Snorkel, drinks, fotos, pôr-do-sol. A gente cuida de tudo a bordo.', photo: NT_PHOTOS.groupDeck },
    { n: '05', t: 'Volte com história', s: 'Fotos profissionais no WhatsApp em até 24h. Avalie o passeio, indique pra um amigo.', photo: NT_PHOTOS.euBuziosGroup },
  ];
  return (
    <NTPage height={2400}>
      <NTWebNav active="como"/>
      <section style={{ padding: '80px 64px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 720 }}>
          <NTEyebrow>Como funciona</NTEyebrow>
          <NTH2 style={{ fontSize: 72 }}>Do clique ao convés,<br/>sem fricção.</NTH2>
          <NTLead style={{ marginTop: 20, fontSize: 18, maxWidth: 560 }}>
            Cinco passos curtos. Nenhum deles envolve fila, papelada ou ligação telefônica — a não ser que você queira.
          </NTLead>
        </div>
      </section>
      <section style={{ padding: '0 64px 80px', background: '#fff' }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{
            display: 'grid', gridTemplateColumns: i % 2 === 0 ? '1fr 1.2fr' : '1.2fr 1fr',
            gap: 64, alignItems: 'center', padding: '48px 0',
            borderTop: i === 0 ? '1px solid var(--charcoal-100)' : 'none',
            borderBottom: '1px solid var(--charcoal-100)',
          }}>
            {i % 2 === 1 && (
              <div style={{ height: 360, borderRadius: 16, backgroundImage: `url(${s.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 600, color: 'var(--red-100)', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.n}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 40, lineHeight: 1.05, margin: '8px 0 16px', color: 'var(--charcoal-700)' }}>{s.t}</h3>
              <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--charcoal-500)', margin: 0, maxWidth: 460 }}>{s.s}</p>
            </div>
            {i % 2 === 0 && (
              <div style={{ height: 360, borderRadius: 16, backgroundImage: `url(${s.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
            )}
          </div>
        ))}
      </section>
      <section style={{ padding: '64px', background: 'var(--charcoal-50)', textAlign: 'center' }}>
        <NTH2 style={{ fontSize: 40, marginBottom: 24 }}>Pronto pra começar?</NTH2>
        <NTButton kind="primary" size="lg">Ver passeios disponíveis<NTIcon name="arrow" size={16}/></NTButton>
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

function SobrePage() {
  return (
    <NTPage height={2600}>
      <NTWebNav active="sobre"/>
      {/* Editorial hero */}
      <section style={{ padding: '96px 64px 64px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <NTEyebrow>Nossa história</NTEyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 88, lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0, color: 'var(--charcoal-700)' }}>
            Começou com<br/>uma escuna<br/><span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--red-600)' }}>e um sonho.</span>
          </h1>
          <NTLead style={{ marginTop: 28, fontSize: 18 }}>
            Em 2008, o capitão Marco saiu do Píer Centro pela primeira vez com 6 turistas, uma escuna alugada e a certeza de que Búzios merecia ser mostrada do mar.<br/><br/>
            18 anos depois, são 4 embarcações, 22 tripulantes e mais de 60 mil hóspedes que voltaram pra casa com história pra contar.
          </NTLead>
        </div>
        <div style={{ height: 580, borderRadius: 16, backgroundImage: `url(${NT_PHOTOS.captainWheel})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
      </section>

      {/* Stats band */}
      <section style={{ padding: '64px', background: 'var(--charcoal-50)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          <NTStat value="60k+" label="Hóspedes desde 2008"/>
          <NTStat value="4.9" label="Estrelas no TripAdvisor"/>
          <NTStat value="22" label="Tripulantes locais"/>
          <NTStat value="0" label="Incidentes reportados"/>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: '80px 64px', background: '#fff' }}>
        <div style={{ marginBottom: 48, maxWidth: 640 }}>
          <NTEyebrow>Marcos</NTEyebrow>
          <NTH2 style={{ fontSize: 48 }}>De uma escuna a uma frota.</NTH2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {[
            { y: '2008', t: 'Primeira escuna', s: 'Capitão Marco e 6 turistas saem do Píer Centro.' },
            { y: '2014', t: 'Segunda embarcação', s: 'Lancha rápida pra grupos pequenos e privativos.' },
            { y: '2019', t: 'Loja física', s: 'Atendimento na Rua das Pedras, equipe trilíngue.' },
            { y: '2024', t: 'Frota de 4', s: '2 escunas + 2 lanchas, 22 tripulantes locais.' },
          ].map(m => (
            <div key={m.y} style={{ borderTop: '2px solid var(--red-600)', paddingTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--red-600)' }}>{m.y}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, color: 'var(--charcoal-700)' }}>{m.t}</div>
              <p style={{ fontSize: 14, color: 'var(--charcoal-500)', marginTop: 8, lineHeight: 1.5 }}>{m.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Crew */}
      <section style={{ padding: '80px 64px', background: 'var(--charcoal-700)', color: '#fff' }}>
        <div style={{ marginBottom: 48, maxWidth: 640 }}>
          <div style={{ fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--red-300)', marginBottom: 12 }}>Equipe</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 56, lineHeight: 1.0, letterSpacing: '-0.02em', margin: 0 }}>
            22 buzianos. <span style={{ color: 'rgba(255,255,255,0.45)' }}>Um time só.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { name: 'Marco', role: 'Capitão fundador', photo: NT_PHOTOS.captainWheel },
            { name: 'Ana', role: 'Atendimento', photo: NT_PHOTOS.storeFront },
            { name: 'Tripulação', role: 'Bordo', photo: NT_PHOTOS.crewRopes },
            { name: 'Equipe a bordo', role: 'Hospitalidade', photo: NT_PHOTOS.barOnBoard },
          ].map(p => (
            <div key={p.name}>
              <div style={{ height: 280, borderRadius: 12, backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 14 }}/>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

function GaleriaPage() {
  const photos = [
    NT_PHOTOS.morningHero, NT_PHOTOS.couple, NT_PHOTOS.snorkelGroup, NT_PHOTOS.drinkView,
    NT_PHOTOS.jump, NT_PHOTOS.buziosBay, NT_PHOTOS.captainWheel, NT_PHOTOS.snorkelClose,
    NT_PHOTOS.groupDeck, NT_PHOTOS.islandFalesia, NT_PHOTOS.barOnBoard, NT_PHOTOS.beachAerial,
    NT_PHOTOS.family, NT_PHOTOS.trampolim, NT_PHOTOS.drinkStrawberry, NT_PHOTOS.modelView,
    NT_PHOTOS.schoonerSunrise, NT_PHOTOS.crewRopes, NT_PHOTOS.pierWide, NT_PHOTOS.euBuziosGroup,
    NT_PHOTOS.islandView, NT_PHOTOS.groupDeck2, NT_PHOTOS.schoonerDeck, NT_PHOTOS.islandAerial,
  ];
  const filters = ['Tudo', 'Ilhas', 'A bordo', 'Drinks', 'Tripulação', 'Aéreas'];
  return (
    <NTPage height={2400}>
      <NTWebNav active="passeios"/>
      <section style={{ padding: '64px 64px 32px', background: '#fff' }}>
        <NTEyebrow>Galeria</NTEyebrow>
        <NTH2 style={{ fontSize: 64 }}>2.347 dias inesquecíveis,<br/>em fotos.</NTH2>
        <p style={{ fontSize: 16, color: 'var(--charcoal-500)', marginTop: 16, maxWidth: 540 }}>
          Todas as fotos abaixo são de hóspedes reais, em passeios reais. Sem stock, sem retoque.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
          {filters.map((f, i) => (
            <button key={f} style={{
              padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              border: i === 0 ? 0 : '1px solid var(--charcoal-200)',
              background: i === 0 ? 'var(--charcoal-700)' : '#fff',
              color: i === 0 ? '#fff' : 'var(--charcoal-700)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>{f}</button>
          ))}
        </div>
      </section>
      <section style={{ padding: '32px 64px 64px', background: '#fff' }}>
        <div style={{ columnCount: 4, columnGap: 12 }}>
          {photos.map((p, i) => {
            const heights = [220, 320, 280, 360, 240, 300];
            const h = heights[i % heights.length];
            return (
              <div key={i} style={{
                marginBottom: 12, breakInside: 'avoid',
                height: h, borderRadius: 10, overflow: 'hidden',
                backgroundImage: `url(${p})`, backgroundSize: 'cover', backgroundPosition: 'center',
              }}/>
            );
          })}
        </div>
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

Object.assign(window, { ComoFuncionaPage, SobrePage, GaleriaPage });
