import os
from PIL import Image
SP=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(SP,'..','..','frontend','img','island')
im=Image.open(SP+'/out/island/sheet.png').convert('RGBA'); W,H=im.size
c=256; OFF=128  # lưới thực của sheet: 3x3 ô 256px nằm giữa ảnh 1024 (lề 128)
# thứ tự ô trong sheet 3x3: ô giữa bị bỏ trống nên 8 đảo nằm ở 8 ô còn lại
cells=[(0,0),(1,0),(2,0),(0,1),(2,1),(0,2),(1,2),(2,2)]
names=['a1','a2','a3','a4','a5','a6','a7','locked']
M=60  # lề mỗi bên để không cắt đuôi đảo / đá bay
def keep_cell(img,core):
    """Giữ các mảnh liền nhau có tâm nằm trong ô gốc (core = hộp ô không lề, toạ độ trong ảnh cắt); bỏ mảnh của đảo bên cạnh."""
    a=img.getchannel('A').point(lambda v:255 if v>24 else 0); w,h=a.size; px=a.load()
    seen=bytearray(w*h); keep=[]
    for sy in range(h):
        for sx in range(w):
            if not px[sx,sy] or seen[sy*w+sx]: continue
            st=[(sx,sy)]; seen[sy*w+sx]=1; n=0; x0=x1=sx; y0=y1=sy; sxm=sym=0
            while st:
                x,y=st.pop(); n+=1; sxm+=x; sym+=y
                x0=min(x0,x);x1=max(x1,x);y0=min(y0,y);y1=max(y1,y)
                for dx in(-1,0,1):
                    for dy in(-1,0,1):
                        nx,ny=x+dx,y+dy
                        if 0<=nx<w and 0<=ny<h and px[nx,ny] and not seen[ny*w+nx]: seen[ny*w+nx]=1; st.append((nx,ny))
            cx,cy=sxm/n,sym/n
            if n>=150 and core[0]<=cx<=core[2] and core[1]<=cy<=core[3]: keep.append((x0,y0,x1+1,y1+1))
    return img.crop((min(k[0] for k in keep),min(k[1] for k in keep),max(k[2] for k in keep),max(k[3] for k in keep)))
for (cx,cy),n in zip(cells,names):
    x0,y0=OFF+cx*c,OFF+cy*c
    box=(max(0,x0-M),max(0,y0-M),min(W,x0+c+M),min(H,y0+c+M))
    core=(x0-box[0],y0-box[1],x0+c-box[0],y0+c-box[1])
    t=keep_cell(im.crop(box),core); w,h=t.size; s=max(w,h)+12
    sq=Image.new('RGBA',(s,s),(0,0,0,0)); sq.paste(t,((s-w)//2,(s-h)//2))
    sq.resize((400,400),Image.LANCZOS).save(os.path.join(OUT,n+'.webp'),quality=90,method=4)
    print(n,box,t.size)
