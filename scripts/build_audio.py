#!/usr/bin/env python3
"""Build assets/data/audio.json — free tilawah audio manifest.

Verified-free sources (public CDNs, streamed at playback time, never bundled):
  * cdn.islamic.network   — per-ayah (global 1..6236) + whole-surah (Alafasy)
  * everyayah.com         — per-ayah fallback for reciters missing on the CDN
  * audio.qurancdn.com    — per-word pronunciation (wbw/SSS_AAA_PPP.mp3)

  --check : structural validation (CI, no network)
  --probe : HEAD-request a few URLs of each template (manual/network)
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "data" / "audio.json"

CDN = "https://cdn.islamic.network/quran/audio/128/{reciter}/{g}.mp3"
CDN_SURAH = "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/{s}.mp3"
EVERYAYAH = "https://everyayah.com/data/{dir}/{padded}.mp3"
WORD_BASE = "https://audio.qurancdn.com/"

RECITERS = [
    {"id": "ar.alafasy", "en": "Mishary Rashid Alafasy", "bn": "মিশারি রাশিদ আল-আফাসি",
     "ayah": CDN.replace("{reciter}", "ar.alafasy"),
     "fallback": EVERYAYAH.replace("{dir}", "Alafasy_128kbps"),
     "surah": CDN_SURAH},
    {"id": "ar.husary", "en": "Mahmoud Khalil Al-Husary", "bn": "মাহমুদ খালিল আল-হুসাইনি",
     "ayah": CDN.replace("{reciter}", "ar.husary"),
     "fallback": EVERYAYAH.replace("{dir}", "Husary_128kbps"),
     "surah": ""},
    {"id": "ar.minshawi", "en": "Mohamed Siddiq El-Minshawi", "bn": "মোহাম্মদ সিদ্দিক আল-মিনশাওি",
     "ayah": CDN.replace("{reciter}", "ar.minshawi"),
     "fallback": "",
     "surah": ""},
    {"id": "ar.hudhaify", "en": "Ali Al-Hudhaify", "bn": "আলী আল-হুদাইফি",
     "ayah": CDN.replace("{reciter}", "ar.hudhaify"),
     "fallback": "",
     "surah": ""},
    {"id": "abdulbasit", "en": "Abdul Basit Abdus Samad (Murattal)",
     "bn": "আবদুল বাসিত আবদুস সামাদ",
     "ayah": "",
     "fallback": EVERYAYAH.replace("{dir}", "Abdul_Basit_Murattal_192kbps"),
     "surah": ""},
    {"id": "ghamadi", "en": "Saad Al-Ghamadi", "bn": "সা'দ আল-ঘামদি",
     "ayah": "",
     "fallback": EVERYAYAH.replace("{dir}", "Ghamadi_40kbps"),
     "surah": ""},
]


def counts_and_offsets():
    data = json.loads((ROOT / "assets" / "data" / "quran_ar.json").read_text("utf-8"))
    counts = [len(data[str(n)]) for n in range(1, 115)]
    offsets, run = [], 0
    for c in counts:
        offsets.append(run)
        run += c
    if len(counts) != 114 or run != 6236:
        raise SystemExit(f"bad counts: {len(counts)} surahs / {run} ayahs")
    return counts, offsets


def build():
    counts, offsets = counts_and_offsets()
    manifest = {
        "counts": counts,
        "offsets": offsets,
        "surah": CDN_SURAH,
        "wordBase": WORD_BASE,
        "reciters": RECITERS,
        "source": "cdn.islamic.network · everyayah.com · audio.qurancdn.com "
                  "(free public Quran audio CDNs; streamed, not redistributed)",
    }
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n",
                   encoding="utf-8")
    print(f"build_audio: {OUT.name} — {len(RECITERS)} reciters, "
          f"{sum(counts)} ayahs, offsets OK")


def check():
    if not OUT.exists():
        raise SystemExit("audio.json missing")
    m = json.loads(OUT.read_text("utf-8"))
    counts, offsets = m.get("counts", []), m.get("offsets", [])
    if len(counts) != 114 or sum(counts) != 6236:
        raise SystemExit(f"counts bad: {len(counts)}/"
                         f"{sum(counts) if counts else 0}")
    if len(offsets) != 114 or offsets[0] != 0 or offsets[1] != 7:
        raise SystemExit(f"offsets bad: {offsets[:3]}")
    if offsets[-1] + counts[-1] != 6236:
        raise SystemExit("last offset+count != 6236")
    rec = m.get("reciters", [])
    if not rec:
        raise SystemExit("no reciters")
    for r in rec:
        if not (r.get("ayah") or r.get("fallback")):
            raise SystemExit(f"reciter {r.get('id')} has no ayah url")
    if "{s}" not in m["surah"]:
        raise SystemExit("surah template missing {s}")
    if not m.get("wordBase", "").startswith("http"):
        raise SystemExit("wordBase missing")
    print(f"build_audio --check: {len(rec)} reciters, "
          f"{sum(counts)} ayahs, offsets OK")


def probe():
    import urllib.request
    m = json.loads(OUT.read_text("utf-8"))
    offs = m["offsets"]
    probes = []
    for r in m["reciters"]:
        tmpl = r.get("ayah") or r.get("fallback")
        g = 6236  # last ayah — hardest file
        u = tmpl.format(g=g, padded="114006", s=1)
        probes.append((r["id"], u))
    probes.append(("surah", m["surah"].format(s=114)))
    probes.append(("word", m["wordBase"] + "wbw/112_001_001.mp3"))
    bad = 0
    for name, u in probes:
        req = urllib.request.Request(u, headers={"User-Agent": "check"},
                                     method="HEAD")
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                code = resp.status
        except Exception as e:  # noqa: BLE001
            code = f"ERR {e}"
        ok = code in (200, 206)
        print(f"  {'OK ' if ok else 'BAD'} {name}: {code} {u}")
        bad += 0 if ok else 1
    if bad:
        raise SystemExit(f"{bad} probe(s) failed")
    print("probe: all templates reachable")


if __name__ == "__main__":
    if "--probe" in sys.argv:
        probe()
    elif "--check" in sys.argv:
        check()
    else:
        build()
