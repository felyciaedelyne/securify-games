const IMG_RE = /^(data:|https?:|\.{0,2}\/|[\w\-\/]+\.(png|jpe?g|gif|webp|svg)$)/i;
const unlocked = () => ALL.every(t=>S.done[t.id]);
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function nextEndless(){
  const E = S.en;
  if(!E.bag.length) E.bag = shuffle([...ENDLESS, ...ALL.map(t=>({...t, kind:t.id[0]==="p"?"post":"msg"}))]);
  const t = {...E.bag.pop(), endless:true}; E.n++; t.id = "e"+E.n; E.cur = t;
  S.draft = {choice:null, reason:""}; S.t0 = Date.now(); prefetchML(t);
}
function endlessView(){
  const E = S.en, t = E.cur, tot = Object.keys(S.er).length;
  const head = `<div class="sec" style="padding-bottom:0"><b>♾️ Endless Mode</b> · Task #${E.n}<br><span class="hd">Benar ${E.ok}/${tot} · 🔥 Streak ${E.streak} (terbaik ${E.best})</span></div>`;
  const lbl = `<div class="sec hd" style="padding-bottom:0">${t.kind==="post"?"📣 Postingan":"✉️ Pesan"}</div>`;
  const card = t.kind==="post"
    ? `<div class="item" style="cursor:default">${avatar(t.user,t.avatar)}<div class="body"><div><span class="nm">${esc(t.user)}</span> <span class="hd">${esc(t.handle)}</span></div><div class="tx">${fmt(t.text)}</div></div></div>`
    : `<div class="sec" style="padding-bottom:0"><span class="nm">${esc(t.user)}</span> <span class="hd">${esc(t.handle)}</span></div><div class="bubble">${fmt(t.text)}</div>`;
  return head + lbl + card + answerPanel(t);
}
/* ============================ GAME ============================ */
const ALL = [...POSTS, ...MSGS];
const BADGES = [
  {id:"first", icon:"🥇", name:"Satpam Pemula", desc:"Selesaikan 1 task", ok:s=>Object.keys(s.done).length>=1},
  {id:"posts", icon:"📣", name:"Pengintai Postingan", desc:"Selesaikan semua task postingan", ok:s=>POSTS.every(t=>s.done[t.id])},
  {id:"msgs", icon:"💬", name:"Penjaga Pesan", desc:"Selesaikan semua task pesan", ok:s=>MSGS.every(t=>s.done[t.id])},
  {id:"pro", icon:"🛡️", name:"Satpam Digital", desc:"Semua task, minimal 80% benar", ok:s=>ALL.every(t=>s.done[t.id])&&ALL.filter(t=>s.done[t.id].correct).length>=8},
  {id:"endless", icon:"♾️", name:"Pemburu Phishing", desc:"10 jawaban benar di Endless Mode", ok:s=>s.en.ok>=10},
  {id:"lapor", icon:"🚩", name:"Pelapor Sigap", desc:"Laporkan akun phishing dengan benar", ok:s=>s.ac.rep>=1},
  {id:"aksi", icon:"🏅", name:"Aksi Jitu", desc:"5 tindakan (Report/Block/Abaikan) yang tepat", ok:s=>s.ac.ok>=5},
  {id:"tweet", icon:"✍️", name:"Penulis Tweet", desc:"Tulis 3 tweet dan lihat nilai modelnya", ok:s=>s.tw.list.length>=3},
  {id:"combo3", icon:"🔥", name:"Mulai Panas", desc:"Kombo 3 jawaban benar beruntun", ok:s=>s.bestCombo>=3},
  {id:"combo6", icon:"⚡", name:"Tak Terhentikan", desc:"Kombo 6 jawaban benar beruntun", ok:s=>s.bestCombo>=6},
  {id:"eagle", icon:"🦅", name:"Mata Elang", desc:"5 jawaban benar tanpa memakai hint", ok:s=>s.eagle>=5},
  {id:"duet", icon:"🧠", name:"Lebih Jeli dari AI", desc:"5 kali benar saat AI keliru", ok:s=>s.beatAI>=5},
  {id:"endless25", icon:"🌋", name:"Legenda Endless", desc:"25 jawaban benar di Endless Mode", ok:s=>s.en.ok>=25},
  {id:"shopper", icon:"🛍️", name:"Belanja Pertama", desc:"Beli sesuatu di Toko", ok:s=>SHOP.buys()>=1},
  {id:"cards", icon:"🃏", name:"Kolektor Kartu", desc:"Kumpulkan 5 kartu waspada", ok:s=>SHOP.cardCount()>=5}
];
let session = 1;
const S = {tab:"home", points:0, done:{}, open:null, thread:null, lock:null, badges:[], draft:{choice:null,reason:""}, s2:false, t0:0, er:{}, en:{n:0,ok:0,streak:0,best:0,bag:[],cur:null}, pend:null, hint:{}, ac:{ok:0,rep:0}, tw:{list:[],draft:"",busy:false,intro:false}, combo:0, bestCombo:0, eagle:0, ml:{}, mlAgree:0, beatAI:0, minfo:null};
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const URL_RE = /((?:https?:\/\/|bit\.ly\/)[^\s]+)/g;
const fmt = t => esc(t).replace(URL_RE, '<span class="lnk">$1</span>');
const COLORS = ["#1d9bf0","#7856ff","#f91880","#ff7a00","#00ba7c"];
const avatar = (u, a0) => {
  const a = a0 || (ALL.find(t=>t.user===u)||{}).avatar || AVATARS[u];
  if(a) return `<div class="av" style="background:var(--surf);border:1px solid var(--line);font-size:24px;overflow:hidden">${IMG_RE.test(a)?`<img src="${a}" alt="" style="width:100%;height:100%;object-fit:cover">`:esc(a)}</div>`;
  return `<div class="av" style="background:${COLORS[u.length%5]}">${esc(u[0])}</div>`;
};

/* ---- dialog gaya visual novel ---- */
let q = [], after = null;
function setMascot(){
  const ic = CONFIG.mascotIcon;
  $("mas").innerHTML = (IMG_RE.test(ic) ? `<img src="${ic}" alt="">` : ic) + SHOP.mascotDeco();
  $("dn").textContent = CONFIG.mascotName;
  $("hint").innerHTML = $("mas").innerHTML;
  // maskot full body di dialog (gaya visual novel); aksesori Bima dari Toko ikut dipasang di kepalanya
  const sp = CONFIG.mascotSprite, hasSp = !!sp && IMG_RE.test(sp);
  $("dlg").classList.toggle("hasSprite", hasSp);
  if(hasSp){ $("spw").innerHTML = `<img id="sprite" src="${sp}" alt="">` + SHOP.mascotDeco(); }
}
function say(lines, cb){ q = lines.slice(); after = cb||null; $("dlg").classList.add("on"); next(); }
function next(){
  if(FX.skipType()) return;
  if(!q.length){ $("dlg").classList.remove("on"); const f = after; after = null; if(f) f(); return; }
  FX.type($("dt"), q.shift()); FX.bounce($("mas")); FX.bounce($("spw"));
}
$("dbox").onclick = next;

/* ---- tampilan ---- */
function toast(m){ const t=$("toast"); t.textContent=m; t.style.display="block"; setTimeout(()=>t.style.display="none",2600); }
function answerPanel(t){
  const d = S.done[t.id] || S.er[t.id];
  if(d) return `<div class="panel"><div class="fb ${d.correct?"":"bad"}"><b>${d.correct?"✅ Tepat!":"❌ Kurang tepat."}</b> Jawabanmu: ${d.choice==="p"?"Phishing":"Bukan phishing"} (+${d.pts} poin${d.bonus?`, termasuk 🔥 kombo +${d.bonus}`:""}${d.dbl?", ⚡ ganda":""}${d.coins?` · +${d.coins} 🪙`:""})${d.shield?`<br>🛡️ Perisai Kombo menyelamatkan kombomu!`:""}<br>${esc(t.explain)}</div>${FX.flagsHtml(t)}${mlPanel(t,d)}${actFb(t,d)}<button class="btn" data-act="close">${t.endless?"Task Berikutnya ▸":"Lanjut"}</button></div>`;
  if(S.pend && S.pend.id===t.id) return actionPanel(t);
  const c = S.draft.choice;
  return `<div class="panel"><h4>Apakah ini phishing?</h4>
    <div class="choices"><button data-act="pick" data-v="p" class="${c==="p"?"sel p":""}">🎣 Phishing</button><button data-act="pick" data-v="s" class="${c==="s"?"sel s":""}">✅ Bukan phishing</button></div>
    <textarea id="reason" placeholder="Tulis alasanmu (mis. ciri yang mencurigakan)...">${esc(S.draft.reason)}</textarea>
    <button class="btn" data-act="submit" ${c?"":"disabled"}>Kirim Jawaban</button></div>`;
}
/* ---- tindakan (Report/Mute/Block/Abaikan), hint maskot, dan tulis tweet ---- */
const ACTS = {report:["🚩","Laporkan"], mute:["🔇","Bisukan (Mute)"], block:["⛔","Blokir"], ignore:["👀","Abaikan"]};
const ACT_WHY = {
  report:"Melaporkan membantu platform menindak akun atau konten berbahaya, sehingga pengguna lain ikut terlindungi.",
  block:"Memblokir menghentikan akun itu menghubungimu, tetapi tidak melindungi pengguna lain. Lebih baik dibarengi laporan.",
  mute:"Membisukan hanya menyembunyikan konten dari tampilanmu. Ancaman phishing tetap ada untuk orang lain, jadi lebih baik dilaporkan.",
  ignore:"Mengabaikan cocok untuk konten yang aman. Tidak perlu melaporkan atau memblokir akun yang tidak bermasalah."
};
const isMsg = t => t.kind==="msg" || t.id[0]==="m";
/* Tindakan yang dianggap benar. Bisa diubah per item dengan field action:"report" dll. di data. */
const okActs = t => t.action ? [t.action] : t.phishing ? (isMsg(t) ? ["report","block"] : ["report"]) : ["ignore"];
function curTask(){ return S.tab==="endless" ? S.en.cur : ALL.find(x=>x.id===(S.open||S.thread)); }
function canHint(){ const t = curTask(); return !!t && ["home","dm","endless"].includes(S.tab) && !S.done[t.id] && !S.er[t.id] && !(S.pend && S.pend.id===t.id); }
function actionPanel(t){
  return `<div class="panel"><h4>Langkah 2: tindakan apa yang kamu pilih?</h4><p class="hd" style="margin:0 0 10px">Jawabanmu: ${S.pend.choice==="p"?"Phishing":"Bukan phishing"}. Sekarang tentukan tindakannya.</p><div class="acts">${Object.entries(ACTS).map(([k,v])=>`<button data-act="act" data-v="${k}">${v[0]} ${v[1]}</button>`).join("")}</div></div>`;
}
function actFb(t,d){
  const best = okActs(t)[0], A = ACTS[d.act], B = ACTS[best];
  return `<div class="fb ${d.aOk?"":"bad"}"><b>${d.aOk?"🏅 Tindakan tepat!":"Tindakan kurang tepat."}</b> Kamu memilih ${A[0]} ${A[1]}${d.aOk?" (+"+CONFIG.pointAction+" poin)":". Tindakan terbaik: "+B[0]+" "+B[1]}.<br>${ACT_WHY[d.aOk?d.act:best]}</div>`;
}

/* ---- model ML: dipanggil otomatis di setiap task, tidak hanya saat minta hint ---- */
function prefetchML(t){
  if(!t || S.ml[t.id]) return;
  EduSecurity.analyze(t.text, {user:t.user, handle:t.handle, taskId:t.id}).then(a=>{ if(a) S.ml[t.id] = a; }).catch(()=>{});
}
async function ensureML(t){
  if(S.ml[t.id]) return S.ml[t.id];
  try{ const a = await withTimeout(EduSecurity.analyze(t.text, {user:t.user, handle:t.handle, taskId:t.id}), 4000); if(a) S.ml[t.id] = a; }catch(e){}
  return S.ml[t.id] || null;
}
function mlSignals(a, max){
  if(!a || !a.signals || !a.signals.length) return "";
  return `<div class="flags">` + a.signals.slice(0, max||5).map(x=>`<div class="flag ${x.arah==="naik"?"":"ok"}"><span class="i">${esc(x.ikon||"🔤")}</span><div><b>${esc(x.judul)} <span class="hd" style="font-weight:400">· ${x.arah==="naik"?"menaikkan":"menurunkan"} skor</span></b>${esc(x.ket||"")}</div></div>`).join("") + `</div>`;
}
function mlPanel(t, d){
  const a = S.ml[t.id]; if(!a) return "";
  const p = Math.min(1, Math.max(0, a.p)), pct = Math.round(p*100), [lv, c] = riskInfo(p);
  const mSays = p >= 0.5, uSays = d.choice === "p", mOk = mSays === t.phishing, same = mSays === uSays;
  const verdict = mOk
    ? (same ? "Kamu dan model sependapat, dan keduanya benar. 🤝" : "Model menebak benar di sini, sedangkan jawabanmu berbeda.")
    : (same ? "Model dan kamu sama-sama keliru. Pesan ini memang licin!" : "Model keliru di sini, tapi kamu benar! Itu sebabnya AI tidak boleh dipercaya mentah-mentah. 💪");
  const note = a.src === "model" ? "" : `<div class="hd" style="font-size:12px;margin-top:4px">Server model tidak terjangkau, ini hanya perkiraan sederhana di perangkat.</div>`;
  return `<div class="fb" style="border-color:${c}"><b>🤖 Penilaian model ${esc(CONFIG.mascotName)}: ${pct}% phishing · ${lv}</b><div class="bar"><i style="width:${pct}%;background:${c}"></i></div>${verdict}${note}${a.signals && a.signals.length ? `<h5 class="hd" style="margin:10px 0 0;font-size:13px">Yang dilihat model:</h5>` + mlSignals(a, 5) : ""}</div>`;
}
function modelCard(){
  const i = S.minfo; if(!i) return "";
  const m = i.mandiri || i.game || {}, acc = m.akurasi ? Math.round(m.akurasi*100) : null;
  return `<div class="fb" style="margin:12px 0"><b>🤖 Tentang model AI di game ini</b><br><span class="hd" style="font-size:13px">Dilatih dari ${i.n_latih} contoh pesan buatan.${acc ? ` Pada uji kecil (${m.n} pesan baru) akurasinya sekitar ${acc}%.` : ""} Di dunia nyata hasilnya bisa lebih rendah, karena penipu terus berganti gaya. Jadi model hanya pembantu, keputusan akhir tetap di tanganmu.</span></div>`;
}
async function hint(){
  const t = curTask(); if(!t) return;
  const cost = SHOP.hintCost(t, S);
  if(cost && !SHOP.canAfford(cost)){ say(["Hint dariku harganya "+cost+" koin 🪙, tapi koinmu belum cukup.","Coba jawab dengan pengamatanmu dulu ya! Jawaban benar memberimu koin lagi."]); return; }
  const b = $("hint"); b.disabled = true;
  let a; try{ a = await ensureML(t); }catch(e){ console.error("predict error", e); }
  b.disabled = false;
  if(!a || typeof a.p!=="number" || isNaN(a.p)){ say(["Maaf, "+CONFIG.mascotName+" belum bisa menganalisis ini. Andalkan pengamatanmu dulu ya."]); return; }
  const p = Math.min(1, Math.max(0, a.p));
  if(cost) SHOP.spend(cost, "hint_paid", {taskId:t.id});
  S.hint[t.id] = p;
  const pct = Math.round(p*100);
  const top = (a.signals||[]).filter(x=>x.arah==="naik").slice(0,2).map(x=>x.judul.toLowerCase());
  const lines = ["Psst... menurut analisis "+CONFIG.mascotName+", peluang ini phishing sekitar "+pct+"% dan bukan phishing "+(100-pct)+"%."];
  if(top.length) lines.push("Yang paling mencolok bagiku: "+top.join(" dan ")+".");
  lines.push("Ingat, ini hanya perkiraan dan bisa keliru. Cek tautannya, nada pesannya, dan apa yang diminta, lalu putuskan sendiri ya!");
  say(lines);
}
function riskInfo(p){
  return p>=0.7 ? ["Tinggi","var(--bad)","Sangat mirip phishing. Tautan mencurigakan, nada mendesak, atau permintaan data pribadi biasanya menaikkan skor."]
       : p>=0.4 ? ["Sedang","var(--warn)","Ada beberapa ciri yang patut diwaspadai. Periksa tautan dan apa yang diminta sebelum percaya."]
       : ["Rendah","var(--ok)","Terlihat relatif aman, tetapi tetap periksa tautan sebelum mengkliknya."];
}
function tweetView(){
  const T = S.tw, L = T.list;
  let h = `<div class="sec"><b>✍️ Tulis Tweet</b><p class="hd" style="margin:4px 0 10px">Tulis tweet bebas, boleh menyertakan tautan apa saja. Model akan menilai peluang tweet-mu dianggap phishing. Jangan menulis data pribadi asli (nama lengkap, nomor, kata sandi).</p><textarea id="tw" maxlength="280" placeholder="Apa yang sedang terjadi?">${esc(T.draft)}</textarea><div class="hd" style="text-align:right;font-size:12px"><span id="twc">${T.draft.length}</span>/280</div><button class="btn" data-act="tweet" ${T.busy?"disabled":""}>${T.busy?"Menganalisis...":"Kirim & Nilai Tweet"}</button></div>`;
  if(L[0]){ const [lv,c,tip] = riskInfo(L[0].p), a = Math.round(L[0].p*100);
    h += `<div class="sec" style="padding-top:0"><div class="fb" style="border-color:${c}"><b>Peluang phishing: ${a}% · ${lv}</b><div class="bar"><i style="width:${a}%;background:${c}"></i></div>${tip}${mlSignals(L[0], 4)}</div></div>`; }
  if(L.length) h += `<div class="sec" style="padding-bottom:0"><b>Tweet-mu</b></div>` + L.map(x=>{ const c = riskInfo(x.p)[1]; return `<div class="item" style="cursor:default">${avatar("Kamu",FX.profile().emoji)}<div class="body"><div><span class="nm">${esc(FX.profile().name)}</span><span class="tag" style="background:${c}">${Math.round(x.p*100)}% phishing</span></div><div class="tx">${fmt(x.text)}</div></div></div>`; }).join("");
  return h;
}
async function postTweet(){
  const T = S.tw, txt = ($("tw").value||"").trim();
  if(txt.length<3){ toast("Tulis sesuatu dulu ya"); return; }
  T.busy = true; T.draft = txt; render();
  let p, a; try{ a = await EduSecurity.analyze(txt, {type:"user_tweet"}); p = a && a.p; }catch(e){ console.error("predict error", e); }
  T.busy = false;
  if(typeof p!=="number" || isNaN(p)){ toast("Model belum merespons, coba lagi"); render(); return; }
  p = Math.min(1, Math.max(0, p));
  const links = txt.match(URL_RE) || [];
  const rec = {session, mode:"compose", type:"user_tweet", text:txt, hasLink:links.length>0, links, predictedPhishProb:p, modelSource:a.src, timestamp:new Date().toISOString()};
  EduSecurity.records.push(rec);
  try{ if(typeof EduSecurity.onTweet==="function") EduSecurity.onTweet(rec); }catch(e){ console.error("onTweet error", e); }
  T.list.unshift({text:txt, p, links, signals:a.signals||[]}); T.draft = "";
  checkBadges(); render();
}
document.addEventListener("input", e=>{ if(e.target.id==="tw"){ S.tw.draft = e.target.value; $("twc").textContent = e.target.value.length; } });
function itemCls(t){ return "item" + (S.lock && S.lock!==t.id ? " lock" : "") + (S.lock===t.id ? " guide" : ""); }
function tag(t){ const d=S.done[t.id]; return d?`<span class="tag" style="background:${d.correct?"var(--ok)":"var(--bad)"}">${d.correct?"benar":"salah"}</span>`:""; }
function render(){
  $("rank").innerHTML = FX.rankBar(S);
  $("title").innerHTML = IMG_RE.test(CONFIG.logo || "")
    ? `<span class="hlogo"><img src="${CONFIG.logoHeader || "img/logo-header.png"}" alt="${esc(CONFIG.appName)}" onerror="this.onerror=null;this.src='${CONFIG.logo}'"></span>`
    : (IMG_RE.test(CONFIG.mascotIcon) ? `<img class="hico" src="${CONFIG.mascotIcon}" alt="">` : "🛡️") + " " + esc(CONFIG.appName);
  $("pts").textContent = "⭐ " + S.points + SHOP.hdr();
  { const ct = curTask(); $("hint").dataset.cost = ct && canHint() ? (SHOP.hintCost(ct, S) ? SHOP.hintCost(ct, S) + "🪙" : "") : ""; }
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on", b.dataset.tab===S.tab));
  $("navEn").style.display = unlocked() ? "" : "none";
  $("hint").style.display = canHint() ? "" : "none";
  let h = "";
  if(S.tab==="home"){
    h = POSTS.map((t,i)=>`<div class="${itemCls(t)}" data-act="open" data-id="${t.id}">${avatar(t.user)}<div class="body"><div><span class="nm">${esc(t.user)}</span> <span class="hd">${esc(t.handle)}</span>${tag(t)}</div><div class="tx">${fmt(t.text)}</div><div class="stats"><span>💬 ${3+i*7}</span><span>🔁 ${12+i*5}</span><span>♡ ${40+i*13}</span></div></div></div>`+(S.open===t.id?answerPanel(t):"")).join("");
  } else if(S.tab==="endless"){
    h = endlessView();
  } else if(S.tab==="shop"){
    h = SHOP.view(S);
  } else if(S.tab==="tweet"){
    h = tweetView();
  } else if(S.tab==="dm"){
    if(S.thread){
      const t = MSGS.find(m=>m.id===S.thread);
      h = `<button class="back" data-act="back">← Kembali</button><div class="sec" style="padding-bottom:0"><span class="nm">${esc(t.user)}</span> <span class="hd">${esc(t.handle)}</span></div><div class="bubble">${fmt(t.text)}</div>`+answerPanel(t);
    } else {
      h = MSGS.map(t=>`<div class="${itemCls(t)}" data-act="thread" data-id="${t.id}">${avatar(t.user)}<div class="body"><div><span class="nm">${esc(t.user)}</span> <span class="hd">${esc(t.handle)}</span>${tag(t)}</div><div class="tx" style="margin:0;color:var(--sub)">${esc(t.text.slice(0,60))}…</div></div></div>`).join("");
    }
  } else {
    const n = Object.keys(S.done).length, ok = ALL.filter(t=>S.done[t.id]&&S.done[t.id].correct).length;
    h = `<div class="sec"><b>Progres: ${n}/${ALL.length} task</b><div class="bar"><i style="width:${n/ALL.length*100}%"></i></div>
    ${FX.profileCard()}${FX.rankCard(S)}${modelCard()}<div class="badges">${BADGES.map(b=>`<div class="badge ${S.badges.includes(b.id)?"":"off"}"><b>${b.icon}</b>${b.name}<br><span class="hd">${b.desc}</span></div>`).join("")}</div>
    <b>Daftar Task</b>`+ALL.map(t=>{const d=S.done[t.id];return `<div class="row"><span>${t.id[0]==="p"?"📣 Postingan":"✉️ Pesan"} dari ${esc(t.user)}</span><span>${d?(d.correct?"✅":"❌"):"⬜"}</span></div>`}).join("")+
    (n===ALL.length?`<p><b>Hasil akhir:</b> ${ok}/${ALL.length} benar (${Math.round(ok/ALL.length*100)}%), total ${S.points} poin, kombo terbaik ${S.bestCombo}x. Pangkatmu: ${FX.rank(S.points).icon} <b>${FX.rank(S.points).name}</b>. Terima kasih sudah menjaga dunia digital, Satpam Digital! 🎉</p><button class="btn" data-act="goend">♾️ Masuk Endless Mode</button><button class="btn" data-act="replay" style="background:var(--sub)">↻ Main Lagi dari Awal</button>`:"")+`</div>`;
  }
  const m = $("main"), top = m.scrollTop; m.innerHTML = h; m.scrollTop = top;
}

/* ---- logika ---- */
function checkBadges(){
  BADGES.forEach(b=>{ if(!S.badges.includes(b.id) && b.ok(S)){ S.badges.push(b.id); SHOP.badgeBonus(b.id); setTimeout(()=>{ toast(b.icon+" Badge baru: "+b.name); FX.snd.badge(); },300); } });
}
function submit(t){
  const reason = ($("reason").value||"").trim(), choice = S.draft.choice;
  S.pend = {id:t.id, choice, reason}; render();
  if(!S.seenAct){ S.seenAct = true; say(["Satu langkah lagi! Setelah menilai, pilih tindakan yang tepat: laporkan, bisukan, blokir, atau abaikan."]); }
}
async function finish(t, act){
  if(!S.pend) return;
  const {choice, reason} = S.pend; S.pend = null;
  const ml = await ensureML(t);
  const correct = (choice==="p") === t.phishing;
  const mlSays = ml ? ml.p >= 0.5 : null;
  if(ml && ml.src==="model" && mlSays === (choice==="p")) S.mlAgree++;
  if(ml && ml.src==="model" && correct && mlSays !== t.phishing) S.beatAI++;   // kamu benar padahal AI keliru
  const aOk = okActs(t).includes(act);
  const rk0 = FX.rank(S.points).i;
  let shielded = false;
  if(correct){ S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); if(S.hint[t.id]===undefined) S.eagle++; }
  else if(S.combo > 0 && SHOP.useShield()) shielded = true;   // Perisai Kombo dari Toko
  else S.combo = 0;
  const bonus = correct ? Math.min(S.combo-1, 5)*2 : 0;   // kombo: +2 per jawaban beruntun, maks +10
  const pts0 = (correct?CONFIG.pointCorrect:0) + (reason.length>=10?CONFIG.pointReason:0) + (aOk?CONFIG.pointAction:0) + bonus;
  const dbl = SHOP.takeDouble(), pts = dbl ? pts0*2 : pts0;   // Poin Ganda dari Toko
  const coins = SHOP.reward({correct, aOk, reasonOk:reason.length>=10, bonus});
  S.points += pts; const res = {choice, correct, reason, pts, bonus, act, aOk, coins, dbl, shield:shielded};
  if(aOk){ S.ac.ok++; if(act==="report") S.ac.rep++; }
  if(t.endless){ S.er[t.id] = res; const E = S.en; if(correct){ E.ok++; E.streak++; E.best = Math.max(E.best,E.streak); } else E.streak = 0; }
  else S.done[t.id] = res;
  const links = t.text.match(URL_RE) || [];
  const rec = {session, mode:t.endless?"endless":"main", taskId:t.id, type:(t.kind==="post"||t.id[0]==="p")?"post":"message", sender:t.user, handle:t.handle, text:t.text,
    hasLink:links.length>0, links, userLabel:choice==="p"?"phishing":"safe", trueLabel:t.phishing?"phishing":"safe",
    correct, reason, reasonLength:reason.length, action:act, actionCorrect:aOk, hintUsed:S.hint[t.id]!==undefined, hintPhishProb:S.hint[t.id]??null, modelPhishProb:ml?ml.p:null, modelSource:ml?ml.src:null, modelAgree:ml?mlSays===(choice==="p"):null, modelCorrect:ml?mlSays===t.phishing:null, responseTimeMs:Date.now()-S.t0, combo:S.combo, bonus, coinsEarned:coins, coinsTotal:SHOP.coins(), shieldUsed:shielded, doubleUsed:dbl, timestamp:new Date().toISOString()};
  EduSecurity.records.push(rec);
  try{ if(typeof EduSecurity.onAnswer==="function") EduSecurity.onAnswer(rec); }catch(e){ console.error("onAnswer error",e); }
  if(aOk) toast("🚩 Tindakan tepat! +"+CONFIG.pointAction+" poin");
  FX.feedback(correct, pts, S.combo);
  const rk1 = FX.rank(S.points); if(rk1.i>rk0){ FX.rankUp(rk1); SHOP.rankBonus(rk1.i); }
  checkBadges(); SHOP.afterAnswer(S); render();
}
function closeTask(id){
  if(id && id[0]==="e"){ nextEndless(); render(); $("main").scrollTop = 0; return; }
  S.open = null; S.thread = null; S.draft = {choice:null,reason:""};
  const n = Object.keys(S.done).length;
  if(id==="p1" && !S.s2){
    S.s2 = true; S.lock = "none"; render();
    const M = CONFIG.mascotName;
    say(["Selamat, kamu berhasil mengerjakan tugas pertamamu!","Bagaimana? Mudah kan?","Selanjutnya, kita akan melompat ke fitur lain, yakni [Pesan]",
      "Phishing dalam pesan media sosial adalah tindakan penipuan melalui pesan yang dikirim kepada pengguna untuk mencuri informasi pribadi, seperti kata sandi, data akun, atau informasi keuangan.",
      "Pelaku biasanya mengirim pesan yang berisi tautan palsu dan meminta pengguna untuk mengkliknya atau memasukkan informasi pribadi. Jika pengguna tertipu, informasi tersebut dapat digunakan untuk mengambil alih akun atau melakukan penipuan."],
      ()=>{ S.tab="dm"; render(); say(["Wah! Ada pesan masuk nih. Coba kita buka."], ()=>{ S.lock="m1"; render(); }); });
    return;
  }
  if(id==="m1"){
    S.lock = "none"; render();
    say(["Keren sekali! Kamu telah menuntaskan task kedua kamu ^^","Nah, karena kamu sudah memahami cara kerjanya, kamu bisa mengecek daftar task yang ada melalui ["+CONFIG.taskFeatureName+"] ^^",
      CONFIG.mascotName+" izin istirahat dulu yah ^^ Selamat berpetualang, Satpam Digital!"], ()=>{ S.lock=null; S.tab="home"; render(); });
    return;
  }
  if(n===ALL.length){
    S.tab = "tasks"; render();
    const ok = ALL.filter(t=>S.done[t.id].correct).length;
    FX.snd.win(); FX.confetti(160);
    say(["Semua task selesai! Kamu menjawab benar "+ok+" dari "+ALL.length+" dan meraih "+S.points+" poin.","Ingat: jangan pernah bagikan kata sandi atau OTP, dan selalu periksa tautan sebelum mengkliknya.","Kabar baik: Endless Mode sudah terbuka! Kamu bisa mengerjakan task tanpa batas lewat tab ♾️ Endless. Selamat berjaga, Satpam Digital!"], ()=>{ S.tab="endless"; if(!S.en.cur) nextEndless(); render(); });
    return;
  }
  render();
}
document.addEventListener("click", e=>{
  const nb = e.target.closest("nav button");
  if(nb && !S.lock) FX.snd.tap();
  if(nb){ if(S.lock) return; S.tab=nb.dataset.tab; if(S.tab==="endless" && !S.en.cur) nextEndless();
    if(S.tab==="tweet" && !S.tw.intro){ S.tw.intro = true; say(["Sekarang giliranmu menulis!","Buat tweet bebas, boleh pakai tautan apa saja. Model akan menilai berapa persen kemungkinannya dianggap phishing. Coba bandingkan tweet dengan tautan resmi dan tautan yang mencurigakan!"]); }
    S.open=null; S.thread=null; S.draft={choice:null,reason:""}; render(); return; }
  const el = e.target.closest("[data-act]"); if(!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if(a==="open"){ if(S.open===id){ S.open=null; } else { S.open=id; S.draft={choice:null,reason:""}; S.t0=Date.now(); prefetchML(ALL.find(x=>x.id===id)); } render(); }
  else if(a==="thread"){ S.thread=id; S.draft={choice:null,reason:""}; S.t0=Date.now(); prefetchML(ALL.find(x=>x.id===id)); render(); }
  else if(a==="back"){ S.thread=null; render(); }
  else if(a==="pick"){ FX.snd.tap(); const r=$("reason"); S.draft.reason = r?r.value:""; S.draft.choice=el.dataset.v; render(); }
  else if(a==="submit"){ const t = S.tab==="endless" ? S.en.cur : ALL.find(x=>x.id===(S.open||S.thread)); submit(t); }
  else if(a==="close"){ closeTask(S.tab==="endless" ? S.en.cur.id : (S.open||S.thread)); }
  else if(a==="goend"){ S.tab="endless"; if(!S.en.cur) nextEndless(); render(); }
  else if(a==="dice"){ FX.reroll(); render(); }
  else if(a==="goshop"){ if(!S.lock && !S.pend){ S.tab="shop"; S.open=null; S.thread=null; render(); } }
  else if(a==="goprofile"){ if(!S.lock && !S.pend){ S.tab="tasks"; S.open=null; S.thread=null; render(); } }
  else if(a==="replay"){ if(el.classList.contains("rp") && S.points>0 && !confirm("Mulai ulang dari awal? Poin dan kombo direset, tetapi koin dan barang belanjaanmu tetap aman.")) return; restart(); }
  else if(a==="act"){ finish(curTask(), el.dataset.v); }
  else if(a==="hint"){ hint(); }
  else if(a==="tweet"){ postTweet(); }
});

/* ---- mulai: Section 1 - Opening ---- */
function restart(){
  q = []; after = null; $("dlg").classList.remove("on");
  Object.assign(S,{tab:"home",points:0,done:{},open:null,thread:null,lock:null,badges:[],draft:{choice:null,reason:""},s2:false,t0:0,er:{},en:{n:0,ok:0,streak:0,best:0,bag:[],cur:null},pend:null,hint:{},ac:{ok:0,rep:0},tw:{list:[],draft:"",busy:false,intro:false},combo:0,bestCombo:0,eagle:0,ml:{},mlAgree:0,beatAI:0});
  SHOP.newRun(); session++; $("main").scrollTop = 0; render(); intro();
}
function intro(){
say(["Halo, "+FX.profile().name+"! Selamat datang di "+CONFIG.appName+".","Kenalin, aku "+CONFIG.mascotName+" yang akan membimbingmu ke dalam dunia digital ini.",
  "Di sini, berbagai pengguna bisa menulis, membaca, dan membagikan pesan singkat kepada orang lain.",
  "Namun, tugas kamu di sini adalah menjadi “satpam” digital. Iya, kamu tidak salah dengar :)",
  "Di dunia digital ini, tidak semua hal itu baik. Orang-orang dapat melakukan kejahatan seperti phishing, yaitu tindakan menipu pengguna melalui pesan atau tautan palsu untuk mencuri informasi pribadi, seperti kata sandi dan data akun.",
  "Nah, “satpam”, "+CONFIG.mascotName+" ingin minta tolong untuk mengecek setiap postingan yang ada, dan bantu identifikasi apakah itu termasuk phishing atau tidak.",
  "Coba klik salah satu postingan pengguna (yang paling atas ya).","Kalau bingung, ketuk ikonku di pojok kanan bawah untuk minta hint. Aku akan kasih perkiraan peluang phishing-nya!",
  "Oh ya, setiap jawaban benar memberimu koin 🪙. Belanjakan di tab Toko untuk dandanan, perisai, dan kartu koleksi!"],
  ()=>{ S.lock="p1"; render(); });
}

/* ---- layar loading, lalu mulai game ---- */
SHOP.init({render, toast, say, checkBadges, setMascot, session:()=>session, rankIdx:()=>FX.rank(S.points).i});
setMascot(); render();
ALL.forEach(prefetchML);   // pemanasan: server model (yang bisa 'tidur' di hosting gratis) dibangunkan sejak layar loading
EduSecurity.modelInfo().then(i=>{ S.minfo = i; if(S.tab==="tasks") render(); });
{ const ic = CONFIG.logo; $("spLogo").innerHTML = IMG_RE.test(ic) ? `<img src="${ic}" alt="${esc(CONFIG.appName)}">` : ic; $("splash").classList.toggle("hasLogo", IMG_RE.test(ic)); $("spName").textContent = CONFIG.appName; }
setTimeout(()=>{ const s = $("splash"); s.classList.add("hide"); setTimeout(()=>s.remove(),500); intro(); }, 2400);