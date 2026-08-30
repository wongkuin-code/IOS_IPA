#!/usr/bin/env python3
# EvaReel bulk publish: upload raw mp4s -> transcode on server (H.264+AAC+faststart,
# vertical 720x1280) -> place at /var/www/evareel-videos/<id>/<id>.mp4 -> regen catalog.json
#
# Credentials come from env (never logged / never hardcoded):
#   EVA_PASS  root password for 43.129.30.172
#   EVA_HOST  (default 43.129.30.172)   EVA_USER (default root)
#
# Server must already have ffmpeg (used: /usr/local/bin/ffmpeg, fallback `ffmpeg`).
import os, sys, json, glob, datetime

HOST = os.environ.get("EVA_HOST", "43.129.30.172")
USER = os.environ.get("EVA_USER", "root")
PASS = os.environ.get("EVA_PASS")
if not PASS:
    sys.exit("ERROR: set env EVA_PASS (root password) before running")

LOCAL_DIR = r"K:/tools/tools/IOS/IOS_IPA/EvaReel/video"
REMOTE_VIDEO = "/var/www/evareel-videos"
REMOTE_INCOMING = REMOTE_VIDEO + "/_incoming"

# ids 2..9 mapped to the titles already used in mytool/src/data/mockDramas.js
# (catalog.json `title` is cosmetic on the client; mockDramas drives display).
TITLES = {
    2: "Misty Morning Valley", 3: "Seaside Stroll", 4: "Forest Path",
    5: "Starry Night Whispers", 6: "Tea After Rain", 7: "Breezy Meadow",
    8: "Silent Snow Peak", 9: "Four Seasons Bloom",
}

import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"==> connecting {USER}@{HOST}:22")
client.connect(HOST, username=USER, password=PASS, port=22, timeout=20)
sftp = client.open_sftp()

def run(cmd, timeout=1800):
    sin, sout, serr = client.exec_command(cmd, timeout=timeout)
    out = sout.read().decode(errors="replace")
    err = serr.read().decode(errors="replace")
    return out, err

# confirm ffmpeg on server
out, err = run("command -v ffmpeg || ls -l /usr/local/bin/ffmpeg 2>/dev/null; ffmpeg -version 2>/dev/null | head -1")
ff = "/usr/local/bin/ffmpeg"
if "ffmpeg version" not in err and "ffmpeg version" not in out:
    ff = "ffmpeg"
print("==> ffmpeg:", (out + err).strip().splitlines()[-1] if (out+err).strip() else "UNKNOWN")

run(f"mkdir -p {REMOTE_INCOMING}")

files = sorted(glob.glob(os.path.join(LOCAL_DIR, "*.mp4")))
print(f"==> found {len(files)} local mp4 files")
if len(files) != 8:
    print(f"WARNING: expected 8, got {len(files)}")

mapping = []
for i, f in enumerate(files, start=2):
    if i > 9:
        break
    base = os.path.basename(f)
    remote = f"{REMOTE_INCOMING}/{base}"
    print(f"==> uploading [{i}] {base}")
    sftp.put(f, remote)
    mapping.append((i, base))

for (i, base) in mapping:
    d = f"{REMOTE_VIDEO}/{i}"
    src = f"{REMOTE_INCOMING}/{base}"
    out_mp4 = f"{d}/{i}.mp4"
    poster = f"{d}/poster.jpg"
    print(f"==> transcoding [{i}] -> {out_mp4}")
    run(f"mkdir -p {d}")
    cmd = (
        f"{ff} -y -i '{src}' "
        f"-vf \"scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p\" "
        f"-c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -preset slow -crf 23 -movflags +faststart "
        f"-c:a aac -b:a 128k -ar 44100 -ac 2 '{out_mp4}'"
    )
    o, e = run(cmd)
    if o.strip() or e.strip():
        print("   ffmpeg out:", (o + e)[-1500:])
    # poster = first frame
    run(f"{ff} -y -i '{out_mp4}' -frames:v 1 -q:v 3 '{poster}'")
    run(f"chown evareel:evareel {d} '{out_mp4}' '{poster}' 2>/dev/null || true")

# build catalog.json (keep id 1 intact, add 2..9)
catalog = {
    "baseUrl": "https://api.haoweimedia.cn/evareel/videos",
    "updatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "dramas": {
        "1": {"title": "Fated to My Vengeful Husband", "urls": {"1": "/1/1.mp4"}},
    },
}
for (i, base) in mapping:
    catalog["dramas"][str(i)] = {"title": TITLES[i], "urls": {"1": f"/{i}/{i}.mp4"}}

cat_local = "/tmp/evareel_catalog.json"
with open(cat_local, "w", encoding="utf-8") as fp:
    json.dump(catalog, fp, ensure_ascii=False, indent=2)
sftp.put(cat_local, f"{REMOTE_VIDEO}/catalog.json")
print("==> catalog.json uploaded")

# cleanup incoming raw files
run(f"rm -rf {REMOTE_INCOMING}")

# verify
out, err = run(f"cat {REMOTE_VIDEO}/catalog.json; echo '---LS---'; ls -R {REMOTE_VIDEO} | head -40")
print("==> server catalog + tree:\n", out)
if err.strip():
    print("   (stderr)", err[-500:])
# nginx local serving check
out, err = run("curl -sI http://127.0.0.1/evareel/videos/2/2.mp4 | head -5")
print("==> nginx local check (id 2):\n", out)

sftp.close()
client.close()
print("DONE")
