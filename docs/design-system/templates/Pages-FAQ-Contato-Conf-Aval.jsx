// Pages: FAQ + Contato + Confirmação pós-reserva + Avaliações

function FAQPage() {
  const groups = [
    {
      title: 'Reservas e pagamento',
      items: [
        ['Posso reservar pra hoje?', 'Pode — desde que tenha vaga. O sistema mostra disponibilidade em tempo real, e a confirmação chega em segundos.'],
        ['Quais formas de pagamento aceitam?', 'Pix (com 5% off), cartão de crédito em até 6x sem juros, e dinheiro na loja física.'],
        ['Tem desconto pra grupo grande?', 'Sim — a partir de 10 pessoas falamos com você no WhatsApp pra montar uma cotação especial.'],
        ['Vocês emitem nota fiscal?', 'Emitimos NFS-e automática, enviada por e-mail logo após a confirmação.'],
      ],
    },
    {
      title: 'No dia do passeio',
      items: [
        ['Quanto tempo antes preciso chegar?', 'Recomendamos 30 minutos antes da saída — pra check-in, banheiro e briefing.'],
        ['Onde fica o ponto de embarque?', 'Píer Centro de Búzios, em frente à loja. Tem placa Nautitour bem visível.'],
        ['Posso levar comida e bebida?', 'Pode, à vontade. Cooler à disposição. Bar a bordo também tem opções de R$ 8 a R$ 25.'],
        ['E se chover?', 'Se cancelarmos por mau tempo, você escolhe: reembolso integral ou outra data.'],
      ],
    },
    {
      title: 'Crianças e pets',
      items: [
        ['Crianças pagam meia?', 'Crianças de 4 a 11 anos pagam 50%. Menores de 4 anos não pagam.'],
        ['Pets podem ir?', 'Em lanchas privativas, sim. Em escunas compartilhadas, infelizmente não permitimos.'],
      ],
    },
  ];
  return (
    <NTPage height={2400}>
      <NTWebNav/>
      <section style={{ padding: '80px 64px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 720 }}>
          <NTEyebrow>Perguntas frequentes</NTEyebrow>
          <NTH2 style={{ fontSize: 72 }}>Tira a dúvida<br/>em 30 segundos.</NTH2>
          <p style={{ fontSize: 16, color: 'var(--charcoal-500)', marginTop: 20 }}>
            Não achou? <a href="#" style={{ color: 'var(--red-600)', fontWeight: 700 }}>Manda no WhatsApp</a> — respondemos em até 5 minutos.
          </p>
        </div>
      </section>
      <section style={{ padding: '0 64px 80px', background: '#fff' }}>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom: 48 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--charcoal-700)', margin: '0 0 16px', borderBottom: '2px solid var(--charcoal-100)', paddingBottom: 12 }}>
              {g.title}
            </h3>
            {g.items.map(([q, a], i) => (
              <details key={q} open={gi === 0 && i === 0} style={{
                borderBottom: '1px solid var(--charcoal-100)',
                padding: '20px 0',
              }}>
                <summary style={{
                  cursor: 'pointer', listStyle: 'none', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 18, fontWeight: 700, color: 'var(--charcoal-700)',
                }}>
                  {q}
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--charcoal-50)', display: 'grid', placeItems: 'center', color: 'var(--red-600)', fontSize: 18, fontWeight: 700 }}>+</span>
                </summary>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--charcoal-500)', marginTop: 12, marginBottom: 0, maxWidth: 720 }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        ))}
      </section>
      {/* Help band */}
      <section style={{ padding: '64px', background: 'var(--charcoal-50)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'center' }}>
        {[
          { t: 'WhatsApp', s: 'Resposta em 5 min', cta: '(22) 99876-5432' },
          { t: 'E-mail', s: 'Resposta em até 1h', cta: 'ola@nautitour.com.br' },
          { t: 'Loja física', s: 'Diariamente 8h–20h', cta: 'Píer Centro · Búzios' },
        ].map(c => (
          <div key={c.t} style={{ background: '#fff', padding: 28, borderRadius: 16 }}>
            <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--charcoal-400)' }}>{c.t}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--red-600)', margin: '12px 0 6px' }}>{c.cta}</div>
            <div style={{ fontSize: 13, color: 'var(--charcoal-500)' }}>{c.s}</div>
          </div>
        ))}
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

function ContatoPage() {
  return (
    <NTPage height={2200}>
      <NTWebNav active="contato"/>
      {/* Hero */}
      <section style={{ padding: '80px 64px 48px', background: '#fff', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64 }}>
        <div>
          <NTEyebrow>Fale com a gente</NTEyebrow>
          <NTH2 style={{ fontSize: 72 }}>Estamos no Píer.<br/><span style={{ color: 'var(--red-600)' }}>Sempre.</span></NTH2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--charcoal-500)', marginTop: 24, maxWidth: 480 }}>
            Loja aberta de 8h às 20h, todos os dias. WhatsApp ativo das 7h às 22h. E o pier está logo ali — venha nos visitar.
          </p>
        </div>
        <div style={{ background: 'var(--charcoal-50)', padding: 28, borderRadius: 16 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {[
              ['Endereço', 'Píer do Centro, Av. José Bento Ribeiro Dantas — Búzios/RJ · 28950-000'],
              ['Telefone', '(22) 99876-5432'],
              ['E-mail', 'ola@nautitour.com.br'],
              ['CADASTUR', '12.345.678 · Receptivo certificado'],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--charcoal-400)' }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal-700)', marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map + form */}
      <section style={{ padding: '0 64px 80px', background: '#fff', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
        <div style={{
          height: 540, borderRadius: 16, position: 'relative', overflow: 'hidden',
          backgroundImage: `url(${NT_PHOTOS.buziosMap})`, backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(31,31,31,0.05) 0%, rgba(31,31,31,0.30) 100%)' }}/>
          {/* Pin */}
          <div style={{ position: 'absolute', left: '52%', top: '46%', transform: 'translate(-50%, -100%)' }}>
            <div style={{ background: 'var(--red-600)', color: '#fff', padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(31,31,31,0.30)', whiteSpace: 'nowrap' }}>
              Nautitour · Píer Centro
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '12px solid var(--red-600)', margin: '0 auto' }}/>
          </div>
          {/* Map controls mock */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['+', '−'].map(s => (
              <button key={s} style={{ width: 36, height: 36, background: '#fff', border: 0, borderRadius: 6, fontSize: 18, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(31,31,31,0.15)' }}>{s}</button>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 2px 8px rgba(31,31,31,0.15)', fontSize: 12, fontWeight: 600 }}>
            Como chegar →
          </div>
        </div>

        {/* Form */}
        <form style={{ background: 'var(--charcoal-50)', padding: 28, borderRadius: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, margin: '0 0 6px', color: 'var(--charcoal-700)' }}>Mande uma mensagem</h3>
          <p style={{ fontSize: 13, color: 'var(--charcoal-500)', margin: '0 0 20px' }}>Respondemos em até 1h em horário comercial.</p>

          {[['Nome', 'Maria Silva'], ['E-mail', 'maria@email.com'], ['Telefone (opcional)', '(11) 9 8765-4321']].map(([l, ph]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal-500)', display: 'block', marginBottom: 6 }}>{l}</label>
              <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--charcoal-100)', fontSize: 14, color: 'var(--charcoal-300)' }}>{ph}</div>
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal-500)', display: 'block', marginBottom: 6 }}>Mensagem</label>
            <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--charcoal-100)', fontSize: 14, color: 'var(--charcoal-300)', height: 100 }}>
              Quero saber sobre lancha privativa para 6 pessoas no dia 15…
            </div>
          </div>

          <NTButton kind="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>Enviar mensagem</NTButton>
        </form>
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

function ConfirmacaoPage() {
  return (
    <NTPage height={1700}>
      <NTWebNav/>
      {/* Confirmation hero */}
      <section style={{ padding: '64px 64px 48px', background: 'linear-gradient(180deg, #fff 0%, var(--charcoal-50) 100%)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: 999, background: 'var(--success)', color: '#fff', display: 'inline-grid', placeItems: 'center', marginBottom: 24 }}>
            <NTIcon name="mark" size={44}/>
          </div>
          <NTEyebrow style={{ textAlign: 'center' }}>Reserva confirmada · #NT-24871</NTEyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 64, lineHeight: 1.0, letterSpacing: '-0.02em', margin: '8px 0 16px', color: 'var(--charcoal-700)' }}>
            Bom embarque, Maria!
          </h1>
          <p style={{ fontSize: 17, color: 'var(--charcoal-500)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Mandamos os detalhes pro seu e-mail e WhatsApp. Salva esta página, ela vale como voucher.
          </p>
        </div>
      </section>

      {/* Voucher card */}
      <section style={{ padding: '0 64px 48px', background: 'var(--charcoal-50)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-2)' }}>
          <div style={{
            height: 200, position: 'relative',
            backgroundImage: `linear-gradient(180deg, rgba(31,31,31,0.10), rgba(31,31,31,0.55)), url(${NT_PHOTOS.morningHero})`,
            backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img src={NT_LOGO_WHITE} alt="" style={{ height: 32 }}/>
              <span style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.85 }}>Voucher</span>
            </div>
            <div>
              <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.75 }}>Tour das Ilhas</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, marginTop: 4 }}>Sáb · 15 Fev · 09h00</div>
            </div>
          </div>
          <div style={{ padding: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, paddingBottom: 24, borderBottom: '1px dashed var(--charcoal-200)' }}>
              {[
                ['Embarque', 'Píer Centro'],
                ['Pessoas', '4 adultos · 2 crianças'],
                ['Duração', '7h (09h–16h)'],
                ['Total pago', 'R$ 1.190,00'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--charcoal-400)' }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal-700)', marginTop: 6 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 32, paddingTop: 24, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal-700)', marginBottom: 10 }}>Antes do passeio:</div>
                {[
                  'Chegue 30 min antes da saída',
                  'Traga protetor solar e toalha',
                  'Documento com foto pra check-in',
                ].map(s => (
                  <div key={s} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--charcoal-500)', padding: '4px 0' }}>
                    <span style={{ color: 'var(--red-600)' }}><NTIcon name="mark" size={16}/></span>
                    {s}
                  </div>
                ))}
              </div>
              <div style={{ width: 160, height: 160, marginLeft: 'auto', background: '#fff', border: '1px solid var(--charcoal-100)', padding: 12, borderRadius: 8 }}>
                {/* QR placeholder */}
                <div style={{ width: '100%', height: '100%', backgroundImage: 'repeating-conic-gradient(var(--charcoal-700) 0% 25%, #fff 0% 50%)', backgroundSize: '14px 14px', borderRadius: 4 }}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section style={{ padding: '48px 64px 80px', background: 'var(--charcoal-50)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { t: 'Adicionar à agenda', s: 'Google · Apple · Outlook', icon: 'cal' },
            { t: 'Falar no WhatsApp', s: '(22) 99876-5432', icon: 'share' },
            { t: 'Indicar a um amigo', s: 'Ganhe R$ 50 de crédito', icon: 'heart' },
          ].map(c => (
            <div key={c.t} style={{ background: '#fff', padding: 24, borderRadius: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-50)', color: 'var(--red-600)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <NTIcon name={c.icon} size={20}/>
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--charcoal-700)' }}>{c.t}</div>
                <div style={{ fontSize: 13, color: 'var(--charcoal-500)', marginTop: 4 }}>{c.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

function AvaliacoesPage() {
  const reviews = [
    { stars: 5, name: 'Marina S.', city: 'São Paulo', date: 'Jan 2026', tour: 'Tour das Ilhas', body: 'Levei meus pais (60+) e meus filhos (8 e 12) — todos amaram. Tripulação atenciosa, paradas perfeitas, almoço no quiosque uma delícia. As fotos que mandaram pelo WhatsApp são profissionais mesmo!' },
    { stars: 5, name: 'Carlos M.', city: 'Belo Horizonte', date: 'Jan 2026', tour: 'Lancha Privativa', body: 'Reservei pra surpresa de aniversário da minha esposa. O capitão Marco esperou no pier com champagne gelado, levou a gente em um canto que ninguém sabia. Inesquecível.' },
    { stars: 5, name: 'Ana P.', city: 'Buenos Aires', date: 'Dez 2025', tour: 'Pôr-do-sol', body: 'Tripulação trilíngue, atendimento impecável. Pôr-do-sol no mar de Búzios é coisa de outro mundo, e a Nautitour entrega esse momento com classe.' },
    { stars: 5, name: 'João R.', city: 'Rio de Janeiro', date: 'Dez 2025', tour: 'Tour das Ilhas', body: 'Já fiz com 3 empresas diferentes em Búzios. Nautitour é absurdamente superior — desde o atendimento na loja até o ponto certo de levar a escuna pra cada parada.' },
    { stars: 5, name: 'Lucia T.', city: 'Curitiba', date: 'Nov 2025', tour: 'Tour das Ilhas', body: 'Reserva pelo site sem dor de cabeça. Pix com 5% off, chegou no e-mail em segundos. No dia, equipe esperando, tudo organizado. Recomendo demais.' },
    { stars: 4, name: 'Felipe A.', city: 'Brasília', date: 'Nov 2025', tour: 'Tour das Ilhas', body: 'Passeio incrível. Tirei uma estrela só porque o sistema do almoço (parceiro) demorou um pouco. A bordo, 10/10 — drinks, fotos, tripulação show.' },
  ];
  return (
    <NTPage height={2400}>
      <NTWebNav/>
      {/* Hero with rating */}
      <section style={{ padding: '80px 64px', background: '#fff', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <NTEyebrow>Avaliações</NTEyebrow>
          <NTH2 style={{ fontSize: 72 }}>2.347 hóspedes.<br/><span style={{ color: 'var(--red-600)' }}>4.9 estrelas.</span></NTH2>
          <p style={{ fontSize: 17, color: 'var(--charcoal-500)', marginTop: 24, lineHeight: 1.55, maxWidth: 480 }}>
            Cada avaliação abaixo é de um hóspede verificado — sem filtro, sem edição. Inclusive as 4 estrelas.
          </p>
        </div>
        <div style={{ background: 'var(--charcoal-50)', borderRadius: 20, padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ color: 'var(--red-600)' }}><NTIcon name="star" size={36}/></span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700, color: 'var(--charcoal-700)', lineHeight: 1 }}>4.9</span>
          </div>
          {[
            ['5★', 92], ['4★', 6], ['3★', 1], ['2★', 0.5], ['1★', 0.5],
          ].map(([l, p]) => (
            <div key={l} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 40px', gap: 12, alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--charcoal-500)' }}>{l}</span>
              <div style={{ height: 8, background: 'var(--charcoal-100)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${p}%`, height: '100%', background: p > 50 ? 'var(--success)' : 'var(--red-300)' }}/>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--charcoal-500)', textAlign: 'right' }}>{p}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section style={{ padding: '0 64px 32px', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--charcoal-100)', paddingBottom: 24 }}>
          {['Todos os passeios', 'Tour das Ilhas', 'Lancha Privativa', 'Pôr-do-sol', '★ 5', '★ 4'].map((f, i) => (
            <button key={f} style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              border: i === 0 ? 0 : '1px solid var(--charcoal-200)',
              background: i === 0 ? 'var(--charcoal-700)' : '#fff',
              color: i === 0 ? '#fff' : 'var(--charcoal-700)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--charcoal-500)', alignSelf: 'center' }}>
            Ordenar: <strong style={{ color: 'var(--charcoal-700)' }}>Mais recentes</strong> ▼
          </span>
        </div>
      </section>

      {/* Reviews grid */}
      <section style={{ padding: '32px 64px 80px', background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {reviews.map(r => (
            <article key={r.name + r.date} style={{ padding: 24, background: 'var(--charcoal-50)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 2, color: 'var(--red-600)' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ opacity: i < r.stars ? 1 : 0.18 }}><NTIcon name="star" size={16}/></span>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'var(--charcoal-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{r.tour}</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--charcoal-700)', margin: '0 0 16px', textWrap: 'pretty' }}>
                "{r.body}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--charcoal-500)' }}>
                <span><strong style={{ color: 'var(--charcoal-700)' }}>{r.name}</strong> · {r.city}</span>
                <span>{r.date} · ✓ verificado</span>
              </div>
            </article>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <NTButton kind="ghost" size="lg">Carregar mais avaliações</NTButton>
        </div>
      </section>
      <NTWebFooter/>
    </NTPage>
  );
}

Object.assign(window, { FAQPage, ContatoPage, ConfirmacaoPage, AvaliacoesPage });
