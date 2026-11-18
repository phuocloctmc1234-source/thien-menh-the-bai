import os,time,requests
SP=os.path.dirname(os.path.abspath(__file__))
K=[l.split('=',1)[1].strip().strip('"') for l in open(os.path.join(SP,'..','..','.env')) if l.startswith('MEOWART_API_KEY')][0]
H={'Authorization':'Bearer '+K}; B='https://api.meowa.ai'
P=("Seven separate floating island dioramas for a mobile RPG stage-select screen, arranged in two rows (4 on top, 3 below) on a plain flat background with VERY wide empty spacing between them so no island touches another or the image border. "
 "Each island is a single chunk of floating land with a rocky underside ending in a full pointed rock tip, with a few small floating rocks near it, three-quarter top-down view, the whole island and its whole bottom tip completely visible. "
 "Same painted anime semi-realistic art style as the reference image. Islands in reading order: "
 "1 dark eerie forest island with twisted trees, glowing green mushrooms and a mossy path; "
 "2 frozen ice cave island with blue ice crystals and snow; "
 "3 ruined gothic void castle island with purple and crimson magic glow and broken pillars; "
 "4 scorching desert island with a sandstone pyramid, ruins and a glowing sun disc behind it; "
 "5 poisonous swamp island with murky green water, dead mossy trees and toxic bubbles; "
 "6 celestial thunder palace island with golden-white pillars, storm clouds and lightning; "
 "7 cosmic void island with violet and teal nebula glow, floating shattered rocks and a small galaxy swirl.")
r=requests.post(B+'/api/workflows/image_edit/run',headers=H,files={'reference_images':('ref.jpg',open(SP+'/ref.jpg','rb'),'image/jpeg')},
  data={'prompt':P,'aspect_ratio':'16:9','resolution':'2K','generation_provider':'image2_5','remove_bg_method':'standard','mode':'hd'})
print(r.status_code,r.text[:200]); jid=r.json().get('job_id')
for _ in range(80):
    time.sleep(8); s=requests.get(B+'/api/jobs/'+jid,headers=H).json()
    if s.get('status') in('success','failure','cancelled'):break
print(s.get('status'), (s.get('result') or {}).get('metadata',{}).get('edited_size'))
if s.get('status')=='success':
    res=s['result']; u=res.get('remove_bg_path') or res.get('url'); print([k for k in res])
    open(SP+'/out/island_free.png','wb').write(requests.get(u).content)
