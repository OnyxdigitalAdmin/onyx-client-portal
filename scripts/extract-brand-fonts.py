#!/usr/bin/env python3
"""Extract the web faces from brand/fonts/Shree714.ttc into public/fonts/.

Browsers cannot load a .ttc collection via @font-face, so the two faces the
portal uses are extracted to .woff2 here.

The collection holds four faces, all of the same dual-script family (Latin +
Devanagari in every face — there is no separate Latin-only face to pick):

    0  Shree Devanagari 714              -> Regular, the one we ship at 400
    1  Shree Devanagari 714 Bold         -> the one we ship at 700
    2  Shree Devanagari 714 Italic       -> unused
    3  Shree Devanagari 714 Bold Italic  -> unused

Do NOT extract these by copying the source tables verbatim. Apple ships this
collection with two defects that CoreText tolerates and OTS — the validator
Chrome and Firefox both run on every downloaded font — rejects outright:

  * cmap format 4 has rangeShift=55 where the spec requires 20, which is a
    hard failure: "OTS parsing error: cmap: unexpected range shift (55 != 20)".
  * gasp's last record is 0xFF, not the required 0xFFFF sentinel, so the whole
    table gets discarded.

Loading with lazy=False decompiles every table, so save() rewrites them from
parsed structures and recomputes the cmap binary-search header correctly. The
gasp sentinel and maxp's under-reported maxCompositePoints are fixed by hand.

Run with fontTools and brotli installed:
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/extract-brand-fonts.py

Verify the output with OTS itself before shipping it — a glyph-count check will
happily pass a font the browser refuses to decode:
    .venv/bin/pip install opentype-sanitizer
    .venv/bin/python -c "import ots,os;print(os.path.dirname(ots.__file__))"
    <that path>/ots-sanitize public/fonts/ShreeDevanagari714-Regular.woff2 /tmp/o
Both files must report "File sanitized successfully!" with no ERROR lines.
"""

from fontTools.ttLib import TTFont

SRC = "brand/fonts/Shree714.ttc"
FACES = {
    0: "public/fonts/ShreeDevanagari714-Regular.woff2",
    1: "public/fonts/ShreeDevanagari714-Bold.woff2",
}

for face_number, out_path in FACES.items():
    font = TTFont(SRC, fontNumber=face_number, lazy=False, recalcTimestamp=False)
    name = font["name"].getDebugName(4)
    print(f"face {face_number} ({name}): {len(font.getBestCmap())} mapped codepoints")

    gasp = font["gasp"].gaspRange
    if gasp and max(gasp) != 0xFFFF:
        gasp[0xFFFF] = gasp.pop(max(gasp))
        print(f"   gasp sentinel fixed -> {gasp}")

    before = font["maxp"].maxCompositePoints
    font["maxp"].recalc(font)
    if font["maxp"].maxCompositePoints != before:
        print(f"   maxCompositePoints {before} -> {font['maxp'].maxCompositePoints}")

    font.flavor = "woff2"
    font.save(out_path)
    print(f"   wrote {out_path}")
