"""Normalisasi teks + ciri tautan + ciri isi pesan untuk model phishing media sosial (v2).

Dipakai SAMA PERSIS oleh training (train_medsos.py / Train_Medsos.ipynb) dan server.py.
Tanpa stemmer: bahasa medsos penuh singkatan/gaul, dan tanpa stemmer server lebih ringan.

Ide utama: setiap tautan diganti token "zurl", lalu ciri-cirinya ditambahkan sebagai token
"z..." di akhir teks, sehingga TF-IDF otomatis ikut mempelajarinya.

Yang baru di v2 (supaya model lebih tahan terhadap kalimat yang belum pernah dilihat):
  * ciri tautan tambahan: merek palsu di domain, subdomain menumpuk, IP/@/punycode, domain umum tepercaya
  * ciri ISI pesan (zc_...): minta data rahasia, tekanan waktu, ancaman, hadiah, bayar di muka,
    mengaku pihak resmi, minta dirahasiakan, dan konteks EDUKASI ("jangan bagikan OTP") yang justru aman
  * gabungan ciri (zkombo_...) untuk pola klasik: rahasia + tekanan, hadiah + biaya, dst.
"""
import re
from functools import lru_cache
from urllib.parse import urlparse

URL_RE = re.compile(
    r"(?:https?://|www\.|bit\.ly/|tinyurl\.com/|s\.id/|t\.co/|cutt\.ly/|rb\.gy/|wa\.me/)\S+"
    r"|\b[a-z0-9][a-z0-9\-]{2,}(?:\.[a-z0-9\-]+)*\.(?:xyz|top|click|tk|site|icu|online|buzz|cc|live|shop|link|monster|cfd|sbs|info|vip)(?:/\S*)?",
    re.IGNORECASE,
)
SHORTENERS = ("bit.ly", "tinyurl.com", "s.id", "t.co", "cutt.ly", "is.gd", "rb.gy", "shorturl.at")
RISKY_TLD = (".xyz", ".top", ".click", ".tk", ".site", ".icu", ".online", ".buzz", ".cc",
             ".live", ".shop", ".link", ".monster", ".cfd", ".sbs", ".info", ".vip")
OFFICIAL_TLD = (".ac.id", ".go.id", ".sch.id", ".edu", ".gov", ".mil.id")
KW_DOMAIN = ("login", "verif", "secure", "akun", "klaim", "claim", "hadiah", "bantuan", "update",
             "cek", "bayar", "promo", "gift", "reward", "konfirmasi", "resmi", "aman", "official",
             "support", "appeal", "airdrop", "free", "gratis", "winner", "cair", "saldo", "aktivasi")

# domain umum yang memang milik layanan tepercaya (bukan jaminan mutlak, hanya satu sinyal)
UMUM_OK = ("youtube.com", "youtu.be", "github.com", "google.com", "gle", "wikipedia.org", "kompas.com",
           "instagram.com", "tokopedia.com", "shopee.co.id", "linkedin.com", "medium.com", "twitter.com",
           "x.com", "facebook.com", "zoom.us", "detik.com", "tempo.co", "cnnindonesia.com", "spotify.com")
# merek yang sering ditiru; jika muncul di domain yang BUKAN domain resminya -> mencurigakan
MEREK = ("kicau", "instagram", "insta", "tiktok", "facebook", "whatsapp", "shopee", "tokopedia", "tokped",
         "telegram", "youtube", "google", "gmail", "bca", "bri", "bni", "mandiri", "dana", "ovo", "gopay",
         "jnt", "jne", "sicepat", "anteraja", "telkomsel", "indosat", "pln", "bpjs", "pajak", "pertamina",
         "linkaja", "jenius", "paypal", "netflix", "binance", "apple", "icloud", "microsoft")
RESMI_MEREK = ("instagram.com", "facebook.com", "whatsapp.com", "tiktok.com", "shopee.co.id", "tokopedia.com",
               "telegram.org", "youtube.com", "google.com", "bca.co.id", "bri.co.id", "bni.co.id",
               "bankmandiri.co.id", "dana.id", "ovo.id", "gopay.co.id", "jne.co.id", "jet.co.id",
               "sicepat.com", "anteraja.id", "telkomsel.com", "indosatooredoo.com", "pln.co.id",
               "bpjs-kesehatan.go.id", "pajak.go.id", "pertamina.com", "linkaja.id", "jenius.com",
               "paypal.com", "netflix.com", "binance.com", "apple.com", "icloud.com", "microsoft.com")


def _host_endswith(host, doms):
    return any(host == d or host.endswith("." + d) for d in doms)


def ciri_url(u):
    """Daftar token ciri untuk satu tautan."""
    u = str(u).strip().rstrip(".,!?)\"'")
    ada_skema = bool(re.match(r"https?://", u, re.IGNORECASE))
    try:
        parsed = urlparse(u if ada_skema else "http://" + u)
        host = (parsed.netloc or "").lower().split("@")[-1]
        if host.startswith("["):                      # IPv6: buang port tanpa merusak alamat
            akhir = host.find("]")
            host = host[1:akhir] if akhir != -1 else ""
        else:
            host = host.rsplit(":", 1)[0]
        if host.startswith("www."):
            host = host[4:]
        path = (parsed.path or "").lower() + ("?" + parsed.query.lower() if parsed.query else "")
    except (ValueError, TypeError, AttributeError):   # URL rusak: jangan hentikan ekstraksi
        parsed, host, path = None, "", ""

    tok = []
    if ada_skema:
        tok.append("zhttps" if u.lower().startswith("https") else "zhttp")
    if host in SHORTENERS:
        tok.append("zshort")
    resmi = host.endswith(OFFICIAL_TLD)
    umum = _host_endswith(host, UMUM_OK)
    if resmi:
        tok.append("ztldresmi")
    elif host.endswith(RISKY_TLD):
        tok.append("ztldmurah")
    else:
        tok.append("ztldbiasa")
    if umum and not resmi:
        tok.append("zumum")
    if host.count("-") >= 1:
        tok.append("zhyphen")
    if host.count("-") >= 2:
        tok.append("zhyphen2")
    if any(k in host for k in KW_DOMAIN):
        tok.append("zkwhost")
    if any(k in path for k in KW_DOMAIN):
        tok.append("zkwpath")
    if path.endswith(".apk"):
        tok.append("zapk")
    if re.search(r"\d", host.split(".")[0]):
        tok.append("zdigithost")
    # merek di domain yang bukan domain resminya (mis. bri-update88.xyz, youtube-copyright-appeal.online)
    if not resmi and not _host_endswith(host, RESMI_MEREK) and not umum \
            and any(m in host for m in MEREK):
        tok.append("zbrandpalsu")
    if len(host.split(".")) >= 4:
        tok.append("zsubdomain")
    if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host):
        tok.append("zipHost")
    if "xn--" in host:
        tok.append("zpunycode")
    if parsed is not None and "@" in parsed.netloc:
        tok.append("zat")
    if len(u) > 70:
        tok.append("zpanjang")
    return tok


# ---------------------------------------------------------------- ciri isi pesan
CUE = {
    "zc_rahasia": r"\b(otp|pin|cvv|kata sandi|password|sandi|kode (?:verifikasi|sms|masuk|otp|yang (?:masuk|barusan|baru|tadi))|\d ?digit|nomor kartu|data kartu)\b",
    "zc_pribadi": r"\b(ktp|nik|selfie|data diri|data lengkap|nomor rekening|no rekening|foto ktp)\b",
    "zc_tekanan": r"\b(\d+ (?:jam|menit)|segera|buruan|cepetan|cepat|secepatnya|sesegera mungkin|sekarang juga|hari ini juga|sebelum (?:hangus|habis|penuh|expired)|slot|terbatas|expired|kedaluwarsa|kadaluarsa|batas waktu|terakhir)\b",
    "zc_ancam": r"\b(diblokir|blokir|dibekukan|dihapus|ditutup|nonaktif|dinonaktifkan|hangus|dicabut|diputus|denda|menunggak|tunggakan|dikembalikan|dibatalkan|melanggar|pelanggaran|mencurigakan|kasus hukum|hukum)\b",
    "zc_hadiah": r"\b(selamat|terpilih|pemenang|memenangkan|menang|gratis|undian|giveaway|hadiah|saldo|cair|airdrop|bonus|cuan|profit|dijamin|untung|voucher|lolos tanpa tes|tanpa tes)\b",
    "zc_bayardulu": r"\b(transfer|setor|deposit|iuran|biaya (?:admin|asuransi|aktivasi|administrasi|seragam)|bayar dulu|isiin|isi pulsa|pinjem|pinjemin|pinjamin|pinjam|uang jaminan|ongkir|kirim(?:in)? (?:dana|uang|duit)|(?:dana|uang|duit) ke rek(?:ening)?|ke rek(?:ening)? \d+|pajak impor|bayar asuransi)\b",
    "zc_otoritas": r"\b(petugas|tim keamanan|tim support|customer service|\bcs\b|kepolisian|direktur|official|admin|pihak (?:bank|resmi)|dari (?:bank|kurir|polisi))\b",
    "zc_rahasiakan": r"\b(jangan (?:sampai )?(?:bilang|kasih tau|kasih tahu|hubungi|telpon|telepon|cerita|\w+ tau)|jangan sampai \w+ tau|rahasia)\b",
    "zc_klik": r"\b(klik|buka link|buka tautan|unduh|download|pasang aplikasi|scan|barcode|login)\b",
    # konteks edukasi / peringatan: kata OTP/PIN muncul, tetapi untuk MELARANG
    "zc_edukasi": r"\b(jangan (?:pernah )?(?:bagikan|berikan|kasih|membagikan|klik|ladeni|diladeni)|waspada|hati-hati|tips|ingat(?:lah)?|laporkan|penipu|penipuan|2fa|verifikasi dua langkah|tidak pernah meminta|pasti palsu|itu penipu)\b",
    "zc_resmiapp": r"\b(aplikasi resmi|menu \w+ di aplikasi|menu pesanan|e-learning|situs resmi|loket|minimarket|kampus|formulir|tanpa biaya|gratis dan terbuka)\b",
    "zc_akrab": r"\b(makasih|terima kasih|traktir|jemput|kuliah|tugas|rapat|skripsi|wisuda|ulang tahun|nonton|kopi|makan|capek|macet)\b",
}
CUE_RE = {k: re.compile(v, re.IGNORECASE) for k, v in CUE.items()}


def ciri_isi(t):
    """Token ciri dari isi pesan (t sudah huruf kecil, tautan sudah diganti zurl)."""
    ada = {k for k, r in CUE_RE.items() if r.search(t)}
    out = sorted(ada)
    edu = "zc_edukasi" in ada
    jahat = ada & {"zc_tekanan", "zc_ancam", "zc_hadiah", "zc_bayardulu", "zc_otoritas", "zc_rahasiakan"}
    if "zc_rahasia" in ada and not edu:
        out.append("zkombo_mintarahasia")
        if jahat:
            out.append("zkombo_rahasia_tekanan")
    if "zc_rahasia" in ada and edu:
        out.append("zkombo_edukasi_rahasia")
    if "zc_hadiah" in ada and ("zc_bayardulu" in ada or "zc_pribadi" in ada or "zc_klik" in ada) and not edu:
        out.append("zkombo_hadiah_biaya")
    if "zc_pribadi" in ada and not edu and (jahat or "zc_klik" in ada):
        out.append("zkombo_pribadi_desak")
    if "zc_bayardulu" in ada and "zc_rahasiakan" in ada:
        out.append("zkombo_uang_rahasia")
    if "zc_otoritas" in ada and ("zc_rahasia" in ada or "zc_pribadi" in ada or "zc_bayardulu" in ada) and not edu:
        out.append("zkombo_otoritas_minta")
    n = len(jahat) + (1 if ("zc_rahasia" in ada and not edu) else 0) + (1 if "zc_pribadi" in ada else 0)
    if not edu:
        out.append("zrisiko%d" % min(n, 4))
    if ada & {"zc_akrab", "zc_resmiapp"} and not jahat and "zc_rahasia" not in ada:
        out.append("zkombo_wajar")
    return out


@lru_cache(maxsize=60000)   # tiap pesan hanya diproses sekali selama pelatihan (jauh lebih cepat)
def _normalisasi(teks):
    teks = str(teks)
    tokens = []

    def ganti(m):
        tokens.extend(ciri_url(m.group(0)))
        return " zurl "

    t = URL_RE.sub(ganti, teks)
    t = t.lower()
    t = re.sub(r"(.)\1{2,}", r"\1\1", t)                         # selamaaat -> selamaat
    cue = ciri_isi(t)                                            # ciri isi dihitung sebelum tanda baca dibuang
    t = re.sub(r"\b(kode|otp|pin|token|verifikasi)\W{0,3}\d{4,6}\b", " zkode ", t)
    t = re.sub(r"\b\d{10,}\b", " znomor ", t)                    # nomor rekening / HP panjang
    t = re.sub(r"\brp\.?\s?\d[\d.,]*", " zrupiah ", t)
    t = re.sub(r"!{2,}", " zseru ", t)
    t = re.sub(r"[^\w\s]", " ", t)                               # buang tanda baca & emoji
    t = re.sub(r"\s+", " ", t).strip()

    ciri = list(tokens)
    if not tokens:
        ciri.append("ztanpalink")
    elif len([c for c in tokens if c.startswith("ztld")]) >= 2:
        ciri.append("zbanyaklink")
    return (t + " " + " ".join(ciri + cue)).strip()


def normalisasi(teks):
    return _normalisasi(str(teks))


def normalisasi_batch(teks_list):
    return [normalisasi(x) for x in teks_list]