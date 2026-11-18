"""Sinh hình thẻ bài bằng Meowa: mỗi job = 8 thẻ (1 lưới 8 ô, ~5 credit).
   python cards_gen.py k01        # chạy 1 job   |   python cards_gen.py   # chạy tất cả job chưa có kết quả
   Sau đó: python build_cards.py  # cắt + nén vào frontend/img/card/<mã>.webp và cập nhật frontend/js/cardart.js"""
import sys,os,json,gen
SP=os.path.dirname(os.path.abspath(__file__))
# job -> [(mã thẻ, mô tả hình bằng tiếng Anh)] đúng thứ tự ô trong lưới
JOBS={
 'k01':[('chem','a single powerful sword slash arc cutting through the air'),
        ('dam','a sword thrusting forward piercing with a streak of light'),
        ('song','two crossed longswords'),
        ('loc','a whirlwind tornado of spinning sword blades'),
        ('khi','a crescent sword-qi wave projectile glowing white-blue'),
        ('phan','a sword parrying and deflecting an incoming strike with sparks'),
        ('huyet','a blood-red battle aura around a raised sword'),
        ('hoa','a longsword wreathed in fire flames')],
}
CARD_STYLE=" Fantasy card-game spell artwork icons, each centered and fully visible in its own cell, dynamic painted look with strong glow and clear silhouette, no text, no frame, no watermark."
def prompt(job):
    return f"{len(JOBS[job])} fantasy card-game skill illustrations, one per cell in this order: "+"; ".join(f"{i+1}) {d}" for i,(_,d) in enumerate(JOBS[job]))+"."+CARD_STYLE
if __name__=='__main__':
    names=sys.argv[1:] or [j for j in JOBS if not os.path.isdir(f'{SP}/out/card_{j}')]
    m=json.load(open(SP+'/out/card_map.json')) if os.path.exists(SP+'/out/card_map.json') else {}
    for n in names:
        gen.run('card_'+n,prompt(n),count=len(JOBS[n])); m['card_'+n]=[i for i,_ in JOBS[n]]
    os.makedirs(SP+'/out',exist_ok=True); json.dump(m,open(SP+'/out/card_map.json','w'))
