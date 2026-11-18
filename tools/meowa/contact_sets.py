import os,json
from PIL import Image,ImageDraw
SP=os.path.dirname(os.path.abspath(__file__)); O=SP+'/out'
M=json.load(open(O+'/set_map.json')); jobs=[j for j in M if os.path.isdir(f'{O}/{j}')]
W=Image.new('RGB',(8*150,len(jobs)*150),(90,90,110)); d=ImageDraw.Draw(W)
for r,j in enumerate(jobs):
    for i,id in enumerate(M[j]):
        p=f'{O}/{j}/{i:02d}.png'
        if os.path.exists(p):
            im=Image.open(p).convert('RGBA').resize((140,140)); W.paste(im,(i*150,r*150),im)
        d.text((i*150+3,r*150+3),id,fill='yellow')
W.save(O+'/contact_sets.png'); print(jobs)
