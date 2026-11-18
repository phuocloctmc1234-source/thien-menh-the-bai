import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import gen, concurrent.futures as cf

# id bo -> (mo ta phong cach, [vu khi, mu, giap, gang tay, giay, nhan])
SETS=[
 ('k1','plain travel-worn style: brown leather, tan cloth, simple steel, muted earth tones',['plain traveler steel longsword with leather grip','wide-brim leather traveler hat','hooded travel cloak with leather straps','worn leather traveling gloves','sturdy brown traveling boots','simple bronze band ring']),
 ('k2','city guard style: polished steel with royal blue tabard and silver trim',['guard captain steel sword with blue-wrapped hilt','steel guard helmet with blue plume','steel breastplate with blue tabard','steel guard gauntlets with blue trim','steel greaves boots with blue trim','silver signet ring with city crest']),
 ('k3','swift wind style: light silver-teal armor with feather motifs and wind swirls',['slender wind sword with feather crossguard and teal glow','silver winged helmet with feather crest','light teal-silver armor with feather pauldrons','silver gloves with feather fins','winged silver boots with teal wind swirl','silver ring with a feather and teal gem']),
 ('k4','blood moon style: black and crimson gear with crescent moon motifs',['crescent-bladed crimson katana with black hilt','black helmet with crescent moon crest and red gem','black armor with crimson crescent emblem','black gauntlets with red crescent blades','black boots with crimson trim','blood-red ruby ring with crescent moon']),
 ('k5','red dragon style: crimson dragon scale armor with gold trim, flames and dragon horns',['dragon-fang sword with flaming crimson blade and gold dragon guard','crimson dragon-head helmet with golden horns','crimson dragon scale armor with golden dragon shoulders','crimson dragon claw gauntlets with gold','crimson dragon scale boots with golden talons','gold dragon ring with red gem eye']),
 ('k6','celestial sword sect style: white and azure robes armor with gold celestial patterns and glowing blue light',['celestial longsword with glowing azure blade and gold wing guard','white and gold celestial helm with azure gem','white-azure celestial armor with gold patterns','white gauntlets with golden celestial runes','white boots with azure glow and gold trim','golden ring with floating azure sword gem']),
 ('b1','apprentice mage style: blue-grey cloth robes, simple wood and brass, small blue gem',['simple wooden apprentice staff with small blue orb','blue-grey pointed apprentice hood hat','blue-grey apprentice mage robe with brass buttons','cloth apprentice gloves with blue cuffs','soft cloth apprentice boots','brass ring with small blue gem']),
 ('b2','white snow style: white fur trim, pale blue cloth, snowflake motifs',['white wood staff topped with snowflake and fur wrap','white fur-trimmed winter hood','white fur-collared pale blue robe','white fur-lined mittens with snowflake','white fur-trimmed snow boots','silver snowflake ring']),
 ('b3','frozen ice style: translucent blue ice crystals, silver frames, frost glow',['ice crystal staff with large frozen shard head','crystal ice crown helm','ice crystal armored robe with frost shoulders','ice crystal gauntlet gloves','frozen crystal boots with frost mist','ice crystal ring with frozen gem']),
 ('b4','storm cloud style: deep purple and silver gear with lightning bolts and swirling clouds',['storm staff with lightning bolt tip and purple orb','purple storm hood with silver lightning circlet','purple storm robe with silver cloud patterns','purple gloves crackling with lightning','purple boots with lightning streaks','silver ring with purple lightning gem']),
 ('b5','celestial frost style: pure white and silver with gold accents, huge glowing frost star, regal',['grand frost-star staff with glowing white-gold star crown','regal white-silver frost tiara helm with gold','regal white and silver frost robe with gold embroidery and long cape','white gloves with golden frost filigree','white and silver boots with golden wings','gold and diamond frost star ring']),
 ('b6','aurora style: shimmering teal, green and violet aurora gradients, glowing ribbons of light',['aurora staff with swirling teal-violet light orb','aurora circlet helm with flowing light ribbons','aurora gradient robe with glowing ribbons','gloves with flowing aurora light','boots with glowing aurora ribbons','ring with aurora gradient gem']),
 ('t1','plain monk training style: undyed cloth wraps, brown leather, simple iron, humble',['simple heavy iron fist gauntlet with leather straps','plain cloth monk headband','plain tan monk training vest with cloth wraps','cloth hand wraps with leather bracers','plain straw-and-cloth monk shoes','plain iron ring']),
 ('t2','grey stone guardian style: carved grey granite pieces with moss and runes',['carved grey stone heavy fist gauntlet with runes','carved stone helmet with runes','heavy carved grey stone armor','stone bracers with runes','heavy stone boots','grey stone ring with rune']),
 ('t3','vajra style: bronze and gold ornate Buddhist vajra motifs, orange cloth',['golden vajra fist gauntlet with bronze spikes','bronze monk crown with golden vajra emblem','bronze and orange cloth armor with golden vajra','bronze bracers with vajra engravings','bronze boots with golden trim','golden vajra ring']),
 ('t4','earth dragon style: brown and mossy green dragon-scale armor, earthen rock chunks',['earth dragon fist gauntlet made of rock and brown scales','earth dragon horned helmet of brown scales and moss','earth dragon scale armor brown and green with rock shoulders','earth dragon claw bracers','earth dragon scale boots','earth dragon ring with green gem']),
 ('t5','golden body style: shining gold and orange muscular-themed gear, radiant aura, powerful',['radiant golden power fist gauntlet with orange flames','golden radiant crown helm','golden orange muscle-plate chest armor with glowing aura','golden power bracers with glowing aura','golden greaves boots with orange glow','large golden power ring with orange gem']),
 ('t6','arhat style: saffron orange and crimson robes with gold prayer beads and Buddhist halo motifs',['arhat fist gauntlet with golden halo and prayer beads','golden arhat halo helmet with crimson cloth','saffron and crimson arhat armor with gold beads','arhat bracers with prayer beads and gold','saffron and crimson arhat boots with gold trim','golden prayer-bead ring with crimson gem']),
]
SLOTN=['weapon','helm','armor','gloves','boots','ring']
ITEMS=[]
for sid,motif,pcs in SETS:
    for sl,desc in zip(SLOTN,pcs): ITEMS.append((f'{sid}_{sl}',motif,desc))
JOBS={}
for j in range(0,len(ITEMS),8):
    ch=ITEMS[j:j+8]; name=f'set{j//8+1:02d}'
    lst='; '.join(f'cell {i+1}: {d} ({m.split(":")[0] if False else m})' for i,(k,m,d) in enumerate(ch))
    JOBS[name]=(f'{len(ch)} fantasy RPG equipment icons, exactly one item per cell, in this order. '+lst+'.', [k for k,_,_ in ch])
# set03 từng bị vẽ lệch (ra đồ trang sức cổ): mô tả rõ hơn từng ô là trang bị chiến đấu
JOBS['set03']=("8 fantasy RPG armor and weapon equipment icons for a swordsman, exactly one item per cell, game inventory icon style, NOT jewelry or ornaments: "
 "cell 1: a pair of light silver combat boots with white feather wings and teal glow; cell 2: a silver ring with a small feather and teal gem; "
 "cell 3: a black curved crimson katana sword with crescent moon guard; cell 4: a black war helmet with crescent moon crest and red gem; "
 "cell 5: black plate armor with crimson crescent moon emblem; cell 6: black steel gauntlets with red crescent blade spikes; "
 "cell 7: black combat boots with crimson trim; cell 8: a blood-red ruby ring with crescent moon shape.",JOBS['set03'][1])
# set12 (Địa Long) từng bị vẽ thành đồ trang sức: mô tả rõ là giáp trụ chiến đấu
JOBS['set12']=("8 fantasy RPG martial-arts monk equipment icons, game inventory icon style, NOT jewelry or ornaments, exactly one item per cell: "
 "cell 1: a pair of bronze monk combat boots with orange cloth ties; cell 2: a golden prayer-bead ring; "
 "cell 3: a heavy fist-weapon gauntlet made of brown rock and mossy green dragon scales; cell 4: a horned combat helmet made of brown dragon scales and moss; "
 "cell 5: a full chest armor of brown and green dragon scales with rock shoulder plates; cell 6: a pair of forearm bracers made of dragon scales with claws; "
 "cell 7: a pair of heavy combat boots made of dragon scales and rock; cell 8: a ring with a carved green dragon head and green gem.",JOBS['set12'][1])
if __name__=='__main__':
    import json
    names=sys.argv[1:] or list(JOBS)
    json.dump({n:JOBS[n][1] for n in JOBS},open(os.path.dirname(os.path.abspath(__file__))+'/out/set_map.json','w'))
    def go(n): gen.run(n,JOBS[n][0],count=len(JOBS[n][1]) if len(JOBS[n][1])>=8 else 8)
    with cf.ThreadPoolExecutor(5) as ex: list(ex.map(go,names))
