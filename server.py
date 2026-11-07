"""EduSecurity server: melayani game (folder public/) + API model phishing.

Jalankan lokal : python server.py
Produksi       : gunicorn server:app --workers 2 --threads 4 --timeout 60

Model: model_medsos.joblib (hibrida). Hasil permainan disimpan per pemain sebagai JSON di data/pemain/.
"""
import json
import os
import re
import tempfile
import threading
from datetime import datetime, timezone

import joblib
import sklearn
from flask import Flask, jsonify, request, send_from_directory

import fitur  # noqa: F401  (dibutuhkan saat memuat model)
import hibrida  # noqa: F401  (kelas Hibrida dibutuhkan joblib)
from penjelas import jelaskan, tingkat

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(BASE, "public")
DATA_DIR = os.environ.get("DATA_DIR", os.path.join(BASE, "data"))
LOG_FILE = os.path.join(DATA_DIR, "records.jsonl")
MODEL_FILE = os.path.join(BASE, "model_medsos.joblib")
META_FILE = os.path.join(BASE, "model_meta.json")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")  # isi di hosting agar /export aman
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__, static_folder=PUBLIC, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024  # batasi ukuran request


def _baca_meta():
    try:
        with open(META_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def muat_model():
    """Muat model. TIDAK melatih ulang otomatis (di PythonAnywhere gratis jatah CPU hanya 100 detik/hari).
    Latih di laptop dengan scikit-learn versi yang sama dengan di server, lalu unggah model_medsos.joblib."""
    meta = _baca_meta()
    if meta.get("sklearn") != sklearn.__version__:
        print(f"PERINGATAN: model dilatih dengan scikit-learn {meta.get('sklearn')}, terpasang {sklearn.__version__}.")
    return joblib.load(MODEL_FILE)


model = muat_model()
META = _baca_meta()


# ---- routes ----
@app.get("/")
def index():
    return send_from_directory(PUBLIC, "index.html")


@app.get("/health")
def health():
    return jsonify(status="ok", sklearn=sklearn.__version__, guard_pendek=hasattr(__import__("penjelas"), "_terlalu_pendek"), file_penjelas=__import__("penjelas").__file__)


@app.get("/model-info")
def model_info():
    """Ringkasan kualitas model untuk ditampilkan di game (transparan)."""
    pilih = ("n_latih", "cv_akurasi", "cv_f1", "game", "mandiri", "sklearn")
    return jsonify({k: META[k] for k in pilih if k in META})


@app.post("/predict")
def predict():
    """Kembalikan peluang phishing + alasan model (sinyal yang menaikkan/menurunkan skor)."""
    data = request.get_json(silent=True) or {}
    teks = str(data.get("text", ""))[:1000]
    if not teks.strip():
        return jsonify(error="text kosong"), 400
    prob, sinyal = jelaskan(model, teks)
    return jsonify(phish_prob=prob, level=tingkat(prob), signals=sinyal)


_lock = threading.Lock()
PEMAIN_DIR = os.path.join(DATA_DIR, "pemain")
os.makedirs(PEMAIN_DIR, exist_ok=True)
MAKS_CATATAN = 3000          # batas catatan per pemain (jaga kuota disk 512 MB)
ID_RE = re.compile(r"[^A-Za-z0-9_-]")


def _ringkas(catatan):
    jawab = [r for r in catatan if r.get("mode") != "shop" and r.get("mode") != "compose" and "correct" in r]
    benar = sum(1 for r in jawab if r.get("correct"))
    ml = [r for r in jawab if "modelCorrect" in r]
    return dict(n_catatan=len(catatan), n_jawaban=len(jawab), benar=benar,
                akurasi=round(benar / len(jawab), 3) if jawab else None,
                model_benar=sum(1 for r in ml if r.get("modelCorrect")), n_model=len(ml),
                koin_terakhir=next((r.get("coinsTotal") for r in reversed(catatan) if "coinsTotal" in r), None))


def simpan_pemain(rec):
    """Tambahkan catatan ke data/pemain/<playerId>.json (tulis atomik: file tidak rusak bila mati listrik)."""
    pid = ID_RE.sub("", str(rec.get("playerId", "")))[:40] or "anonim"
    path = os.path.join(PEMAIN_DIR, pid + ".json")
    try:
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
    except Exception:
        doc = {"playerId": pid, "pertama": rec["server_time"], "catatan": []}
    if len(doc["catatan"]) < MAKS_CATATAN:
        doc["catatan"].append(rec)
    doc["terakhir"] = rec["server_time"]
    doc["ringkasan"] = _ringkas(doc["catatan"])
    fd, tmp = tempfile.mkstemp(dir=PEMAIN_DIR, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False)
    os.replace(tmp, path)


@app.post("/log")
def log():
    """Simpan jawaban/tweet pemain: JSON per pemain + cadangan baris JSONL."""
    rec = request.get_json(silent=True)
    if not isinstance(rec, dict):
        return jsonify(error="bad request"), 400
    rec["server_time"] = datetime.now(timezone.utc).isoformat()
    with _lock:
        simpan_pemain(rec)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return jsonify(ok=True)


@app.get("/export.json")
def export_json():
    """Semua pemain dalam SATU JSON: /export.json?token=ADMIN_TOKEN (tambah &ringkas=1 untuk tanpa catatan)."""
    if not ADMIN_TOKEN or request.args.get("token") != ADMIN_TOKEN:
        return jsonify(error="forbidden"), 403
    out = []
    for fn in sorted(os.listdir(PEMAIN_DIR)):
        if fn.endswith(".json"):
            with open(os.path.join(PEMAIN_DIR, fn), encoding="utf-8") as f:
                d = json.load(f)
            if request.args.get("ringkas"):
                d.pop("catatan", None)
            out.append(d)
    return jsonify(dibuat=datetime.now(timezone.utc).isoformat(), n_pemain=len(out), pemain=out)


@app.get("/export")
def export():
    """Unduh semua catatan: /export?token=ADMIN_TOKEN"""
    if not ADMIN_TOKEN or request.args.get("token") != ADMIN_TOKEN:
        return jsonify(error="forbidden"), 403
    if not os.path.exists(LOG_FILE):
        return "", 204
    with open(LOG_FILE, encoding="utf-8") as f:
        return app.response_class(f.read(), mimetype="application/x-ndjson")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))