"""Tự dựng lời nhắc cho TẤT CẢ thẻ từ tên + mô tả rồi sinh hình theo thứ tự ưu tiên
   (khởi đầu > huyền thoại > hiếm > tốt > thường), dừng ngay khi hết credit.
   Chạy lại sau khi nạp thêm credit: job đã có kết quả sẽ được bỏ qua.
     python cards_auto.py --list        # xem danh sách job
     python cards_auto.py [số_job_tối_đa]
     python build_cards.py              # cắt + nén vào frontend/img/card và cập nhật cardart.js
   Cần out/cards.json (xuất từ CARDS trong frontend/js) — đã có sẵn."""
import sys, os, json, gen
SP = os.path.dirname(os.path.abspath(__file__)); O = SP + '/out'
CARDS = json.load(open(O + '/cards.json', encoding='utf-8'))
DONE_TEST = ('chem', 'dam', 'song', 'loc', 'khi', 'phan', 'huyet', 'hoa')  # đã tạo ở job thử k01
THEME = {'kiem': 'wuxia swordsman', 'bang': 'ice mage', 'thach': 'shaolin monk martial arts', '*': 'neutral'}
# từ trong tên thẻ -> khái niệm tiếng Anh
G = [('kim cang', 'golden vajra guardian'), ('la hán', 'arhat monk'), ('phật', 'buddha lotus light'), ('long hổ', 'dragon and tiger'),
     ('song long', 'twin dragons'), ('hỏa phượng', 'fire phoenix'), ('thần hổ', 'divine tiger'), ('thái sơn', 'massive mountain'),
     ('thiên địa', 'heaven and earth'), ('thiên kiếm', 'heavenly swords'), ('vạn kiếm', 'ten thousand flying swords'),
     ('thiên thủ quan âm', 'thousand-armed guanyin'), ('thiên thạch', 'falling meteor'), ('hủy diệt', 'annihilation'),
     ('bát quái', 'bagua trigrams'), ('ngũ hành', 'five elements'), ('băng hà', 'glacier'), ('băng tâm', 'frozen heart crystal'),
     ('băng giáp', 'ice armor'), ('băng thuẫn', 'ice shield'), ('băng tiễn', 'ice arrow'), ('băng kiếm', 'ice sword'),
     ('băng châm', 'ice needle'), ('băng hỏa', 'ice and fire yin-yang'), ('băng', 'ice'), ('hàn', 'freezing cold'),
     ('tuyết', 'snow blizzard'), ('sương', 'mist fog'), ('phong ấn', 'sealing talisman'), ('phong', 'wind'), ('liệt hỏa', 'blazing fire'),
     ('hỏa', 'fire'), ('lôi', 'thunder lightning'), ('sét', 'lightning bolt'), ('xung điện', 'electric surge'), ('điện', 'electricity'),
     ('độc', 'poison toxic'), ('chảy máu', 'bleeding'), ('huyết', 'blood'), ('máu', 'blood'), ('kiếm', 'sword'), ('đao', 'saber blade'),
     ('chém', 'slash'), ('trảm', 'cleaving strike'), ('đâm', 'thrust'), ('quyền', 'fist punch'), ('chưởng', 'palm strike'),
     ('cước', 'kick'), ('thiết', 'iron'), ('thạch', 'stone'), ('đá', 'stone rock'), ('giáp', 'armor shield'),
     ('hộ thể', 'protective body aura'), ('hộ pháp', 'dharma guardian'), ('hộ', 'guardian ward'), ('thuẫn', 'shield'),
     ('kết giới', 'magic barrier'), ('long', 'dragon'), ('hổ', 'tiger'), ('phượng', 'phoenix'), ('quỷ', 'demon ghost'),
     ('ma ', 'demon dark magic '), ('thần', 'divine god'), ('nộ', 'rage fury'), ('cuồng', 'frenzy'), ('tụ', 'gathering energy'),
     ('khí', 'qi energy'), ('linh', 'spirit'), ('pháp', 'magic art'), ('chú', 'curse spell'), ('ấn', 'seal mark'), ('dấu', 'mark'),
     ('nguyền', 'curse'), ('hồi xuân', 'spring regeneration green leaves'), ('hồi', 'healing'), ('thiền', 'meditation'),
     ('động đất', 'earthquake'), ('chấn', 'shockwave'), ('địa', 'earth'), ('thiên', 'heaven'), ('vô cực', 'infinite void'),
     ('vô hạn', 'infinite'), ('luân hồi', 'reincarnation cycle'), ('thời gian', 'time hourglass'), ('thời không', 'space-time'),
     ('bất tử', 'immortal'), ('bất động', 'immovable'), ('bất hoại', 'indestructible'), ('bất diệt', 'undying'), ('gai', 'thorns spikes'),
     ('cột', 'pillar'), ('vân', 'cloud'), ('lốc', 'whirlwind'), ('bão', 'storm'), ('cầu', 'orb'), ('tử vong', 'death'),
     ('hấp thụ', 'absorbing'), ('hút', 'draining'), ('giáng', 'descending'), ('hạ phàm', 'descending to earth'),
     ('tái sinh', 'rebirth'), ('nhiếp', 'soul capture'), ('hồn', 'soul'), ('đoạt mệnh', 'life-taking'), ('nhân đôi', 'doubling'),
     ('nguyên tố', 'elemental'), ('bùng nổ', 'explosion'), ('cộng hưởng', 'resonance'), ('quán đỉnh', 'empowerment light from above'),
     ('kim thân', 'golden body'), ('ngọc', 'jade'), ('tảo', 'sweeping'), ('mài', 'sharpening'), ('uy áp', 'intimidating aura'),
     ('nhìn thấu', 'all-seeing eye'), ('phản', 'counter reflecting'), ('thủ', 'defense'), ('công', 'attack'), ('liên', 'chain'),
     ('tam', 'triple'), ('bóng', 'shadow'), ('tay', 'hand'), ('vết thương', 'wound'), ('sa', 'sand'), ('lá chắn', 'shield'),
     ('tường', 'wall')]
G.sort(key=lambda x: -len(x[0]))
CUE = [('Giáp', 'with a glowing defensive barrier'), ('Kết giới', 'with a shimmering magic ward'), ('Sức mạnh', 'radiating power aura'),
       ('Độc', 'toxic green poison'), ('Thiêu đốt', 'burning flames'), ('Đóng băng', 'frozen ice crystals'), ('Chảy máu', 'blood splatter'),
       ('Hút máu', 'crimson life-drain'), ('Hồi', 'soft healing green light'), ('Rút', 'floating glowing cards'),
       ('Năng lượng', 'bright energy spark'), ('Gai', 'sharp spikes'), ('TẤT CẢ', 'wide area burst'), ('Dấu ấn', 'glowing target mark'),
       ('Yếu', 'dark weakening curse'), ('Dễ vỡ', 'cracking shatter'), ('Suy nhược', 'draining gloom')]


def concept(c):
    n = c['n'].lower() + ' '
    parts = []
    for k, v in G:
        if k in n and v not in parts:
            parts.append(v)
            n = n.replace(k, '#', 1)
        if len(parts) >= 3:
            break
    cues = [v for k, v in CUE if k in c['d']][:2]
    kind = {'atk': 'attack skill', 'skill': 'defensive or utility skill', 'pow': 'passive power-up'}[c['t']]
    return f"{kind} '{c['n']}' ({THEME.get(c['h'], '')}): " + (', '.join(parts) or 'martial arts energy') + (' ' + ', '.join(cues) if cues else '')


ORDER = ['s', 'l', 'r', 'u', 'c']
cards = sorted([c for c in CARDS if c['id'] not in DONE_TEST], key=lambda c: (ORDER.index(c['r']), c['h'], c['id']))
JOBS = {}
for i in range(0, len(cards), 8):  # gói đều 8 thẻ/job theo thứ tự ưu tiên (tránh job lẻ lãng phí credit)
    grp = cards[i:i + 8]
    JOBS[f"a{i // 8:02d}_{grp[0]['r']}"] = [(c['id'], concept(c)) for c in grp]
STYLE = " Fantasy card-game spell artwork icons, each centered and fully visible in its own cell, dynamic painted look with strong glow and clear silhouette, no text, no frame, no watermark."


def prompt(j):
    return f"{len(JOBS[j])} fantasy card-game skill illustrations, one per cell in this order: " + "; ".join(f"{k + 1}) {d}" for k, (_, d) in enumerate(JOBS[j])) + "." + STYLE


if __name__ == '__main__':
    if '--list' in sys.argv:
        for j, v in JOBS.items():
            print(j, len(v))
        print(len(JOBS), 'job')
        sys.exit()
    nums = [a for a in sys.argv[1:] if a.isdigit()]
    mx = int(nums[0]) if nums else 999
    mp = f'{O}/card_map.json'
    m = json.load(open(mp)) if os.path.exists(mp) else {}
    done = 0
    for j in JOBS:
        if os.path.isdir(f'{O}/card_{j}'):
            continue
        if done >= mx:
            break
        ok = gen.run('card_' + j, prompt(j), count=len(JOBS[j]))
        if not ok:
            print('DUNG (co the het credit):', gen.LAST_ERR)
            break
        m['card_' + j] = [k for k, _ in JOBS[j]]
        json.dump(m, open(mp, 'w'))
        done += 1
    print('da tao', done, 'job')
