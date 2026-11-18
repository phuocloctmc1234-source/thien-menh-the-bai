import os
from PIL import Image
SP=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(SP,'..','..','frontend','img','island')
im=Image.open(SP+'/out/island_free.png').convert('RGBA'); w,h=im.size
a=im.getchannel('A').point(lambda v:255 if v>24 else 0); px=a.load()
seen=bytearray(w*h); comps=[]
for sy in range(h):
    for sx in range(w):
        if not px[sx,sy] or seen[sy*w+sx]: continue
        st=[(sx,sy)]; seen[sy*w+sx]=1; n=0; x0=x1=sx; y0=y1=sy
        while st:
            x,y=st.pop(); n+=1
            if x<x0:x0=x
            if x>x1:x1=x
            if y<y0:y0=y
            if y>y1:y1=y
            for dx in(-1,0,1):
                for dy in(-1,0,1):
                    nx,ny=x+dx,y+dy
                    if 0<=nx<w and 0<=ny<h and px[nx,ny] and not seen[ny*w+nx]: seen[ny*w+nx]=1; st.append((nx,ny))
        comps.append([n,x0,y0,x1+1,y1+1])
comps.sort(reverse=True); big=comps[:7]; print('big areas',[c[0] for c in big],'small',len(comps)-7)
groups=[[c] for c in big]
def dist(b,c):
    dx=max(b[1]-c[3],c[1]-b[3],0); dy=max(b[2]-c[4],c[2]-b[4],0); return (dx*dx+dy*dy)**.5
for c in comps[7:]:
    if c[0]<60: continue                       # bỏ bụi nhỏ
    g=min(groups,key=lambda g:min(dist(m,c) for m in g)); g.append(c)
boxes=[(min(m[1] for m in g),min(m[2] for m in g),max(m[3] for m in g),max(m[4] for m in g)) for g in groups]
boxes.sort(key=lambda b:((b[1]+b[3])/2>h*0.5, b[0]))   # hàng trên (4) rồi hàng dưới (3), trái sang phải
for i,b in enumerate(boxes):
    t=im.crop(b); tw,th=t.size; s=max(tw,th)+14
    sq=Image.new('RGBA',(s,s),(0,0,0,0)); sq.paste(t,((s-tw)//2,(s-th)//2))
    sq.resize((360,360),Image.LANCZOS).save(os.path.join(OUT,f'a{i+1}.webp'),quality=90,method=4); print(f'a{i+1}',b,t.size,'edge-touch:',b[0]<=1 or b[1]<=1 or b[2]>=w-1 or b[3]>=h-1)
