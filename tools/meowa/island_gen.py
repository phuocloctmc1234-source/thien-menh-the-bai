import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import gen
name=sys.argv[1] if len(sys.argv)>1 else 'island'
P=("8 floating island dioramas for a mobile RPG stage-select screen. IMPORTANT: each island must be drawn SMALL, occupying only about 55% of its cell width and height, centered, with a very large empty margin on all four sides, "
 "and the ENTIRE island including the full pointed rock tip at the very bottom and all small floating rocks must be completely visible inside the cell, nothing touching or cut by the cell edges. "
 "Single floating chunk of land with rocky underside ending in a pointed tip, three-quarter top-down view, game icon style, one island per cell in this order: "
 "cell 1: dark eerie forest island with twisted trees, glowing green mushrooms and a mossy path; "
 "cell 2: frozen ice cave island with blue ice crystals, snow and frozen rocks; "
 "cell 3: ruined gothic void castle island with purple and crimson magic glow and broken pillars; "
 "cell 4: scorching desert island with sandstone pyramid ruins, dunes and a glowing sun disc; "
 "cell 5: poisonous swamp island with murky green water, dead mossy trees and toxic bubbles; "
 "cell 6: celestial thunder palace island with golden-white pillars, storm clouds and lightning; "
 "cell 7: cosmic void island with violet and teal nebula glow, floating shattered rocks, tiny galaxy swirl and a glowing pink energy stream; "
 "cell 8: a mysterious locked island wrapped in dark clouds with a big chain and padlock.")
gen.run(name,P)
