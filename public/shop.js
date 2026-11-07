/* ==========================================================
   SHOP: koin, toko dandanan, bantuan, kartu waspada, misi
   Dimuat SETELAH fx.js dan SEBELUM game.js. Data tersimpan di perangkat
   (localStorage "edu_shop_v1"), tidak dikirim ke server kecuali log
   kejadian pembelian untuk analisis PkM.
   Cara mengubah isi toko: edit daftar ITEMS, CONS, CARDS, MISSIONS di bawah.
   ========================================================== */
const SHOP = (() => {
  const KEY = "edu_shop_v1";
  const HINT_COST = 0;               // harga hint maskot (0 = gratis; isi angka koin bila ingin berbayar lagi)
  const FREE_HINT = ["p1", "m1"];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  /* ---------- katalog ---------- */
  // slot: hat = topi untukmu, bima = aksesori maskot, pet = peliharaan, frame = bingkai avatar, theme = tema warna
  // rank (opsional): pangkat minimum (indeks 0-5 dari FX) untuk BELI; need = nama pangkatnya
  const SLOTS = {hat:"🎩 Topi untukmu", bima:"✨ Aksesori Bima", pet:"🐾 Peliharaan", frame:"🖼️ Bingkai", theme:"🎨 Tema warna"};
  const ITEMS = [
    {id:"hat_cap",   slot:"hat",   icon:"🧢", name:"Topi Santai",     price:15},
    {id:"hat_grad",  slot:"hat",   icon:"🎓", name:"Topi Wisuda",     price:25},
    {id:"hat_top",   slot:"hat",   icon:"🎩", name:"Topi Sulap",      price:30},
    {id:"hat_crown", slot:"hat",   icon:"👑", name:"Mahkota Raja",    price:60, rank:3, need:"Detektif Phishing"},
    {id:"bm_ribbon", slot:"bima",  icon:"🎀", name:"Pita Bima",       price:15},
    {id:"bm_helmet", slot:"bima",  icon:"⛑️", name:"Helm Satpam",     price:25},
    {id:"bm_phones", slot:"bima",  icon:"🎧", name:"Headphone",       price:25},
    {id:"bm_top",    slot:"bima",  icon:"🎩", name:"Topi Kebesaran",  price:40},
    {id:"bm_crown",  slot:"bima",  icon:"👑", name:"Mahkota Bima",    price:70, rank:4, need:"Pakar Anti-Phishing"},
    {id:"pet_chick", slot:"pet",   icon:"🐥", name:"Anak Ayam",       price:20},
    {id:"pet_cat",   slot:"pet",   icon:"🐈", name:"Kucing Manis",    price:35},
    {id:"pet_dog",   slot:"pet",   icon:"🐕", name:"Anjing Setia",    price:35},
    {id:"pet_parrot",slot:"pet",   icon:"🦜", name:"Burung Beo",      price:40},
    {id:"pet_dragon",slot:"pet",   icon:"🐉", name:"Naga Mini",       price:70, rank:3, need:"Detektif Phishing"},
    {id:"fr_bronze", slot:"frame", icon:"🥉", name:"Bingkai Perunggu",price:15, cls:"fr-bronze"},
    {id:"fr_silver", slot:"frame", icon:"🥈", name:"Bingkai Perak",   price:25, cls:"fr-silver"},
    {id:"fr_gold",   slot:"frame", icon:"🥇", name:"Bingkai Emas",    price:40, cls:"fr-gold", rank:2, need:"Penjaga Waspada"},
    {id:"fr_rain",   slot:"frame", icon:"🌈", name:"Bingkai Pelangi", price:60, cls:"fr-rain", rank:3, need:"Detektif Phishing"},
    {id:"th_sun",    slot:"theme", icon:"🌅", name:"Tema Senja",      price:25, skin:"sunset"},
    {id:"th_forest", slot:"theme", icon:"🌲", name:"Tema Hutan",      price:25, skin:"forest"},
    {id:"th_galaxy", slot:"theme", icon:"🌌", name:"Tema Galaksi",    price:35, skin:"galaxy"},
    {id:"th_candy",  slot:"theme", icon:"🍬", name:"Tema Permen",     price:35, skin:"candy"}
  ];
  // barang habis pakai
  const CONS = [
    {id:"shield", icon:"🛡️", name:"Perisai Kombo", price:15, max:5,
     desc:"Otomatis menyelamatkan kombomu satu kali saat jawabanmu salah."},
    {id:"double", icon:"⚡", name:"Poin Ganda", price:20, max:3,
     desc:"Pakai sebelum menjawab: poin dari jawaban berikutnya jadi dua kali lipat (benar atau salah)."}
  ];
  // kartu koleksi: tiap kartu = satu modus penipuan + cara menghadapinya
  const CARDS = [
    {id:"c_otp",   icon:"🔑", name:"OTP Rahasia",     price:12, ciri:"Ada yang minta kode OTP, PIN, atau kata sandi lewat chat.", aksi:"OTP itu seperti kunci rumahmu. Jangan kasih ke siapa pun, termasuk teman. Telepon orangnya langsung untuk memastikan."},
    {id:"c_gift",  icon:"🎁", name:"Hadiah Palsu",    price:12, ciri:"Tiba-tiba menang hadiah, saldo gratis, atau giveaway yang minta login.", aksi:"Kalau tidak ikut undian, tidak mungkin menang. Abaikan lalu laporkan."},
    {id:"c_short", icon:"🔗", name:"Tautan Pendek",   price:12, ciri:"Link seperti bit.ly atau s.id yang menyembunyikan tujuan aslinya.", aksi:"Jangan langsung klik. Tanya orang dewasa atau cek lewat situs resmi yang kamu ketik sendiri."},
    {id:"c_fake",  icon:"🎭", name:"Domain Tiruan",   price:12, ciri:"Alamat situs mirip yang asli tapi aneh: kicau-verifikasi.xyz, bri-update88.top.", aksi:"Periksa ujung alamatnya. Situs resmi tidak memakai kata login/verifikasi yang dirangkai tanda hubung."},
    {id:"c_money", icon:"💸", name:"Teman Minta Uang",price:12, ciri:"'Teman' tiba-tiba minta transfer atau pulsa, dan disuruh dirahasiakan.", aksi:"Akun temanmu bisa diretas. Telepon atau temui dia langsung sebelum mengirim apa pun."},
    {id:"c_apk",   icon:"📦", name:"File APK",        price:12, ciri:"Disuruh mengunduh aplikasi dari link, misalnya undangan nikah atau tagihan.", aksi:"Pasang aplikasi hanya dari toko resmi. File .apk dari chat bisa mencuri data."},
    {id:"c_job",   icon:"💼", name:"Kerja Gampang",   price:12, ciri:"Gaji besar tanpa pengalaman, tapi diminta bayar biaya atau data KTP.", aksi:"Lowongan asli tidak minta uang di depan. Bicarakan dengan orang tua."},
    {id:"c_post",  icon:"🚚", name:"Kurir Palsu",     price:12, ciri:"Paket tertahan, disuruh bayar biaya kecil atau mengisi data kartu.", aksi:"Cek pesananmu lewat aplikasi toko atau kurir yang resmi, bukan lewat link di pesan."},
    {id:"c_time",  icon:"⏰", name:"Tekanan Waktu",   price:12, ciri:"'Dalam 1 jam!', 'sisa 10 menit!', 'akun akan dihapus!'.", aksi:"Penipu ingin kamu panik. Tarik napas dulu, jangan buru-buru klik."},
    {id:"c_boss",  icon:"📞", name:"Pura-pura Resmi", price:12, ciri:"Mengaku admin, petugas bank, polisi, atau guru dan meminta data.", aksi:"Lembaga resmi tidak meminta PIN atau OTP lewat pesan. Hubungi nomor resminya sendiri."}
  ];
  // misi per permainan (dihitung dari state game S); hadiah koin otomatis saat selesai
  const MISSIONS = [
    {id:"m_combo", icon:"🔥", name:"Kombo 3 jawaban benar beruntun", goal:3, val:S => S.bestCombo,   reward:15},
    {id:"m_rep",   icon:"🚩", name:"Laporkan 2 akun phishing dengan benar", goal:2, val:S => S.ac.rep, reward:10},
    {id:"m_eagle", icon:"🦅", name:"4 jawaban benar tanpa hint",  goal:4, val:S => S.eagle,        reward:15},
    {id:"m_duet",  icon:"🧠", name:"Lebih jeli dari AI: 2 kali benar saat AI keliru", goal:2, val:S => S.beatAI, reward:15}
  ];
  const RANK_NAMES = ["Satpam Magang","Satpam Pemula","Penjaga Waspada","Detektif Phishing","Pakar Anti-Phishing","Legenda Siber"];

  /* ---------- state (disimpan di perangkat) ---------- */
  function fresh(){ return {coins:20, owned:{}, equip:{}, cards:[], buys:0, paid:{}}; }   // 20 koin hadiah selamat datang
  function load(){
    try{
      const o = JSON.parse(localStorage.getItem(KEY));
      if(o && typeof o.coins === "number") return Object.assign(fresh(), o);
    }catch(e){}
    return fresh();
  }
  let st = load();
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} };
  save();
  let run = {answered:0, dbl:false, miss:{}};     // state per permainan (reset saat "Ulang")
  let sub = "dandan";
  let ctx = {render(){}, toast(){}, say(){}, checkBadges(){}, setMascot(){}, session:() => 0, rankIdx:() => 0};

  const byId = id => ITEMS.find(x => x.id === id) || CONS.find(x => x.id === id) || CARDS.find(x => x.id === id);
  const eqItem = slot => { const id = st.equip[slot]; return id ? ITEMS.find(x => x.id === id) : null; };

  /* ---------- notifikasi bertumpuk (tidak bentrok dengan toast game) ---------- */
  function note(msg, delay){
    setTimeout(() => {
      let box = document.getElementById("snote");
      if(!box){ box = document.createElement("div"); box.id = "snote"; document.body.appendChild(box); }
      const d = document.createElement("div"); d.textContent = msg; box.appendChild(d);
      setTimeout(() => d.remove(), 3000);
    }, delay || 0);
  }
  function log(type, extra){
    const rec = Object.assign({session:ctx.session(), mode:"shop", type, coinsAfter:st.coins, timestamp:new Date().toISOString()}, extra || {});
    try{ if(window.EduSecurity){ EduSecurity.records.push(rec); if(typeof EduSecurity.onEvent === "function") EduSecurity.onEvent(rec); } }catch(e){ console.error("log shop", e); }
  }

  /* ---------- koin ---------- */
  const coins = () => st.coins;
  const canAfford = n => st.coins >= n;
  function earn(n, label, delay){
    if(n <= 0) return;
    st.coins += n; save();
    if(label) note("🪙 +" + n + " " + label, delay);
  }
  function spend(n, why, extra){
    if(st.coins < n) return false;
    st.coins -= n; save(); log(why, Object.assign({price:n}, extra || {}));
    return true;
  }
  // hadiah sekali seumur perangkat (lencana, pangkat) supaya tidak bisa dikuras dengan "Ulang"
  function bonusOnce(key, n, label, delay){
    if(st.paid[key]) return;
    st.paid[key] = 1; earn(n, label, delay);
  }

  /* ---------- dipanggil game.js ---------- */
  function reward(r){            // r: {correct, aOk, reasonOk, bonus}
    const n = (r.correct ? 5 : 0) + (r.aOk ? 2 : 0) + (r.reasonOk ? 1 : 0) + Math.floor((r.bonus || 0) / 2);
    st.coins += n; save();
    if(n > 0) setTimeout(() => FX.float("+" + n + " 🪙", "#ffd400"), 750);
    return n;
  }
  function useShield(){
    if(!st.owned.shield) return false;
    st.owned.shield--; save(); log("shield_used"); return true;
  }
  function takeDouble(){ if(run.dbl){ run.dbl = false; log("double_used"); return true; } return false; }
  function afterAnswer(S){        // misi
    run.answered++;
    let d = 1300;
    MISSIONS.forEach(m => {
      if(!run.miss[m.id] && m.val(S) >= m.goal){
        run.miss[m.id] = 1; earn(m.reward, "Misi selesai: " + m.name, d); d += 700;
        log("mission", {item:m.id, reward:m.reward}); FX.snd.badge();
      }
    });
  }
  function badgeBonus(id){ bonusOnce("b_" + id, 10, "lencana baru", 900); }
  function rankBonus(i){ if(i > 0) bonusOnce("r_" + i, 20, "naik pangkat", 1500); }
  function newRun(){ run = {answered:0, dbl:false, miss:{}}; }
  const hintCost = (t, S) => (FREE_HINT.includes(t.id) || S.hint[t.id] !== undefined) ? 0 : HINT_COST;
  const hdr = () => " · 🪙 " + st.coins + (run.dbl ? " · ⚡x2" : "");
  const buys = () => st.buys;
  const cardCount = () => st.cards.length;

  /* ---------- tampilan: dekorasi avatar & maskot ---------- */
  function deco(){
    const h = eqItem("hat"), p = eqItem("pet");
    return (h ? `<span class="deco-hat">${h.icon}</span>` : "") + (p ? `<span class="deco-pet">${p.icon}</span>` : "");
  }
  function cls(){ const f = eqItem("frame"); return f ? f.cls : ""; }
  function mascotDeco(){ const b = eqItem("bima"); return b ? `<span class="deco-hat">${b.icon}</span>` : ""; }
  function applyTheme(){
    const t = eqItem("theme"), r = document.documentElement;
    if(t) r.setAttribute("data-skin", t.skin); else r.removeAttribute("data-skin");
  }
  applyTheme();

  /* ---------- aksi toko ---------- */
  function buy(id){
    const it = byId(id); if(!it) return;
    const isCard = CARDS.includes(it), isCons = CONS.includes(it);
    if(!isCons && (st.owned[id] || st.cards.includes(id))) return;
    if(isCons && (st.owned[id] || 0) >= it.max){ ctx.toast("Kamu sudah punya " + it.max + " " + it.name); return; }
    if(it.rank && ctx.rankIdx() < it.rank){ ctx.toast("🔒 Butuh pangkat " + it.need + " (kumpulkan poin dulu)"); return; }
    if(!canAfford(it.price)){ FX.snd.bad(); ctx.toast("Koinmu kurang " + (it.price - st.coins) + " 🪙 lagi"); return; }
    spend(it.price, "purchase", {item:id, kind:isCard ? "card" : isCons ? "consumable" : it.slot});
    st.buys++;
    if(isCons) st.owned[id] = (st.owned[id] || 0) + 1;
    else if(isCard) st.cards.push(id);
    else { st.owned[id] = 1; st.equip[it.slot] = id; }      // barang dandanan langsung dipakai
    save(); FX.snd.badge();
    if(!isCons && !isCard){ applyTheme(); ctx.setMascot(); FX.confetti(30); }
    ctx.checkBadges(); ctx.render();
    if(isCard){
      FX.confetti(50);
      if(st.cards.length === CARDS.length) earn(30, "koleksi kartu lengkap!", 600);
      ctx.say(["Kartu baru: " + it.icon + " " + it.name + "!", "Ciri-cirinya: " + it.ciri, "Yang sebaiknya kamu lakukan: " + it.aksi]);
    }
  }
  function equip(id){
    const it = byId(id); if(!it || !st.owned[id]) return;
    st.equip[it.slot] = id; save(); FX.snd.tap(); log("equip", {item:id});
    applyTheme(); ctx.setMascot(); ctx.render();
  }
  function unequip(slot){ delete st.equip[slot]; save(); FX.snd.tap(); applyTheme(); ctx.setMascot(); ctx.render(); }
  function use(id){
    if(id === "double"){
      if(!st.owned.double){ return; }
      if(run.dbl){ ctx.toast("Poin Ganda sudah aktif"); return; }
      st.owned.double--; run.dbl = true; save(); FX.snd.combo(3); log("double_on");
      ctx.toast("⚡ Poin Ganda aktif untuk jawabanmu berikutnya!"); ctx.render();
    }
  }

  /* ---------- tampilan toko ---------- */
  function itemCard(it, S){
    const own = !!st.owned[it.id], eq = st.equip[it.slot] === it.id;
    const locked = !own && it.rank && ctx.rankIdx() < it.rank;
    let btn;
    if(eq) btn = `<button class="sbtn on" data-act="shop-unequip" data-id="${it.slot}">✔ Dipakai · Lepas</button>`;
    else if(own) btn = `<button class="sbtn" data-act="shop-equip" data-id="${it.id}">Pakai</button>`;
    else if(locked) btn = `<button class="sbtn lock" data-act="shop-buy" data-id="${it.id}">🔒 ${esc(it.need)}</button>`;
    else btn = `<button class="sbtn buy ${canAfford(it.price) ? "" : "no"}" data-act="shop-buy" data-id="${it.id}">🪙 ${it.price}</button>`;
    return `<div class="icard ${eq ? "eq" : ""}"><div class="ic">${it.icon}</div><b>${esc(it.name)}</b>${btn}</div>`;
  }
  const IMG = /^(data:|https?:|\.{0,2}\/|[\w\-\/]+\.(png|jpe?g|gif|webp|svg)$)/i;
  const mascotImg = (st = "") => IMG.test(CONFIG.mascotIcon) ? `<img src="${CONFIG.mascotIcon}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:50%;${st}">` : CONFIG.mascotIcon;
  function viewDandan(S){
    const base = mascotImg();
    let h = `<div class="prev"><div class="pv"><div class="pav big ${cls()}">${FX.profile().emoji}${deco()}</div><small class="hd">Kamu</small></div><div class="pv"><div class="mas2">${base}${mascotDeco()}</div><small class="hd">${esc(CONFIG.mascotName)}</small></div></div>`;
    Object.keys(SLOTS).forEach(slot => {
      h += `<h5 class="shd">${SLOTS[slot]}</h5><div class="igrid">${ITEMS.filter(x => x.slot === slot).map(x => itemCard(x, S)).join("")}</div>`;
    });
    return h;
  }
  function viewBantuan(S){
    let h = CONS.map(c => {
      const n = st.owned[c.id] || 0;
      const buyBtn = `<button class="sbtn buy ${canAfford(c.price) && n < c.max ? "" : "no"}" data-act="shop-buy" data-id="${c.id}">🪙 ${c.price}</button>`;
      const useBtn = c.id === "double" ? `<button class="sbtn ${n && !run.dbl ? "on" : "no"}" data-act="shop-use" data-id="double">${run.dbl ? "⚡ Aktif" : "Pakai"}</button>` : "";
      return `<div class="srow"><div class="ic">${c.icon}</div><div style="flex:1;min-width:0"><b>${c.name}</b> <span class="hd">· punya ${n}</span><div class="hd" style="font-size:13px">${c.desc}</div></div><div class="sbtns">${buyBtn}${useBtn}</div></div>`;
    }).join("");
    h += `<div class="srow"><div class="ic">${mascotImg()}</div><div style="flex:1"><b>Hint ${esc(CONFIG.mascotName)}</b><div class="hd" style="font-size:13px">Ketuk ikon maskot saat mengerjakan task. Hint gratis, tapi coba pikir sendiri dulu sebelum memintanya ya!</div></div></div>`;
    return h;
  }
  function viewKartu(S){
    let h = `<p class="hd" style="margin:0 0 8px">Koleksi kartu waspada: <b>${st.cards.length}/${CARDS.length}</b>${st.cards.length === CARDS.length ? " 🎉 lengkap!" : ""}. Setiap kartu berisi ciri penipuan dan cara menghadapinya.</p><div class="kgrid">`;
    CARDS.forEach(c => {
      if(st.cards.includes(c.id)) h += `<div class="kcard got"><div class="ic">${c.icon}</div><b>${esc(c.name)}</b><small><b>Ciri:</b> ${esc(c.ciri)}</small><small><b>Lakukan:</b> ${esc(c.aksi)}</small></div>`;
      else h += `<div class="kcard"><div class="ic">❓</div><b>Kartu misteri</b><button class="sbtn buy ${canAfford(c.price) ? "" : "no"}" data-act="shop-buy" data-id="${c.id}">🪙 ${c.price}</button></div>`;
    });
    return h + `</div>`;
  }
  function viewMisi(S){
    let h = `<p class="hd" style="margin:0 0 8px">Selesaikan misi saat bermain untuk dapat koin. Misi diulang tiap kamu mulai permainan baru.</p>`;
    h += MISSIONS.map(m => {
      const v = Math.min(m.val(S), m.goal), done = !!run.miss[m.id];
      return `<div class="srow"><div class="ic">${done ? "✅" : m.icon}</div><div style="flex:1;min-width:0"><b>${esc(m.name)}</b><div class="bar" style="margin:6px 0 2px"><i style="width:${v / m.goal * 100}%"></i></div><span class="hd" style="font-size:12px">${v}/${m.goal} · hadiah ${m.reward} 🪙</span></div></div>`;
    }).join("");
    return h;
  }
  function view(S){
    const tabs = [["dandan", "🎩 Dandanan"], ["bantu", "🛡️ Bantuan"], ["kartu", "🃏 Kartu"], ["misi", "🎯 Misi"]];
    let h = `<div class="sec shop"><div class="coinbig"><span class="cn">🪙</span><div><b>${st.coins} koin</b><div class="hd" style="font-size:13px">Dapat dari jawaban benar, kombo, lencana, dan misi.</div></div></div>`;
    h += `<div class="stabs">${tabs.map(t => `<button data-act="shop-sub" data-v="${t[0]}" class="${sub === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div>`;
    h += sub === "dandan" ? viewDandan(S) : sub === "bantu" ? viewBantuan(S) : sub === "kartu" ? viewKartu(S) : viewMisi(S);
    return h + `</div>`;
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act^='shop-']"); if(!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if(a === "shop-sub"){ sub = el.dataset.v; FX.snd.tap(); ctx.render(); }
    else if(a === "shop-buy") buy(id);
    else if(a === "shop-equip") equip(id);
    else if(a === "shop-unequip") unequip(id);
    else if(a === "shop-use") use(id);
  });

  function init(c){ ctx = Object.assign(ctx, c); }
  return {init, view, coins, canAfford, spend, earn, reward, useShield, takeDouble, afterAnswer, badgeBonus, rankBonus, newRun,
          hintCost, hdr, buys, cardCount, deco, cls, mascotDeco, HINT_COST, RANK_NAMES};
})();