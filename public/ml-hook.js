/* ==========================================================
   HOOK MODEL ML (terhubung ke server.py)
   - EduSecurity.analyze(text) : { p, level, signals[], src } dari POST /predict
       src = "model"      -> dari model scikit-learn di server (disertai alasan/sinyal)
       src = "heuristic"  -> server tidak terjangkau; pakai aturan sederhana di perangkat (tanpa sinyal)
     Hasil model disimpan di cache supaya teks yang sama tidak diminta dua kali.
   - EduSecurity.predict(text) : hanya angka peluang (kompatibel dengan kode lama).
   - EduSecurity.modelInfo()   : ringkasan kualitas model dari GET /model-info.
   - onAnswer / onTweet        : mengirim catatan ke POST /log.
   Semua data juga tersimpan di EduSecurity.records / getData().
   ========================================================== */
function levelOf(p){ return p >= 0.7 ? "tinggi" : p >= 0.4 ? "sedang" : "rendah"; }

async function heuristicPredict(text){
  const s = text.toLowerCase();
  const links = s.split(/\s+/).filter(w=>w.startsWith("http")||w.startsWith("www.")||w.startsWith("bit.ly"));
  let z = -1.2;
  if(links.length) z += 0.8;
  links.forEach(l=>{
    if([".xyz",".top",".click",".tk",".site",".icu",".online"].some(x=>l.includes(x))) z += 1.6;
    if(["bit.ly","tinyurl","s.id"].some(x=>l.includes(x))) z += 1.0;
    if(["login","verif","secure","akun","klaim","claim","hadiah"].some(x=>l.includes(x))) z += 0.9;
    if([".ac.id",".go.id",".edu",".gov"].some(x=>l.includes(x))) z -= 2;
    if(l.startsWith("http://")) z += 0.4;
  });
  ["otp","pin","kata sandi","password","verifikasi","segera","blokir","dibekukan","hadiah","klaim","pemenang","undian","selamat","ktp","data kartu","login","transfer","gaji","24 jam","1 jam","menit"].forEach(w=>{ if(s.includes(w)) z += 0.55; });
  ["terima kasih","makasih","kuliah","tugas","seminar","gratis"," ya"].forEach(w=>{ if(s.includes(w)) z -= 0.35; });
  if(s.includes("!!")) z += 0.4;
  return 1/(1+Math.exp(-z));
}

const _mlCache = new Map();
async function analyzeLocal(text){
  const p = await heuristicPredict(text);
  return {p, level: levelOf(p), signals: [], src: "heuristic"};
}

window.EduSecurity = {
  records: [],
  onAnswer: null,
  onTweet: null,
  onEvent: null,
  analyze: analyzeLocal,
  async predict(text, meta){ return (await this.analyze(text, meta)).p; },
  modelInfo: async () => null,
  getData(){ return JSON.parse(JSON.stringify(this.records)); }
};

/* ---------- koneksi ke server ---------- */
const API_BASE = "";   // kosong = server yang sama (game & API satu alamat)
const ON_SERVER = location.protocol.startsWith("http");  // false jika index.html dibuka dari file://

// ID anonim per perangkat (tanpa data pribadi) agar jawaban satu anak bisa dikelompokkan
let PLAYER_ID = "anon";
try{
  PLAYER_ID = localStorage.getItem("edu_pid") || ("p" + Math.random().toString(36).slice(2, 8));
  localStorage.setItem("edu_pid", PLAYER_ID);
}catch(e){}

function withTimeout(promise, ms){
  return Promise.race([promise, new Promise((_, rej)=>setTimeout(()=>rej(new Error("timeout")), ms))]);
}

if(ON_SERVER){
  EduSecurity.analyze = async (text, meta) => {
    if(_mlCache.has(text)) return _mlCache.get(text);
    try{
      const res = await withTimeout(fetch(API_BASE + "/predict", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text, ...meta})
      }), 8000);
      if(!res.ok) throw new Error("HTTP " + res.status);
      const out = await res.json();
      if(typeof out.phish_prob !== "number") throw new Error("respons tidak valid");
      const a = {p: out.phish_prob, level: out.level || levelOf(out.phish_prob), signals: Array.isArray(out.signals) ? out.signals : [], src: "model"};
      _mlCache.set(text, a);
      return a;
    }catch(e){
      console.warn("API model tidak terjangkau, pakai heuristik:", e);
      return analyzeLocal(text);
    }
  };

  EduSecurity.modelInfo = async () => {
    try{
      const res = await withTimeout(fetch(API_BASE + "/model-info"), 5000);
      return res.ok ? await res.json() : null;
    }catch(e){ return null; }
  };

  const kirim = (rec) => {
    try{
      fetch(API_BASE + "/log", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({...rec, playerId: PLAYER_ID}),
        keepalive: true
      }).catch(()=>{});
    }catch(e){}
  };
  EduSecurity.onAnswer = kirim;
  EduSecurity.onTweet  = kirim;
  EduSecurity.onEvent  = kirim;   // pembelian, pemakaian bantuan, misi, peti (dari shop.js)
}
