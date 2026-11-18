import sys,json,time,os,requests,concurrent.futures as cf
SP=os.path.dirname(os.path.abspath(__file__))
K=[l.split('=',1)[1].strip().strip('"') for l in open(os.path.join(SP,'..','..','.env')) if l.startswith('MEOWART_API_KEY')][0]
H={'Authorization':'Bearer '+K}
B='https://api.meowa.ai'
STYLE=" Anime semi-realistic painted style identical to the reference character: clean dark ink lines, soft cel shading, rich detailed colors, subtle red and navy accents. Each item centered and fully visible inside its own cell, no text, no watermark."
LAST_ERR=''
def run(name,prompt,tpl='ancient_watercolor_icon',aspect='1:1',count=8,ref='ref.jpg',style=None):
    global LAST_ERR
    for attempt in range(3):
        r=requests.post(B+'/api/hd-gen',headers=H,files={'reference_file':('ref.jpg',open(SP+'/'+ref,'rb'),'image/jpeg')},
          data={'template_name':tpl,'template_config':json.dumps({'target_count':count}),'requirement':prompt+(STYLE if style is None else style),'aspect_ratio':aspect,'resolution':'1K'})
        jid=r.json().get('api_job_id')
        if not jid: LAST_ERR=r.text[:300]; print(name,'submit fail',r.text[:200]); continue
        for _ in range(60):
            time.sleep(8)
            s=requests.get(B+'/api/hd-gen/jobs',params={'id':jid},headers=H).json()
            if s['status'] in('success','failure','cancelled'):break
        if s['status']=='success':
            d=f'{SP}/out/{name}'; os.makedirs(d,exist_ok=True)
            for i,u in enumerate(s['output']['final_sprite_paths']):
                open(f'{d}/{i:02d}.png','wb').write(requests.get(u).content)
            pv=s['output'].get('sprite_pack_preview_path')
            if pv: open(f'{d}/sheet.png','wb').write(requests.get(pv).content)
            print(name,'OK',len(s['output']['final_sprite_paths']),jid); return True
        print(name,'attempt',attempt,'failed')
    print(name,'GAVE UP'); return False
JOBS={
 'equip2':"8 fantasy RPG equipment icons, one per cell: Golden Kim Cang gauntlet, short dagger, flaming fire sword, bronze trident staff, blue lapis crystal staff, silver fist gauntlet, golden rock-breaking gauntlet, thick cloth tunic.",
 'equip3':"8 fantasy RPG equipment icons, one per cell: leather armor, chainmail armor, steel plate armor, dragon scale armor (rare, glowing), bronze ring, silver pendant necklace, jade-guardian bracelet, green jade pendant.",
 'equip4':"8 fantasy RPG equipment icons, one per cell: golden heaven-destiny talisman charm, cloth cap, leather soldier hat, iron helmet, chainmail guard helmet, holy dragon crown helmet (rare), cloth gloves, leather gloves.",
 'equip5':"8 fantasy RPG equipment icons, one per cell: steel gloves, mage gloves, divine power gauntlet gloves (rare), straw sandals, leather boots, iron boots, wind boots, cloud-walking winged boots (rare).",
 'mon1':"8 fantasy RPG monster battle sprites, one full creature per cell, front 3/4 view, forest theme: poison mushroom, shadow wolf, blood bat, skeleton warrior, poison spider, stone golem (elite, big), serpent king (boss, big snake), plus a small wooden treasure chest.",
 'mon2':"8 fantasy RPG monster battle sprites, one full creature per cell, front 3/4 view, ice cave theme: ghost spirit, sand scorpion, water squid monster, zombie, fire lizard, red oni demon (elite), frost dragon (boss), plus a small treasure chest.",
 'mon3':"8 fantasy RPG monster battle sprites, one full creature per cell, front 3/4 view, void castle theme: thunder eagle, vampire, witch, void eyeball monster, tyrant rex dinosaur (elite), void demon lord (boss), plus a dark knight, plus a small treasure chest.",
 'mon4':"8 fantasy RPG monster battle sprites, one full creature per cell, desert theme: fire snake, iron armored beetle, sand genie, ancient mummy, scorpion queen, ancient sphinx (elite), hellfire pharaoh (boss), plus a small treasure chest.",
 'mon5':"8 fantasy RPG monster battle sprites, one full creature per cell, swamp theme: poison frog, giant crocodile, water siren yokai, giant mushroom, swamp troll, hydra (elite, multi-headed), swamp queen (boss, elf-like witch), plus a small treasure chest.",
 'mon6':"8 fantasy RPG monster battle sprites, one full creature per cell, heavenly thunder palace theme: heavenly soldier, celestial archer, fallen fairy, celestial war elephant, celestial machine golem, azure dragon guardian (elite), thunder god emperor (boss), plus a small treasure chest.",
 'mon7':"8 fantasy RPG monster battle sprites, one full creature per cell, cosmic void theme: void alien, abyss octopus, blood duke vampire, nightmare black horse, void eyeball, ancient demon god (elite), cosmic destiny lord (boss), plus a small treasure chest.",
}
if __name__=='__main__':
    names=sys.argv[1:] or list(JOBS)
    with cf.ThreadPoolExecutor(6) as ex: list(ex.map(lambda n:run(n,JOBS[n]),names))
