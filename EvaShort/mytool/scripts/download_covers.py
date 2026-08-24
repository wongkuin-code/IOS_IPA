#!/usr/bin/env python3
"""Download 30 Western couple (man+woman together) cover images from Unsplash
(free license), face-cropped to 400x600 2:3, into mytool/assets/covers/poster-01..30.jpg.

All sources are `images.unsplash.com/photo-...` (Unsplash License: free commercial use).
`plus.unsplash.com` premium images are intentionally avoided.

Usage: python scripts/download_covers.py
"""
import io
import os
import sys
import urllib.request
from PIL import Image

# 30 romantic/cozy couple photos (man + woman together, drama-poster style)
PHOTOS = [
    'photo-1608145640433-937abd82a4e1',   # 01 studio couple
    'photo-1539464443546-5e3512c46694',   # 02 couple white sweaters
    'photo-1633460730540-e4029e619db8',   # 03 couple posing
    'photo-1576299657860-bd5eb28ceca7',   # 04 holding hands grey wall
    'photo-1607335620049-6026244a3118',   # 05 couple blue sky
    'photo-1610112839947-5664d10bab30',   # 06 couple rocky ground
    'photo-1542301456267-bf7db60bb9cd',   # 07 leaning on shoulder
    'photo-1653765000011-de1f5cad4fba',   # 08 couple posing
    'photo-1619687174476-03650bed65c8',   # 09 kissing
    'photo-1527184478405-b1cf212ab2a3',   # 10 looking each other by water
    'photo-1627675382774-efb7caab2370',   # 11 hug (blue/white shirt)
    'photo-1540076156429-35ffe82b7870',   # 12 kiss on forehead
    'photo-1541089404510-5c9a779841fc',   # 13 hugging each other
    'photo-1501901609772-df0848060b33',   # 14 piggyback
    'photo-1513279922550-250c2129b13a',   # 15 sitting field city
    'photo-1525206809752-65312b959c88',   # 16 loving eye contact
    'photo-1559435578-231f6137aac5',      # 17 carried & kiss blue sky
    'photo-1541385496969-a3edfa5a94ed',   # 18 kissing
    'photo-1496602910407-bacda74a0fe4',   # 19 golden hour trees
    'photo-1514480657081-a987d9a45e90',   # 20 forehead kiss on bed
    'photo-1566759996874-04d713cc224a',   # 21 hanging bridge
    'photo-1506014299253-3725319c0f69',   # 22 holding hands
    'photo-1480618376353-2950ee462b17',   # 23 shallow focus hands
    'photo-1541679368093-5c967ac6de11',   # 24 holding hands
    'photo-1617376431454-8195cf1fd668',   # 25 white dress hug
    'photo-1491582990992-68ec88e070a3',   # 26 rock overlooking lake
    'photo-1555689070-2d15336749b6',      # 27 piggyback field
    'photo-1513744985676-c7e80ee4d05e',   # 28 carrying seashore
    'photo-1531747056595-07f6cbbe10ad',   # 29 dancing among trees
    'photo-1726766406089-0308c800b6b2',   # 30 hugging in field
]

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'covers')
W = 400
H = 600
QUALITY = 82

def url_for(photo_id):
    return f'https://images.unsplash.com/{photo_id}?w={W}&h={H}&fit=crop&crop=faces&q={QUALITY}&fm=jpg&auto=format'

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    headers = {'User-Agent': 'Mozilla/5.0 (EvaShort cover asset script)'}
    ok = 0
    total = 0
    for i, photo_id in enumerate(PHOTOS, start=1):
        out_path = os.path.join(OUT_DIR, f'poster-{i:02d}.jpg')
        try:
            req = urllib.request.Request(url_for(photo_id), headers=headers)
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            img = Image.open(io.BytesIO(data)).convert('RGB')
            img.save(out_path, 'JPEG', quality=QUALITY, optimize=True)
            kb = os.path.getsize(out_path) / 1024
            total += kb
            ok += 1
            print(f'[{i:02d}] {kb:6.1f}KB  {img.size[0]}x{img.size[1]}  poster-{i:02d}.jpg')
        except Exception as e:
            print(f'[{i:02d}] FAILED {photo_id}: {e}')
    print(f'\nDone: {ok}/{len(PHOTOS)}  total {total/1024:.2f}MB  -> {OUT_DIR}')
    return 0 if ok == len(PHOTOS) else 1

if __name__ == '__main__':
    sys.exit(main())
