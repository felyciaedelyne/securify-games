/* ==========================================================
   FX: efek suara, konfeti, pangkat, mesin ketik, dan "tanda bahaya"
   Dimuat SEBELUM game.js. Tidak bergantung pada variabel game
   (state dikirim lewat parameter), jadi aman diubah terpisah.
   ========================================================== */
const FX = (() => {
  const REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const dec = () => typeof SHOP !== "undefined" ? SHOP.deco() : "";   // topi & peliharaan dari toko
  const dcls = () => typeof SHOP !== "undefined" ? SHOP.cls() : "";   // bingkai avatar dari toko

  /* ---------- suara (WebAudio, tanpa file) ---------- */
  let ac = null, muted = false;
  try{ muted = localStorage.getItem("edu_mute") === "1"; }catch(e){}
  function ctx(){
    if(!ac){ try{ ac = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
    if(ac && ac.state === "suspended") ac.resume();
    return ac;
  }
  function tone(f, t0, d, type="sine", v=.12){
    const c = ctx(); if(!c || muted) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t+.01); g.gain.exponentialRampToValueAtTime(.0001, t+d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+d+.02);
  }
  const snd = {
    tap(){ tone(520, 0, .05, "triangle", .06); },
    ok(){ tone(660, 0, .12); tone(880, .1, .2); },
    bad(){ tone(220, 0, .18, "sawtooth", .07); tone(165, .14, .28, "sawtooth", .07); },
    combo(n){ [523, 659, 784, 1047].slice(0, Math.min(4, n)).forEach((f,i) => tone(f, i*.07, .15)); },
    badge(){ tone(880, 0, .1); tone(1175, .1, .28); },
    win(){ [523, 659, 784, 1047, 1319].forEach((f,i) => tone(f, i*.1, .28)); }
  };
  function setMuted(m){
    muted = m; try{ localStorage.setItem("edu_mute", m ? "1" : "0"); }catch(e){}
    const b = document.getElementById("snd"); if(b) b.textContent = m ? "🔇" : "🔊";
  }

  /* ---------- mesin ketik untuk dialog maskot ---------- */
  let tmr = null, el = null, full = "";
  function type(e, text){
    clearInterval(tmr); tmr = null; el = e; full = text;
    if(REDUCE){ e.textContent = text; return; }
    const ch = Array.from(text); let i = 0; e.textContent = "";
    tmr = setInterval(() => { i += 2; e.textContent = ch.slice(0, i).join(""); if(i >= ch.length){ clearInterval(tmr); tmr = null; } }, 16);
  }
  function skipType(){ if(!tmr) return false; clearInterval(tmr); tmr = null; el.textContent = full; return true; }
  function bounce(e){ if(REDUCE) return; e.classList.remove("bounce"); void e.offsetWidth; e.classList.add("bounce"); }

  /* ---------- efek visual ---------- */
  function float(txt, color){
    if(REDUCE) return;
    const d = document.createElement("div"); d.className = "float"; d.textContent = txt; d.style.color = color || "#fff";
    document.body.appendChild(d); setTimeout(() => d.remove(), 1150);
  }
  function flash(ok){
    if(REDUCE) return;
    let f = document.getElementById("flash");
    if(!f){ f = document.createElement("div"); f.id = "flash"; document.body.appendChild(f); }
    f.className = ""; void f.offsetWidth; f.className = ok ? "ok" : "bad";
  }
  function shake(){
    if(REDUCE) return;
    const a = document.getElementById("app"); a.classList.remove("shake"); void a.offsetWidth; a.classList.add("shake");
  }
  function confetti(n = 100){
    if(REDUCE) return;
    let cv = document.getElementById("fxc");
    if(!cv){ cv = document.createElement("canvas"); cv.id = "fxc"; document.body.appendChild(cv); }
    const c = cv.getContext("2d"), W = cv.width = innerWidth, H = cv.height = innerHeight;
    const cols = ["#1d9bf0", "#7856ff", "#f91880", "#ff7a00", "#00ba7c", "#ffd400"];
    const P = Array.from({length:n}, () => ({x:W/2 + (Math.random()-.5)*80, y:H*.55, vx:(Math.random()-.5)*12, vy:-Math.random()*13-4,
      s:5+Math.random()*6, r:Math.random()*6, vr:(Math.random()-.5)*.4, c:cols[Math.random()*cols.length|0]}));
    let f = 0;
    (function tick(){
      c.clearRect(0, 0, W, H);
      P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s/2, -p.s/3, p.s, p.s*.6); c.restore(); });
      if(++f < 110) requestAnimationFrame(tick); else c.clearRect(0, 0, W, H);
    })();
  }

  /* ---------- pangkat ---------- */
  const RANKS = [[0,"🐣","Satpam Magang"], [30,"🔰","Satpam Pemula"], [70,"🛡️","Penjaga Waspada"],
                 [120,"🕵️","Detektif Phishing"], [200,"🏆","Pakar Anti-Phishing"], [350,"👑","Legenda Siber"]];
  function rank(p){
    let i = 0; RANKS.forEach((r,k) => { if(p >= r[0]) i = k; });
    const cur = RANKS[i], nx = RANKS[i+1];
    return {i, icon:cur[1], name:cur[2], next:nx, need:nx ? nx[0]-p : 0, pct:nx ? (p-cur[0])/(nx[0]-cur[0]) : 1};
  }
  function rankBar(S){
    const r = rank(S.points);
    return `<span class="pav sm ${dcls()}">${P.emoji}${dec()}</span><span class="rk">${r.icon} ${r.name}</span><div class="xp"><i style="width:${Math.round(r.pct*100)}%"></i></div>` +
      (S.combo >= 2 ? `<span class="cb">🔥 x${S.combo}</span>` : `<span class="hd">${r.next ? r.need + " poin lagi" : "PANGKAT MAKS"}</span>`);
  }
  function rankCard(S){
    const r = rank(S.points);
    return `<div class="rcard"><div class="big">${r.icon}</div><div style="flex:1"><b>${r.name}</b><div class="xp" style="margin:6px 0 4px"><i style="width:${Math.round(r.pct*100)}%"></i></div><span class="hd" style="font-size:12px">${r.next ? r.need + " poin lagi menuju " + r.next[1] + " " + r.next[2] : "Pangkat tertinggi tercapai!"} · kombo terbaik ${S.bestCombo}x</span></div></div>`;
  }
  function rankUp(r){ snd.win(); confetti(80); setTimeout(() => { const t = document.getElementById("toast"); t.textContent = r.icon + " Naik pangkat: " + r.name + "!"; t.style.display = "block"; setTimeout(() => t.style.display = "none", 2600); }, 700); }

  /* ---------- umpan balik jawaban ---------- */
  function feedback(correct, pts, combo){
    flash(correct);
    if(correct){
      snd.ok(); float("+" + pts, "#7dffc4");
      if(combo >= 3){ setTimeout(() => { snd.combo(combo - 2); float("🔥 Kombo x" + combo, "#ffd400"); confetti(combo >= 5 ? 70 : 35); }, 450); }
    } else { snd.bad(); shake(); float("Hati-hati!", "#ff8fb1"); }
  }

  /* ---------- tanda bahaya / tanda aman (dijelaskan setelah menjawab) ---------- */
  const SHORT = ["bit.ly", "tinyurl.com", "s.id", "t.co", "cutt.ly", "is.gd", "rb.gy", "shorturl.at"];
  const RISKY = [".xyz", ".top", ".click", ".tk", ".site", ".icu", ".online", ".buzz", ".cc", ".live", ".shop", ".link", ".vip", ".info"];
  const OFFICIAL = [".ac.id", ".go.id", ".sch.id", ".edu", ".gov", ".mil.id"];
  const KWH = ["login", "verif", "secure", "akun", "klaim", "claim", "hadiah", "bantuan", "update", "cek", "bayar", "promo", "gift", "reward", "konfirmasi", "resmi", "aman", "giveaway", "download", "foto"];
  const LINK_RE = /(?:https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|s\.id\/)[^\s]+/gi;

  function linkFlags(text){
    const out = [];
    (text.match(LINK_RE) || []).forEach(raw => {
      const u = raw.replace(/[.,!?)"']+$/, "");
      let h, path = "", https = /^https:/i.test(u);
      try{ const o = new URL(/^https?:/i.test(u) ? u : "http://" + u); h = o.hostname.toLowerCase().replace(/^www\./, ""); path = o.pathname.toLowerCase(); }catch(e){ return; }
      if(SHORT.includes(h)) out.push({bad:1, i:"🔗", t:"Tautan dipendekkan (" + h + ")", d:"Tujuan asli disembunyikan, kamu tidak tahu akan dibawa ke mana."});
      if(OFFICIAL.some(x => h.endsWith(x))) out.push({bad:0, i:"🏛️", t:"Domain resmi (" + h + ")", d:"Akhiran .ac.id / .go.id hanya bisa dipakai lembaga yang terdaftar."});
      else if(RISKY.some(x => h.endsWith(x))) out.push({bad:1, i:"🌐", t:"Akhiran domain murah (" + h + ")", d:"Domain seperti .xyz atau .top murah dan sering dipakai untuk situs penipuan."});
      if(h.includes("-") && KWH.some(k => h.includes(k))) out.push({bad:1, i:"🎭", t:"Domain meniru nama resmi", d:"Kata seperti verifikasi/login/akun dirangkai dengan tanda hubung agar tampak meyakinkan."});
      if(/^http:/i.test(u)) out.push({bad:1, i:"🔓", t:"Tidak memakai HTTPS", d:"Situs resmi untuk login hampir selalu memakai https."});
      if(path.endsWith(".apk")) out.push({bad:1, i:"📦", t:"Mengajak mengunduh file .apk", d:"Aplikasi dari luar toko resmi bisa berisi virus pencuri data."});
    });
    return out;
  }
  const TXT_RULES = [
    [/(\d+\s?(jam|menit)|segera|buruan|cepetan|sekarang juga|orang pertama|sisa \d+|batas waktu)/i, "⏰", "Menekan dengan batas waktu", "Pelaku ingin kamu panik dan tidak sempat berpikir."],
    [/(diblokir|dibekukan|dihapus|dibatalkan|permanen|melanggar|tertahan|dihentikan)/i, "😨", "Mengancam akan ada kerugian", "Ancaman dipakai supaya kamu menuruti perintah."],
    [/(\botp\b|\bpin\b|kata sandi|password|\bcvv\b|kode verifikasi|kode sms)/i, "🔑", "Meminta data rahasia", "OTP, PIN, dan kata sandi tidak boleh diberikan kepada siapa pun."],
    [/(\bktp\b|\bnik\b|data kartu|data lengkap|nomor rekening)/i, "🪪", "Meminta data pribadi", "Data seperti KTP/NIK/kartu bisa dipakai untuk menipu atas namamu."],
    [/(selamat|terpilih|memenangkan|menang|giveaway|hadiah|saldo|undian|gaji \d+|\d+ juta)/i, "🎁", "Penawaran terlalu bagus", "Hadiah atau uang yang tiba-tiba datang hampir selalu umpan."],
    [/(foto kamu|videomu|lihat foto)/i, "👀", "Umpan rasa penasaran", "Pesan membuatmu ingin langsung mengeklik tanpa curiga."],
    [/(transfer|pinjem|pinjam|isiin pulsa)/i, "💸", "Meminta uang secara mendesak", "Hubungi orangnya lewat telepon atau jalur lain untuk memastikan."]
  ];
  function analyze(t){
    const bad = [], good = [], txt = t.text, links = linkFlags(txt);
    if(t.phishing){
      if(/official|admin|support|resmi|^@cs_|_cs_|keamanan/i.test(t.handle || "")) bad.push({i:"🎭", t:"Akun mengaku pihak resmi", d:"Nama pengguna dibuat mirip akun resmi. Cek centang verifikasi dan riwayat akunnya."});
      TXT_RULES.forEach(r => { if(r[0].test(txt)) bad.push({i:r[1], t:r[2], d:r[3]}); });
      links.filter(l => l.bad).forEach(l => bad.push(l));
      if(/login|masuk/i.test(txt) && links.length) bad.push({i:"🔐", t:"Meminta login lewat tautan", d:"Login seharusnya lewat aplikasi atau situs resmi yang kamu ketik sendiri."});
      return {phish:true, items:bad.slice(0, 5)};
    }
    links.filter(l => !l.bad).forEach(l => good.push(l));
    if(!links.length) good.push({i:"✅", t:"Tidak ada tautan", d:"Tidak ada yang perlu diklik, risikonya kecil."});
    if(!TXT_RULES[2][0].test(txt) && !TXT_RULES[3][0].test(txt)) good.push({i:"🙂", t:"Tidak meminta data rahasia", d:"Tidak ada permintaan OTP, PIN, kata sandi, atau data pribadi."});
    if(!TXT_RULES[0][0].test(txt) && !TXT_RULES[1][0].test(txt)) good.push({i:"🧘", t:"Tanpa tekanan atau ancaman", d:"Nadanya tenang, kamu bebas memutuskan."});
    if(/aplikasi|menu|resmi/i.test(txt) && !links.length) good.push({i:"📱", t:"Mengarahkan ke aplikasi resmi", d:"Cek lewat menu di aplikasi, bukan lewat tautan asing."});
    return {phish:false, items:good.slice(0, 4)};
  }
  function flagsHtml(t){
    const a = analyze(t); if(!a.items.length) return "";
    return `<div class="flags"><h5>${a.phish ? "🚩 Tanda bahaya yang bisa kamu temukan" : "🟢 Kenapa ini terlihat aman"}</h5>` +
      a.items.map(x => `<div class="flag ${a.phish ? "" : "ok"}"><span class="i">${x.i}</span><div><b>${esc(x.t)}</b>${esc(x.d)}</div></div>`).join("") + `</div>`;
  }

  /* ---------- profil pemain (nama & bio lucu, acak, disimpan di perangkat) ---------- */
  const ANIMALS = [["🐱","Kucing"],["🐶","Anjing"],["🦊","Rubah"],["🐼","Panda"],["🐸","Katak"],["🐧","Pinguin"],["🦉","Burung Hantu"],["🐙","Gurita"],
                   ["🦖","Dino"],["🐹","Hamster"],["🦄","Unicorn"],["🐢","Kura-kura"],["🐨","Koala"],["🦆","Bebek"],["🐰","Kelinci"],["🐯","Harimau"]];
  const ADJ = ["Waspada","Jeli","Anti-Tipu","Sigap","Cerdik","Kebal Phishing","Santuy","Teliti","Galak","Anti-Klik"];
  const BIOS = ["Klik link? Nanti dulu ya.","OTP-ku rahasia negara 🤫","Hadiah gratis? Aku cek dulu.","Curigaan itu sehat.","Tanya dulu, klik belakangan.",
                "Suka bakso, anti umpan 🍜","Dompet aman, hati tenang.","Satpam digital kelas teri, tapi teliti."];
  const pick = a => a[Math.random()*a.length|0];
  function makeProfile(){
    const [e, n] = pick(ANIMALS), adj = pick(ADJ);
    return {emoji:e, name:n + " " + adj, handle:"@" + (n + adj).toLowerCase().replace(/[^a-z]/g, "") + (10 + (Math.random()*89|0)), bio:pick(BIOS)};
  }
  let P = null;
  try{ P = JSON.parse(localStorage.getItem("edu_profile")); }catch(e){}
  if(!P || !P.name) P = makeProfile();
  const save = () => { try{ localStorage.setItem("edu_profile", JSON.stringify(P)); }catch(e){} };
  save();
  const profile = () => P;
  function reroll(){ P = makeProfile(); save(); snd.tap(); }
  function profileCard(){
    return `<div class="pcard"><div class="pav ${dcls()}">${P.emoji}${dec()}</div><div style="flex:1;min-width:0"><b>${esc(P.name)}</b><div class="hd">${esc(P.handle)}</div><div class="bio">“${esc(P.bio)}”</div></div><button class="dice" data-act="dice" title="Acak profil">🎲</button></div>`;
  }

  const b = document.getElementById("snd");
  if(b){ b.textContent = muted ? "🔇" : "🔊"; b.onclick = () => { setMuted(!muted); if(!muted) snd.tap(); }; }
  return {profile, reroll, profileCard, snd, type, skipType, bounce, float, confetti, rank, rankBar, rankCard, rankUp, feedback, flagsHtml, analyze};
})();
