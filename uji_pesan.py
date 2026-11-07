"""Uji cepat model: python uji_pesan.py            -> 4 contoh bawaan
                   python uji_pesan.py "teks pesan" "teks lain"   -> pesanmu sendiri
Mencetak peluang phishing + sinyal yang dilihat model. Memakai model_medsos.joblib di folder ini."""
import os
import sys

import joblib

import fitur  # noqa: F401
import hibrida  # noqa: F401
from penjelas import jelaskan

BASE = os.path.dirname(os.path.abspath(__file__))
CONTOH = [
    ("halo", "aman"),
    ("[PERINGATAN PENTING] Paket Anda dengan nomor resi #ID99281 gagal dikirim karena alamat tidak lengkap. Klik tautan berikut untuk memperbarui data: bit.ly/cek-paket-sekarang...", "phishing"),
    ("Peringatan Keamanan: Akun perbankan Anda terdeteksi melakukan transaksi mencurigakan sebesar Rp15.000.000. Jika bukan Anda, segera batalkan di [tautan-palsu] dalam waktu 1 jam atau akun akan dibekukan permanen.", "phishing"),
    ("halo kami dari @instagram mau konfirmasi keaktifan akunmu", "mencurigakan"),
]
if __name__ == "__main__":
    model = joblib.load(os.path.join(BASE, "model_medsos.joblib"))
    daftar = [(t, "?") for t in sys.argv[1:]] or CONTOH
    for t, harapan in daftar:
        p, sinyal = jelaskan(model, t)
        print(f"{p * 100:5.0f}% phishing (seharusnya: {harapan}) :: {t[:80]}")
        for s in sinyal[:4]:
            print(f"        {s['ikon']} {s['judul']} ({s['arah']})")