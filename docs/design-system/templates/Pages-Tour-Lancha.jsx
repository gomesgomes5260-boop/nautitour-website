// Pages: Tour Detail (Tour das Ilhas) + Lancha Privativa
// Full responsive hi-fi mockups, 1280px wide.

// =============================================================================
// PAGE: Detalhe do passeio — "Tour das Ilhas" (escuna)
// =============================================================================

function TourDetailPage() {
  return (
    <NTPage height={3400}>
      <NTWebNav active="passeios"/>

      {/* Photo gallery hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gridTemplateRows: '300px 300px', gap: 4, padding: 4, background: '#fff' }}>
        <div style={{ gridRow: '1 / 3', backgroundImage: `url(${NT_PHOTOS.morningHero})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.92)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--charcoal-700)' }}>1 / 28</span>
        </div>
        <div style={{ backgroundImage: `url(${NT_PHOTOS.snorkelGroup})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
        <div style={{ backgroundImage: `url(${NT_PHOTOS.couple})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center', color: 'var(--charcoal-700)' }}><NTIcon name="heart" size={16}/></span>
        </div>
        <div style={{ backgroundImage: `url(${NT_PHOTOS.drinkView})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
        <div style={{ backgroundImage: `url(${NT_PHOTOS.jump})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <button style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(255,255,255,0.92)', border: 0, padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--charcoal-700)', cursor: 'pointer' }}>+ Ver todas as 28 fotos</button>
        </div>
      </div>

      {/* Header band */}
      <div style={{ padding: '40px 48px 0', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 48 }}>
        <div>
          <NTEyebrow>Passeio em Escuna · 7h</NTEyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 600, lineHeight: 1.0, letterSpacing: '-0.02em', margin: 0, color: 'var(--charcoal-700)' }}>
            Tour das Ilhas
          </h1>
          <p style={{ fontSize: 14, color: 'var(--charcoal-500)', margin: '8px 0 0', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            Three islands, twelve beaches, one perfect day.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 24, alignItems: 'center', fontSize: 14, color: 'var(--charcoal-500)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--red-600)', display: 'inline-flex' }}><NTIcon name="star" size={18}/></span>
              <strong style={{ color: 'var(--charcoal-700)', fontSize: 16 }}>4.9</strong>
              <span>(2.347 avaliações)</span>
            </span>
            <span style={{ width: 4, height: 4, background: 'var(--charcoal-300)', borderRadius: 999 }}/>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><NTIcon name="pin" size={16}/>Píer Centro, Búzios</span>
            <span style={{ width: 4, height: 4, background: 'var(--charcoal-300)', borderRadius: 999 }}/>
            <span>Saída 9h · retorno 16h</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'flex-start' }}>
          <NTButton kind="ghost" size="md"><NTIcon name="share" size={16}/>Compartilhar</NTButton>
          <NTButton kind="ghost" size="md"><NTIcon name="heart" size={16}/>Salvar</NTButton>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ padding: '48px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 48, alignItems: 'start' }}>
        {/* LEFT */}
        <div>
          {/* Highlights row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
            {[
              { v: '12', l: 'praias visitadas' },
              { v: '3', l: 'paradas pra mergulho' },
              { v: '7h', l: 'a bordo' },
              { v: 'open bar', l: 'no roteiro pôr-do-sol' },
            ].map(s => (
              <div key={s.l} style={{ padding: '20px 18px', borderRadius: 12, background: 'var(--charcoal-50)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--charcoal-700)', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: 'var(--charcoal-500)', marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Sobre o passeio */}
          <div style={{ marginBottom: 48 }}>
            <NTEyebrow>Sobre o passeio</NTEyebrow>
            <NTH2 style={{ fontSize: 36, marginBottom: 20 }}>O clássico de Búzios, do jeito mais relaxado.</NTH2>
            <NTLead style={{ fontSize: 17 }}>
              Em 7 horas a bordo da nossa escuna você visita as três ilhas mais bonitas da costa de Búzios — João Fernandes, Tartaruga e Feia — com paradas para mergulho, drinks gelados, almoço opcional e o famoso pôr-do-sol que rendeu nossas 2.300+ avaliações 5 estrelas.
            </NTLead>
          </div>

          {/* Roteiro / Timeline */}
          <div style={{ marginBottom: 48 }}>
            <NTEyebrow>Roteiro do dia</NTEyebrow>
            <NTH2 style={{ fontSize: 36, marginBottom: 24 }}>Hora a hora</NTH2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 28, top: 28, bottom: 28, width: 2, background: 'var(--charcoal-100)' }}/>
              {[
                { time: '09h00', title: 'Embarque no Píer Centro', body: 'Check-in com a equipe, distribuição de coletes e briefing de segurança.' },
                { time: '09h30', title: 'Saída e primeira parada — João Fernandes', body: 'A praia mais famosa de Búzios, ideal para snorkel nas pedras.', photo: NT_PHOTOS.snorkelGroup },
                { time: '11h30', title: 'Ilha Feia — mergulho profundo', body: 'Águas cristalinas, perfeitas pra ver peixes coloridos.', photo: NT_PHOTOS.snorkelClose },
                { time: '13h00', title: 'Almoço opcional na Tartaruga', body: 'Parada em quiosque parceiro com peixe na brasa (R$ 60–90/pessoa).' },
                { time: '15h00', title: 'Volta panorâmica pelas praias', body: 'Geribá, Ferradura, Azeda — vistas impagáveis da água.' },
                { time: '16h00', title: 'Retorno ao Píer Centro', body: 'Desembarque tranquilo, fotos do passeio enviadas por WhatsApp.' },
              ].map((step, i) => (
                <li key={i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '60px 1fr', gap: 20, marginBottom: 20, paddingLeft: 0 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 999, background: '#fff', border: '2px solid var(--charcoal-100)', display: 'grid', placeItems: 'center', color: 'var(--red-600)', fontWeight: 700, fontSize: 13, position: 'relative', zIndex: 1 }}>
                    {step.time}
                  </div>
                  <div style={{ paddingTop: 4, paddingBottom: 12, display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--charcoal-700)' }}>{step.title}</div>
                      <div style={{ fontSize: 14, color: 'var(--charcoal-500)', marginTop: 4, lineHeight: 1.5 }}>{step.body}</div>
                    </div>
                    {step.photo && (
                      <div style={{ width: 100, height: 70, borderRadius: 8, flexShrink: 0,
                        backgroundImage: `url(${step.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Mapa das paradas */}
          <div style={{ marginBottom: 48 }}>
            <NTEyebrow>Mapa das paradas</NTEyebrow>
            <NTH2 style={{ fontSize: 36, marginBottom: 20 }}>O percurso completo</NTH2>
            <div style={{ position: 'relative', height: 360, borderRadius: 16, overflow: 'hidden', backgroundImage: `url(${NT_PHOTOS.buziosMap})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {[
                { l: 30, t: 70, label: '1 · João Fernandes' },
                { l: 55, t: 50, label: '2 · Ilha Feia' },
                { l: 70, t: 30, label: '3 · Tartaruga' },
              ].map((p, i) => (
                <div key={i} style={{ position: 'absolute', left: `${p.l}%`, top: `${p.t}%`, transform: 'translate(-50%, -100%)' }}>
                  <div style={{ background: 'var(--red-600)', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(31,31,31,0.25)' }}>
                    {p.label}
                  </div>
                  <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid var(--red-600)', margin: '0 auto' }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Vídeo do passeio */}
          <div style={{ marginBottom: 48 }}>
            <NTEyebrow>Vídeo do passeio</NTEyebrow>
            <NTH2 style={{ fontSize: 36, marginBottom: 20 }}>Veja como é a bordo</NTH2>
            <div style={{ position: 'relative', height: 360, borderRadius: 16, overflow: 'hidden', backgroundImage: `linear-gradient(180deg, rgba(31,31,31,0.20), rgba(31,31,31,0.55)), url(${NT_PHOTOS.cruiseView})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 84, height: 84, borderRadius: 999, background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 30px rgba(31,31,31,0.30)' }}>
                <div style={{ width: 0, height: 0, borderLeft: '22px solid var(--red-600)', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', marginLeft: 6 }}/>
              </div>
              <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                Tour das Ilhas — vídeo de 2 min
              </div>
            </div>
          </div>

          {/* Incluído / não incluído */}
          <div style={{ marginBottom: 48 }}>
            <NTEyebrow>O que está incluído</NTEyebrow>
            <NTH2 style={{ fontSize: 36, marginBottom: 24 }}>Tudo no preço</NTH2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: 12 }}>Incluído</div>
                {['Passagem ida e volta', 'Equipamento de snorkel', 'Coletes salva-vidas', 'Tripulação certificada', 'Trilha sonora a bordo', 'Fotos profissionais via WhatsApp'].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--charcoal-100)', alignItems: 'center', fontSize: 14 }}>
                    <span style={{ color: 'var(--success)', display: 'inline-flex' }}><NTIcon name="mark" size={18}/></span>
                    {item}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal-400)', textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: 12 }}>Não incluído</div>
                {['Almoço (R$ 60–90/pessoa no quiosque)', 'Bebidas no bar de bordo', 'Toalhas de praia', 'Protetor solar'].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--charcoal-100)', alignItems: 'center', fontSize: 14, color: 'var(--charcoal-500)' }}>
                    <span style={{ color: 'var(--charcoal-300)', display: 'inline-flex' }}><NTIcon name="close" size={18}/></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Política de cancelamento */}
          <div>
            <NTEyebrow>Política de cancelamento</NTEyebrow>
            <NTH2 style={{ fontSize: 36, marginBottom: 20 }}>Reserve sem medo</NTH2>
            <div style={{ background: 'var(--charcoal-50)', padding: 24, borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>+24h</div>
                <div style={{ fontSize: 13, color: 'var(--charcoal-500)', marginTop: 6 }}>Cancelamento <strong style={{ color: 'var(--charcoal-700)' }}>grátis</strong> com reembolso integral em até 5 dias úteis.</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>12–24h</div>
                <div style={{ fontSize: 13, color: 'var(--charcoal-500)', marginTop: 6 }}>Reembolso de 50% ou crédito integral pra outra data.</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--charcoal-400)' }}>Mau tempo</div>
                <div style={{ fontSize: 13, color: 'var(--charcoal-500)', marginTop: 6 }}>Se cancelarmos por condições do mar, você escolhe: reembolso integral ou outra data.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — sticky booking card */}
        <aside style={{ position: 'sticky', top: 32 }}>
          <div style={{ background: '#fff', border: '1px solid var(--charcoal-100)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-2)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--charcoal-700)' }}>R$ 280</span>
                <span style={{ fontSize: 14, color: 'var(--charcoal-400)', marginLeft: 6 }}>/pessoa</span>
              </div>
              <span style={{ fontSize: 12, background: 'var(--red-50)', color: 'var(--red-700)', padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>-15% até 10/05</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ padding: 12, border: '1px solid var(--charcoal-100)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--charcoal-400)', fontWeight: 700 }}>Data</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>Sáb · 15 Fev</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--charcoal-100)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--charcoal-400)', fontWeight: 700 }}>Saída</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>09h00</div>
              </div>
            </div>

            <div style={{ padding: 12, border: '1px solid var(--charcoal-100)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--charcoal-400)', fontWeight: 700, marginBottom: 8 }}>Pessoas</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Adultos</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--charcoal-200)', background: '#fff', cursor: 'pointer', color: 'var(--charcoal-500)', display: 'grid', placeItems: 'center' }}><NTIcon name="minus" size={12}/></button>
                    <strong style={{ minWidth: 18, textAlign: 'center' }}>4</strong>
                    <button style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--charcoal-200)', background: '#fff', cursor: 'pointer', color: 'var(--charcoal-500)', display: 'grid', placeItems: 'center' }}><NTIcon name="plus" size={12}/></button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Crianças</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--charcoal-200)', background: '#fff', cursor: 'pointer', color: 'var(--charcoal-500)', display: 'grid', placeItems: 'center' }}><NTIcon name="minus" size={12}/></button>
                    <strong style={{ minWidth: 18, textAlign: 'center' }}>2</strong>
                    <button style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--charcoal-200)', background: '#fff', cursor: 'pointer', color: 'var(--charcoal-500)', display: 'grid', placeItems: 'center' }}><NTIcon name="plus" size={12}/></button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--charcoal-100)', borderBottom: '1px solid var(--charcoal-100)', marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--charcoal-500)' }}>4 adultos × R$ 280</span>
                <span>R$ 1.120</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--charcoal-500)' }}>2 crianças × R$ 140</span>
                <span>R$ 280</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 700 }}>
                <span>Desconto -15%</span>
                <span>−R$ 210</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--red-600)' }}>R$ 1.190</span>
            </div>

            <NTButton kind="primary" size="lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
              Reservar agora
            </NTButton>
            <div style={{ fontSize: 11, color: 'var(--charcoal-400)', textAlign: 'center' }}>
              Você não será cobrado ainda · Cancelamento grátis até 24h
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: 'var(--charcoal-50)', borderRadius: 12, fontSize: 13, lineHeight: 1.5, color: 'var(--charcoal-500)' }}>
            <strong style={{ color: 'var(--charcoal-700)' }}>Dúvida?</strong> Fala com a gente no WhatsApp <strong style={{ color: 'var(--charcoal-700)' }}>(22) 99876-5432</strong> — respondemos em até 5 minutos no horário comercial.
          </div>
        </aside>
      </div>

      <NTWebFooter/>
    </NTPage>
  );
}

// =============================================================================
// PAGE: Lancha Privativa (premium)
// =============================================================================

function LanchaPrivativaPage() {
  return (
    <NTPage height={2800}>
      <NTWebNav active="lancha"/>

      {/* Premium hero — full bleed photo with restrained typography */}
      <section style={{ position: 'relative', height: 720, backgroundImage: `linear-gradient(180deg, rgba(31,31,31,0.10) 0%, rgba(31,31,31,0.65) 100%), url(${NT_PHOTOS.buziosBay})`, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, padding: '64px 64px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.85)', borderTop: '1px solid rgba(255,255,255,0.40)', paddingTop: 14, width: 240 }}>
              Serviço exclusivo · Private charter
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>
              <span>I</span><span>II</span><span>III</span><span>IV</span>
            </div>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 120, lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0, fontStyle: 'italic' }}>
              Búzios,<br/>
              <span style={{ fontWeight: 600, fontStyle: 'normal' }}>como ninguém</span><br/>
              <span style={{ fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)' }}>te mostrou.</span>
            </h1>
            <div style={{ marginTop: 32, display: 'flex', gap: 64, alignItems: 'flex-end' }}>
              <p style={{ maxWidth: 380, fontSize: 15, lineHeight: 1.65, margin: 0, color: 'rgba(255,255,255,0.85)' }}>
                Lancha privativa para o seu grupo. Capitão dedicado, roteiro sob medida, paradas onde só os locais conhecem. Até 8 pessoas, dia inteiro, do seu jeito.
              </p>
              <NTButton kind="white" size="lg" style={{ background: '#fff' }}>
                Solicitar cotação
                <NTIcon name="arrow" size={16}/>
              </NTButton>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing panel — minimalist */}
      <section style={{ padding: '80px 64px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <NTEyebrow>Investimento</NTEyebrow>
          <NTH2 style={{ fontSize: 56 }}>A partir de<br/><span style={{ color: 'var(--red-600)' }}>R$ 4.800</span><br/>/dia</NTH2>
          <p style={{ fontSize: 16, color: 'var(--charcoal-500)', lineHeight: 1.6, marginTop: 24, maxWidth: 420 }}>
            Lancha completa, capitão e marinheiro, combustível, gelo, água. Você divide pelo grupo — para 8 pessoas dá R$ 600/cabeça em um dia inteiro de luxo náutico.
          </p>
          <NTButton kind="secondary" size="lg" style={{ marginTop: 24 }}>
            Ver pacotes
            <NTIcon name="arrow" size={16}/>
          </NTButton>
        </div>
        <div style={{ background: 'var(--charcoal-50)', padding: 32, borderRadius: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--charcoal-400)', marginBottom: 16 }}>O que inclui</div>
          {[
            ['Lancha 35 pés', 'até 8 pessoas, banheiro privativo, som premium'],
            ['Capitão e marinheiro', '20+ anos de experiência local'],
            ['Combustível e gelo', 'pra um dia inteiro sem preocupação'],
            ['Equipamento snorkel', 'máscaras, snorkels, nadadeiras'],
            ['Água, frutas, toalhas', 'cortesia da casa'],
            ['Fotos profissionais', 'via WhatsApp no fim do dia'],
          ].map(([t, s]) => (
            <div key={t} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--charcoal-100)' }}>
              <span style={{ color: 'var(--red-600)', display: 'inline-flex', flexShrink: 0, marginTop: 2 }}><NTIcon name="mark" size={18}/></span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t}</div>
                <div style={{ fontSize: 13, color: 'var(--charcoal-500)', marginTop: 2 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial photo grid */}
      <section style={{ padding: '64px 64px 80px', background: '#fff' }}>
        <div style={{ marginBottom: 40, maxWidth: 640 }}>
          <NTEyebrow>O que esperar</NTEyebrow>
          <NTH2 style={{ fontSize: 48 }}>Liberdade que escuna não dá.</NTH2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '300px 200px', gap: 16 }}>
          <div style={{ gridColumn: 'span 2', backgroundImage: `url(${NT_PHOTOS.couple})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12 }}/>
          <div style={{ backgroundImage: `url(${NT_PHOTOS.captainWheel})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12 }}/>
          <div style={{ backgroundImage: `url(${NT_PHOTOS.drinkStrawberry})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12 }}/>
          <div style={{ backgroundImage: `url(${NT_PHOTOS.snorkelClose})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12 }}/>
          <div style={{ backgroundImage: `url(${NT_PHOTOS.islandFalesia})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12 }}/>
        </div>
      </section>

      {/* Why us — 3 columns */}
      <section style={{ padding: '80px 64px', background: 'var(--charcoal-700)', color: '#fff' }}>
        <div style={{ maxWidth: 720, marginBottom: 56 }}>
          <div style={{ fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--red-300)', marginBottom: 12 }}>Por que com a gente</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 56, lineHeight: 1.0, letterSpacing: '-0.02em', margin: 0 }}>
            Não vendemos passeio. Vendemos o melhor dia da sua viagem.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            ['18 anos', 'navegando em Búzios, sem nenhum incidente reportado.'],
            ['Roteiro sob medida', 'você escolhe as paradas — ou nos deixa surpreender.'],
            ['Capitão local', 'que conhece cantos que turista nenhum descobre sozinho.'],
          ].map(([t, s]) => (
            <div key={t}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, lineHeight: 1.05, color: '#fff', marginBottom: 16 }}>{t}</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.70)', lineHeight: 1.55 }}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section style={{ padding: '64px', background: '#fff', textAlign: 'center' }}>
        <NTEyebrow style={{ display: 'block', textAlign: 'center' }}>Pronto pra reservar?</NTEyebrow>
        <NTH2 style={{ fontSize: 48, marginBottom: 24 }}>Conta pra gente o seu plano.</NTH2>
        <p style={{ fontSize: 16, color: 'var(--charcoal-500)', maxWidth: 520, margin: '0 auto 32px' }}>
          Em até 1h respondemos com cotação personalizada, datas disponíveis e roteiro sugerido.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <NTButton kind="primary" size="lg">
            WhatsApp · Resposta em 5min
            <NTIcon name="arrow" size={16}/>
          </NTButton>
          <NTButton kind="ghost" size="lg">Formulário online</NTButton>
        </div>
      </section>

      <NTWebFooter/>
    </NTPage>
  );
}

Object.assign(window, { TourDetailPage, LanchaPrivativaPage });
