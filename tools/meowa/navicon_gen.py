import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import gen
P=("8 glossy mobile game menu button icons, bold simple readable shapes, thick dark outline, gold trim, shiny highlights and soft glow, same glossy badge art style as the reference image, no text, one icon per cell, centered with empty margin: "
 "cell 1: a cute merchant shop storefront with striped awning; "
 "cell 2: a pink-red adventurer backpack with straps and buckles; "
 "cell 3: a small glowing planet globe with continents and a ring; "
 "cell 4: a fan of three trading cards with a gold frame and a gem; "
 "cell 5: a wooden treasure chest with golden bands, slightly open with a glow; "
 "cell 6: a golden trophy cup with two handles and a star; "
 "cell 7: a quest scroll with a red target bullseye and a check mark; "
 "cell 8: a closed leather guide book with a golden question mark emblem.")
gen.run('navicon',P,ref='ref_icon.jpg',style=" Keep each icon fully visible inside its own cell with generous margin on all sides.")
