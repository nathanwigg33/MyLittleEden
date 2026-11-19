import struct, zlib, sys
from PIL import Image
def parse(path):
    d=open(path,'rb').read()
    fsize,magic,nframes,w,h,depth=struct.unpack_from('<IHHHHH',d,0)
    pos=128; layers=[]; frames=[]; tags=[]; pal=[(0,0,0,0)]*256
    for f in range(nframes):
        fb,mg,oldn,dur,_,_,newn=struct.unpack_from('<IHHHBBI',d,pos); n=newn or oldn
        p=pos+16; cels=[]
        for c in range(n):
            cs,ct=struct.unpack_from('<IH',d,p); q=p+6
            if ct==0x2004:
                flags,ltype,child,_,_,blend,op=struct.unpack_from('<HHHHHHB',d,q); nl=struct.unpack_from('<H',d,q+16)[0]
                layers.append(dict(name=d[q+18:q+18+nl].decode(),vis=flags&1,type=ltype,op=op))
            elif ct==0x2005:
                li,x,y,op,ctype,z=struct.unpack_from('<HhhBHh',d,q); r=q+16
                if ctype==2:
                    cw,chh=struct.unpack_from('<HH',d,r); raw=zlib.decompress(d[r+4:p+cs])
                    cels.append((li,x,y,cw,chh,raw,op))
                elif ctype==0:
                    cw,chh=struct.unpack_from('<HH',d,r); cels.append((li,x,y,cw,chh,d[r+4:r+4+cw*chh*depth//8],op))
                elif ctype==1:
                    cels.append((li,x,y,'link',struct.unpack_from('<H',d,r)[0],None,op))
            elif ct==0x2018:
                nt=struct.unpack_from('<H',d,q)[0]; r=q+10
                for t in range(nt):
                    fr,to=struct.unpack_from('<HH',d,r); nl=struct.unpack_from('<H',d,r+17)[0]; tags.append((d[r+19:r+19+nl].decode(),fr,to)); r+=19+nl
            elif ct==0x2019:
                ns,first,last=struct.unpack_from('<III',d,q); r=q+20
                for i in range(first,last+1):
                    fl=struct.unpack_from('<H',d,r)[0]; pal[i]=tuple(d[r+2:r+6]); r+=6
                    if fl&1: nl=struct.unpack_from('<H',d,r)[0]; r+=2+nl
            p+=cs
        frames.append(cels); pos+=fb
    return dict(w=w,h=h,depth=depth,layers=layers,frames=frames,tags=tags,pal=pal)
def cel_img(a,c):
    li,x,y,cw,chh,raw,op=c
    if a['depth']==32: return Image.frombytes('RGBA',(cw,chh),raw)
    if a['depth']==8:
        im=Image.new('RGBA',(cw,chh)); im.putdata([a['pal'][b] if b else (0,0,0,0) for b in raw]); return im
def render(a,f,only=None):
    out=Image.new('RGBA',(a['w'],a['h']))
    for c in sorted(a['frames'][f],key=lambda c:c[0]):
        if c[3]=='link':
            c2=[k for k in a['frames'][c[4]] if k[0]==c[0]]
            if not c2: continue
            c=c2[0]
        L=a['layers'][c[0]]
        if only is not None and not only(L): continue
        if only is None and not L['vis']: continue
        out.alpha_composite(cel_img(a,c),(max(0,c[1]),max(0,c[2]))) if c[1]>=0 and c[2]>=0 else out.paste(cel_img(a,c),(c[1],c[2]),cel_img(a,c))
    return out
if __name__=='__main__':
    a=parse(sys.argv[1]); print(a['w'],a['h'],a['depth'],len(a['frames'])); print([(l['name'],l['vis'],l['type']) for l in a['layers']]); print(a['tags'])
