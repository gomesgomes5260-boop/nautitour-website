import json, base64, glob, os, html, re
SC='/tmp/claude-0/-home-user-nautitour-website/9fcdbe13-6567-556f-b486-7a82b6efa579/scratchpad'
skel=open(f'{SC}/revisao/skeleton.html').read()
head=skel.split('</style>')[0]+'</style>'
import re as _re; head=_re.sub(r'<title>[^<]*</title>','<title>Inventário de clipes</title>',head)
script=skel[skel.index('<script>'):].replace("db.collection('revisao')","db.collection('clipes')")
head=head.replace('</style>','.badge { display:inline-block; font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; background:var(--turq); color:#0A4A4E; padding:2px 8px; border-radius:999px; margin-left:8px; vertical-align:middle; }\n.art img { width:100%; height:auto; display:block; }\n.grid { grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); }\n</style>')
meta=json.load(open(f'{SC}/clipes/meta.json'))  # {base: {dur, w, h, fps, grupo, nota}}
def grupo(b):
    n=int(re.sub(r'\D','',b) or 0)
    if b.startswith('IMG_'): return 'iPhone · fev/2024'
    if n>=977: return 'Drone · 28/jan/2025'
    if n>=916: return 'Drone · 23/jan/2025'
    if n>=657: return 'Drone · 10/fev/2024'
    if n>=499: return 'Drone · 31/jan/2024'
    return 'Drone · 29/jan/2024'
cards=[]
ordem=sorted(meta.keys(), key=lambda b:(grupo(b), b))
for b in ordem:
    m=meta[b]; img=f'{SC}/clipes/sheets/{b}.jpg'
    if not os.path.exists(img): continue
    data=base64.b64encode(open(img,'rb').read()).decode()
    ori='vertical' if m['h']>m['w'] else 'horizontal'
    e=html.escape
    cards.append(f'''<article class="card" data-id="{b}" data-canal="{e(grupo(b))}">
  <div class="art"><img src="data:image/jpeg;base64,{data}" alt="{b}" loading="lazy"></div>
  <div class="body">
    <div class="eyebrow">{e(grupo(b))} · {ori} · {m['w']}×{m['h']} · {m['fps']} fps</div>
    <h3>{b} <span class="badge">{m['dur']:.0f} s</span></h3>
    {'<div class="meta obs"><span class="k">Minha leitura</span><span>'+e(m.get('nota',''))+'</span></div>' if m.get('nota') else ''}
    <div class="decide" role="group" aria-label="Decisão">
      <button type="button" class="st" data-st="aprovado" id="b-{b}-ok">Quero usar</button>
      <button type="button" class="st" data-st="ajustar" id="b-{b}-adj">Talvez</button>
      <button type="button" class="st" data-st="descartar" id="b-{b}-no">Não usar</button>
      <span class="when" id="w-{b}"></span>
    </div>
    <label class="cmt"><span class="k">Takes (tempos) / comentário</span><textarea id="c-{b}" rows="2" placeholder="Ex.: 00:05–00:09 chegada na praia; 00:14 escuna de cima"></textarea></label>
    <div class="row"><button type="button" class="save" id="s-{b}">Salvar</button><span class="saved" id="sv-{b}"></span></div>
  </div>
</article>''')
n=len(cards)
page=head+f'''
<div class="wrap">
<header>
  <div><h1>Inventário de clipes · Escuna Estrela <span class="badge">vídeos do Drive</span></h1><p>{n} clipes da pasta "Videos Para Edição / Escuna". Cada folha tem 12 frames com o tempo (hh:mm:ss) pra você apontar os takes. Marque "Quero usar" nos clipes bons e escreva os tempos no campo. Com isso eu monto o comercial de 15 s e os posts de feed e story só com imagem real.</p></div>
  <div class="rule"><b>Nada é publicado automaticamente.</b> Isto é só a seleção de material.</div>
</header>
<div class="score" id="score"><span>Quero usar <i id="n-aprovado">0</i></span><span>Talvez <i id="n-ajustar">0</i></span><span>Não usar <i id="n-descartar">0</i></span><span>Sem decisão <i id="n-pendente">{n}</i></span></div>
<p class="note" id="note">Carregando as decisões salvas…</p>
<div class="grid">
'''+'\n'.join(cards)+'''</div>
<footer>Proxies 720p no sandbox de edição; os originais (4K) ficam no Drive e são rebaixados só na montagem final.</footer>
</div>
'''+script
open(f'{SC}/clipes/index.html','w').write(page)
print(n,'cards',len(page)//1024,'KB')
