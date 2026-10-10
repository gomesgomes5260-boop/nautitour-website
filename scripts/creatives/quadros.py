# Mede os quadros das polaroides pintadas pelo Higgsfield numa arte base: pra cada polaroide, o retângulo da foto
# (centro, tamanho, giro) e a largura da borda branca em cada lado. O molde HF usa isso pra encaixar a foto escolhida
# e a legenda por cima da polaroide pintada (rasgo natural do Higgsfield, foto e texto exatos).
#
#   python3 scripts/creatives/quadros.py scripts/creatives/bases/enquete-01.jpg [debug.jpg]
#   python3 scripts/creatives/quadros.py --todas      # regrava scripts/creatives/bases/quadros.json
#
# Requer opencv-python-headless + numpy (pip install opencv-python-headless). Valores em % da largura/altura da arte.
import cv2, numpy as np, json, sys, os
def medir(src, out=None):
    im=cv2.imread(src); H,W=im.shape[:2]
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
    b,g,r=[im[:,:,i].astype(int) for i in range(3)]
    paper=((hsv[:,:,2]>222)&(hsv[:,:,1]<32)&((b-r)<6)).astype(np.uint8)*255
    paper=cv2.morphologyEx(paper,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    notpaper=cv2.bitwise_not(paper)
    notpaper=cv2.morphologyEx(notpaper,cv2.MORPH_OPEN,np.ones((11,11),np.uint8))
    n,lab,stats,cent=cv2.connectedComponentsWithStats(notpaper)
    res=[]; dbg=im.copy()
    def extent(cx,cy,vec,mask,start,maxlen):
        # anda a partir de (cx,cy)+vec*start enquanto mask for papel; devolve distância
        d=start; last=start; gap=0
        while d<start+maxlen:
            x=int(round(cx+vec[0]*d)); y=int(round(cy+vec[1]*d))
            if x<0 or y<0 or x>=W or y>=H: break
            if mask[y,x]: last=d; gap=0
            else:
                gap+=1
                if gap>8: break
            d+=1
        return last-start
    for i in range(1,n):
        x,y,w,h,a=stats[i]
        if a<W*H*0.02: continue
        if x<=1 or y<=1 or x+w>=W-1 or y+h>=H-1: continue   # encosta na borda da arte: não é foto
        comp=(lab==i).astype(np.uint8)*255
        cnts,_=cv2.findContours(comp,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        c=cv2.convexHull(max(cnts,key=cv2.contourArea))
        (cx,cy),(rw,rh),ang=cv2.minAreaRect(c)
        if ang>45: ang-=90; rw,rh=rh,rw
        if ang<-45: ang+=90; rw,rh=rh,rw
        rect=rw*rh
        if cv2.contourArea(c)/rect<0.92: continue
        r=np.deg2rad(ang); down=np.array([-np.sin(r),np.cos(r)]); right=np.array([np.cos(r),np.sin(r)])
        # mede a borda branca em cada direção a partir da beira da foto (média de 3 pontos)
        def side(vec,half,perp,phalf):
            ds=[extent(cx+perp[0]*k*phalf*0.6,cy+perp[1]*k*phalf*0.6,vec,paper,half+2,400) for k in(-1,0,1)]
            return float(np.median(ds))+2
        bL=side(-right,rw/2,down,rh/2); bR=side(right,rw/2,down,rh/2); bT=side(-down,rh/2,right,rw/2); bB=side(down,rh/2,right,rw/2)
        box=cv2.boxPoints(((cx,cy),(rw,rh),ang)).astype(int); cv2.polylines(dbg,[box],True,(0,0,255),3)
        capc=np.array([cx,cy])+down*(rh/2+bB/2)
        cv2.polylines(dbg,[cv2.boxPoints(((float(capc[0]),float(capc[1])),(rw,bB),ang)).astype(int)],True,(0,200,0),2)
        res.append({'foto':{'cx':round(cx/W*100,2),'cy':round(cy/H*100,2),'w':round(rw/W*100,2),'h':round(rh/H*100,2)},'girar':round(float(ang),2),
                    'borda':{'esq':round(bL/W*100,2),'dir':round(bR/W*100,2),'cima':round(bT/W*100,2),'baixo':round(bB/W*100,2)}})
    # junta pedaços da mesma foto (céu claro parte a foto ao meio): mesmo cx, ângulo parecido, encostados na vertical
    def merge(a,b):
        fa,fb=a['foto'],b['foto']; top=min(fa['cy']-fa['h']/2,fb['cy']-fb['h']/2); bot=max(fa['cy']+fa['h']/2,fb['cy']+fb['h']/2)
        return {'foto':{'cx':round((fa['cx']+fb['cx'])/2,2),'cy':round((top+bot)/2,2),'w':max(fa['w'],fb['w']),'h':round(bot-top,2)},'girar':round((a['girar']+b['girar'])/2,2),
                'borda':{'esq':max(a['borda']['esq'],b['borda']['esq']),'dir':max(a['borda']['dir'],b['borda']['dir']),'cima':max(a['borda']['cima'],b['borda']['cima']),'baixo':max(a['borda']['baixo'],b['borda']['baixo'])}}
    changed=True
    while changed:
        changed=False
        for i in range(len(res)):
            for j in range(i+1,len(res)):
                a,b=res[i],res[j]
                if abs(a['foto']['cx']-b['foto']['cx'])<4 and abs(a['girar']-b['girar'])<3 and abs(a['foto']['cy']-b['foto']['cy'])<(a['foto']['h']+b['foto']['h'])/2+3:
                    res[i]=merge(a,b); del res[j]; changed=True; break
            if changed: break
    res.sort(key=lambda r:r['foto']['cx'])
    if out: cv2.imwrite(out,dbg)
    return res

if __name__=='__main__':
    here=os.path.dirname(os.path.abspath(__file__)); bases=os.path.join(here,'bases')
    if sys.argv[1:]==['--todas']:
        out={}
        for f in sorted(os.listdir(bases)):
            if not f.endswith('.jpg'): continue
            q=medir(os.path.join(bases,f))
            if q: out[f]=q
        json.dump(out,open(os.path.join(bases,'quadros.json'),'w'),indent=1,ensure_ascii=False)
        print('quadros.json:',{k:len(v) for k,v in out.items()})
    else:
        print(json.dumps(medir(sys.argv[1], sys.argv[2] if len(sys.argv)>2 else None),ensure_ascii=False))
