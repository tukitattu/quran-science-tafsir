#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build SQLite tafsir.db from existing JS/JSON data
Reads: deep_research.js, surah_knowledge.js, wiki_map.js, ghaur_ofikr_map.js, chapters.js, paras.json
Creates: tafsir.db with CREATE TABLE for surahs, verses, words, tafsir, figures, etc.
Then VACUUM and gzip -9
"""
import json, re, sqlite3, gzip, pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/data"
WORK = pathlib.Path("/tmp/opencode/work")
DB_PATH = ROOT / "tafsir.db"

def load_js_object(path, var_name):
    """Load JS const X = { ... }; and return dict (uses Node for robustness)"""
    import subprocess as sp, json as js2
    # Try Node evaluation first (most robust for JS object literals)
    try:
        node_code = f"""
const fs=require('fs');
const src=fs.readFileSync('{path}', 'utf8');
const m=src.match(/const {var_name}\\s*=\\s*(\\{{.*\\}});/s);
if(!m){{console.error('not found'); process.exit(1)}}
let obj;
try{{ eval('obj='+m[1]); }}catch(e){{ console.error(e.message); process.exit(1)}}
console.log(JSON.stringify(obj));
"""
        result = sp.run(["node", "-e", node_code], capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and result.stdout.strip():
            return js2.loads(result.stdout)
    except Exception as e:
        pass
    # Fallback to regex method
    src = pathlib.Path(path).read_text(encoding="utf-8")
    m = re.search(rf"const {re.escape(var_name)}\s*=\s*(\{{.*\}});", src, re.S)
    if not m:
        raise ValueError(f"{var_name} not found in {path}")
    raw = m.group(1)
    try:
        return json.loads(raw)
    except:
        pass
    raw_json = re.sub(r'([{,\n]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', raw)
    raw_json = re.sub(r'([\{\s,])(\d+):', r'\1"\2":', raw_json)
    return json.loads(raw_json)

def load_chapters():
    src = (ASSETS / "chapters.js").read_text(encoding="utf-8")
    m = re.search(r"chapters:\s*\[(.*?)\]\s*\}", src, re.S)
    vals = re.findall(r'\{\s*n:\s*(\d+),\s*ar:\s*"([^"]*)",\s*en:\s*"([^"]*)",\s*bn:\s*"([^"]*)"\s*\}', m.group(1))
    return {int(n): {"ar": ar, "en": en, "bn": bn} for n, ar, en, bn in vals}

def main():
    print("Loading data...")
    deep = load_js_object(ASSETS / "deep_research.js", "DEEP_RESEARCH")
    know = load_js_object(ASSETS / "surah_knowledge.js", "SURAH_KNOWLEDGE")
    wiki = load_js_object(ASSETS / "wiki_map.js", "WIKI_MAP")
    # ghaur may not exist on first run, handle gracefully
    try:
        ghaur = load_js_object(ASSETS / "ghaur_ofikr_map.js", "GHAUR_O_FIKR_MAP")
    except:
        ghaur = {}
    chapters = load_chapters()
    paras = json.loads((WORK / "paras.json").read_text(encoding="utf-8")) if (WORK / "paras.json").exists() else {}
    # Load Bengali translations cache (trans_cache.json: "surah:paraIdx" -> bn text)
    trans_cache = {}
    tc_path = WORK / "trans_cache.json"
    if tc_path.exists():
        try:
            trans_cache = json.loads(tc_path.read_text(encoding="utf-8"))
            print(f"Loaded trans_cache: {len(trans_cache)} entries")
        except Exception as e:
            print(f"trans_cache load fail: {e}")
    # Also check assets copy
    if not trans_cache and (ROOT / "assets" / "trans_cache.json").exists():
        try:
            trans_cache = json.loads((ROOT / "assets" / "trans_cache.json").read_text(encoding="utf-8"))
        except: pass

    # Also try alt_meanings.json if exists
    alt_path = ASSETS / "alt_meanings.json"
    alts = {}
    if alt_path.exists():
        try:
            alts = json.loads(alt_path.read_text(encoding="utf-8"))
        except:
            pass

    if DB_PATH.exists():
        DB_PATH.unlink()
    con = sqlite3.connect(str(DB_PATH))
    cur = con.cursor()

    # Schema
    cur.executescript("""
    PRAGMA journal_mode=WAL;
    CREATE TABLE surahs (
        id INTEGER PRIMARY KEY,
        ar TEXT, en TEXT, bn TEXT,
        verses INTEGER, type TEXT
    );
    CREATE TABLE verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_id INTEGER,
        ayah_num INTEGER,
        ar TEXT, en TEXT, bn TEXT,
        FOREIGN KEY(surah_id) REFERENCES surahs(id)
    );
    CREATE TABLE words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_id INTEGER,
        w TEXT, tr TEXT, root TEXT, form TEXT, why TEXT,
        en TEXT, bn TEXT,
        root_analysis TEXT, alternative_meanings TEXT,
        FOREIGN KEY(surah_id) REFERENCES surahs(id)
    );
    CREATE TABLE tafsir (
        surah_id INTEGER PRIMARY KEY,
        amud_en TEXT, amud_bn TEXT, amud_ar TEXT,
        nazm_en TEXT, nazm_bn TEXT, nazm_ar TEXT,
        gaur_fikr TEXT, balagha TEXT, multiple_meanings TEXT,
        FOREIGN KEY(surah_id) REFERENCES surahs(id)
    );
    CREATE TABLE figures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_id INTEGER,
        fig_num TEXT, page INTEGER, path TEXT,
        FOREIGN KEY(surah_id) REFERENCES surahs(id)
    );
    CREATE TABLE wiki_map (
        category TEXT, key TEXT, title TEXT,
        PRIMARY KEY(category, key)
    );
    CREATE TABLE alt_meanings (
        ayah_key TEXT PRIMARY KEY,
        data TEXT
    );
    CREATE TABLE quran_ayahs (
        surah_id INTEGER,
        ayah_num INTEGER,
        ar TEXT,
        PRIMARY KEY (surah_id, ayah_num)
    );
    CREATE VIRTUAL TABLE verses_fts USING fts5(en, bn, ar, content='verses', content_rowid='id');
    CREATE VIRTUAL TABLE quran_ayahs_fts USING fts5(ar, content='quran_ayahs', content_rowid='rowid');
    """)

    # Insert surahs + related
    for n in range(1, 115):
        meta = chapters.get(n, {"ar": f"Surah {n}", "en": f"Surah {n}", "bn": f"সূরা {n}"})
        # Try to get verses count from deep or know, fallback to SURAH_META if we had it
        verses = None
        # deep may have info, but use ch table count? Use 0 for now, will fill from paras
        # Count paras for this surah as proxy for verses count
        para_count = len(paras.get(str(n), {}).get("paras", []))
        # Determine type from know or default
        surah_type = "makki"
        if str(n) in know or n in know:
            # know keys are strings after our loader
            pass
        # Insert surah
        cur.execute("INSERT INTO surahs (id, ar, en, bn, verses, type) VALUES (?,?,?,?,?,?)",
                    (n, meta["ar"], meta["en"], meta["bn"], para_count, surah_type))

        # Verses: from paras (actually tafsir paragraphs; name 'verses' is historical)
        pdata = paras.get(str(n), {})
        for idx, para in enumerate(pdata.get("paras", [])):
            # Heuristic: paragraphs starting with [number] are verses
            m = re.match(r"^\s*\[(\d+)\]", para)
            ayah_num = int(m.group(1)) if m else idx+1
            bn = trans_cache.get(f"{n}:{idx}", "") or trans_cache.get(f"{n}:{idx+1}", "") or ""
            # Some caches use string keys without 0-index shift; fallback scan
            if not bn and trans_cache:
                # try stripped para as key (legacy cache format: english para -> bn)
                bn = trans_cache.get(para[:120], "") or trans_cache.get(para.strip()[:120], "")
            cur.execute("INSERT INTO verses (surah_id, ayah_num, ar, en, bn) VALUES (?,?,?,?,?)",
                        (n, ayah_num, "", para[:2000], bn[:2000] if bn else ""))

        # Words
        deep_entry = deep.get(str(n)) or deep.get(n) or {}
        for w in deep_entry.get("wordByWord", []):
            cur.execute("""INSERT INTO words (surah_id, w, tr, root, form, why, en, bn, root_analysis, alternative_meanings)
                           VALUES (?,?,?,?,?,?,?,?,?,?)""",
                        (n, w.get("w"), w.get("tr"), w.get("root"), w.get("form"), w.get("why"),
                         w.get("en"), w.get("bn"),
                         json.dumps(w.get("root_analysis"), ensure_ascii=False) if w.get("root_analysis") else None,
                         json.dumps(w.get("alternative_meanings"), ensure_ascii=False) if w.get("alternative_meanings") else None))

        # Tafsir
        cur.execute("""INSERT INTO tafsir (surah_id, amud_en, amud_bn, amud_ar, nazm_en, nazm_bn, nazm_ar, gaur_fikr, balagha, multiple_meanings)
                       VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (n,
                     (deep_entry.get("amud") or {}).get("en"), (deep_entry.get("amud") or {}).get("bn"), (deep_entry.get("amud") or {}).get("ar"),
                     (deep_entry.get("nazm") or {}).get("en"), (deep_entry.get("nazm") or {}).get("bn"), (deep_entry.get("nazm") or {}).get("ar"),
                     json.dumps(deep_entry.get("gaurFikr"), ensure_ascii=False) if deep_entry.get("gaurFikr") else None,
                     json.dumps(deep_entry.get("balagha"), ensure_ascii=False) if deep_entry.get("balagha") else None,
                     json.dumps(deep_entry.get("multipleMeanings"), ensure_ascii=False) if deep_entry.get("multipleMeanings") else None))

    # Figures: scan assets/figures
    fig_dir = ROOT / "assets/figures"
    if fig_dir.exists():
        for p in fig_dir.glob("*.jpg"):
            # Try to parse fig number from filename fig_1_6.jpg
            m = re.search(r"fig_(\d+_\d+)", p.name)
            if m:
                fig_num = m.group(1).replace("_", ".")
                # Guess surah from fig num: 1.6 -> surah 1? Not accurate, but use prefix
                try:
                    surah_id = int(fig_num.split(".")[0])
                    if 1 <= surah_id <= 114:
                        cur.execute("INSERT INTO figures (surah_id, fig_num, page, path) VALUES (?,?,?,?)",
                                    (surah_id, fig_num, 0, f"assets/figures/{p.name}"))
                except:
                    pass

    # Wiki map
    for cat, mapping in wiki.items():
        if isinstance(mapping, dict):
            for k, v in mapping.items():
                cur.execute("INSERT OR REPLACE INTO wiki_map (category, key, title) VALUES (?,?,?)", (cat, str(k), str(v)))

    # Alt meanings
    for k, v in alts.items():
        cur.execute("INSERT OR REPLACE INTO alt_meanings (ayah_key, data) VALUES (?,?)", (k, json.dumps(v, ensure_ascii=False)))

    # Complete Uthmani Arabic text (6,236 ayahs). This is the authoritative
    # Arabic source for the ayah-of-the-day and Arabic search; `verses.ar`
    # can only cover the few paragraphs that carry explicit [n] markers.
    quran_ar_path = ROOT / "assets/data/quran_ar.json"
    if quran_ar_path.exists():
        quran = json.loads(quran_ar_path.read_text(encoding="utf-8-sig"))
        for sn, ayahs in quran.items():
            for an, txt in ayahs.items():
                text = (txt or "").replace("\ufeff", "").strip()
                if text:
                    cur.execute(
                        "INSERT OR REPLACE INTO quran_ayahs (surah_id, ayah_num, ar) VALUES (?,?,?)",
                        (int(sn), int(an), text),
                    )

    # FTS trigger
    cur.executescript("""
    INSERT INTO verses_fts(verses_fts) VALUES('rebuild');
    INSERT INTO quran_ayahs_fts(quran_ayahs_fts) VALUES('rebuild');
    CREATE INDEX idx_verses_surah ON verses(surah_id);
    CREATE INDEX idx_words_surah ON words(surah_id);
    CREATE INDEX idx_figures_surah ON figures(surah_id);
    """)

    con.commit()
    # Optimize
    cur.execute("VACUUM;")
    con.close()

    # Compress
    gz_path = ROOT / "tafsir.db.gz"
    with open(DB_PATH, 'rb') as f_in, gzip.open(gz_path, 'wb', compresslevel=9) as f_out:
        shutil.copyfileobj(f_in, f_out)

    print(f"Built {DB_PATH} ({DB_PATH.stat().st_size/1024/1024:.2f} MB) -> {gz_path} ({gz_path.stat().st_size/1024/1024:.2f} MB)")
    # Verify
    con2 = sqlite3.connect(str(DB_PATH))
    cur2 = con2.cursor()
    for tbl in ["surahs","verses","words","tafsir","figures","wiki_map","alt_meanings","quran_ayahs"]:
        cur2.execute(f"SELECT COUNT(*) FROM {tbl}")
        print(f"{tbl}: {cur2.fetchone()[0]}")
    con2.close()

if __name__ == "__main__":
    main()
