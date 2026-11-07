/* ==========================================================
   KONFIGURASI (ubah bagian ini untuk mengganti isi game)
   ========================================================== */
const CONFIG = {
  appName: "EduSecurify",      // [nama game / judul]
  mascotName: "Bima",          // [nama maskot]
  // Ikon maskot: emoji, atau data URI gambar (mis. "data:image/png;base64,...")
  mascotIcon: "img/kepala.webp",     // ikon bulat maskot (tombol hint, dst.)
  mascotSprite: "img/maskot.webp",   // maskot full body di dialog (kosongkan "" untuk memakai ikon bulat saja)
  // Logo aplikasi untuk layar loading: emoji atau data URI gambar
  logo: "img/logo.png",
  taskFeatureName: "Task",     // [nama fitur] daftar task (label tab juga bisa diubah di HTML)
  pointCorrect: 10,            // poin jika pilihan benar
  pointReason: 5, pointAction: 5               // bonus jika alasan diisi (min. 10 karakter)
};

/* Teks postingan & pesan: ganti sesuai kebutuhan.
   phishing: true/false | explain: penjelasan setelah menjawab
   avatar (opsional): ikon pengguna berupa emoji atau gambar, mis. avatar:"🧑‍🎓" atau data URI.
   Jika dikosongkan, dipakai huruf awal nama. */
const POSTS = [
  {id:"p1", user:"Kicau Support Official", handle:"@kicau_support_official", phishing:true,
   text:"⚠️ Akun kamu terdeteksi melanggar kebijakan! Verifikasi dalam 1 jam atau akun dibekukan permanen: http://kicau-verifikasi-akun.xyz/login",
   explain:"Phishing. Ada ancaman dan batas waktu untuk membuatmu panik, tautannya bukan domain resmi, dan akun palsu meniru nama resmi."},
  {id:"p2", user:"Kampus Merdeka", handle:"@kampusmerdeka", phishing:false,
   text:"Seminar literasi digital gratis hari Sabtu, pukul 09.00 WIB. Info lengkap dan pendaftaran: https://kampus.ac.id/seminar",
   explain:"Bukan phishing. Domain resmi (.ac.id), tidak meminta data pribadi, dan tidak menekan kamu untuk buru-buru."},
  {id:"p3", user:"Hadiah Hari Ini", handle:"@hadiah_cuan88", phishing:true,
   text:"SELAMAT! Kamu terpilih dapat saldo e-wallet Rp500.000 🎁 Klik bit.ly/hadiah-kicau lalu masukkan kata sandi untuk klaim!",
   explain:"Phishing. Hadiah yang tiba-tiba, tautan pendek yang menyembunyikan tujuan, dan permintaan kata sandi."},
  {id:"p4", user:"Dimas Pratama", handle:"@dimas_pr", phishing:false,
   text:"Baru nyobain bakso depan kampus, kuahnya juara banget 🍜 Besok ke sini lagi ah.",
   explain:"Bukan phishing. Hanya cerita biasa, tanpa tautan dan tanpa permintaan apa pun."},
  {id:"p5", user:"Lowongan Kerja Santai", handle:"@loker_wfh_mudah", phishing:true,
   text:"Kerja dari rumah gaji 15 juta/minggu, tanpa pengalaman! Daftar di http://kerja-mudah.top/daftar dan isi NIK serta kode OTP.",
   explain:"Phishing. Gaji tidak masuk akal, domain mencurigakan, dan meminta NIK serta OTP yang tidak boleh dibagikan."}
];
const MSGS = [
  {id:"m1", user:"Admin Kicau", handle:"@admin_kicau_id", phishing:true,
   text:"Akun Anda akan dihapus dalam 24 jam. Login ulang di http://kicau-secure-login.com untuk menyelamatkan akun Anda.",
   explain:"Phishing. Pesan mengaku admin, mengancam, dan mengarah ke situs tiruan untuk mencuri kata sandi."},
  {id:"m2", user:"Sari (Teman Kelompok)", handle:"@sari_aw", phishing:false,
   text:"Eh tugas kelompok udah kamu kumpul belum? Deadline-nya besok jam 8 ya 🙏",
   explain:"Bukan phishing. Konteksnya wajar, dari teman yang kamu kenal, tanpa tautan atau permintaan data."},
  {id:"m3", user:"Kurir Paket Cepat", handle:"@kurir_cepat_id", phishing:true,
   text:"Paket Anda tertahan. Bayar biaya Rp3.500 di http://cek-paket-id.top dan masukkan data kartu untuk pengiriman ulang.",
   explain:"Phishing. Biaya kecil dipakai sebagai umpan agar kamu memasukkan data kartu di situs palsu."},
  {id:"m4", user:"Kicau", handle:"@kicau", phishing:false,
   text:"Kami melihat login baru dari perangkat baru. Jika itu kamu, abaikan pesan ini. Jika bukan, ubah sandi lewat menu Pengaturan di aplikasi.",
   explain:"Bukan phishing. Tidak ada tautan, tidak meminta data, dan mengarahkanmu ke menu resmi di dalam aplikasi."},
  {id:"m5", user:"Rani (Teman)", handle:"@rani_kw", phishing:true,
   text:"Tolong dong, kirimin kode OTP yang masuk ke HP kamu, aku salah masukin nomor. Buruan penting banget!!",
   explain:"Phishing (akun teman bisa diretas). Kode OTP bersifat rahasia dan tidak boleh diberikan kepada siapa pun."}
];

/* ENDLESS MODE: kumpulan task tambahan (kind: "post" atau "msg").
   Task diambil acak tanpa batas; setelah habis, dikocok ulang bersama 10 task utama. */
const ENDLESS = [
 {kind:"post", user:"Info Beasiswa Kilat", handle:"@beasiswa_kilat77", phishing:true, text:"Beasiswa penuh 100% untuk 50 orang pertama! Isi data lengkap + foto KTP di http://beasiswa-gratis.click/form", explain:"Phishing. Penawaran terlalu bagus, ada tekanan 'orang pertama', dan meminta data KTP lewat situs tidak resmi."},
 {kind:"post", user:"Perpustakaan Kota", handle:"@perpuskota", phishing:false, text:"Perpustakaan buka sampai pukul 20.00 selama minggu ujian. Katalog daring: https://perpus.kotaku.go.id", explain:"Bukan phishing. Informasi biasa dengan domain resmi (.go.id) dan tanpa permintaan data."},
 {kind:"msg", user:"CS Bank Digital", handle:"@cs_bank_digital_id", phishing:true, text:"Rekening Anda diblokir sementara. Konfirmasi PIN dan OTP di http://bank-verif.top/cek agar bisa dipakai kembali.", explain:"Phishing. Bank tidak pernah meminta PIN atau OTP lewat pesan, dan domainnya mencurigakan."},
 {kind:"msg", user:"Pak Rudi (Dosen)", handle:"@rudi_dosen", phishing:false, text:"Besok kuliah dimulai pukul 10.00 di ruang B2. Mohon hadir tepat waktu ya.", explain:"Bukan phishing. Pesan wajar dari orang yang dikenal, tanpa tautan atau permintaan data."},
 {kind:"post", user:"Giveaway Gadget", handle:"@giveaway_gadget_id", phishing:true, text:"GIVEAWAY HP terbaru! Login lewat http://giveaway-hp.xyz/login pakai akun Kicau-mu untuk ikut. Sisa 10 menit!", explain:"Phishing. Meminta login lewat situs luar dengan batas waktu sempit."},
 {kind:"post", user:"Nina Aulia", handle:"@ninaaulia", phishing:false, text:"Akhirnya sidang skripsi selesai! Terima kasih semua yang sudah mendoakan 🎓", explain:"Bukan phishing. Cerita pribadi tanpa tautan dan tanpa permintaan apa pun."},
 {kind:"msg", user:"Hadiah Undian", handle:"@undian_resmi_id", phishing:true, text:"Selamat! Nomor kamu memenangkan mobil. Hubungi kami dan kirim foto KTP serta kode verifikasi yang dikirim lewat SMS.", explain:"Phishing. Hadiah tak jelas, dan meminta KTP serta kode verifikasi (OTP)."},
 {kind:"msg", user:"Toko Buku Kita", handle:"@tokobukukita", phishing:false, text:"Pesanan #2210 sudah dikirim. Pantau di menu Pesanan pada aplikasi resmi kami. Terima kasih sudah berbelanja!", explain:"Bukan phishing. Tidak ada tautan atau permintaan data; kamu diarahkan ke aplikasi resmi."},
 {kind:"post", user:"Update Aplikasi Kicau", handle:"@kicau_update_resmi", phishing:true, text:"Update wajib! Unduh versi terbaru dari http://kicau-apk-download.top/kicau.apk atau akun tidak bisa dipakai.", explain:"Phishing. File dari luar toko aplikasi resmi dan ancaman akun diblokir."},
 {kind:"post", user:"Komunitas Coding", handle:"@kodekita", phishing:false, text:"Meetup coding minggu depan, daftar lewat tautan di profil resmi kami. Gratis dan terbuka untuk pemula.", explain:"Bukan phishing. Tidak ada tautan mencurigakan atau permintaan data sensitif."},
 {kind:"msg", user:"Teman Lama", handle:"@bayu_old", phishing:true, text:"Hai, ini aku Bayu. Lihat foto kamu di sini deh 😱 http://foto-kamu-bocor.top/lihat (login dulu ya)", explain:"Phishing. Umpan penasaran, tautan mencurigakan, dan meminta login."},
 {kind:"msg", user:"Dina (Teman)", handle:"@dinadn", phishing:false, text:"Makasih ya udah bantuin catatan kemarin! Traktir kopi sabtu ini 😄", explain:"Bukan phishing. Obrolan santai antar teman, tanpa tautan dan tanpa permintaan data."},
 {kind:"msg", user:"Pinjol Kilat", handle:"@pinjol_kilat_cair", phishing:true, text:"Pinjaman Rp10 juta cair 5 menit tanpa jaminan! Transfer biaya asuransi Rp100.000 dulu, lalu klik http://pinjam-cepat88.top/ajukan", explain:"Phishing. Pinjaman asli tidak meminta biaya di muka, janjinya terlalu mudah, dan domainnya mencurigakan."},
 {kind:"post", user:"Trading Profit Harian", handle:"@cuan_trader_vip", phishing:true, text:"Modal Rp100.000 jadi 10 juta dalam 7 hari, profit dijamin! Gabung grup di http://trader-vip-id.xyz/daftar sebelum slot penuh", explain:"Phishing. Untung pasti dan cepat itu mustahil, ada tekanan 'slot penuh', dan tautannya tidak resmi."},
 {kind:"msg", user:"Undangan Digital", handle:"@undangan_digital", phishing:true, text:"Undangan pernikahan kami 💌 Unduh aplikasinya di http://undangan-nikah.site/undangan.apk", explain:"Phishing. Undangan asli tidak perlu memasang aplikasi. File .apk dari luar toko resmi bisa berisi virus pencuri data."},
 {kind:"msg", user:"Kurir Anteraja Info", handle:"@anteraja_info_cs", phishing:true, text:"Alamat paket tidak lengkap. Perbarui data dalam 12 jam di http://cek-alamat-paket.click/ubah atau paket dikembalikan ke pengirim.", explain:"Phishing. Batas waktu sempit, ancaman paket dikembalikan, dan domain .click yang bukan milik kurir."},
 {kind:"msg", user:"Rizky (Teman)", handle:"@rizky_kw", phishing:true, text:"Bro lagi darurat, pinjem Rp500.000 dulu ya, transfer ke rekening 1234567890. Besok kuganti. Jangan bilang siapa-siapa!", explain:"Phishing (akun teman bisa diretas). Minta uang mendesak dan rahasia. Telepon temanmu langsung untuk memastikan."},
 {kind:"post", user:"Bantuan Pelajar Cair", handle:"@bantuan_pelajar_cair", phishing:true, text:"Bantuan pemerintah Rp1.000.000 untuk pelajar sudah cair! Cek namamu dan isi data di bit.ly/bansos-pelajar", explain:"Phishing. Mengatasnamakan pemerintah, tetapi memakai tautan pendek dan meminta data pribadi."},
 {kind:"msg", user:"Tim Keamanan Kicau", handle:"@keamanan_kicau_help", phishing:true, text:"Ada yang mencoba masuk ke akunmu dari Medan. Amankan sekarang: http://kicau-amankan-akun.xyz/verif", explain:"Phishing. Meniru notifikasi keamanan, tetapi tautannya mengarah ke domain palsu."},
 {kind:"post", user:"BEM Fakultas Teknik", handle:"@bem_ft", phishing:false, text:"Pendaftaran lomba poster digital dibuka sampai Jumat. Formulir resmi: https://bem.kampusku.ac.id/lomba", explain:"Bukan phishing. Domain resmi (.ac.id), informasi jelas, dan tidak meminta data rahasia."},
 {kind:"post", user:"Waspada Penipuan", handle:"@waspada_online", phishing:false, text:"Ingat ya, jangan pernah bagikan kode OTP ke siapa pun, termasuk yang mengaku dari bank!", explain:"Bukan phishing. Kata OTP memang muncul, tetapi justru untuk mengingatkan agar tidak dibagikan."},
 {kind:"msg", user:"Kopi Senja", handle:"@kopisenja", phishing:false, text:"Pesananmu sudah kami terima dan sedang diproses, estimasi tiba besok. Terima kasih 🙏", explain:"Bukan phishing. Hanya pemberitahuan pesanan, tanpa tautan dan tanpa permintaan data."},
 {kind:"msg", user:"Galih (Teman)", handle:"@galih_pk", phishing:false, text:"Besok jadi ke perpus? Aku jemput jam 13.00 ya, jangan telat 😄", explain:"Bukan phishing. Obrolan wajar antar teman, tanpa tautan dan tanpa permintaan apa pun."},
 {kind:"post", user:"Tika Sari", handle:"@tikasari", phishing:false, text:"Weekend ini mau camping bareng temen-temen. Ada yang mau ikut?", explain:"Bukan phishing. Ajakan biasa, tanpa tautan dan tanpa permintaan data."},
 {kind:"msg", user:"Info Kampus", handle:"@info_kampus", phishing:false, text:"Jadwal ujian semester sudah terbit, cek di https://www.univnusa.ac.id/jadwal", explain:"Bukan phishing. Tautan menuju domain resmi (.ac.id) dan hanya memberi informasi."},
 {kind:"post", user:"Komunitas Python", handle:"@pythonkita", phishing:false, text:"Giveaway buku untuk 3 pemenang! Cukup follow akun ini, like postingan, dan tag 2 temanmu. Pemenang diumumkan Sabtu. Tanpa biaya dan tanpa data pribadi.", explain:"Bukan phishing. Syaratnya hanya aktivitas biasa di aplikasi, tanpa biaya, tanpa tautan, dan tanpa data pribadi."}
];

/* Avatar lucu per akun (emoji). Sengaja campur: akun penipu juga bisa tampil imut,
   jadi avatar tidak membocorkan jawaban. Akun tanpa entri memakai huruf awal nama. */
const AVATARS = {
  "Kicau Support Official":"🦊","Hadiah Hari Ini":"🐹","Lowongan Kerja Santai":"🐸","Admin Kicau":"🐧","Kurir Paket Cepat":"🐢",
  "Rani (Teman)":"🐰","Info Beasiswa Kilat":"🦆","CS Bank Digital":"🐙","Giveaway Gadget":"🦄","Hadiah Undian":"🐯",
  "Update Aplikasi Kicau":"🦉","Teman Lama":"🐨","Pinjol Kilat":"🐼","Trading Profit Harian":"🦖","Undangan Digital":"🐶",
  "Kurir Anteraja Info":"🐱","Rizky (Teman)":"🐻","Bantuan Pelajar Cair":"🐷","Tim Keamanan Kicau":"🦁",
  "Kampus Merdeka":"🐘","Dimas Pratama":"🐵","Sari (Teman Kelompok)":"🦒","Kicau":"🐦","Perpustakaan Kota":"🦔","Pak Rudi (Dosen)":"🐺",
  "Nina Aulia":"🐿️","Toko Buku Kita":"🦦","Komunitas Coding":"🦎","Dina (Teman)":"🐮","BEM Fakultas Teknik":"🦅","Waspada Penipuan":"🦇",
  "Kopi Senja":"🦝","Galih (Teman)":"🐴","Tika Sari":"🐞","Info Kampus":"🐝","Komunitas Python":"🐍"
};
