"""Fitur STRUKTUR angka & tautan (numerik, bukan kata). Dipakai training dan server.

Alasan: TF-IDF hanya menghitung kata. "Rp450.000", "0987654321", atau "bit.ly/a1" cuma jadi token
acak; TF-IDF tidak tahu bahwa nomor panjang = nomor rekening, atau bahwa domain dengan 3 tanda
hubung + angka itu aneh. Di sini semua itu diubah jadi ANGKA YANG BISA DIBANDINGKAN (jumlah,
panjang, rasio), lalu dipelajari model pohon (yang pandai soal ambang & interaksi).
"""
import re
from functools import lru_cache
from urllib.parse import urlparse

import numpy as np

URL_RE = re.compile(r"(?:https?://|www\.)\S+|\b[a-z0-9][a-z0-9\-]{1,}(?:\.[a-z0-9\-]+)*\."
                    r"(?:com|net|org|id|co|xyz|top|click|tk|site|icu|online|buzz|cc|live|shop|link|info|vip|ly|gl)(?:/\S*)?", re.I)
SHORT = ("bit.ly", "tinyurl.com", "s.id", "t.co", "cutt.ly", "is.gd", "rb.gy", "shorturl.at", "goo.gl")
TLD_RISK = (".xyz", ".top", ".click", ".tk", ".site", ".icu", ".online", ".buzz", ".cc", ".live", ".shop", ".link", ".info", ".vip")
KATA_URL = ("login", "verif", "secure", "akun", "account", "claim", "klaim", "update", "bayar", "gift", "reward", "free", "gratis", "bank", "confirm")
KW_KODE = re.compile(r"\b(otp|pin|kode|code|password|sandi|cvv|token)\b", re.I)
KW_UANG = re.compile(r"(rp\.?\s?\d|\$\s?\d|£\s?\d|\d\s?(ribu|juta|jt|rb)\b|transfer|saldo|dana|hadiah|prize|win|won|cash|bayar|pay)", re.I)
KW_URGEN = re.compile(r"(segera|sekarang|hari ini|detik|jam lagi|24 ?jam|urgent|now|immediately|expire|diblokir|dibekukan|suspend|last chance|terakhir)", re.I)

NAMA = ["n_char", "n_kata", "n_digit", "rasio_digit", "rasio_kapital", "n_seru", "n_tanya",
        "n_angka_panjang", "maks_panjang_angka", "ada_rupiah_uang", "ada_telp_like",
        "n_url", "url_pendek", "url_tld_risiko", "url_ip", "url_ada_at", "url_n_hubung",
        "url_n_digit_host", "url_n_subdomain", "url_panjang_maks", "url_kata_curiga", "url_tanpa_https",
        "kode_dan_angka", "kata_uang", "kata_urgen", "n_simbol"]


def _host(u):
    u = u.strip().rstrip(".,!?)\"'")
    try:
        p = urlparse(u if re.match(r"https?://", u, re.I) else "http://" + u)
    except ValueError:                      # tautan rusak mis. "http://[abc" (IPv6 tidak valid): jangan hentikan pelatihan
        return "", u
    h = (p.netloc or "").lower().split(":")[0].split("@")[-1]
    return h[4:] if h.startswith("www.") else h, u


@lru_cache(maxsize=60000)
def _vektor(t):
    n_char = len(t)
    kata = t.split()
    dig = sum(c.isdigit() for c in t)
    huruf = [c for c in t if c.isalpha()]
    kap = sum(c.isupper() for c in huruf)   # rasio kapital hanya dipakai bila pesan >= 20 huruf (pesan pendek: 'Halo' = 'halo')
    # angka "panjang" digabung bila dipisah titik/spasi/tanda hubung (nomor telp, rekening, uang)
    deret = re.findall(r"\d[\d .\-]{4,}\d|\d{5,}", t)
    panjang_angka = [len(re.sub(r"\D", "", s)) for s in deret]
    urls = URL_RE.findall(t) if False else [m.group(0) for m in URL_RE.finditer(t)]
    hosts = [_host(u) for u in urls]
    f = dict(
        n_char=n_char, n_kata=len(kata), n_digit=dig, rasio_digit=dig / max(n_char, 1),
        rasio_kapital=(kap / len(huruf)) if len(huruf) >= 20 else 0.0, n_seru=t.count("!"), n_tanya=t.count("?"),
        n_angka_panjang=sum(1 for x in panjang_angka if x >= 7), maks_panjang_angka=max(panjang_angka, default=0),
        ada_rupiah_uang=int(bool(KW_UANG.search(t))), ada_telp_like=int(any(9 <= x <= 14 for x in panjang_angka)),
        n_url=len(urls),
        url_pendek=int(any(h in SHORT or h.endswith("." + s) for (h, _), s in [(x, s) for x in hosts for s in SHORT] if True)),
        url_tld_risiko=int(any(h.endswith(TLD_RISK) for h, _ in hosts)),
        url_ip=int(any(re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", h) for h, _ in hosts)),
        url_ada_at=int(any("@" in u for _, u in hosts)),
        url_n_hubung=max([h.count("-") for h, _ in hosts], default=0),
        url_n_digit_host=max([sum(c.isdigit() for c in h) for h, _ in hosts], default=0),
        url_n_subdomain=max([max(h.count(".") - 1, 0) for h, _ in hosts], default=0),
        url_panjang_maks=max([len(u) for _, u in hosts], default=0),
        url_kata_curiga=int(any(k in h or k in u.lower() for h, u in hosts for k in KATA_URL)),
        url_tanpa_https=int(any(not u.lower().startswith("https://") for _, u in hosts)),
        kode_dan_angka=int(bool(KW_KODE.search(t)) and dig >= 4),
        kata_uang=len(KW_UANG.findall(t)), kata_urgen=len(KW_URGEN.findall(t)),
        n_simbol=sum(1 for c in t if not c.isalnum() and not c.isspace()),
    )
    return tuple(float(f[k]) for k in NAMA)


def vektor(teks):
    return _vektor(str(teks))


def matriks(teks_list):
    return np.array([vektor(t) for t in teks_list], dtype=np.float64)