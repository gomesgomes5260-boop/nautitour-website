#!/usr/bin/env python3
"""Monta um vídeo social da Escuna Estrela a partir de um spec JSON.

Roda no sandbox do Higgsfield (ffmpeg 5.1 + fontes em /home/user/fonts + logos em /home/user/brand).
Cada clipe é recortado em modo "cover" pro formato, recebe a sombra de legibilidade no terço inferior,
a logo Escuna Estrela (variante ESCUNA branco + sombra) no canto superior direito e os textos com fade.
No fim entra o cartão petróleo (degradê da marca) com logo grande, CTA e logo Nautitour.

Uso: python3 monta.py spec.json saida.mp4

Spec:
{
  "formato": "youtube" | "feed" | "story" | "quadrado",
  "transicao": 0.5,                 # xfade entre clipes, em segundos — ou {"tipo": "rasgo", "dur": 0.6,
                                    #   "tira": "/home/user/work/tira-kraft-1080.png", "direcao": "cima|baixo|alterna"}:
                                    #   uma tira de kraft rasgada varre o quadro e troca o take atrás dela
                                    #   ou {"tipo": "rasgo-video", "dur": 1.5, "borda": 30, "videos": [{"src": "tear.mp4", "in": 0.8,
                                    #   "flip": "h|v|hv"}, ...]}: o PRÓPRIO take rasga como papel (vídeo de rasgo sobre chroma
                                    #   verde gerado no Higgsfield), as bordas viram kraft e o take seguinte aparece por trás.
                                    #   Um vídeo de rasgo por corte, em rodízio; montagem em 2 passos (segmentos → timeline).
  "fontes": {"titulo": "...ttf"},   # opcional: troca as fontes (Escuna Estrela no social usa Poppins)
  "logo_tam": 0.17,                 # largura da logo em fração da largura do vídeo
  "clipes": [{"src": "...mp4", "in": 0, "dur": 4.6,
              "textos": [{"texto": "...", "fonte": "titulo|corpo|mao", "tam": 0.05, "y": 0.78,
                          "inicio": 0.4, "fim": 4.6, "alinhar": "centro|esq|dir", "cor": "#E9E6DF"}]}],
  "final": {"dur": 2.6, "logo_tam": 0.5, "logo_y": 0.40, "textos": [...]}
}
"""
import json, subprocess, sys

spec = json.load(open(sys.argv[1])); out = sys.argv[2]
FMT = {'youtube': (1920, 1080), 'feed': (1080, 1350), 'story': (1080, 1920), 'quadrado': (1080, 1080)}
W, H = FMT[spec['formato']]
FONTS = {'titulo': '/home/user/fonts/Fraunces-SemiBold.ttf', 'corpo': '/home/user/fonts/Montserrat-SemiBold.ttf', 'mao': '/home/user/fonts/Kalam-Bold.ttf'}
FONTS.update(spec.get('fontes', {}))
TR = spec.get('transicao', 0.5); RASGO = TR if isinstance(TR, dict) else None
FR = 30; XF = float(TR['dur'] if RASGO else TR); OFF = '#E9E6DF'
LOGO = '/home/user/brand/logo-petroleo-sombra.png'; LOGO_NT = '/home/user/brand/logo-nautitour-white.png'


def esc(t):
    return t.replace('\\', '\\\\').replace("'", '’').replace(':', '\\:').replace('%', '\\%').replace(',', '\\,')


def drawtext(t, dur):
    f = FONTS[t.get('fonte', 'titulo')]; size = int(W * t.get('tam', 0.05))
    a = float(t.get('inicio', 0.0)); b = float(t.get('fim', dur)); fade = t.get('fade', 0.35)
    alpha = f"if(lt(t\\,{a}+{fade})\\,(t-{a})/{fade}\\,if(gt(t\\,{b}-{fade})\\,({b}-t)/{fade}\\,1))"
    mx = int(W * t.get('margem', 0.07))
    x = {'centro': '(w-text_w)/2', 'esq': str(mx), 'dir': f'w-text_w-{mx}'}[t.get('alinhar', 'centro')]
    y = f"h*{t.get('y', 0.75)}-text_h/2"
    parts = [f"fontfile={f}", f"text='{esc(t['texto'])}'", f"fontsize={size}", f"fontcolor={t.get('cor', OFF)}",
             f"x={x}", f"y={y}", f"alpha='{alpha}'", f"enable='between(t\\,{a}\\,{b})'",
             "shadowcolor=black@0.45", "shadowx=2", "shadowy=3", "line_spacing=10"]
    return "drawtext=" + ":".join(parts)


clips = spec['clipes']; n = len(clips); inputs = []; filt = []
for c in clips:
    inputs += ['-ss', str(c.get('in', 0)), '-t', str(c['dur']), '-i', c['src']]
inputs += ['-loop', '1', '-t', '1', '-i', f'/home/user/work/shade-{W}x{H}.png']   # n
inputs += ['-loop', '1', '-t', '1', '-i', LOGO]                                   # n+1
inputs += ['-loop', '1', '-t', '1', '-i', LOGO_NT]                                # n+2
lw = int(W * spec.get('logo_tam', 0.20)); m = int(W * 0.035)
filt.append(f"[{n}:v]split={n}" + "".join(f"[sh{i}]" for i in range(n)))
filt.append(f"[{n+1}:v]scale={lw}:-1,split={n+1}" + "".join(f"[lg{i}]" for i in range(n + 1)))
for i, c in enumerate(clips):
    dur = float(c['dur'])
    ch = f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FR},format=yuv420p[b{i}];"
    ch += f"[b{i}][sh{i}]overlay=0:0[s{i}];[s{i}][lg{i}]overlay={W}-w-{m}:{m}[l{i}];"
    dt = ",".join(drawtext(t, dur) for t in c.get('textos', [])) or "null"
    ch += f"[l{i}]{dt},format=yuv420p[v{i}]"
    filt.append(ch)

# cartão final (degradê petróleo da marca)
e = spec.get('final', {}); ed = float(e.get('dur', 2.6))
if e.get('fundo'):  # imagem de fundo do cartão (ex.: bases/fundo-petroleo-01.jpg), recorte cover com foco fx/fy
    fb = e['fundo']; inputs += ['-loop', '1', '-t', str(ed), '-i', fb['src']]; fi = n + 3
    fx, fy = fb.get('fx', 0.5), fb.get('fy', 0.5)
    g = f"[{fi}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:x=(iw-{W})*{fx}:y=(ih-{H})*{fy},setsar=1,fps={FR},format=yuv420p,trim=duration={ed},setpts=PTS-STARTPTS[g0];"
else:
    g = f"gradients=s={W}x{H}:c0=#072A2E:c1=#075A5E:c2=#09959C:n=3:x0=0:y0=0:x1={W}:y1={H}:d={ed}:speed=0.002,fps={FR},format=yuv420p[g0];"
g += f"[lg{n}]scale={int(W*e.get('logo_tam',0.5))}:-1[lgE];[g0][lgE]overlay=({W}-w)/2:{H}*{e.get('logo_y',0.40)}-h/2[g1];"
g += f"[{n+2}:v]scale={int(W*0.12)}:-1[nt];[g1][nt]overlay=({W}-w)/2:{H}-h-{int(H*0.05)}[g2];"
dt = ",".join(drawtext(t, ed) for t in e.get('textos', [])) or "null"
g += f"[g2]{dt},format=yuv420p[vE]"
filt.append(g)

durs = [float(c['dur']) for c in clips] + [ed]; labels = [f"v{i}" for i in range(n)] + ["vE"]
total = sum(durs) - XF * (len(durs) - 1)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-3000:]); sys.exit(r.returncode)


if RASGO and RASGO.get('tipo') == 'rasgo-video':
    # PASSO 1: cada clipe (com sombra, logo e textos) e o cartão viram um segmento próprio
    import os, tempfile
    tmp = tempfile.mkdtemp(prefix='monta-')
    segs = []
    for i, c in enumerate(clips):
        seg = f"{tmp}/seg{i}.mp4"
        ins = ['-ss', str(c.get('in', 0)), '-t', str(c['dur']), '-i', c['src'], '-loop', '1', '-t', '1', '-i', f'/home/user/work/shade-{W}x{H}.png', '-loop', '1', '-t', '1', '-i', LOGO]
        f = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FR},format=yuv420p[b];"
             f"[b][1:v]overlay=0:0[s];[2:v]scale={lw}:-1[lg];[s][lg]overlay={W}-w-{m}:{m}[l];"
             f"[l]{','.join(drawtext(t, float(c['dur'])) for t in c.get('textos', [])) or 'null'},format=yuv420p[v]")
        run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', f, '-map', '[v]', '-r', str(FR), '-t', str(c['dur']), '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', '-pix_fmt', 'yuv420p', '-an', seg])
        segs.append(seg)
    segE = f"{tmp}/segE.mp4"
    insE = ['-loop', '1', '-t', '1', '-i', LOGO, '-loop', '1', '-t', '1', '-i', LOGO_NT]
    if e.get('fundo'):
        insE += ['-loop', '1', '-t', str(ed), '-i', e['fundo']['src']]
        gE = f"[2:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:x=(iw-{W})*{fx}:y=(ih-{H})*{fy},setsar=1,fps={FR},format=yuv420p,trim=duration={ed},setpts=PTS-STARTPTS[g0];"
    else:
        gE = f"gradients=s={W}x{H}:c0=#072A2E:c1=#075A5E:c2=#09959C:n=3:x0=0:y0=0:x1={W}:y1={H}:d={ed}:speed=0.002,fps={FR},format=yuv420p[g0];"
    gE += f"[0:v]scale={int(W*e.get('logo_tam',0.5))}:-1[lgE];[g0][lgE]overlay=({W}-w)/2:{H}*{e.get('logo_y',0.40)}-h/2[g1];"
    gE += f"[1:v]scale={int(W*0.12)}:-1[nt];[g1][nt]overlay=({W}-w)/2:{H}-h-{int(H*0.05)}[g2];"
    gE += f"[g2]{','.join(drawtext(t, ed) for t in e.get('textos', [])) or 'null'},format=yuv420p[vE]"
    run(['ffmpeg', '-v', 'error', '-y'] + insE + ['-filter_complex', gE, '-map', '[vE]', '-r', str(FR), '-t', str(ed), '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', '-pix_fmt', 'yuv420p', '-an', segE])
    segs.append(segE)

    # PASSO 2: timeline = meio0, T1, meio1, T2, ... — cada T_k: a cauda do take anterior "impressa" no papel que rasga,
    # borda de kraft (máscara erodida por blur+limiar) e o take seguinte por trás.
    vids = RASGO['videos']; XF = float(RASGO.get('dur', 1.5)); R = int(RASGO.get('borda', 30)); K = len(segs)
    def probe(p):
        return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip())
    inputs2 = []; filt2 = []; idx = 0
    def add(args):
        global idx
        inputs2.extend(args); idx += 1; return idx - 1
    parts = []
    for k in range(K):
        d = durs[k]; a = XF if k > 0 else 0.0; b = d - (XF if k < K - 1 else 0.0)
        mid = add(['-ss', f"{a:.3f}", '-t', f"{b - a:.3f}", '-i', segs[k]])
        filt2.append(f"[{mid}:v]setpts=PTS-STARTPTS,format=yuv420p[mid{k}]")
        if k > 0:
            tail = add(['-ss', f"{durs[k-1] - XF:.3f}", '-t', f"{XF:.3f}", '-i', segs[k - 1]])
            head = add(['-t', f"{XF:.3f}", '-i', segs[k]])
            tv = vids[(k - 1) % len(vids)]; tin = float(tv.get('in', 0.0)); tlen = probe(tv['src']) - tin; V = tlen / XF
            tear = add(['-ss', f"{tin:.3f}", '-i', tv['src']])
            flip = {'h': 'hflip,', 'v': 'vflip,', 'hv': 'hflip,vflip,'}.get(tv.get('flip', ''), '')
            fo = max(0.0, XF - 0.3)
            filt2.append(
                f"[{tear}:v]{flip}scale={W}:{H},setpts=(PTS-STARTPTS)/{V:.4f},fps={FR},trim=duration={XF},"
                f"chromakey=0x00FF00:{tv.get('sim', 0.18)}:{tv.get('blend', 0.04)},format=rgba,fade=t=out:st={fo:.3f}:d=0.3:alpha=1,split=2[pap{k}][pap2_{k}];"
                f"[pap2_{k}]alphaextract,format=gray,avgblur=sizeX={R}:sizeY={R},lut=c0='if(gt(val,240),255,0)'[m{k}];"
                f"[{tail}:v]setpts=PTS-STARTPTS,format=rgba[ta{k}];[ta{k}][m{k}]alphamerge[am{k}];"
                f"[{head}:v]setpts=PTS-STARTPTS,format=yuv420p[hb{k}];[hb{k}][pap{k}]overlay=0:0:eof_action=pass[bk{k}];"
                f"[bk{k}][am{k}]overlay=0:0:eof_action=pass,format=yuv420p,trim=duration={XF},setpts=PTS-STARTPTS[T{k}]")
            parts.append(f"T{k}")
        parts.append(f"mid{k}")
    filt2.append("".join(f"[{p}]" for p in parts) + f"concat=n={len(parts)}:v=1:a=0[v]")
    cmd = ['ffmpeg', '-v', 'error', '-y'] + inputs2 + ['-filter_complex', ";".join(filt2), '-map', '[v]', '-r', str(FR),
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out]
    print('total ~', round(sum(durs) - XF * (K - 1), 2), 's (rasgo-video, 2 passos)'); sys.stdout.flush()
    run(cmd); print('ok', out); sys.exit(0)

# xfade em cadeia (fade, ou "rasgo": a tira de kraft sobe/desce e o take troca na linha escondida sob ela)
if RASGO:
    import struct
    tira = RASGO['tira']; hdr = open(tira, 'rb').read(24); tw, th = struct.unpack('>II', hdr[16:24])
    hs = int(th * W / tw); ti = inputs.count('-i')
    inputs += ['-loop', '1', '-t', str(total + 1), '-i', tira]
    filt.append(f"[{ti}:v]scale={W}:-1,format=rgba,split={len(labels)-1}" + "".join(f"[tira{k}]" for k in range(1, len(labels))))
    modo = RASGO.get('direcao', 'alterna')
cur = labels[0]; off = 0.0; tiras = []
for k in range(1, len(labels)):
    off += durs[k - 1] - XF
    nxt = f"x{k}"
    if RASGO:
        sobe = modo == 'cima' or (modo == 'alterna' and k % 2 == 1)
        ease = "(1-P)*(1-P)*(3-2*(1-P))"   # P vai de 1 a 0 no xfade; ease-in-out
        yb = f"(H+{hs})*(1-{ease})-{hs}/2" if sobe else f"(H+{hs})*{ease}-{hs}/2"
        expr = f"if({'gt' if sobe else 'lt'}(Y,{yb}),B,A)"
        filt.append(f"[{cur}][{labels[k]}]xfade=transition=custom:duration={XF}:offset={off:.3f}:expr='{expr}'[{nxt}]")
        u = f"clip((t-{off:.3f})/{XF},0,1)"; E = f"({u}*{u}*(3-2*{u}))"
        ytira = f"({H}+{hs})*(1-{E})-{hs}" if sobe else f"({H}+{hs})*{E}-{hs}"
        tiras.append((k, off, ytira))
    else:
        filt.append(f"[{cur}][{labels[k]}]xfade=transition=fade:duration={XF}:offset={off:.3f}[{nxt}]")
    cur = nxt
for k, off, ytira in tiras:   # a tira passa por cima de tudo (logo e textos inclusive), um overlay por corte
    filt.append(f"[{cur}][tira{k}]overlay=x=0:y='{ytira}':enable='between(t,{off:.3f},{off+XF:.3f})'[t{k}]")
    cur = f"t{k}"

cmd = ['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', ";".join(filt), '-map', f'[{cur}]', '-r', str(FR),
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out]
print('total ~', round(sum(durs) - XF * (len(durs) - 1), 2), 's'); sys.stdout.flush()
r = subprocess.run(cmd, capture_output=True, text=True)
print(r.stderr[-3000:] if r.returncode else 'ok ' + out)
sys.exit(r.returncode)
