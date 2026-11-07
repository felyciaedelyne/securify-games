"""Latih & bandingkan model pada data PUBLIK (data/publik/gabungan.csv), lalu simpan model_medsos.joblib.

Masalah yang ditangani: dataset email Kaggle berbahasa Inggris dan panjang, sedangkan game memakai pesan pendek
BAHASA INDONESIA. Bila email membanjiri data, model bisa salah menilai pesan Indonesia. Karena itu skrip ini
MEMILIH konfigurasi berdasarkan bukti di pesan Indonesia (data validasi), bukan menebak:
    1. semua_data           : semua sumber, bobot sama
    2. semua_data_bobot_id  : semua sumber, contoh Indonesia diberi bobot besar (total bobot setara sumber lain)
    3. campuran_bobot_id    : hanya sumber yang punya KEDUA kelas (hindari model menebak dari gaya/asal sumber), Indonesia berbobot
    4. indonesia_saja       : hanya sumber Indonesia
Konfigurasi dengan F1 terbaik pada validasi Indonesia dipakai. Data uji Indonesia dibuka sekali di akhir.

Aturan evaluasi: data uji tidak dipakai memilih apa pun; data/game_items.csv (soal game, ditulis manual)
hanya cek domain, BUKAN data latih.

Jalankan: python latih_hibrida.py            (pilih konfigurasi + laporan)
          python latih_hibrida.py --lintas   (tambah uji lintas-sumber, lebih lama)
          python latih_hibrida.py --indonesia-saja   (paksa hanya data Indonesia; tanpa pemilihan otomatis)
"""
import json
import os
import sys
import time

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

from fitur_struktur import matriks
from hibrida import Hibrida, buat_lr

BASE = os.path.dirname(os.path.abspath(__file__))
MAKS_TOTAL = int(os.environ.get("EDU_MAKS_TOTAL", 30000))     # batas jumlah pesan untuk latih+uji
# nama sumber (= nama file CSV tanpa ekstensi) yang berbahasa Indonesia; tambahkan bila punya data Indonesia lain
SUMBER_INDONESIA = ("dataset_sms_spam_v1",)
CAMPURAN = []      # sumber yang punya phishing DAN normal (diisi di main)
T0 = time.time()


def log(msg):
    print(f"[{time.time() - T0:6.0f}s] {msg}", flush=True)


def skor(y, p):
    y = np.asarray(y)
    pred = (np.asarray(p) >= 0.5).astype(int)
    return dict(n=int(len(y)), akurasi=round(accuracy_score(y, pred), 4),
                presisi=round(precision_score(y, pred, zero_division=0), 4),
                recall=round(recall_score(y, pred, zero_division=0), 4),
                f1=round(f1_score(y, pred, zero_division=0), 4),
                auc=round(roc_auc_score(y, p), 4) if len(set(y)) > 1 else None)


def bobot_untuk(tr, mode):
    """Bobot per baris sesuai konfigurasi."""
    w = np.ones(len(tr))
    if mode.endswith("bobot_id"):
        idn = tr["indo"].values
        if idn.sum() and (~idn).sum():
            w[idn] = min((~idn).sum() / idn.sum(), 30.0)      # total bobot Indonesia ~ setara sumber lain
    return w


def data_latih(tr, mode):
    if mode == "indonesia_saja":
        return tr[tr["indo"]]
    if mode == "campuran_bobot_id":
        return tr[tr["sumber"].isin(CAMPURAN)]
    return tr


def latih_tiga(tr, w):
    """A = TF-IDF+LR (baseline), B = fitur struktur saja, C = hibrida."""
    A = buat_lr().fit(tr["teks"], tr["label"], clf__sample_weight=w)
    B = HistGradientBoostingClassifier(max_depth=4, max_iter=250, learning_rate=0.08, class_weight="balanced",
                                       random_state=0).fit(matriks(tr["teks"]), tr["label"], sample_weight=w)
    C = Hibrida().fit(tr["teks"], tr["label"], w)
    return A, B, C


def prediksi(m3, teks):
    A, B, C = m3
    return {"A_tfidf_lr": A.predict_proba(teks)[:, 1],
            "B_struktur_gb": B.predict_proba(matriks(teks))[:, 1],
            "C_hibrida": C.predict_proba(teks)[:, 1]}


def cetak(bagian, isi):
    print(f"\n== {bagian}")
    for k, v in isi.items():
        print("  ", k.ljust(15), v)


if __name__ == "__main__":
    lintas = "--lintas" in sys.argv
    paksa_indo = "--indonesia-saja" in sys.argv
    path = os.path.join(BASE, "data", "publik", "gabungan.csv")
    if not os.path.exists(path):
        sys.exit("data/publik/gabungan.csv belum ada. Jalankan dulu: python ambil_data.py")
    df = pd.read_csv(path).dropna().drop_duplicates("teks").reset_index(drop=True)
    df["teks"] = df["teks"].astype(str).str[:1500]
    df["sumber"] = df["sumber"].astype(str).str.replace(r"\.(csv|tsv)$", "", regex=True)   # "x.csv" -> "x"
    df["indo"] = df["sumber"].isin(SUMBER_INDONESIA)
    cnt = df.groupby(["sumber", "label"]).size().unstack(fill_value=0)
    CAMPURAN[:] = [k for k in cnt.index if cnt.loc[k].min() >= 100]   # punya kedua kelas (>=100 contoh tiap kelas)
    print("sumber dengan kedua kelas:", CAMPURAN)
    if len(df) > MAKS_TOTAL:       # jaga waktu latih tetap wajar; sumber kecil (mis. Indonesia) tetap utuh
        kecil = df[df.groupby("sumber")["teks"].transform("count") < 1500]
        besar = df.drop(kecil.index)
        besar, _ = train_test_split(besar, train_size=max(MAKS_TOTAL - len(kecil), 1000), stratify=besar["label"], random_state=0)
        df = pd.concat([kecil, besar]).reset_index(drop=True)
    log(f"scikit-learn {sklearn.__version__} | {len(df)} pesan, {int(df.label.sum())} phishing, {int(df.indo.sum())} pesan Indonesia")
    print(df.pivot_table(index="sumber", columns="label", values="teks", aggfunc="count", fill_value=0)
          .rename(columns={0: "normal", 1: "phishing"}))

    ada_indo = df["indo"].sum() >= 100 and df[df.indo]["label"].nunique() == 2
    if ada_indo:       # Indonesia: 60% latih / 20% validasi / 20% uji ; sumber lain: 80% latih / 20% uji
        indo = df[df.indo]
        i_tv, i_te = train_test_split(indo, test_size=0.2, stratify=indo["label"], random_state=42)
        i_tr, i_va = train_test_split(i_tv, test_size=0.25, stratify=i_tv["label"], random_state=42)
        lain = df[~df.indo]
        if len(lain):
            l_tr, l_te = train_test_split(lain, test_size=0.2, stratify=lain["label"], random_state=42)
        else:
            l_tr, l_te = lain, lain
        tr = pd.concat([l_tr, i_tr]); te_lain, te_indo, va_indo = l_te, i_te, i_va
    else:
        log("PERINGATAN: data Indonesia tidak ada/terlalu sedikit; model tidak bisa dicek untuk pesan Indonesia.")
        tr, te_lain = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)
        te_indo = va_indo = None

    # ---- 1) pilih konfigurasi berdasarkan validasi Indonesia ----
    mode = "semua_data"
    pilih = {}
    if paksa_indo and ada_indo:
        mode = "indonesia_saja"
        log("konfigurasi dipaksa: indonesia_saja")
    elif ada_indo and len(l_tr):
        daftar_konf = ["semua_data", "semua_data_bobot_id"]
        if any(k not in SUMBER_INDONESIA for k in CAMPURAN):      # ada sumber campuran selain Indonesia
            daftar_konf.append("campuran_bobot_id")
        daftar_konf.append("indonesia_saja")
        for m in daftar_konf:
            t = data_latih(tr, m)
            log(f"konfigurasi '{m}': melatih pada {len(t)} pesan...")
            h = Hibrida().fit(t["teks"], t["label"], bobot_untuk(t, m))
            pilih[m] = skor(va_indo["label"], h.predict_proba(va_indo["teks"])[:, 1])
        cetak("pemilihan konfigurasi (validasi pesan Indonesia)", pilih)
        mode = max(pilih, key=lambda m: (pilih[m]["f1"], pilih[m]["akurasi"]))
        log(f"-> konfigurasi dipilih: {mode}")
    elif ada_indo:
        mode = "indonesia_saja"

    # ---- 2) laporan 3 model pada konfigurasi terpilih ----
    t = data_latih(tr, mode)
    w = bobot_untuk(t, mode)
    log(f"melatih 3 model (konfigurasi '{mode}') pada {len(t)} pesan...")
    m3 = latih_tiga(t, w)
    lap = {"konfigurasi_dipilih": mode, "pemilihan_validasi_indonesia": pilih}
    if te_indo is not None:
        lap["uji_INDONESIA"] = {k: skor(te_indo["label"], v) for k, v in prediksi(m3, te_indo["teks"]).items()}
    if len(te_lain):
        ps = prediksi(m3, te_lain["teks"])
        lap["uji_sumber_lain"] = {k: skor(te_lain["label"], v) for k, v in ps.items()}
        M = matriks(te_lain["teks"])      # subset angka panjang / tautan (titik lemah TF-IDF)
        for nama, mask in {"ada_tautan": M[:, 11] > 0, "angka_panjang": M[:, 7] > 0}.items():
            yy = te_lain["label"].values[mask]
            if mask.sum() >= 20 and len(set(yy)) > 1:
                lap["subset_" + nama] = {k: skor(yy, v[mask]) for k, v in ps.items()}
    gp = os.path.join(BASE, "data", "game_items.csv")
    if os.path.exists(gp):
        g = pd.read_csv(gp)
        lap["soal_game_cek_domain"] = {k: skor(g["label"], v) for k, v in prediksi(m3, g["teks"]).items()}

    if lintas:
        lap["lintas_sumber"] = {}
        for s, b in df.groupby("sumber"):
            a = df[df.sumber != s]
            if len(b) >= 200 and b["label"].nunique() == 2 and a["label"].nunique() == 2:
                log(f"lintas-sumber: latih tanpa '{s}', uji di '{s}' ({len(b)} pesan)")
                a = a.sample(min(len(a), 15000), random_state=0)
                lap["lintas_sumber"][s] = {k: skor(b["label"], v) for k, v in
                                           prediksi(latih_tiga(a, np.ones(len(a))), b["teks"]).items()}
    for bagian, isi in lap.items():
        if bagian in ("konfigurasi_dipilih", "pemilihan_validasi_indonesia"):
            continue
        if bagian == "lintas_sumber":
            for s, d in isi.items():
                cetak(f"lintas-sumber: uji di {s}", d)
        else:
            cetak(bagian, isi)

    # ---- 3) model akhir: SEMUA data (latih+validasi+uji) dengan konfigurasi terpilih ----
    log("melatih model akhir pada SEMUA data...")
    semua = data_latih(df, mode)
    final = Hibrida().fit(semua["teks"], semua["label"], bobot_untuk(semua, mode))
    joblib.dump(final, os.path.join(BASE, "model_medsos.joblib"), compress=3)
    meta = dict(sklearn=sklearn.__version__, jenis="hibrida: TF-IDF+LR (kata) + fitur struktur + HistGradientBoosting",
                konfigurasi=mode, n_latih=int(len(semua)), sumber={k: int(v) for k, v in semua.sumber.value_counts().items()},
                evaluasi=lap)
    with open(os.path.join(BASE, "model_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1, default=str)
    log("Tersimpan model_medsos.joblib + model_meta.json")