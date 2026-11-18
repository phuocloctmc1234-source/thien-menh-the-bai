import os,json,re
from PIL import Image
SP=os.path.dirname(os.path.abspath(__file__)); O=SP+'/out'; F=os.path.join(SP,'..','..','frontend')
M=json.load(open(O+'/card_map.json'))
os.makedirs(F+'/img/card',exist_ok=True)
def trim(im,pad=4):
    im=im.convert('RGBA'); b=im.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
    if not b: return None
    im=im.crop(b); w,h=im.size; s=max(w,h)+2*pad; c=Image.new('RGBA',(s,s),(0,0,0,0)); c.paste(im,((s-w)//2,(s-h)//2)); return c
done=[]
for job,ids in M.items():
    for i,id in enumerate(ids):
        p=f'{O}/{job}/{i:02d}.png'
        if not os.path.exists(p): continue
        t=trim(Image.open(p))
        if t is None: continue
        t.resize((160,160),Image.LANCZOS).save(f'{F}/img/card/{id}.webp',quality=86,method=4); done.append(id)
open(F+'/js/cardart.js','w',encoding='utf-8').write("/* Hình thẻ bài (tạo bằng Meowa: tools/meowa/cards_gen.py + build_cards.py). Thẻ chưa có hình dùng emoji. File này do build_cards.py tự ghi. */\nconst CARD_ART=new Set('"+' '.join(done)+"'.split(' '));\n")
print(len(done),'thẻ có hình')
