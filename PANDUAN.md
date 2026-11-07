# EduSecurify v4 — panduan

## 1. Latih model (di laptop, SEKALI)
```
pip install -r requirements.txt
python ambil_data.py        # unduh dataset publik Kaggle -> data/publik/gabungan.csv
python latih_hibrida.py     # bandingkan 3 model, cetak evaluasi, simpan model_medsos.joblib
```
Hanya dataset phishing yang dipakai (lihat DAFTAR di ambil_data.py). Dataset Indonesia belum ada di daftar: bila kamu menemukan dataset phishing berbahasa Indonesia di Kaggle, tambahkan slug-nya ke DAFTAR atau taruh CSV-nya di data/publik/
Model di zip ini dilatih pada 903 SMS Indonesia (Yudiwbs). Tambahkan dataset phishing Kaggle lalu latih ulang agar lebih luas.
Pasang scikit-learn di PythonAnywhere dengan versi yang SAMA seperti di laptop (lihat `model_meta.json`).

## 2. Deploy PythonAnywhere (gratis: 100 detik CPU/hari, 512 MB, 1 web app, 1 worker, kedaluwarsa 1 bulan)
1. Upload folder ini ke `/home/USERNAME/edusecurify/` (tab Files, atau `git clone`).
2. Consoles → Bash: `mkvirtualenv ed --python=python3.12 && pip install flask joblib numpy scipy scikit-learn==<versi laptop>`
3. Web → Add new web app → Manual configuration → pilih versi Python; isi Virtualenv `/home/USERNAME/.virtualenvs/ed`.
4. Di file WSGI: 
```
import sys, os
sys.path.insert(0, '/home/USERNAME/edusecurify')
os.environ['ADMIN_TOKEN'] = 'GANTI-RAHASIA'
from server import app as application
```
5. Static files: URL `/` → tidak bisa; cukup biarkan Flask melayani `public/`. Reload.
6. Klik "Run until 1 month from today" agar tidak kedaluwarsa.
Anak-anak buka `https://USERNAME.pythonanywhere.com`.

## 3. Hasil tersimpan sebagai JSON
- Tiap pemain: `data/pemain/<playerId>.json` (catatan + ringkasan akurasi, koin) — ditulis atomik.
- Cadangan: `data/records.jsonl`.
- Unduh semua: `https://USERNAME.pythonanywhere.com/export.json?token=GANTI-RAHASIA` (tambah `&ringkas=1` untuk ringkasan saja).
