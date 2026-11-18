import os,json,re
from PIL import Image
SP=os.path.dirname(os.path.abspath(__file__)); O=SP+'/out'
F=os.path.join(SP,'..','..','frontend')
M=json.load(open(O+'/set_map.json'))
def trim(im,pad=6):
    im=im.convert('RGBA'); a=im.getchannel('A').point(lambda v:255 if v>24 else 0); b=a.getbbox()
    if not b: return None
    im=im.crop(b); w,h=im.size; s=max(w,h)+2*pad; c=Image.new('RGBA',(s,s),(0,0,0,0)); c.paste(im,((s-w)//2,(s-h)//2)); return c
done=[]
for job,ids in M.items():
    d=f'{O}/{job}'
    if not os.path.isdir(d): continue
    for i,id in enumerate(ids):
        p=f'{d}/{i:02d}.png'
        if not os.path.exists(p): continue
        t=trim(Image.open(p))
        if t is None: continue
        t.resize((144,144),Image.LANCZOS).save(f'{F}/img/equip/{id}.webp',quality=88,method=4); done.append(id)
js=open(F+'/js/sets.js',encoding='utf-8').read()
js=re.sub(r"new Set\('[^']*'\.split\(' '\)\)","new Set('"+' '.join(done)+"'.split(' '))",js,1)
open(F+'/js/sets.js','w',encoding='utf-8').write(js)
print(len(done),done)
