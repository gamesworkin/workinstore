/* =========================================================
   CENTRAL DE SUPORTE - Firebase Auth + Realtime Database
   1) Substitua firebaseConfig pelos dados do seu projeto.
   2) Ative "E-mail/senha" em Authentication > Sign-in method.
   3) Cole database.rules.json em Realtime Database > Regras.
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyB9tnMqgbJcucac0fmfYOWIc1iCWiVE94I",
  authDomain: "suporte-workin.firebaseapp.com",
  databaseURL: "https://suporte-workin-default-rtdb.firebaseio.com",
  projectId: "suporte-workin",
  storageBucket: "suporte-workin.firebasestorage.app",
  messagingSenderId: "964454475461",
  appId: "1:964454475461:web:4a0d3256dac8ada811b2ac",
  measurementId: "G-FSL2SKT01E"
};


const ADMIN_EMAIL = "admin@workinstore.org";
const EMAIL_WHITELIST = ["gmail.com","googlemail.com","outlook.com","outlook.com.br","hotmail.com","hotmail.com.br","live.com","msn.com","yahoo.com","yahoo.com.br","icloud.com","me.com","uol.com.br","bol.com.br","terra.com.br","ig.com.br","globo.com","globomail.com","r7.com","protonmail.com","proton.me","aol.com","zoho.com","gmx.com","workinstore.org"];
const PLATAFORMAS = ["Shopee","Mercado Livre","Facebook Marketplace"];
const UFS = ["AC - Acre","AL - Alagoas","AP - Amapá","AM - Amazonas","BA - Bahia","CE - Ceará","DF - Distrito Federal","ES - Espírito Santo","GO - Goiás","MA - Maranhão","MT - Mato Grosso","MS - Mato Grosso do Sul","MG - Minas Gerais","PA - Pará","PB - Paraíba","PR - Paraná","PE - Pernambuco","PI - Piauí","RJ - Rio de Janeiro","RN - Rio Grande do Norte","RS - Rio Grande do Sul","RO - Rondônia","RR - Roraima","SC - Santa Catarina","SP - São Paulo","SE - Sergipe","TO - Tocantins"];
const DEFAULT_WELCOME = "Olá! 👋 Bem-vindo(a) à nossa central de suporte. Digite sua dúvida que eu procuro a melhor resposta para você, ou fale com um atendente.";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const TS = firebase.database.ServerValue.TIMESTAMP;

/* ---------- utilidades ---------- */
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const toastType = (m) => /^(erro|error)|inválid|não conferem|preencha|selecione|escolha|digite|informe|use um|fora da|encerrad/i.test(m) ? "error" : /sucesso|salv|atualizad|adicionad|cadastrad|criada|enviamos|enviado|pronta|removidos/i.test(m) ? "success" : "info";
const toast = (m, type) => { const t = $("toast"); type = type || toastType(String(m)); t.className = "toast toast-" + type; t.innerHTML = ""; t.append(el("span", "toast-ico", type === "error" ? "!" : type === "success" ? "✓" : "i"), el("span", "toast-msg", m)); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 3500); };
const confirmBox = (m, okText = "Confirmar") => new Promise((res) => {
  const ov = el("div", "modal-overlay"), box = el("div", "modal-card");
  const p = el("p", "modal-msg", m), acts = el("div", "modal-actions");
  const no = el("button", "btn ghost", "Cancelar"), ok = el("button", "btn primary", okText);
  const close = (v) => { ov.remove(); document.removeEventListener("keydown", key); res(v); };
  const key = (e) => { if (e.key === "Escape") close(false); if (e.key === "Enter") close(true); };
  no.onclick = () => close(false); ok.onclick = () => close(true); ov.onclick = (e) => { if (e.target === ov) close(false); };
  acts.append(no, ok); box.append(el("h3", "", "Confirmação"), p, acts); ov.append(box); document.body.append(ov);
  document.addEventListener("keydown", key); ok.focus();
});
const fmtDate = (ts) => ts ? new Date(ts).toLocaleString("pt-BR") : "";
const avatarFallback = (n) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='#555'/><text x='50%' y='55%' font-size='34' fill='#fff' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>${(n||"?")[0].toUpperCase()}</text></svg>`);
const safeUrl = (u) => /^https?:\/\//i.test(u || "") ? u : "";
const showView = (id) => { ["loginView","registerView","appView"].forEach(v => $(v).classList.toggle("hidden", v !== id)); };
const validEmail = (e) => { const m = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec((e||"").trim().toLowerCase()); return !!m && EMAIL_WHITELIST.includes(m[1]); };
const authErr = (e) => ({ "auth/invalid-credential":"E-mail ou senha incorretos.","auth/wrong-password":"Senha incorreta.","auth/user-not-found":"Conta não encontrada.","auth/email-already-in-use":"Este e-mail já está cadastrado.","auth/weak-password":"Senha fraca (mínimo 6 caracteres).","auth/too-many-requests":"Muitas tentativas. Aguarde um pouco." }[e.code] || e.message);

/* paginação genérica: 10 itens/página, janela de 5 páginas com setas */
const PAGE_SIZE = 10, PAGE_WINDOW = 5, pages = {};
function paginate(key, items, box, pagerId) {
  const total = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  let p = Math.min(Math.max(pages[key] || 1, 1), total); pages[key] = p;
  const pager = $(pagerId); pager.innerHTML = "";
  if (total > 1) {
    const go = (n) => { pages[key] = n; box.dataset.rerender && window[box.dataset.rerender](); };
    const start = Math.floor((p - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1, end = Math.min(start + PAGE_WINDOW - 1, total);
    const prev = el("button", "btn small", "‹"); prev.disabled = p === 1; prev.onclick = () => go(p - 1); pager.append(prev);
    for (let i = start; i <= end; i++) { const b = el("button", "btn small" + (i === p ? " primary" : ""), String(i)); b.onclick = () => go(i); pager.append(b); }
    const next = el("button", "btn small", "›"); next.disabled = p === total; next.onclick = () => go(p + 1); pager.append(next);
  }
  return items.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
}
const matches = (q, ...f) => f.join(" ").toLowerCase().includes(q);
const searchBind = (inputId, key, fn) => { $(inputId).oninput = () => { pages[key] = 1; fn(); }; };

/* máscara WhatsApp (00) 00000-0000 */
function maskPhone(input) {
  input.addEventListener("input", () => {
    let d = input.value.replace(/\D/g, "").slice(0, 11);
    let r = d;
    if (d.length > 0) r = "(" + d.slice(0, 2);
    if (d.length >= 3) r += ") " + d.slice(2, d.length > 10 ? 7 : 6);
    if (d.length >= 7) r += "-" + d.slice(d.length > 10 ? 7 : 6);
    input.value = r;
  });
}
const phoneOk = (v) => /^\(\d{2}\) \d{4,5}-\d{4}$/.test(v);
["rWhats","pWhats","sWhats"].forEach(id => maskPhone($(id)));
["rUF","sUF"].forEach(id => $(id).innerHTML = '<option value="">Selecione...</option>' + UFS.map(u => `<option value="${u}">${u}</option>`).join(""));

/* ---------- temas ---------- */
let siteSettings = {};
function applyTheme(t) { document.body.dataset.theme = t; applyAccent(); }
function applyAccent() {
  const s = siteSettings;
  document.documentElement.style.setProperty("--radius", s.radius || "14px");
  if (s.useAccent && /^#[0-9a-f]{6}$/i.test(s.accent || "")) {
    document.body.style.setProperty("--accent", s.accent);
    document.body.style.setProperty("--glow", s.accent + "40");
  } else { document.body.style.removeProperty("--accent"); document.body.style.removeProperty("--glow"); }
}
applyTheme(localStorage.getItem("theme") || "cyan");
$("themeBtn").onclick = () => $("themeMenu").classList.toggle("hidden");
document.querySelectorAll("[data-set-theme]").forEach(b => b.onclick = () => {
  localStorage.setItem("theme", b.dataset.setTheme); applyTheme(b.dataset.setTheme); $("themeMenu").classList.add("hidden");
});

db.ref("settings").on("value", (s) => {
  siteSettings = s.val() || {};
  const name = siteSettings.siteName || "Central de Suporte";
  document.querySelectorAll(".site-name").forEach(e => e.textContent = name);
  document.title = name;
  document.body.dataset.layout = siteSettings.layout || "sidebar";
  if (!localStorage.getItem("theme") && siteSettings.defaultTheme) applyTheme(siteSettings.defaultTheme); else applyAccent();
});

/* ---------- produtos (públicos para o cadastro) ---------- */
let products = {};
db.ref("products").on("value", (s) => { products = s.val() || {}; renderProductPick("rProdutos"); renderProductPick("oProdutos"); renderProdAdmin(); });
function renderProductPick(boxId) {
  const box = $(boxId); box.innerHTML = "";
  const ids = Object.keys(products);
  if (!ids.length) { box.append(el("p", "muted", "Nenhum produto cadastrado ainda.")); return; }
  ids.forEach(id => {
    const l = el("label"); const r = el("input"); r.type = "radio"; r.name = boxId; r.value = id;
    const t = el("span"); t.append(el("strong", null, products[id].nome)); if (products[id].descricao) { t.append(el("br")); t.append(el("small", "muted", products[id].descricao)); }
    l.append(r, t); box.append(l);
  });
}
const pickedProduct = (boxId) => { const r = document.querySelector(`input[name="${boxId}"]:checked`); return r ? r.value : null; };
$("rPedido").addEventListener("input", e => $("rProdutosBox").classList.toggle("hidden", !e.target.value.trim()));
$("oPedido").addEventListener("input", e => $("oProdutosBox").classList.toggle("hidden", !e.target.value.trim()));

/* ---------- login / cadastro ---------- */
$("goRegister").onclick = (e) => { e.preventDefault(); showView("registerView"); };
$("goLogin").onclick = (e) => { e.preventDefault(); showView("loginView"); };
$("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  const em = $("loginEmail").value.trim(), pw = $("loginPass").value;
  $("loginPass").value = "";
  showLoading(true);
  try { await auth.signInWithEmailAndPassword(em, pw); }
  catch (err) { showLoading(false); toast(authErr(err)); }
};
$("forgotBtn").onclick = async () => {
  const em = $("loginEmail").value.trim();
  if (!em) return toast("Digite seu e-mail no campo acima.");
  try { await auth.sendPasswordResetEmail(em); toast("Se o e-mail existir, enviamos o link de redefinição."); } catch (err) { toast(authErr(err)); }
};

let registering = false;
$("registerForm").onsubmit = async (e) => {
  e.preventDefault();
  const d = { nome: $("rNome").value.trim(), sobrenome: $("rSobrenome").value.trim(), email: $("rEmail").value.trim().toLowerCase(),
    whatsapp: $("rWhats").value, cidade: $("rCidade").value.trim(), uf: $("rUF").value };
  const plat = $("rPlataforma").value, pedido = $("rPedido").value.trim(), prod = pickedProduct("rProdutos");
  if (Object.values(d).some(v => !v) || !plat || !pedido) return toast("Preencha todos os campos.");
  if (!validEmail(d.email)) return toast("Use um e-mail de um provedor conhecido (Gmail, Outlook, Yahoo, iCloud...).");
  if ($("rPass").value !== $("rPass2").value) return toast("As senhas não conferem.");
  if (!phoneOk(d.whatsapp)) return toast("WhatsApp inválido.");
  if (!PLATAFORMAS.includes(plat)) return toast("Escolha a plataforma.");
  if (!prod) return toast("Selecione o produto do pedido.");
  if (!UFS.includes(d.uf)) return toast("Selecione o estado.");
  try {
    registering = true;
    showLoading(true);
    const cred = await auth.createUserWithEmailAndPassword(d.email, $("rPass").value);
    const uid = cred.user.uid;
    await db.ref("users/" + uid).set({ ...d, foto: "", criadoEm: TS });
    await db.ref("orders/" + uid).push({ plataforma: plat, numero: pedido, produtoId: prod, produtoNome: products[prod].nome, criadoEm: TS });
    registering = false;
    await startApp(cred.user);
    clearAuthFields();
    showLoading(false);
    toast("Conta criada com sucesso!");
  } catch (err) { registering = false; showLoading(false); toast(authErr(err)); }
};
const showLoading = (on) => $("loading").classList.toggle("hidden", !on);
function clearAuthFields() {
  document.querySelectorAll("#loginForm, #registerForm").forEach(f => f.reset());
  ["loginEmail","loginPass","rPass","rPass2"].forEach(id => { if ($(id)) $(id).value = ""; });
}
async function wipeLocalData() {
  try { localStorage.clear(); } catch (_) {}
  try { sessionStorage.clear(); } catch (_) {}
  try { if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } } catch (_) {}
  try { if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); } } catch (_) {}
  try {
    if (indexedDB.databases) { const dbs = await indexedDB.databases(); dbs.forEach(d => d.name && indexedDB.deleteDatabase(d.name)); }
    else ["firebaseLocalStorageDb","firebase-heartbeat-database","firebase-installations-database"].forEach(n => indexedDB.deleteDatabase(n));
  } catch (_) {}
  try { document.cookie.split(";").forEach(c => { const n = c.split("=")[0].trim(); if (n) document.cookie = n + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"; }); } catch (_) {}
}
$("logoutBtn").onclick = async () => {
  showLoading(true);
  offs.forEach(f => f()); offs = [];
  me = null; myRole = "user";
  clearAuthFields();
  try { await auth.signOut(); } catch (_) {}
  try { await Promise.all(firebase.apps.map(a => a.delete())); } catch (_) {}
  await wipeLocalData();
  location.replace(location.pathname + "?t=" + Date.now());
};

/* ---------- conta compacta no celular: avatar, nome e "Sair" dentro da engrenagem ---------- */
const accountBtn = $("accountBtn"), accountMenu = $("accountMenu"), sidebarEl = document.querySelector(".sidebar");
const mqSmall = window.matchMedia("(max-width: 820px)");
const closeAccount = () => { accountMenu.classList.add("hidden"); accountBtn.setAttribute("aria-expanded", "false"); };
function placeAccountParts() {
  const meBox = $("meBox"), logout = $("logoutBtn");
  if (mqSmall.matches) accountMenu.append(meBox, logout);
  else { sidebarEl.insertBefore(meBox, $("nav")); sidebarEl.insertBefore(logout, accountBtn); }
  closeAccount();
}
accountBtn.onclick = (e) => {
  e.stopPropagation();
  const closed = accountMenu.classList.toggle("hidden");
  accountBtn.setAttribute("aria-expanded", String(!closed));
};
document.addEventListener("click", (e) => {
  if (accountMenu.classList.contains("hidden")) return;
  if (!accountMenu.contains(e.target) && !accountBtn.contains(e.target)) closeAccount();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAccount(); });
if (mqSmall.addEventListener) mqSmall.addEventListener("change", placeAccountParts);
else if (mqSmall.addListener) mqSmall.addListener(placeAccountParts);
placeAccountParts();

/* ---------- sessão ---------- */
let me = null, myRole = "user", offs = [];
const listen = (ref, ev, fn) => { ref.on(ev, fn); offs.push(() => ref.off(ev, fn)); };

auth.onAuthStateChanged(async (user) => {
  offs.forEach(f => f()); offs = [];
  if (!user) { me = null; clearAuthFields(); showLoading(false); showView("loginView"); if (location.search) history.replaceState(null, "", location.pathname); return; }
  if (!registering) { showLoading(true); try { await startApp(user); } finally { showLoading(false); } }
});

async function startApp(user) {
  offs.forEach(f => f()); offs = [];
  const isAdmin = user.email === ADMIN_EMAIL;
  let role = "user";
  if (isAdmin) role = "admin";
  else { const r = await db.ref("roles/" + user.uid).get(); if (r.val() === "moderator") role = "moderator"; }
  myRole = role;
  if (role !== "user") { const mm = await db.ref("modMenus").get(); modMenus = mm.val() || {}; }
  const snap = await db.ref("users/" + user.uid).get();
  let profile = snap.val();
  if (!profile && isAdmin) { profile = { nome: "Administrador", sobrenome: "", email: user.email, whatsapp: "(00) 00000-0000", cidade: "-", uf: "SP - São Paulo", foto: "" }; await db.ref("users/" + user.uid).set(profile); }
  me = { uid: user.uid, email: user.email, ...(profile || {}) };
  listen(db.ref("users/" + user.uid), "value", s => { if (s.val()) { me = { ...me, ...s.val() }; renderMe(); } });
  renderMe();
  buildNav();
  clearAuthFields();
  showView("appView");
}

function renderMe() {
  $("meName").textContent = (me.nome || "") + " " + (me.sobrenome || "");
  $("meRole").textContent = { admin: "Administrador", moderator: "Moderador", user: "Cliente" }[myRole];
  const foto = me.foto || avatarFallback(me.nome);
  $("meAvatar").src = foto; $("pAvatar").src = foto;
  $("pNome").value = me.nome + " " + me.sobrenome; $("pEmail").value = me.email;
  if (document.activeElement !== $("pWhats")) $("pWhats").value = me.whatsapp || "";
  $("pLocal").value = (me.cidade || "") + " / " + (me.uf || "");
}

/* ---------- navegação ---------- */
// menus que o admin pode liberar/bloquear para moderadores (padrão: liberado?)
const MOD_MENUS = [["chamados","Chamados",true],["links","Links úteis",true],["produtos","Produtos",false],["gerar","Gerar Números",false],["automacao","Automação",false],["linksadm","Links (gerenciar)",false]];
let modMenus = {};
const modAllowed = (id) => { const d = MOD_MENUS.find(m => m[0] === id); if (!d) return false; return modMenus[id] === undefined ? d[2] : modMenus[id] === true; };
const TABS = {
  user: [["pedidos","Meus pedidos"],["suporte","Suporte"],["links","Links úteis"],["perfil","Perfil"]],
  moderator: [["chamados","Chamados"],["links","Links úteis"],["perfil","Perfil"]],
  admin: [["chamados","Chamados"],["usuarios","Usuários"],["produtos","Produtos"],["gerar","Gerar Números"],["automacao","Automação"],["linksadm","Links"],["aparencia","Aparência"],["perfil","Perfil"]]
};
function myTabs() {
  if (myRole !== "moderator") return TABS[myRole];
  return [...MOD_MENUS.filter(m => modAllowed(m[0])).map(m => [m[0], m[1]]), ["perfil","Perfil"]];
}
function buildNav(keepTab) {
  const nav = $("nav"); nav.innerHTML = "";
  const tabs = myTabs();
  tabs.forEach(([id, label], i) => {
    const b = el("button"); b.dataset.tab = id; b.append(el("span", null, label));
    if (id === "chamados") { const n = el("span", "notif hidden"); n.id = "notifBadge"; b.append(n); }
    b.onclick = () => openTab(id); nav.append(b);
  });
  if (keepTab === undefined) initData();
  openTab(keepTab && tabs.some(t => t[0] === keepTab) ? keepTab : tabs[0][0]);
}
const canUse = (id) => myRole === "admin" || (myRole === "moderator" && modAllowed(id));
let permStarted = new Set();
function startPermData() {
  if (canUse("automacao") && !permStarted.has("faq")) { permStarted.add("faq"); listen(db.ref("faq"), "value", renderFaqAdmin); $("welcomeMsg").value = siteSettings.welcome || DEFAULT_WELCOME; }
  if (canUse("gerar") && !permStarted.has("gen")) { permStarted.add("gen"); listen(db.ref("generated"), "value", s => { generated = s.val() || {}; renderGenerated(); }); }
}
function renderModMenusAdmin() {
  const box = $("modMenusBox"); if (!box) return; box.innerHTML = "";
  MOD_MENUS.forEach(([id, label]) => {
    const l = el("label", "check"); const c = el("input"); c.type = "checkbox"; c.checked = modAllowed(id);
    c.onchange = () => db.ref("modMenus/" + id).set(c.checked).then(() => toast(label + (c.checked ? " liberado" : " bloqueado") + " para moderadores."));
    l.append(c, el("span", null, " " + label)); box.append(l);
  });
}
function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("hidden", t.id !== "tab-" + id));
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
  if (id === "suporte") startClientChat();
}

function initData() {
  listen(db.ref("links"), "value", renderLinks);
  listen(db.ref("faq"), "value", s => { faqData = s.val() || {}; });
  if (myRole === "user") listen(db.ref("orders/" + me.uid), "value", s => { myOrders = s.val() || {}; renderOrders(s); renderSupportOrders(); });
  if (myRole !== "user") listen(db.ref("chats"), "value", renderTickets);
  if (myRole !== "user") listen(db.ref("modMenus"), "value", s => {
    const before = JSON.stringify(modMenus); modMenus = s.val() || {};
    renderModMenusAdmin();
    if (myRole === "moderator" && before !== JSON.stringify(modMenus)) {
      const cur = document.querySelector("#nav button.active"); buildNav(cur ? cur.dataset.tab : "perfil");
      startPermData();
    }
  });
  permStarted = new Set(); startPermData();
  if (myRole === "admin") {
    listen(db.ref("users"), "value", s => { allUsers = s.val() || {}; renderUsers(); });
    listen(db.ref("roles"), "value", s => { allRoles = s.val() || {}; renderUsers(); });
    $("welcomeMsg").value = siteSettings.welcome || DEFAULT_WELCOME;
    $("lkNome").value = siteSettings.siteName || "Central de Suporte";
    $("lkTema").value = siteSettings.defaultTheme || "cyan";
    $("lkLayout").value = siteSettings.layout || "sidebar";
    $("lkRadius").value = siteSettings.radius || "14px";
    $("lkAccent").value = siteSettings.accent || "#19d3e6";
    $("lkUseAccent").checked = !!siteSettings.useAccent;
  }
}

/* ---------- pedidos ---------- */
function renderOrders(s) {
  const box = $("ordersList"); box.innerHTML = "";
  const o = s.val() || {};
  const ids = Object.keys(o).sort((a, b) => (o[b].criadoEm || 0) - (o[a].criadoEm || 0));
  if (!ids.length) box.append(el("p", "muted", "Nenhum pedido."));
  ids.forEach(id => {
    const c = el("div", "card"); c.append(el("h4", null, o[id].produtoNome));
    c.append(el("p", null, o[id].plataforma + " • Pedido " + o[id].numero)); c.append(el("p", null, fmtDate(o[id].criadoEm)));
    const sb = el("button", "btn small", "💬 Suporte deste pedido");
    sb.onclick = () => { openTab("suporte"); selectOrder(id); }; c.append(sb);
    box.append(c);
  });
}
$("newOrderForm").onsubmit = async (e) => {
  e.preventDefault();
  const plat = $("oPlataforma").value, num = $("oPedido").value.trim(), prod = pickedProduct("oProdutos");
  if (!PLATAFORMAS.includes(plat) || !num || !prod) return toast("Preencha plataforma, número e produto.");
  await db.ref("orders/" + me.uid).push({ plataforma: plat, numero: num, produtoId: prod, produtoNome: products[prod].nome, criadoEm: TS });
  e.target.reset(); $("oProdutosBox").classList.add("hidden"); toast("Pedido adicionado!");
};

/* ---------- perfil ---------- */
let pendingFoto = null;
function compressImage(file, maxBytes = 25 * 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas"); const ctx = c.getContext("2d");
      let size = 256, q = 0.85, data;
      for (let i = 0; i < 25; i++) {
        const r = Math.min(size / img.width, size / img.height, 1);
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        data = c.toDataURL("image/jpeg", q);
        if (data.length * 0.75 <= maxBytes) break;
        if (q > 0.4) q -= 0.1; else size = Math.round(size * 0.8);
      }
      URL.revokeObjectURL(url);
      data.length * 0.75 <= maxBytes ? resolve(data) : reject(new Error("Não foi possível reduzir a imagem."));
    };
    img.onerror = () => reject(new Error("Imagem inválida."));
    img.src = url;
  });
}
$("pFile").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { pendingFoto = await compressImage(f); $("pAvatar").src = pendingFoto; $("pFotoUrl").value = ""; toast("Imagem pronta (" + Math.round(pendingFoto.length * 0.75 / 1024) + " KB). Clique em salvar."); }
  catch (err) { toast(err.message); }
};
$("pFotoUrl").oninput = (e) => { const u = safeUrl(e.target.value.trim()); if (u) { pendingFoto = u; $("pAvatar").src = u; } };
$("profileForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!phoneOk($("pWhats").value)) return toast("WhatsApp inválido.");
  const upd = { whatsapp: $("pWhats").value };
  if (pendingFoto) upd.foto = pendingFoto;
  try { await db.ref("users/" + me.uid).update(upd); pendingFoto = null; $("pFile").value = ""; toast("Perfil atualizado!"); } catch (err) { toast("Erro: " + err.message); }
};
$("resetPassBtn").onclick = async () => { await auth.sendPasswordResetEmail(me.email); toast("Link de troca de senha enviado para " + me.email); };

/* ---------- links (com edição e ordem) ---------- */
let linksData = {}, editingLink = null;
const sortedLinks = () => Object.entries(linksData).sort((x, y) => (x[1].ordem ?? 1e12) - (y[1].ordem ?? 1e12) || (x[1].titulo || "").localeCompare(y[1].titulo || ""));
function renderLinks(s) {
  if (s) linksData = s.val() || {};
  const box = $("linksList"); box.innerHTML = "";
  sortedLinks().forEach(([, l]) => {
    const u = safeUrl(l.url); if (!u) return;
    const a = el("a", "card"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.append(el("h4", null, l.titulo)); box.append(a);
  });
  if (!box.children.length) box.append(el("p", "muted", "Nenhum link disponível."));
  renderLinkAdmin();
}
async function moveLink(id, dir) {
  const list = sortedLinks(), i = list.findIndex(([k]) => k === id), j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const upd = {}; list.forEach(([k], n) => upd["links/" + k + "/ordem"] = n);
  await db.ref().update(upd);
}
function renderLinkAdmin() {
  const adm = $("linkAdmList"); if (!adm) return; adm.innerHTML = "";
  const q = $("linkSearch").value.toLowerCase(), all = sortedLinks();
  const items = all.filter(([, l]) => matches(q, l.titulo, l.url));
  paginate("links", items, adm, "linkPager").forEach(([id, l]) => {
    const pos = all.findIndex(([k]) => k === id);
    const r = el("div", "row"); const t = el("div"); t.append(el("strong", null, (pos + 1) + ". " + l.titulo), el("small", null, l.url));
    const a = el("div", "actions");
    const up = el("button", "btn small", "↑"); up.title = "Subir"; up.disabled = pos === 0; up.onclick = () => moveLink(id, -1);
    const dn = el("button", "btn small", "↓"); dn.title = "Descer"; dn.disabled = pos === all.length - 1; dn.onclick = () => moveLink(id, 1);
    const ed = el("button", "btn small", "Editar"); ed.onclick = () => {
      editingLink = id; $("linkTitulo").value = l.titulo; $("linkUrl").value = l.url;
      $("linkSubmit").textContent = "Salvar alterações"; $("linkCancel").classList.remove("hidden"); $("linkTitulo").focus();
    };
    const del = el("button", "btn small danger", "Excluir"); del.onclick = async () => { if (await confirmBox("Excluir link?", "Excluir")) db.ref("links/" + id).remove(); };
    a.append(up, dn, ed, del); r.append(t, a); adm.append(r);
  });
  if (!items.length) adm.append(el("p", "muted", "Nenhum link encontrado."));
}
window.renderLinkAdmin = renderLinkAdmin;
function resetLinkForm() { editingLink = null; $("linkForm").reset(); $("linkSubmit").textContent = "Adicionar link"; $("linkCancel").classList.add("hidden"); }
$("linkCancel").onclick = resetLinkForm;
searchBind("linkSearch", "links", renderLinkAdmin);
$("linkForm").onsubmit = async (e) => {
  e.preventDefault(); const u = safeUrl($("linkUrl").value.trim()); if (!u) return toast("URL inválida.");
  const titulo = $("linkTitulo").value.trim();
  if (editingLink) { await db.ref("links/" + editingLink).update({ titulo, url: u }); toast("Link atualizado."); }
  else {
    const max = Object.values(linksData).reduce((m, l) => Math.max(m, l.ordem ?? -1), -1);
    await db.ref("links").push({ titulo, url: u, ordem: max + 1 }); toast("Link adicionado.");
  }
  resetLinkForm();
};

/* ---------- produtos (admin) ---------- */
function renderProdAdmin() {
  const box = $("prodList"); box.innerHTML = "";
  const q = $("prodSearch").value.toLowerCase();
  const items = Object.entries(products).filter(([, p]) => matches(q, p.nome, p.descricao || ""));
  if (!items.length) box.append(el("p", "muted", "Nenhum produto encontrado."));
  paginate("prod", items, box, "prodPager").forEach(([id, p]) => {
    const r = el("div", "row"); const t = el("div"); t.append(el("strong", null, p.nome), el("small", null, p.descricao || ""));
    const ed = el("button", "btn small", "Editar"); ed.onclick = () => {
      editingProd = id; $("prodNome").value = p.nome; $("prodDesc").value = p.descricao || "";
      $("prodSubmit").textContent = "Salvar alterações"; $("prodCancel").classList.remove("hidden"); $("prodNome").focus();
    };
    const del = el("button", "btn small danger", "Excluir"); del.onclick = async () => { if (await confirmBox("Excluir produto?", "Excluir")) db.ref("products/" + id).remove(); };
    const a = el("div", "actions"); a.append(ed, del); r.append(t, a); box.append(r);
  });
}
window.renderProdAdmin = renderProdAdmin;
searchBind("prodSearch", "prod", renderProdAdmin);
let editingProd = null;
function resetProdForm() { editingProd = null; $("prodForm").reset(); $("prodSubmit").textContent = "Cadastrar produto"; $("prodCancel").classList.add("hidden"); }
$("prodCancel").onclick = resetProdForm;
$("prodForm").onsubmit = async (e) => {
  e.preventDefault();
  const data = { nome: $("prodNome").value.trim(), descricao: $("prodDesc").value.trim() };
  if (editingProd) { await db.ref("products/" + editingProd).update(data); toast("Produto atualizado."); }
  else { await db.ref("products").push(data); toast("Produto cadastrado."); }
  resetProdForm();
};


/* ---------- gerar números (10 dígitos, únicos) ---------- */
let generated = {}, editingGen = null;
const SUPORTE_URL = "https://www.workinstore.org/suporte";
const genText = (n) => `Este é o número do seu pedido ${n}. Para suporte remoto e pós-venda, acesse nosso suporte neste site e cadastre o número do seu pedido ${SUPORTE_URL}`;
const rand10 = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return String(1000000000 + ((a[0] * 4294967296 + a[1]) % 9000000000)); };
/* reserva o número com transação: só grava se ainda não existir (nunca repete) */
async function reserveNumber(data) {
  for (let i = 0; i < 20; i++) {
    const n = rand10();
    const r = await db.ref("generated/" + n).transaction(cur => cur === null ? { ...data, numero: n, criadoEm: Date.now() } : undefined);
    if (r.committed) return n;
  }
  throw new Error("Não foi possível gerar um número único. Tente novamente.");
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); }
  catch (_) { const ta = el("textarea"); ta.value = t; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
}
function renderGenerated() {
  const box = $("genList"); if (!box) return; box.innerHTML = "";
  const q = $("genSearch").value.toLowerCase();
  const items = Object.entries(generated)
    .filter(([n, g]) => matches(q, n, g.nome, g.cidade, g.bairro, g.endereco, g.whatsapp, (g.whatsapp || "").replace(/\D/g, "")))
    .sort((a, b) => (b[1].criadoEm || 0) - (a[1].criadoEm || 0));
  if (!items.length) box.append(el("p", "muted", "Nenhum número gerado."));
  paginate("gen", items, box, "genPager").forEach(([n, g]) => {
    const r = el("div", "row"); const t = el("div");
    t.append(el("strong", null, n + " — " + g.nome),
      el("small", null, `${g.endereco}, ${g.numeroEnd} — ${g.bairro} — ${g.cidade} · ${g.whatsapp} · ${fmtDate(g.criadoEm)}`));
    const cp = el("button", "btn small primary", "Copiar"); cp.onclick = async () => { await copyText(genText(n)); toast("Texto copiado!"); };
    const ed = el("button", "btn small", "Editar"); ed.onclick = () => {
      editingGen = n; $("gNome").value = g.nome; $("gWhats").value = g.whatsapp; $("gEnd").value = g.endereco;
      $("gNum").value = g.numeroEnd; $("gBairro").value = g.bairro; $("gCidade").value = g.cidade;
      $("genSubmit").textContent = "Salvar alterações"; $("genCancel").classList.remove("hidden"); $("gNome").focus();
    };
    const del = el("button", "btn small danger", "Excluir"); del.onclick = async () => { if (await confirmBox("Excluir número " + n + "?", "Excluir")) db.ref("generated/" + n).remove(); };
    const a = el("div", "actions"); a.append(cp, ed, del); r.append(t, a); box.append(r);
  });
}
window.renderGenerated = renderGenerated;
searchBind("genSearch", "gen", renderGenerated);
maskPhone($("gWhats"));
$("gNum").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, ""); });
function resetGenForm() { editingGen = null; $("genForm").reset(); $("genSubmit").textContent = "Gerar"; $("genCancel").classList.add("hidden"); }
$("genCancel").onclick = resetGenForm;
$("genForm").onsubmit = async (e) => {
  e.preventDefault();
  const data = { nome: $("gNome").value.trim(), whatsapp: $("gWhats").value.trim(), endereco: $("gEnd").value.trim(),
    numeroEnd: $("gNum").value.trim(), bairro: $("gBairro").value.trim(), cidade: $("gCidade").value.trim() };
  if ($("gWhats").value.replace(/\D/g, "").length < 10) return toast("WhatsApp inválido.");
  try {
    if (editingGen) { await db.ref("generated/" + editingGen).update(data); toast("Dados atualizados."); }
    else { const n = await reserveNumber(data); pages.gen = 1; toast("Número gerado: " + n); }
    resetGenForm();
  } catch (err) { toast("Erro: " + err.message); }
};

/* ---------- automação / FAQ ---------- */
let faqData = {};
async function loadFaq() {
  try { const s = await db.ref("faq").get(); faqData = s.val() || {}; } catch (_) {}
  return faqData;
}
let faqAdmData = {};
function renderFaqAdmin(s) {
  if (s) faqAdmData = s.val() || {};
  const box = $("faqList"); box.innerHTML = "";
  const q = $("faqSearch").value.toLowerCase();
  const items = Object.entries(faqAdmData).filter(([, f]) => matches(q, f.pergunta, f.resposta));
  if (!items.length) box.append(el("p", "muted", "Nenhuma pergunta encontrada."));
  paginate("faq", items, box, "faqPager").forEach(([id, f]) => {
    const r = el("div", "row"); const t = el("div"); t.append(el("strong", null, f.pergunta), el("small", null, f.resposta));
    const ed = el("button", "btn small", "Editar"); ed.onclick = () => {
      editingFaq = id; $("faqQ").value = f.pergunta; $("faqA").value = f.resposta;
      $("faqSubmit").textContent = "Salvar alterações"; $("faqCancel").classList.remove("hidden"); $("faqQ").focus();
    };
    const del = el("button", "btn small danger", "Excluir"); del.onclick = async () => { if (await confirmBox("Excluir pergunta?", "Excluir")) db.ref("faq/" + id).remove(); };
    const a = el("div", "actions"); a.append(ed, del); r.append(t, a); box.append(r);
  });
}
window.renderFaqAdmin = renderFaqAdmin;
searchBind("faqSearch", "faq", renderFaqAdmin);
let editingFaq = null;
function resetFaqForm() { editingFaq = null; $("faqForm").reset(); $("faqSubmit").textContent = "Adicionar pergunta"; $("faqCancel").classList.add("hidden"); }
$("faqCancel").onclick = resetFaqForm;
$("faqForm").onsubmit = async (e) => {
  e.preventDefault();
  const data = { pergunta: $("faqQ").value.trim(), resposta: $("faqA").value.trim() };
  if (editingFaq) { await db.ref("faq/" + editingFaq).update(data); toast("Pergunta atualizada."); }
  else { await db.ref("faq").push(data); toast("Pergunta adicionada."); }
  resetFaqForm();
};
$("saveWelcome").onclick = async () => { await db.ref("settings/welcome").set($("welcomeMsg").value.trim() || DEFAULT_WELCOME); toast("Boas-vindas salvas."); };

/* ---------- aparência ---------- */
$("lookForm").onsubmit = async (e) => {
  e.preventDefault();
  await db.ref("settings").update({ siteName: $("lkNome").value.trim() || "Central de Suporte", defaultTheme: $("lkTema").value, layout: $("lkLayout").value,
    radius: $("lkRadius").value, accent: $("lkAccent").value, useAccent: $("lkUseAccent").checked });
  toast("Aparência salva para todos os usuários.");
};

/* ---------- chat do cliente (um chat por pedido) ----------
   Estrutura: chats/{uid}/{ticketId}/meta  e  chats/{uid}/{ticketId}/messages
   meta: { orderId, pedido, produto, plataforma, status, nome, email, whatsapp, ... } */
const chatState = { uid: null, tid: null, orderId: null, status: "bot", off: null };
const STATUS_TXT = { bot: "Assistente virtual", waiting: "Aguardando atendente", open: "Em atendimento", closed: "Encerrado" };
const LEGACY = ["meta", "messages"];
function renderMsg(box, m, mine) {
  if (m.from === "sys") { box.append(el("div", "msg sys", m.text)); box.scrollTop = box.scrollHeight; return; }
  const d = el("div", "msg" + (mine ? " me" : "") + (m.from === "bot" ? " bot" : ""));
  d.append(el("span", "who", m.from === "bot" ? "🤖 Assistente" : (m.nome || "")), document.createTextNode(m.text));
  box.append(d); box.scrollTop = box.scrollHeight;
}
const sendMsg = (uid, tid, from, text, nome) => db.ref(`chats/${uid}/${tid}/messages`).push({ from, text: text.slice(0, 2000), nome: nome || "", ts: TS });
const setMeta = (uid, tid, upd) => db.ref(`chats/${uid}/${tid}/meta`).update({ ...upd, updatedAt: TS });
const orderLabel = (o) => `${o.produtoNome} — ${o.plataforma} #${o.numero}`;

let myOrders = {}, myTickets = {};
function startClientChat() {
  if (chatState.uid === me.uid) { renderSupportOrders(); return; }
  chatState.uid = me.uid;
  listen(db.ref("chats/" + me.uid), "value", s => { myTickets = s.val() || {}; renderSupportOrders(); });
}
function ticketsOfOrder(orderId) {
  return Object.entries(myTickets).filter(([id, t]) => !LEGACY.includes(id) && t && t.meta && t.meta.orderId === orderId)
    .sort((a, b) => (a[1].meta.createdAt || 0) - (b[1].meta.createdAt || 0));
}
function renderSupportOrders() {
  const box = $("supOrders"); if (!box) return; box.innerHTML = "";
  const ids = Object.keys(myOrders).sort((a, b) => (myOrders[b].criadoEm || 0) - (myOrders[a].criadoEm || 0));
  if (!ids.length) box.append(el("p", "muted", "Você ainda não tem pedidos. Cadastre um em \"Meus pedidos\"."));
  ids.forEach(id => {
    const ts = ticketsOfOrder(id); const last = ts[ts.length - 1];
    const st = last ? last[1].meta.status : null;
    const b = el("button", "ticket" + (id === chatState.orderId ? " sel" : "") + (st === "waiting" ? " waiting" : ""));
    b.append(el("strong", null, myOrders[id].produtoNome), el("small", null, myOrders[id].plataforma + " • Pedido " + myOrders[id].numero),
      el("small", null, last ? STATUS_TXT[st] + " • " + ts.length + " chat(s)" : "Sem chat aberto"));
    b.onclick = () => selectOrder(id); box.append(b);
  });
  if (chatState.orderId) renderOrderHistory();
}
function selectOrder(orderId) {
  chatState.orderId = orderId;
  const ts = ticketsOfOrder(orderId); const last = ts[ts.length - 1];
  renderSupportOrders();
  if (last) openClientTicket(last[0]); else { closeClientTicket(); $("chatTitle").textContent = orderLabel(myOrders[orderId]); renderFaqButtons(); }
}
function renderOrderHistory() {
  const box = $("chatHistory"); box.innerHTML = "";
  const ts = ticketsOfOrder(chatState.orderId);
  if (ts.length < 2) return;
  box.append(el("span", "muted", "Chats deste pedido: "));
  ts.forEach(([tid, t], i) => { const b = el("button", "btn small" + (tid === chatState.tid ? " primary" : " ghost"), "#" + (i + 1) + " " + (t.meta.status === "closed" ? "(encerrado)" : "")); b.onclick = () => openClientTicket(tid); box.append(b); });
}
function closeClientTicket() {
  if (chatState.off) chatState.off(); chatState.off = null; chatState.tid = null; chatState.status = null;
  $("chatMsgs").innerHTML = ""; $("chatStatus").textContent = "Nenhum chat"; $("chatHistory").innerHTML = "";
  $("chatText").disabled = true;
}
function openClientTicket(tid) {
  if (chatState.off) chatState.off();
  chatState.tid = tid; suggest = [];
  const box = $("chatMsgs"); box.innerHTML = "";
  $("chatTitle").textContent = orderLabel(myOrders[chatState.orderId]);
  const mref = db.ref(`chats/${me.uid}/${tid}/messages`).limitToLast(200);
  const mfn = s => renderMsg(box, s.val(), s.val().from === me.uid);
  const metaRef = db.ref(`chats/${me.uid}/${tid}/meta`);
  const metaFn = s => {
    if (chatState.tid !== tid) return;
    chatState.status = (s.val() || {}).status || "bot";
    $("chatStatus").textContent = STATUS_TXT[chatState.status];
    $("chatText").disabled = chatState.status === "closed";
    $("chatText").placeholder = chatState.status === "closed" ? "Chat encerrado. Abra um novo chat para este pedido." : "Digite sua mensagem...";
    renderFaqButtons(); renderOrderHistory();
  };
  mref.on("child_added", mfn); metaRef.on("value", metaFn);
  chatState.off = () => { mref.off("child_added", mfn); metaRef.off("value", metaFn); };
}
async function newTicketForOrder() {
  const o = myOrders[chatState.orderId]; if (!o) return;
  const open = ticketsOfOrder(chatState.orderId).find(([, t]) => t.meta.status !== "closed");
  if (open) return openClientTicket(open[0]);
  const tid = db.ref("chats/" + me.uid).push().key;
  await setMeta(me.uid, tid, { status: "bot", orderId: chatState.orderId, pedido: o.numero, produto: o.produtoNome, plataforma: o.plataforma,
    nome: me.nome + " " + me.sobrenome, email: me.email, whatsapp: me.whatsapp, createdAt: TS });
  await sendMsg(me.uid, tid, "bot", (siteSettings.welcome || DEFAULT_WELCOME) + `\n\nPedido: ${orderLabel(o)}`);
  openClientTicket(tid);
}
let suggest = [];
const normTxt = (x) => (x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");
const STOP = new Set("para como qual quais quando onde porque pois esta este isso essa esse minha meu voce voces tenho estou com sem uma umas uns dos das nos nas que nao sim mais muito pelo pela ola oi bom boa dia tarde noite obrigado".split(" "));
function searchFaq(text) {
  const words = normTxt(text).split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  if (!words.length) return [];
  return Object.values(faqData).map(f => {
    const q = normTxt(f.pergunta), a = normTxt(f.resposta); let sc = 0;
    words.forEach(w => { const r = w.length > 4 ? w.slice(0, -1) : w; if (q.includes(r)) sc += 2; if (a.includes(r)) sc += 1; });
    return { f, sc };
  }).filter(x => x.sc > 0).sort((x, y) => y.sc - x.sc).slice(0, 5).map(x => x.f);
}
function renderFaqButtons() {
  const box = $("faqBtns"); if (!box) return; box.innerHTML = "";
  if (myRole !== "user" || !chatState.orderId) return;
  if (!chatState.tid || chatState.status === "closed") {
    const n = el("button", "human", chatState.tid ? "➕ Abrir novo chat para este pedido" : "💬 Iniciar chat sobre este pedido");
    n.onclick = newTicketForOrder; box.append(n); return;
  }
  if (chatState.status === "bot") {
    const uid = me.uid, tid = chatState.tid;
    if (!suggest.length) box.append(el("small", "muted", "Digite sua dúvida abaixo para ver as respostas disponíveis."));
    suggest.forEach((f, i) => {
      const txt = f.resposta.length > 140 ? f.resposta.slice(0, 140) + "…" : f.resposta;
      const b = el("button", null, (i + 1) + ". " + txt);
      b.onclick = async () => {
        suggest = []; renderFaqButtons();
        await sendMsg(uid, tid, uid, "Opção " + (i + 1), me.nome);
        setTimeout(() => sendMsg(uid, tid, "bot", f.resposta + "\n\nIsso resolveu sua dúvida? Se não, digite sua dúvida com outras palavras ou clique em \"Falar com atendente\"."), 400);
      };
      box.append(b);
    });
    const h = el("button", "human", "🙋 Falar com atendente");
    h.onclick = async () => {
      suggest = [];
      await setMeta(uid, tid, { status: "waiting", unread: true });
      await sendMsg(uid, tid, "sys", "Você entrou na fila. Um atendente responderá em breve.");
    };
    box.append(h);
  }
}
$("chatForm").onsubmit = async (e) => {
  e.preventDefault(); const t = $("chatText").value.trim(); if (!t) return;
  if (!chatState.tid || chatState.status === "closed") return toast("Abra um chat para este pedido.");
  const uid = me.uid, tid = chatState.tid;
  $("chatText").value = "";
  await sendMsg(uid, tid, uid, t, me.nome);
  if (chatState.status === "open" || chatState.status === "waiting") await setMeta(uid, tid, { unread: true });
  else if (chatState.status === "bot") {
    await loadFaq();
    suggest = searchFaq(t);
    renderFaqButtons();
    const n = suggest.length;
    setTimeout(() => sendMsg(uid, tid, "bot", n
      ? "Encontrei " + n + (n > 1 ? " respostas" : " resposta") + " para o que você digitou:\n\n" + suggest.map((f, i) => (i + 1) + ". " + f.resposta).join("\n\n") + "\n\nEscolha abaixo a resposta que melhor se adequa ao seu caso."
      : "Não encontrei uma resposta para isso. Tente escrever sua dúvida com outras palavras ou clique em \"Falar com atendente\"."), 400);
  }
};

/* ---------- mesa de atendimento (admin/moderador) ---------- */
let desk = null, deskOff = null, lastWaiting = 0;
function renderTickets(s) {
  const all = s.val() || {};
  const list = $("ticketList"); list.innerHTML = "";
  const order = { waiting: 0, open: 1, bot: 2, closed: 3 };
  const items = [];
  Object.entries(all).forEach(([uid, tks]) => Object.entries(tks || {}).forEach(([tid, t]) => {
    if (!LEGACY.includes(tid) && t && t.meta) items.push({ uid, tid, m: t.meta });
  }));
  const q = ($("ticketSearch").value || "").toLowerCase();
  const filt = items.filter(x => ((x.m.nome || "") + " " + (x.m.pedido || "") + " " + (x.m.produto || "") + " " + (x.m.email || "")).toLowerCase().includes(q));
  filt.sort((a, b) => ((order[a.m.status] ?? 9) - (order[b.m.status] ?? 9)) || ((b.m.updatedAt || 0) - (a.m.updatedAt || 0)));
  const waiting = items.filter(x => x.m.status === "waiting" || (x.m.status === "open" && x.m.unread)).length;
  const badge = $("notifBadge");
  if (badge) { badge.textContent = waiting; badge.classList.toggle("hidden", !waiting); }
  if (waiting > lastWaiting) { toast("🔔 Novo chamado aguardando atendimento!"); try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play(); } catch (_) {} }
  lastWaiting = waiting;
  if (!filt.length) list.append(el("p", "muted", "Nenhuma conversa."));
  filt.forEach(x => {
    const m = x.m, sel = desk && desk.uid === x.uid && desk.tid === x.tid;
    const b = el("button", "ticket" + (m.status === "waiting" ? " waiting" : "") + (sel ? " sel" : ""));
    b.append(el("strong", null, m.nome || x.uid),
      el("small", "tk-order", "📦 " + (m.produto || "?") + " • " + (m.plataforma || "") + " #" + (m.pedido || "?")),
      el("small", null, STATUS_TXT[m.status] + (m.unread ? " • nova mensagem" : "") + (m.agentName ? " • " + m.agentName : "")),
      el("small", null, fmtDate(m.updatedAt)));
    b.onclick = () => openDesk(x.uid, x.tid, m); list.append(b);
  });
  if (desk && all[desk.uid] && all[desk.uid][desk.tid]) updateDeskInfo(all[desk.uid][desk.tid].meta);
}
$("ticketSearch").oninput = () => db.ref("chats").get().then(renderTickets);
function updateDeskInfo(m) {
  desk.status = m.status;
  $("deskTitle").textContent = (m.nome || "") + " — " + STATUS_TXT[m.status];
  $("deskInfo").textContent = `📦 Pedido ${m.plataforma || ""} #${m.pedido || "?"} • Produto: ${m.produto || "?"} • ${m.email || ""} • WhatsApp ${m.whatsapp || "-"}`;
  $("deskText").disabled = m.status === "closed";
  $("deskText").placeholder = m.status === "closed" ? "Chat encerrado — o cliente precisa abrir um novo chat." : "Responder...";
}
function openDesk(uid, tid, m) {
  if (deskOff) deskOff();
  desk = { uid, tid, status: m.status }; updateDeskInfo(m);
  const box = $("deskMsgs"); box.innerHTML = "";
  const ref = db.ref(`chats/${uid}/${tid}/messages`).limitToLast(300);
  const fn = s => renderMsg(box, s.val(), s.val().from === me.uid);
  ref.on("child_added", fn); deskOff = () => ref.off("child_added", fn);
  if (m.unread && m.status === "open") setMeta(uid, tid, { unread: false });
  document.querySelectorAll("#ticketList .ticket").forEach(b => b.classList.remove("sel"));
}
$("deskTake").onclick = async () => {
  if (!desk) return; if (desk.status === "closed") return toast("Este chat já foi encerrado.");
  await setMeta(desk.uid, desk.tid, { status: "open", unread: false, agent: me.uid, agentName: me.nome });
  await sendMsg(desk.uid, desk.tid, "sys", `${me.nome} entrou no atendimento.`);
};
$("deskClose").onclick = async () => {
  if (!desk || desk.status === "closed") return;
  if (!await confirmBox("Encerrar este chat? O cliente só poderá abrir um novo chat para este pedido.", "Encerrar")) return;
  await setMeta(desk.uid, desk.tid, { status: "closed", unread: false, closedAt: TS });
  await sendMsg(desk.uid, desk.tid, "sys", "Atendimento encerrado. Se precisar, abra um novo chat para este pedido.");
};
$("deskForm").onsubmit = async (e) => {
  e.preventDefault(); const t = $("deskText").value.trim(); if (!t || !desk) return;
  if (desk.status === "closed") return toast("Chat encerrado.");
  $("deskText").value = "";
  await sendMsg(desk.uid, desk.tid, me.uid, t, me.nome + (myRole === "admin" ? " (Admin)" : " (Suporte)"));
  await setMeta(desk.uid, desk.tid, { status: "open", unread: false, agent: me.uid, agentName: me.nome });
};

/* ---------- usuários (admin) ---------- */
let allUsers = {}, allRoles = {};
function renderUsers() {
  const box = $("userList"); if (!box) return; box.innerHTML = "";
  const q = $("userSearch").value.toLowerCase();
  const items = Object.entries(allUsers).filter(([, u]) => matches(q, u.nome, u.sobrenome, u.email));
  if (!items.length) box.append(el("p", "muted", "Nenhum usuário encontrado."));
  paginate("users", items, box, "userPager").forEach(([uid, u]) => {
    const r = el("div", "row"); const t = el("div");
    t.append(el("strong", null, u.nome + " " + u.sobrenome), el("small", null, `${u.email} • ${u.whatsapp} • ${u.cidade}/${(u.uf || "").slice(0, 2)}`));
    const a = el("div", "actions");
    if (u.email !== ADMIN_EMAIL) {
      const sel = el("select"); sel.innerHTML = '<option value="user">Cliente</option><option value="moderator">Moderador</option>';
      sel.value = allRoles[uid] === "moderator" ? "moderator" : "user";
      sel.onchange = () => db.ref("roles/" + uid).set(sel.value).then(() => toast("Função atualizada."));
      const del = el("button", "btn small danger", "Remover dados");
      del.onclick = async () => { if (!await confirmBox("Remover dados, pedidos e chat deste usuário?", "Remover")) return;
        await db.ref().update({ ["users/" + uid]: null, ["orders/" + uid]: null, ["chats/" + uid]: null, ["roles/" + uid]: null }); toast("Dados removidos."); };
      a.append(sel, del);
    } else a.append(el("span", "badge", "Admin"));
    r.append(t, a); box.append(r);
  });
}
window.renderUsers = renderUsers;
searchBind("userSearch", "users", renderUsers);
// cria conta usando uma instância secundária, para o admin não ser deslogado
$("staffForm").onsubmit = async (e) => {
  e.preventDefault();
  const email = $("sEmail").value.trim().toLowerCase();
  if (!validEmail(email)) return toast("E-mail fora da lista de provedores aceitos.");
  if (!phoneOk($("sWhats").value)) return toast("WhatsApp inválido.");
  const cidade = $("sCidade").value.trim(), uf = $("sUF").value;
  if (!cidade) return toast("Informe a cidade.");
  if (!UFS.includes(uf)) return toast("Selecione o estado.");
  const sec = firebase.apps.find(a => a.name === "secondary") || firebase.initializeApp(firebaseConfig, "secondary");
  try {
    const cred = await sec.auth().createUserWithEmailAndPassword(email, $("sPass").value);
    const uid = cred.user.uid; await sec.auth().signOut();
    await db.ref("users/" + uid).set({ nome: $("sNome").value.trim(), sobrenome: $("sSobrenome").value.trim(), email, whatsapp: $("sWhats").value, cidade, uf, foto: "", criadoEm: TS });
    await db.ref("roles/" + uid).set($("sRole").value);
    e.target.reset(); toast("Conta criada!");
  } catch (err) { toast(authErr(err)); }
};
