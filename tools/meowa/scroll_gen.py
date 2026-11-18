import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import gen
P=("8 fantasy RPG upgrade scroll item icons, game inventory icon style, each a single rolled parchment scroll tied with a ribbon and a wax seal, exactly one scroll per cell, each scroll with a different glowing color and a different emblem on the seal: "
 "cell 1: red-orange scroll with a glowing sword emblem; "
 "cell 2: blue scroll with a glowing helmet emblem; "
 "cell 3: silver-steel colored scroll with a glowing armor chestplate emblem; "
 "cell 4: green scroll with a glowing gauntlet glove emblem; "
 "cell 5: brown-gold scroll with a glowing winged boot emblem; "
 "cell 6: purple scroll with a glowing ring emblem; "
 "cell 7: white and gold mystery scroll with a glowing question mark emblem; "
 "cell 8: a golden blacksmith anvil with a hammer and sparks.")
gen.run('scroll',P)
