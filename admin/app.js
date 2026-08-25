/* ==========================================================================
   GESTOR ELETRÔNICOS — app.js
   Firebase Authentication + Realtime Database (sem Firestore / sem Storage)
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, push, update, remove, onValue, onDisconnect,
  query, orderByChild, limitToLast, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ------------------------------------------------------------------
   1) CONFIGURAÇÃO DO FIREBASE  —  SUBSTITUA PELOS SEUS DADOS
   Console Firebase > Configurações do projeto > Seus apps (Web)
   Ative: Authentication (E-mail/senha) e Realtime Database.
------------------------------------------------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyBHahO9SNdc_wnL_VMs6B2i-Gb3AXYR1ws",
  authDomain: "admin-workin-store.firebaseapp.com",
  databaseURL: "https://admin-workin-store-default-rtdb.firebaseio.com",
  projectId: "admin-workin-store",
  storageBucket: "admin-workin-store.firebasestorage.app",
  messagingSenderId: "284284142161",
  appId: "1:284284142161:web:abc50279da94b634b3ae70"
};


const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

const ADMIN_EMAIL = "admin@admin.com";

/* ================= Helpers ================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const money = n => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num   = n => Number(String(n ?? "").toString().replace(",", ".")) || 0;
const esc   = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = d => d ? d.split("-").reverse().join("/") : "—";

function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3600);
}
function fbErr(e) {
  const m = {
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha deve ter ao menos 6 caracteres.",
    "auth/network-request-failed": "Falha de rede. Verifique sua conexão."
  };
  return m[e?.code] || e?.message || "Erro inesperado.";
}
async function fileToBase64(file, maxPx = 512) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

/* ================= Estado global ================= */
const STATE = {
  user: null, profile: null, perms: {}, isAdmin: false,
  products: {}, kits: {}, entries: {}, sales: {},
  payables: {}, receivables: {}, expenses: {}, users: {}, settings: {},
  accounts: {}, fin: {}, finTab: "contas",
  view: "dashboard", unsubs: []
};

const PERMS = [
  ["dashboard", "Dashboard"], ["produtos", "Cadastro de Itens"], ["kits", "Kits"],
  ["estoque", "Estoque / Compras"], ["vendas", "Vendas"], ["financeiro", "Financeiro"],
  ["despesas", "Despesas Gerais"], ["relatorios", "Relatórios"], ["mensagens", "Mensagens"],
  ["usuarios", "Usuários & Permissões"], ["config", "Configurações"]
];

/* ================= Tema / densidade ================= */
const html = document.documentElement;
function applyTheme(t) {
  html.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
  const b = $("#themeBtn"); if (b) b.textContent = t === "dark" ? "☾" : "☀";
}
applyTheme(localStorage.getItem("theme") || "dark");
function applyDensity(d) { html.setAttribute("data-density", d); localStorage.setItem("density", d); }
applyDensity(localStorage.getItem("density") || "normal");

$("#themeBtn").onclick = () => applyTheme(html.getAttribute("data-theme") === "dark" ? "light" : "dark");
$("#densityBtn").onclick = () => applyDensity(html.getAttribute("data-density") === "compact" ? "normal" : "compact");
$("#menuToggle").onclick = () => $("#sidebar").classList.toggle("open");
$$(".pw-toggle").forEach(b => b.onclick = () => {
  const i = $("#" + b.dataset.target); i.type = i.type === "password" ? "text" : "password";
});

/* ================= LOGIN ================= */
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("#loginError"); err.classList.add("hidden");
  const btn = $("#loginBtn"); btn.disabled = true; btn.textContent = "Entrando...";
  try {
    await signInWithEmailAndPassword(auth, $("#loginEmail").value.trim(), $("#loginPass").value);
  } catch (ex) {
    err.textContent = fbErr(ex); err.classList.remove("hidden");
  } finally { btn.disabled = false; btn.textContent = "Entrar"; }
});
$("#openForgot").onclick = () => {
  $("#forgotEmail").value = $("#loginEmail").value.trim();
  $("#forgotBackdrop").classList.remove("hidden");
};
$("#forgotClose").onclick = () => $("#forgotBackdrop").classList.add("hidden");
$("#forgotForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = $("#forgotMsg"); msg.className = "alert hidden";
  try {
    await sendPasswordResetEmail(auth, $("#forgotEmail").value.trim());
    msg.textContent = "Link de redefinição enviado! Confira sua caixa de entrada e o spam.";
    msg.className = "alert ok";
  } catch (ex) { msg.textContent = fbErr(ex); msg.className = "alert"; }
});
$("#logoutBtn").onclick = () => signOut(auth);

/* ================= Sessão ================= */
onAuthStateChanged(auth, async user => {
  STATE.unsubs.forEach(u => u()); STATE.unsubs = [];
  if (!user) {
    stopMessaging();
    STATE.user = null;
    $("#app").classList.add("hidden");
    $("#loginScreen").classList.remove("hidden");
    loadPublicSettings();
    return;
  }
  STATE.user = user;
  STATE.isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL;

  const uref = ref(db, "users/" + user.uid);
  const snap = await get(uref);
  if (!snap.exists()) {
    const base = {
      email: user.email, firstName: (user.displayName || "").split(" ")[0] || "",
      lastName: (user.displayName || "").split(" ").slice(1).join(" ") || "",
      phone: "", role: STATE.isAdmin ? "admin" : "colaborador",
      perms: STATE.isAdmin ? Object.fromEntries(PERMS.map(p => [p[0], true])) : { dashboard: true, perfil: true },
      createdAt: Date.now()
    };
    await set(uref, base); STATE.profile = base;
  } else STATE.profile = snap.val();

  if (STATE.isAdmin && STATE.profile.role !== "admin") {
    STATE.profile.role = "admin";
    STATE.profile.perms = Object.fromEntries(PERMS.map(p => [p[0], true]));
    await update(uref, { role: "admin", perms: STATE.profile.perms });
  }
  STATE.perms = STATE.profile.perms || {};

  $("#loginScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#loginPass").value = "";
  bindData();
  startMessaging();
  renderShell();
});

function can(p) { return STATE.isAdmin || p === "perfil" || p === "dashboard" ? true : !!STATE.perms[p]; }

/* ================= Bindings do Realtime Database ================= */
function bindNode(path, key, cb) {
  const un = onValue(ref(db, path), s => { STATE[key] = s.val() || {}; cb && cb(); },
    err => {
      console.error("Falha ao ler /" + path, err);
      toast(`Sem permissão para ler "${path}" no banco. Ajuste as regras do Realtime Database.`, "err");
    });
  STATE.unsubs.push(un);
}
function bindData() {
  const rerender = () => {
    if (!STATE.ready) return;
    renderView();
    reconcilePayables(true).then(nCreated => { if (nCreated) renderView(); });
    autoSettleDuePayables();
    autoSettleDueReceivables();
    checkReceivableAlerts();
  };
  ["products", "kits", "entries", "sales", "payables", "receivables", "expenses", "users", "settings", "accounts", "fin"]
    .forEach(k => bindNode(k, k, rerender));
  // mantém o perfil (permissões, cargo de chat, silenciamento) sempre atualizado
  bindNode("users", "users", () => {
    const me = STATE.users[STATE.user?.uid];
    if (me) { STATE.profile = { ...STATE.profile, ...me }; STATE.perms = me.perms || STATE.perms; }
    refreshMsgBadge();
  });
  STATE.ready = true;
}
function loadPublicSettings() {
  get(ref(db, "settings")).then(s => {
    const st = s.val() || {};
    if (st.logo) { $("#loginLogo").src = st.logo; $("#loginLogo").style.display = "block"; $("#loginLogoFallback").classList.add("hidden"); }
  }).catch(() => {});
}
loadPublicSettings();

/* ================= Shell ================= */
function renderShell() {
  const p = STATE.profile || {};
  $("#sideUserName").textContent = ((p.firstName || "") + " " + (p.lastName || "")).trim() || p.email;
  $("#sideUserRole").textContent = STATE.isAdmin ? "Administrador geral" : (p.role || "colaborador");
  const av = $("#avatarInitials");
  if (p.photo) { av.innerHTML = `<img src="${p.photo}" alt="Foto de perfil">`; }
  else av.textContent = ((p.firstName || p.email || "?")[0] + ((p.lastName || "")[0] || "")).toUpperCase();
  $$("#nav .nav-item").forEach(b => {
    b.classList.toggle("hidden", !can(b.dataset.perm));
    b.onclick = () => { STATE.view = b.dataset.view; $("#sidebar").classList.remove("open"); renderView(); };
  });
  refreshMsgBadge();
  renderView();
}
function applySettingsUI() {
  const st = STATE.settings || {};
  if (st.companyName) { $("#brandName").textContent = st.companyName; document.title = st.companyName + " — Sistema Gerencial"; }
  if (st.logo) { $("#sideLogo").src = st.logo; $("#loginLogo").src = st.logo; $("#loginLogo").style.display = "block"; $("#loginLogoFallback").classList.add("hidden"); }
}

const VIEWS = {
  dashboard: ["Dashboard", viewDashboard], produtos: ["Cadastro de Itens", viewProdutos],
  kits: ["Kits", viewKits], estoque: ["Estoque / Compras", viewEstoque], vendas: ["Vendas", viewVendas],
  financeiro: ["Financeiro", viewFinanceiro], despesas: ["Despesas Gerais", viewDespesas],
  relatorios: ["Relatórios", viewRelatorios], mensagens: ["Mensagens", viewMensagens],
  usuarios: ["Usuários & Permissões", viewUsuarios],
  perfil: ["Perfil", viewPerfil], config: ["Configurações", viewConfig]
};
function renderView() {
  applySettingsUI();
  const v = VIEWS[STATE.view] ? STATE.view : "dashboard";
  if (!can(v === "perfil" ? "perfil" : v)) { STATE.view = "dashboard"; }
  const [title, fn] = VIEWS[STATE.view];
  $("#viewTitle").textContent = title;
  $$("#nav .nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === STATE.view));
  $("#content").innerHTML = "";
  fn($("#content"));
}

/* ================= Modal genérico ================= */
function openModal(title, bodyHTML, footHTML = "") {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHTML;
  $("#modalFoot").innerHTML = footHTML;
  $("#modalBackdrop").classList.remove("hidden");
}
function closeModal() { $("#modalBackdrop").classList.add("hidden"); }
$("#modalClose").onclick = closeModal;
$("#modalBackdrop").onclick = e => { if (e.target.id === "modalBackdrop") closeModal(); };
function confirmDialog(msg, onYes) {
  openModal("Confirmar", `<p>${esc(msg)}</p>`,
    `<button class="btn" id="cNo">Cancelar</button><button class="btn btn-danger" id="cYes">Confirmar</button>`);
  $("#cNo").onclick = closeModal;
  $("#cYes").onclick = async () => { closeModal(); await onYes(); };
}

/* ================= Cálculos de negócio ================= */
const list = obj => Object.entries(obj || {}).map(([id, v]) => ({ id, ...v }));
function stockValue() { return list(STATE.products).reduce((s, p) => s + num(p.qty) * num(p.avgCost), 0); }
function kitCost(kit) {
  const items = kit.items || [];
  const base = items.reduce((s, it) => s + num(STATE.products[it.productId]?.avgCost) * num(it.qty), 0);
  return base + num(kit.extraCost);
}
function kitAvailable(kit) {
  const items = kit.items || [];
  if (!items.length) return 0;
  return Math.min(...items.map(it => Math.floor(num(STATE.products[it.productId]?.qty) / (num(it.qty) || 1))));
}
function margin(p) {
  const price = num(p.promo) || num(p.price);
  const cost = num(p.avgCost);
  const value = price - cost;
  return { price, cost, value, pct: price > 0 ? (value / price) * 100 : 0, markup: cost > 0 ? (value / cost) * 100 : 0 };
}
const marginCell = (value, percent, hasPrice = true, markup = null) => `<span class="pill ${value >= 0 ? "ok" : "dan"}"${markup !== null ? ` title="Markup sobre o custo: ${pct(markup)}"` : ""}>${money(value)}${hasPrice ? ` · ${pct(percent)}` : ""}</span>`;
const pct = n => (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
function inRange(dateStr, from, to) {
  if (!dateStr) return false;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

/* ================= CONTAS, MOVIMENTOS E FILTROS ================= */
const ACC_TYPES = { digital: "Conta digital / Pix", cash: "Caixa em espécie", bank: "Conta no banco", outra: "Outra" };
const FIN_KINDS = {
  venda: ["Venda", "in"], compra: ["Compra de mercadoria", "out"], despesa: ["Despesa", "out"],
  aporte: ["Injeção de verba / aporte", "in"], investimento: ["Investimento aplicado", "out"],
  resgate: ["Resgate de investimento", "in"],
  doacao_in: ["Doação recebida", "in"], doacao_out: ["Doação efetuada", "out"],
  transfer_in: ["Transferência recebida", "in"], transfer_out: ["Transferência enviada", "out"],
  ajuste_in: ["Outra entrada", "in"], ajuste_out: ["Outra saída", "out"]
};
const kindLabel = k => (FIN_KINDS[k] || [k || "—"])[0];
const accList = () => list(STATE.accounts).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
const finList = () => list(STATE.fin);
function accBalance(id, to) {
  const a = STATE.accounts[id] || {};
  return finList()
    .filter(f => f.accountId === id && (!to || (f.date || "") <= to))
    .reduce((s, f) => s + (f.dir === "in" ? num(f.amount) : -num(f.amount)), num(a.opening));
}
const totalBalance = to => accList().reduce((s, a) => s + accBalance(a.id, to), 0);
const accName = id => STATE.accounts[id]?.name || "—";
const accountOptions = (sel = "") => accList()
  .map(a => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${esc(a.name)} — ${ACC_TYPES[a.type] || a.type} · ${money(accBalance(a.id))}</option>`).join("");
const defaultAccount = () => (accList()[0] || {}).id || "";

async function finAdd(t) {
  if (!t.accountId) return null;
  const dir = t.dir || (FIN_KINDS[t.kind] || ["", "in"])[1];
  return push(ref(db, "fin"), {
    date: t.date || todayISO(), kind: t.kind || "ajuste_in", dir,
    accountId: t.accountId, amount: num(t.amount), description: t.description || "",
    party: t.party || "", category: t.category || kindLabel(t.kind),
    refKind: t.refKind || "", refId: t.refId || "", notes: t.notes || "",
    createdAt: Date.now(), user: STATE.user?.email || ""
  });
}
async function finRemoveByRef(refKind, refId) {
  for (const f of finList().filter(f => f.refKind === refKind && f.refId === refId)) {
    await remove(ref(db, "fin/" + f.id));
  }
}

/* ---- Filtros de período reutilizáveis: diário / mensal / anual / personalizado ---- */
const PERIOD_STORE = {};
const lastDayOfMonth = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).toISOString().slice(0, 10);
function periodSeed(mode) {
  const t = todayISO();
  if (mode === "all") return { mode, from: "", to: "" };
  if (mode === "day") return { mode, from: t, to: t };
  if (mode === "year") return { mode, from: t.slice(0, 4) + "-01-01", to: t.slice(0, 4) + "-12-31" };
  return { mode, from: t.slice(0, 8) + "01", to: lastDayOfMonth(t.slice(0, 7)) };
}
function periodBar(id, def = "month") {
  const s = PERIOD_STORE[id] || (PERIOD_STORE[id] = periodSeed(def));
  return `<div class="toolbar" data-period="${id}">
    <select id="${id}_mode" title="Período">
      ${[["day", "Diário (hoje)"], ["month", "Mensal"], ["year", "Anual"], ["all", "Tudo"], ["custom", "Personalizado"]]
      .map(([v, l]) => `<option value="${v}" ${s.mode === v ? "selected" : ""}>${l}</option>`).join("")}
    </select>
    <input type="date" id="${id}_from" value="${s.from}" title="De">
    <input type="date" id="${id}_to" value="${s.to}" title="Até">
  </div>`;
}
function periodApply(id) {
  const s = PERIOD_STORE[id], t = todayISO(), mode = $("#" + id + "_mode").value;
  s.mode = mode;
  if (mode === "day") { s.from = t; s.to = t; }
  else if (mode === "month") { s.from = t.slice(0, 8) + "01"; s.to = lastDayOfMonth(t.slice(0, 7)); }
  else if (mode === "year") { s.from = t.slice(0, 4) + "-01-01"; s.to = t.slice(0, 4) + "-12-31"; }
  else if (mode === "all") { s.from = ""; s.to = ""; }
  else { s.from = $("#" + id + "_from").value; s.to = $("#" + id + "_to").value; }
  if (mode !== "custom") { $("#" + id + "_from").value = s.from; $("#" + id + "_to").value = s.to; }
  const dis = mode !== "custom";
  $("#" + id + "_from").disabled = dis; $("#" + id + "_to").disabled = dis;
  return s;
}
function bindPeriod(id, cb) {
  ["_mode", "_from", "_to"].forEach(sfx => { const el = $("#" + id + sfx); if (el) el.onchange = () => { periodApply(id); cb(); }; });
  periodApply(id);
}
const periodOf = id => PERIOD_STORE[id] || { from: "", to: "" };
const inPeriod = (date, id) => { const p = periodOf(id); return (!p.from && !p.to) ? !!date : inRange(date, p.from, p.to); };
const periodLabel = id => { const p = periodOf(id); return (!p.from && !p.to) ? "todo o período" : `${fmtDate(p.from)} a ${fmtDate(p.to)}`; };

/* ---- Exportações CSV / PDF ---- */
function downloadCsv(name, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = name.endsWith(".csv") ? name : name + ".csv"; a.click();
  toast("CSV exportado", "ok");
}
function printHTML(title, bodyHTML) {
  const w = window.open("", "_blank");
  if (!w) return toast("Permita pop-ups para gerar o PDF", "err");
  const st = STATE.settings || {};
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Inter,system-ui,sans-serif;color:#111;padding:22px}
h1{font-size:19px;margin:0}h2{font-size:14px;margin:18px 0 6px}
table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0 14px}
th,td{border:1px solid #ccc;padding:5px 6px;text-align:left}th{background:#eef1f6}
.right{text-align:right}.muted{color:#666;font-size:12px}
.kpis{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.kpi{border:1px solid #ccc;border-radius:8px;padding:8px 10px;min-width:150px}
.kpi b{display:block;font-size:15px}</style></head><body>
<h1>${esc(st.companyName || "Relatório")}</h1>
<div class="muted">${esc(title)} · gerado em ${fmtDate(todayISO())}</div>
${bodyHTML}
<script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close();
}
const kpiHTML = arr => `<div class="kpis">${arr.map(([l, v]) => `<div class="kpi"><small>${l}</small><b>${v}</b></div>`).join("")}</div>`;
const tblHTML = (heads, rows) => `<table><thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;

/* ================= DASHBOARD ================= */
function viewDashboard(root) {
  const prods = list(STATE.products), sales = list(STATE.sales);
  const today = todayISO(), month = today.slice(0, 7);
  const salesMonth = sales.filter(s => (s.date || "").startsWith(month));
  const revenue = salesMonth.reduce((s, v) => s + num(v.total), 0);
  const cogs = salesMonth.reduce((s, v) => s + num(v.cost), 0);
  const expMonth = list(STATE.expenses).filter(e => (e.date || "").startsWith(month)).reduce((s, e) => s + num(e.amount), 0);
  const recPend = list(STATE.receivables).filter(r => r.status !== "recebido");
  const payPend = list(STATE.payables).filter(r => r.status !== "pago");
  const lowStock = prods.filter(p => num(p.qty) <= num(p.minQty || 0));
  const nextPay = list(STATE.payables).filter(r => r.status !== "pago" && r.due).sort((a, b) => (a.due || "").localeCompare(b.due || "")).slice(0, 8);
  const nextRec = list(STATE.receivables).filter(r => r.status !== "recebido" && r.due).sort((a, b) => (a.due || "").localeCompare(b.due || "")).slice(0, 8);

  root.innerHTML = `
  <div class="stats">
    ${stat("Faturamento do mês", money(revenue), salesMonth.length + " venda(s)")}
    ${stat("Lucro bruto do mês", money(revenue - cogs), "Custo: " + money(cogs))}
    ${stat("Despesas do mês", money(expMonth), "Resultado: " + money(revenue - cogs - expMonth))}
    ${stat("Valor em estoque", money(stockValue()), prods.length + " item(ns) cadastrados")}
    ${stat("A receber", money(recPend.reduce((s, r) => s + num(r.amount), 0)), recPend.length + " título(s)")}
    ${stat("A pagar", money(payPend.reduce((s, r) => s + num(r.amount), 0)), payPend.length + " título(s)")}
  </div>
  <div class="grid2">
    <div class="card">
      <div class="card-head"><h3>Estoque baixo</h3></div>
      ${lowStock.length ? tbl(["Produto", "Qtd", "Mínimo"], lowStock.slice(0, 8).map(p =>
        `<tr><td>${esc(p.name)}</td><td><span class="pill dan">${num(p.qty)}</span></td><td>${num(p.minQty || 0)}</td></tr>`).join(""))
        : `<div class="empty">Nenhum item abaixo do mínimo.</div>`}
    </div>
    <div class="card">
      <div class="card-head"><h3>Últimas vendas</h3></div>
      ${sales.length ? tbl(["Data", "Cliente", "Total"], sales.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 8).map(s =>
        `<tr><td>${fmtDate(s.date)}</td><td>${esc(s.customer || "—")}</td><td class="right">${money(s.total)}</td></tr>`).join(""))
        : `<div class="empty">Nenhuma venda registrada.</div>`}
    </div>
  </div>
  <div class="grid2">
    <div class="card">
      <div class="card-head"><h3>Próximos vencimentos a pagar</h3></div>
      ${nextPay.length ? tbl(["Vencimento", "Descrição", "Valor"], nextPay.map(r =>
        `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}</td><td class="right"><strong>${money(r.amount)}</strong></td></tr>`).join(""))
        : `<div class="empty">Nenhum título a pagar em aberto.</div>`}
    </div>
    <div class="card">
      <div class="card-head"><h3>Próximos vencimentos a receber</h3></div>
      ${nextRec.length ? tbl(["Vencimento", "Descrição", "Valor"], nextRec.map(r =>
        `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}</td><td class="right"><strong>${money(r.amount)}</strong></td></tr>`).join(""))
        : `<div class="empty">Nenhum título a receber em aberto.</div>`}
    </div>
  </div>`;
}
const stat = (l, v, d = "") => `<div class="stat"><small>${l}</small><b>${v}</b><div class="delta">${d}</div></div>`;
const tbl = (heads, rows) => `<div class="tbl-wrap"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;

/* ================= PAGINAÇÃO — 10/20/30 por página, máx. 5 números + setas ‹ › ================= */
const PAGER = {};
function pagerState(id) { return PAGER[id] || (PAGER[id] = { size: 10, page: 1 }); }
function paged(id, items) {
  const st = pagerState(id);
  const pages = Math.max(1, Math.ceil(items.length / st.size));
  if (st.page > pages) st.page = pages;
  return items.slice((st.page - 1) * st.size, st.page * st.size);
}
function pagerHTML(id, total) {
  const st = pagerState(id);
  const pages = Math.max(1, Math.ceil(total / st.size));
  const start = Math.max(1, Math.min(st.page - 2, pages - 4));
  const nums = [];
  for (let i = start; i < start + Math.min(5, pages); i++) nums.push(i);
  const from = total ? (st.page - 1) * st.size + 1 : 0;
  const to = Math.min(total, st.page * st.size);
  return `<div class="pager" data-pager="${id}" data-total="${total}">
    <span class="pager-info">Exibindo ${from}–${to} de ${total}</span>
    <div class="pager-btns">
      ${pages > 5 ? `<button class="btn btn-sm" data-pg="prev" ${st.page <= 1 ? "disabled" : ""} title="Página anterior">‹</button>` : ""}
      ${nums.map(n => `<button class="btn btn-sm ${n === st.page ? "btn-primary" : ""}" data-pg="${n}">${n}</button>`).join("")}
      ${pages > 5 ? `<button class="btn btn-sm" data-pg="next" ${st.page >= pages ? "disabled" : ""} title="Próxima página">›</button>` : ""}
    </div>
    <select class="pager-size" data-pgsize title="Itens por página">${[10, 20, 30].map(s => `<option value="${s}" ${st.size === s ? "selected" : ""}>${s} por página</option>`).join("")}</select>
  </div>`;
}
function bindPager(id, redraw) {
  const box = document.querySelector(`[data-pager="${id}"]`);
  if (!box) return;
  const st = pagerState(id);
  const total = +box.dataset.total || 0;
  box.querySelectorAll("[data-pg]").forEach(b => b.onclick = () => {
    const pages = Math.max(1, Math.ceil(total / st.size));
    const v = b.dataset.pg;
    if (v === "prev") st.page = Math.max(1, st.page - 1);
    else if (v === "next") st.page = Math.min(pages, st.page + 1);
    else st.page = +v;
    redraw();
  });
  const sel = box.querySelector("[data-pgsize]");
  if (sel) sel.onchange = () => { st.size = +sel.value; st.page = 1; redraw(); };
}


/* ================= PRODUTOS ================= */
function viewProdutos(root) {
  root.innerHTML = `
  <div class="card">
    <div class="card-head">
      <h3>Catálogo de itens</h3><div class="spacer" style="flex:1"></div>
      <div class="toolbar">
        <input id="pSearch" placeholder="Buscar por nome, SKU ou código de barras" style="min-width:260px" />
        <select id="pCat"><option value="">Todas as categorias</option></select>
        <button class="btn btn-primary" id="pNew">+ Novo item</button>
      </div>
    </div>
    <div id="pTable"></div>
  </div>`;
  const cats = [...new Set(list(STATE.products).map(p => p.category).filter(Boolean))];
  $("#pCat").innerHTML += cats.map(c => `<option>${esc(c)}</option>`).join("");
  const draw = () => {
    const q = ($("#pSearch").value || "").toLowerCase(), cat = $("#pCat").value;
    const rows = list(STATE.products)
      .filter(p => !cat || p.category === cat)
      .filter(p => !q || [p.name, p.sku, p.barcode, p.brand, p.model].some(v => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    $("#pTable").innerHTML = rows.length ? tbl(
      ["", "Produto", "SKU", "Cód. barras", "Categoria", "Estoque", "Custo médio", "Preço venda", "Margem un. (R$ · %)", "Total", "Ações"],
      paged("prodPg", rows).map(p => {
        const m = margin(p);
        return `<tr>
        <td>${p.image ? `<img class="thumb" src="${p.image}" alt="">` : `<div class="thumb"></div>`}</td>
        <td><strong>${esc(p.name)}</strong><br><small class="muted">${esc(p.brand || "")} ${esc(p.model || "")}</small></td>
        <td>${esc(p.sku || "—")}</td><td>${esc(p.barcode || "—")}</td><td>${esc(p.category || "—")}</td>
        <td><span class="pill ${num(p.qty) <= num(p.minQty || 0) ? "dan" : "ok"}">${num(p.qty)} ${esc(p.unit || "un")}</span></td>
        <td class="right">${money(p.avgCost)}</td><td class="right">${money(p.price)}</td>
        <td class="right">${marginCell(m.value, m.pct, m.price > 0, m.markup)}</td>
        <td class="right">${money(num(p.qty) * num(p.avgCost))}</td>
        <td><button class="btn btn-sm" data-edit="${p.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button></td></tr>`;
      }).join("")
    ) + pagerHTML("prodPg", rows.length) : `<div class="empty">Nenhum item encontrado. Cadastre o primeiro produto.</div>`;
    bindPager("prodPg", draw);
    $$("[data-edit]", $("#pTable")).forEach(b => b.onclick = () => productForm(b.dataset.edit));
    $$("[data-del]", $("#pTable")).forEach(b => b.onclick = () => confirmDialog("Excluir este item do catálogo?", async () => {
      await remove(ref(db, "products/" + b.dataset.del)); toast("Item excluído", "ok");
    }));
  };
  $("#pSearch").oninput = draw; $("#pCat").onchange = draw; $("#pNew").onclick = () => productForm();
  draw();
}

function productForm(id) {
  const p = id ? { id, ...STATE.products[id] } : {};
  openModal(id ? "Editar item" : "Novo item", `
  <div class="section-title">Identificação</div>
  <div class="grid2">
    <label class="field"><span>Nome do produto *</span><input id="f_name" value="${esc(p.name || "")}" required></label>
    <label class="field"><span>SKU / Código interno</span><input id="f_sku" value="${esc(p.sku || "")}"></label>
    <label class="field"><span>Código de barras (EAN/GTIN)</span><input id="f_barcode" value="${esc(p.barcode || "")}"></label>
    <label class="field"><span>NCM</span><input id="f_ncm" value="${esc(p.ncm || "")}"></label>
    <label class="field"><span>Categoria</span><input id="f_category" list="catlist" value="${esc(p.category || "")}">
      <datalist id="catlist">${[...new Set(list(STATE.products).map(x => x.category).filter(Boolean))].map(c => `<option>${esc(c)}</option>`).join("")}</datalist></label>
    <label class="field"><span>Subcategoria</span><input id="f_subcategory" value="${esc(p.subcategory || "")}"></label>
    <label class="field"><span>Marca</span><input id="f_brand" value="${esc(p.brand || "")}"></label>
    <label class="field"><span>Modelo</span><input id="f_model" value="${esc(p.model || "")}"></label>
    <label class="field"><span>Fornecedor padrão</span><input id="f_supplier" value="${esc(p.supplier || "")}"></label>
    <label class="field"><span>Localização no estoque</span><input id="f_location" value="${esc(p.location || "")}"></label>
  </div>
  <div class="section-title">Estoque e preços</div>
  <div class="grid3">
    <label class="field"><span>Unidade</span><input id="f_unit" value="${esc(p.unit || "un")}"></label>
    <label class="field"><span>Quantidade atual</span><input id="f_qty" type="number" step="0.001" value="${num(p.qty)}"></label>
    <label class="field"><span>Estoque mínimo</span><input id="f_minQty" type="number" step="0.001" value="${num(p.minQty)}"></label>
    <label class="field"><span>Custo médio (R$)</span><input id="f_avgCost" type="number" step="0.01" value="${num(p.avgCost)}"></label>
    <label class="field"><span>Preço de venda (R$)</span><input id="f_price" type="number" step="0.01" value="${num(p.price)}"></label>
    <label class="field"><span>Preço promocional (R$)</span><input id="f_promo" type="number" step="0.01" value="${num(p.promo)}"></label>
    <label class="field"><span>Garantia (meses)</span><input id="f_warranty" type="number" value="${num(p.warranty)}"></label>
    <label class="field"><span>Peso (kg)</span><input id="f_weight" type="number" step="0.001" value="${num(p.weight)}"></label>
    <label class="field"><span>Dimensões (C x L x A)</span><input id="f_dims" value="${esc(p.dims || "")}"></label>
  </div>
  <div class="section-title">Imagem (link externo ou arquivo em base64 no Realtime Database)</div>
  <div class="grid2">
    <label class="field"><span>URL da imagem</span><input id="f_imgUrl" placeholder="https://..." value="${p.image && !String(p.image).startsWith("data:") ? esc(p.image) : ""}"></label>
    <label class="field"><span>Enviar arquivo (convertido em base64)</span><input id="f_imgFile" type="file" accept="image/*"></label>
  </div>
  <div class="section-title">Detalhes</div>
  <label class="field"><span>Descrição</span><textarea id="f_desc">${esc(p.description || "")}</textarea></label>
  <label class="field"><span>Observações internas</span><textarea id="f_notes">${esc(p.notes || "")}</textarea></label>
  <label class="chk"><input type="checkbox" id="f_active" ${p.active === false ? "" : "checked"}> Item ativo para venda</label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar item</button>`);

  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const name = $("#f_name").value.trim();
    if (!name) return toast("Informe o nome do produto", "err");
    let image = $("#f_imgUrl").value.trim() || (p.image && String(p.image).startsWith("data:") ? p.image : "");
    const file = $("#f_imgFile").files[0];
    if (file) { try { image = await fileToBase64(file); } catch { toast("Falha ao processar imagem", "err"); } }
    const data = {
      name, sku: $("#f_sku").value.trim(), barcode: $("#f_barcode").value.trim(), ncm: $("#f_ncm").value.trim(),
      category: $("#f_category").value.trim(), subcategory: $("#f_subcategory").value.trim(),
      brand: $("#f_brand").value.trim(), model: $("#f_model").value.trim(),
      supplier: $("#f_supplier").value.trim(), location: $("#f_location").value.trim(),
      unit: $("#f_unit").value.trim() || "un", qty: num($("#f_qty").value), minQty: num($("#f_minQty").value),
      avgCost: num($("#f_avgCost").value), price: num($("#f_price").value), promo: num($("#f_promo").value),
      warranty: num($("#f_warranty").value), weight: num($("#f_weight").value), dims: $("#f_dims").value.trim(),
      image, description: $("#f_desc").value.trim(), notes: $("#f_notes").value.trim(),
      active: $("#f_active").checked, updatedAt: Date.now()
    };
    if (id) await update(ref(db, "products/" + id), data);
    else await push(ref(db, "products"), { ...data, createdAt: Date.now() });
    closeModal(); toast("Item salvo com sucesso", "ok");
  };
}

/* ================= KITS ================= */
function viewKits(root) {
  const kits = list(STATE.kits);
  root.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Kits e combos</h3><div style="flex:1"></div>
      <button class="btn btn-primary" id="kNew">+ Novo kit</button></div>
    <p class="muted">O custo do kit é a soma dos custos médios dos itens que o compõem, mais o valor adicional definido para a montagem.</p>
    <div id="kTable" style="margin-top:12px"></div>
  </div>`;
  $("#kTable").innerHTML = kits.length ? tbl(
    ["Kit", "Composição", "Custo dos itens", "Adicional", "Custo total", "Preço venda", "Margem (R$ · %)", "Montáveis", "Ações"],
    paged("kitPg", kits).map(k => {
      const base = (k.items || []).reduce((s, it) => s + num(STATE.products[it.productId]?.avgCost) * num(it.qty), 0);
      const total = base + num(k.extraCost);
      const marg = num(k.price) - total;
      return `<tr>
        <td><strong>${esc(k.name)}</strong><br><small class="muted">${esc(k.sku || "")}</small></td>
        <td>${(k.items || []).map(it => `${num(it.qty)}× ${esc(STATE.products[it.productId]?.name || "item removido")}`).join("<br>") || "—"}</td>
        <td class="right">${money(base)}</td><td class="right">${money(k.extraCost)}</td>
        <td class="right"><strong>${money(total)}</strong></td><td class="right">${money(k.price)}</td>
        <td class="right">${marginCell(marg, num(k.price) > 0 ? marg / num(k.price) * 100 : 0, num(k.price) > 0, total > 0 ? marg / total * 100 : null)}</td>
        <td>${kitAvailable(k)}</td>
        <td><button class="btn btn-sm" data-edit="${k.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-del="${k.id}">Excluir</button></td></tr>`;
    }).join("")
  ) + pagerHTML("kitPg", kits.length) : `<div class="empty">Nenhum kit criado. Combine itens do catálogo para formar kits.</div>`;
  bindPager("kitPg", renderView);
  $("#kNew").onclick = () => kitForm();
  $$("[data-edit]", $("#kTable")).forEach(b => b.onclick = () => kitForm(b.dataset.edit));
  $$("[data-del]", $("#kTable")).forEach(b => b.onclick = () => confirmDialog("Excluir este kit?", async () => {
    await remove(ref(db, "kits/" + b.dataset.del)); toast("Kit excluído", "ok");
  }));
}

function kitForm(id) {
  const k = id ? { id, ...STATE.kits[id] } : { items: [] };
  let items = (k.items || []).map(i => ({ ...i }));
  openModal(id ? "Editar kit" : "Novo kit", `
    <div class="grid2">
      <label class="field"><span>Nome do kit *</span><input id="k_name" value="${esc(k.name || "")}"></label>
      <label class="field"><span>SKU do kit</span><input id="k_sku" value="${esc(k.sku || "")}"></label>
      <label class="field"><span>Custo adicional da montagem (R$)</span><input id="k_extra" type="number" step="0.01" value="${num(k.extraCost)}"></label>
      <label class="field"><span>Preço de venda do kit (R$)</span><input id="k_price" type="number" step="0.01" value="${num(k.price)}"></label>
    </div>
    <label class="field"><span>Descrição</span><textarea id="k_desc">${esc(k.description || "")}</textarea></label>
    <div class="section-title">Itens do kit</div>
    <div class="toolbar">
      <select id="k_prod" style="flex:1">${list(STATE.products).sort((a,b)=>(a.name||"").localeCompare(b.name||""))
        .map(p => `<option value="${p.id}">${esc(p.name)} — ${money(p.avgCost)}</option>`).join("")}</select>
      <input id="k_qty" type="number" step="0.001" value="1" style="max-width:100px">
      <button class="btn" id="k_add">Adicionar</button>
    </div>
    <div id="k_items"></div>
    <div class="stat" style="margin-top:6px"><small>Custo total do kit</small><b id="k_total">R$ 0,00</b>
      <div class="delta" id="k_marg"></div></div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar kit</button>`);

  const draw = () => {
    $("#k_items").innerHTML = items.length ? tbl(["Item", "Qtd", "Custo médio", "Subtotal", ""],
      items.map((it, i) => {
        const p = STATE.products[it.productId] || {};
        return `<tr><td>${esc(p.name || "removido")}</td><td>${num(it.qty)}</td><td class="right">${money(p.avgCost)}</td>
        <td class="right">${money(num(p.avgCost) * num(it.qty))}</td>
        <td><button class="btn btn-sm btn-danger" data-rm="${i}">×</button></td></tr>`;
      }).join("")) : `<div class="empty">Nenhum item adicionado.</div>`;
    $$("[data-rm]", $("#k_items")).forEach(b => b.onclick = () => { items.splice(+b.dataset.rm, 1); draw(); });
    const base = items.reduce((s, it) => s + num(STATE.products[it.productId]?.avgCost) * num(it.qty), 0);
    const total = base + num($("#k_extra").value);
    $("#k_total").textContent = money(total);
    $("#k_marg").textContent = `Itens ${money(base)} + adicional ${money($("#k_extra").value)} · Margem: ${money(num($("#k_price").value) - total)}`;
  };
  $("#k_add").onclick = () => {
    const pid = $("#k_prod").value; if (!pid) return toast("Cadastre produtos primeiro", "err");
    const q = num($("#k_qty").value) || 1;
    const ex = items.find(i => i.productId === pid);
    if (ex) ex.qty = num(ex.qty) + q; else items.push({ productId: pid, qty: q });
    draw();
  };
  $("#k_extra").oninput = draw; $("#k_price").oninput = draw;
  draw();

  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const name = $("#k_name").value.trim();
    if (!name) return toast("Informe o nome do kit", "err");
    if (!items.length) return toast("Adicione ao menos um item ao kit", "err");
    const data = {
      name, sku: $("#k_sku").value.trim(), description: $("#k_desc").value.trim(),
      extraCost: num($("#k_extra").value), price: num($("#k_price").value), items, updatedAt: Date.now()
    };
    if (id) await update(ref(db, "kits/" + id), data);
    else await push(ref(db, "kits"), { ...data, createdAt: Date.now() });
    closeModal(); toast("Kit salvo", "ok");
  };
}

/* ================= ESTOQUE / COMPRAS (preço médio) ================= */
function viewEstoque(root) {
  const entries = list(STATE.entries).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const prods = list(STATE.products).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const totalCost = prods.reduce((s, p) => s + num(p.qty) * num(p.avgCost), 0);
  const totalSale = prods.reduce((s, p) => s + num(p.qty) * (num(p.promo) || num(p.price)), 0);

  root.innerHTML = `
  <div class="stats">
    ${stat("Valor total em estoque (custo)", money(totalCost), prods.length + " item(ns)")}
    ${stat("Valor potencial de venda", money(totalSale))}
    ${stat("Margem potencial", money(totalSale - totalCost), totalSale > 0 ? pct((totalSale - totalCost) / totalSale * 100) + " sobre a venda" : "")}
    ${stat("Entradas registradas", String(entries.length))}
  </div>

  <div class="card">
    <div class="card-head"><h3>Entrada de mercadoria (compra)</h3></div>
    <p class="muted">Ao registrar a entrada, o custo médio é recalculado automaticamente:
      (qtd atual × custo médio + qtd comprada × custo unitário) ÷ (qtd total).</p>
    <div class="grid3" style="margin-top:12px">
      <label class="field"><span>Produto</span><select id="e_prod">${prods
        .map(p => `<option value="${p.id}">${esc(p.name)} (estoque: ${num(p.qty)} · médio ${money(p.avgCost)})</option>`).join("")}</select></label>
      <label class="field"><span>Quantidade comprada</span><input id="e_qty" type="number" step="0.001" placeholder="10"></label>
      <label class="field"><span>Valor total da remessa (R$)</span><input id="e_total" type="number" step="0.01" placeholder="250,00"></label>
      <label class="field"><span>Ou custo unitário (R$)</span><input id="e_unit" type="number" step="0.01" placeholder="25,00"></label>
      <label class="field"><span>Fornecedor</span><input id="e_supplier"></label>
      <label class="field"><span>Nota fiscal / documento</span><input id="e_doc"></label>
      <label class="field"><span>Data</span><input id="e_date" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Frete rateado (R$)</span><input id="e_freight" type="number" step="0.01" value="0"></label>
      <label class="field"><span>Pagamento</span><select id="e_pay">
        <option value="imediato">À vista — debita do saldo agora</option>
        <option value="prazo">A prazo — gera conta a pagar</option>
        <option value="nao">Não lançar no financeiro</option></select></label>
      <label class="field"><span>Conta de origem</span><select id="e_acc">${accountOptions(defaultAccount())}</select></label>
      <label class="field hidden" id="e_instWrap"><span>Parcelas (a prazo)</span><select id="e_inst">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}x</option>`).join("")}</select></label>
      <label class="field hidden" id="e_firstWrap"><span>Vencimento da 1ª parcela</span><input id="e_first" type="date" value="${addMonthsISO(todayISO(), 1)}"></label>
      <label class="field hidden" id="e_autoWrap"><span>Débito das parcelas</span><select id="e_auto">
        <option value="0" selected>Manual — fica em aberto no Contas a pagar</option>
        <option value="1">Automático — quita na data do vencimento</option></select></label>
      <label class="field"><span>Juros/desconto cartão de crédito (%)</span>
        <input id="e_juros" type="number" step="0.01" value="0" placeholder="Ex.: 2,99 = juros · -3 = desconto"></label>
      <div class="hidden" id="e_instPrev" style="grid-column:1/-1"></div>
    </div>
    <div class="card" style="margin-top:12px;background:var(--panel-2)"><div id="e_preview" class="muted">Preencha os campos para ver a simulação do novo custo médio.</div></div>
    <div style="margin-top:12px"><button class="btn btn-primary" id="e_save">Registrar entrada</button></div>
  </div>

  <div class="card">
    <div class="card-head">
      <h3>Posição de estoque — todos os produtos</h3><div style="flex:1"></div>
      <div class="toolbar"><input id="sSearch" placeholder="Buscar produto, SKU ou categoria" style="min-width:240px" /></div>
    </div>
    <div id="sTable" style="margin-top:12px"></div>
  </div>

  <div class="card">
    <div class="card-head"><h3>Histórico de entradas</h3><div style="flex:1"></div>
      <div class="toolbar">${periodBar("entP", "month")}<button class="btn" id="ent_csv">CSV</button></div></div>
    <p class="muted">Ao editar ou excluir uma entrada, o estoque e o custo médio do produto são recalculados (a entrada é desfeita e, se for o caso, reaplicada com os novos valores).</p>
    <div id="eTable" style="margin-top:12px"></div>
  </div>`;

  /* ---------- posição de estoque ---------- */
  const drawStock = () => {
    const q = ($("#sSearch").value || "").toLowerCase();
    const rows = prods.filter(p => !q || [p.name, p.sku, p.barcode, p.category, p.brand, p.model]
      .some(v => (v || "").toLowerCase().includes(q)));
    $("#sTable").innerHTML = rows.length ? tbl(
      ["Produto", "SKU", "Categoria", "Local", "Qtd", "Mínimo", "Custo médio", "Custo total", "Preço venda", "Margem un. (R$ · %)", "Venda total", "Margem total (R$ · %)", "Entradas", "Ações"],
      paged("stkPg", rows).map(p => {
        const m = margin(p);
        const qty = num(p.qty);
        const cost = qty * num(p.avgCost);
        const sale = qty * (num(p.promo) || num(p.price));
        const nEnt = entries.filter(e => e.productId === p.id).length;
        return `<tr>
          <td><strong>${esc(p.name)}</strong><br><small class="muted">${esc(p.brand || "")} ${esc(p.model || "")}</small></td>
          <td>${esc(p.sku || "—")}</td><td>${esc(p.category || "—")}</td><td>${esc(p.location || "—")}</td>
          <td><span class="pill ${qty <= num(p.minQty || 0) ? "dan" : "ok"}">${qty} ${esc(p.unit || "un")}</span></td>
          <td>${num(p.minQty || 0)}</td>
          <td class="right">${money(p.avgCost)}</td>
          <td class="right">${money(cost)}</td>
          <td class="right">${money(num(p.promo) || num(p.price))}</td>
          <td class="right">${marginCell(m.value, m.pct, m.price > 0, m.markup)}</td>
          <td class="right">${money(sale)}</td>
          <td class="right">${marginCell(sale - cost, sale > 0 ? (sale - cost) / sale * 100 : 0, sale > 0)}</td>
          <td>${nEnt}</td>
          <td><button class="btn btn-sm" data-pedit="${p.id}">Editar</button></td></tr>`;
      }).join("")
    ) + pagerHTML("stkPg", rows.length) : `<div class="empty">Nenhum produto encontrado.</div>`;
    bindPager("stkPg", drawStock);
    $$("[data-pedit]", $("#sTable")).forEach(b => b.onclick = () => productForm(b.dataset.pedit));
  };
  $("#sSearch").oninput = drawStock;
  drawStock();

  /* ---------- histórico com editar / excluir ---------- */
  const drawEntries = () => {
  const per = entries.filter(e => inPeriod(e.date, "entP"));
  $("#ent_csv").onclick = () => downloadCsv(`compras_${periodOf("entP").from || "tudo"}`,
    [["Data", "Produto", "Qtd", "Custo unit.", "Frete", "Total", "Fornecedor", "Documento", "Pagamento", "Conta"],
    ...per.map(e => [e.date, STATE.products[e.productId]?.name || e.productName || "", num(e.qty),
      num(e.unitCost).toFixed(2), num(e.freight).toFixed(2), num(e.total).toFixed(2),
      e.supplier || "", e.doc || "", e.settlement || "", accName(e.accountId)])]);
  $("#eTable").innerHTML = per.length ? tbl(
    ["Data", "Produto", "Qtd", "Custo unit.", "Frete", "Total", "Custo médio anterior", "Novo custo médio", "Fornecedor", "Documento", "Ações"],
    paged("entPg", per).map(e => `<tr><td>${fmtDate(e.date)}</td>
      <td>${esc(STATE.products[e.productId]?.name || e.productName || "—")}</td>
      <td>${num(e.qty)}</td><td class="right">${money(e.unitCost)}</td><td class="right">${money(e.freight)}</td>
      <td class="right">${money(e.total)}</td>
      <td class="right">${money(e.prevAvg)}</td><td class="right"><strong>${money(e.newAvg)}</strong></td>
      <td>${esc(e.supplier || "—")}</td><td>${esc(e.doc || "—")}</td>
      <td><button class="btn btn-sm" data-eedit="${e.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-edel="${e.id}">Excluir</button></td></tr>`).join("")
  ) + pagerHTML("entPg", per.length) : `<div class="empty">Nenhuma entrada no período.</div>`;

  bindPager("entPg", drawEntries);
  $$("[data-eedit]", $("#eTable")).forEach(b => b.onclick = () => entryForm(b.dataset.eedit));
  $$("[data-edel]", $("#eTable")).forEach(b => b.onclick = () => {
    const e = { id: b.dataset.edel, ...STATE.entries[b.dataset.edel] };
    confirmDialog(`Excluir a entrada de ${num(e.qty)} un de "${STATE.products[e.productId]?.name || e.productName || "produto"}"? O estoque e o custo médio serão desfeitos.`, async () => {
      const rev = revertEntry(e);
      if (rev) await update(ref(db, "products/" + e.productId), rev);
      await finRemoveByRef("entry", e.id);
      for (const r of list(STATE.payables).filter(x => x.refKind === "entry" && x.refId === e.id)) {
        await finRemoveByRef("payables", r.id);
        await remove(ref(db, "payables/" + r.id));
      }
      await remove(ref(db, "entries/" + e.id));
      toast("Entrada excluída e estoque ajustado", "ok");
      renderView();
    });
  });
  };
  bindPeriod("entP", drawEntries);
  drawEntries();

  /* ---------- registrar nova entrada ---------- */
  const preview = () => {
    const p = STATE.products[$("#e_prod").value]; if (!p) return;
    const q = num($("#e_qty").value);
    const unit = num($("#e_unit").value) || (q ? (num($("#e_total").value) + num($("#e_freight").value)) / q : 0);
    if (!q || !unit) { $("#e_preview").textContent = "Preencha quantidade e valor para simular."; return; }
    const newQty = num(p.qty) + q;
    const newAvg = (num(p.qty) * num(p.avgCost) + q * unit) / newQty;
    $("#e_preview").innerHTML = `<strong>Simulação:</strong> estoque ${num(p.qty)} → ${newQty} · custo médio ${money(p.avgCost)} → <strong style="color:var(--primary)">${money(newAvg)}</strong> (unitário desta compra: ${money(unit)})`;
  };
  ["e_prod", "e_qty", "e_total", "e_unit", "e_freight"].forEach(i => { $("#" + i).oninput = preview; $("#" + i).onchange = preview; });

  /* ---------- parcelamento da compra a prazo ---------- */
  const instPreview = () => {
    const prazo = $("#e_pay").value === "prazo";
    ["e_instWrap", "e_firstWrap", "e_autoWrap", "e_instPrev"].forEach(id => $("#" + id).classList.toggle("hidden", !prazo));
    if (!prazo) return;
    const q = num($("#e_qty").value);
    const freight = num($("#e_freight").value);
    const unit = num($("#e_unit").value) || (q ? (num($("#e_total").value) + freight) / q : 0);
    const total = withRate(unit * q, num($("#e_juros").value));
    const n = Math.max(1, Math.min(12, parseInt($("#e_inst").value) || 1));
    const first = $("#e_first").value || $("#e_date").value || todayISO();
    const parts = installmentPlan(total, n, first);
    $("#e_instPrev").innerHTML = total > 0
      ? `<div class="card" style="background:var(--panel-2)"><strong>Parcelamento:</strong> ${n}x · ${parts.map(x => `${fmtDate(x.due)} — ${money(x.amount)}`).join(" · ")}
         <div class="muted" style="margin-top:6px">${$("#e_auto").value === "1"
        ? "Cada parcela será debitada automaticamente da conta escolhida na data do vencimento."
        : "As parcelas ficam em aberto no Contas a pagar para quitação manual."}</div></div>`
      : `<div class="muted">Informe quantidade e valor para simular as parcelas.</div>`;
  };
  ["e_pay", "e_inst", "e_first", "e_auto", "e_juros", "e_qty", "e_total", "e_unit", "e_freight", "e_date"].forEach(i => {
    $("#" + i).addEventListener("change", instPreview); $("#" + i).addEventListener("input", instPreview);
  });
  $("#e_date").addEventListener("change", () => { if (!$("#e_first").dataset.touched) $("#e_first").value = addMonthsISO($("#e_date").value || todayISO(), 1); instPreview(); });
  $("#e_first").addEventListener("change", () => { $("#e_first").dataset.touched = "1"; });
  instPreview();

  $("#e_save").onclick = async () => {
    const pid = $("#e_prod").value, p = STATE.products[pid];
    if (!p) return toast("Cadastre um produto antes", "err");
    const q = num($("#e_qty").value);
    if (q <= 0) return toast("Informe a quantidade", "err");
    const freight = num($("#e_freight").value);
    const unit = num($("#e_unit").value) || (num($("#e_total").value) + freight) / q;
    if (unit <= 0) return toast("Informe o valor da compra", "err");
    const total = unit * q;
    const jurosPct = num($("#e_juros").value);
    const finTotal = withRate(total, jurosPct);
    const prevAvg = num(p.avgCost), prevQty = num(p.qty);
    const newQty = prevQty + q;
    const newAvg = (prevQty * prevAvg + q * unit) / newQty;
    await update(ref(db, "products/" + pid), { qty: newQty, avgCost: Number(newAvg.toFixed(4)) });
    const mode = $("#e_pay").value;
    const accId = $("#e_acc") ? $("#e_acc").value : "";
    const eDate = $("#e_date").value || todayISO();
    const entRef = await push(ref(db, "entries"), {
      productId: pid, productName: p.name, qty: q, unitCost: Number(unit.toFixed(4)), total,
      freight, prevAvg, newAvg: Number(newAvg.toFixed(4)), supplier: $("#e_supplier").value.trim(),
      doc: $("#e_doc").value.trim(), date: eDate, settlement: mode,
      cardRate: jurosPct, financeTotal: finTotal,
      accountId: mode === "imediato" ? accId : "", createdAt: Date.now(),
      user: STATE.user.email
    });
    if (mode === "prazo") {
      const n = Math.max(1, Math.min(12, parseInt($("#e_inst").value) || 1));
      const first = $("#e_first").value || eDate;
      const autoPay = $("#e_auto").value === "1";
      const res = await createPayablesForEntry({
        entryId: entRef.key, productName: p.name, qty: q, total: finTotal, n, first,
        supplier: $("#e_supplier").value.trim(), accountId: accId || "", autoPay
      });
      if (res.created > 0) {
        // mostra o resultado já na aba certa do Financeiro, sem filtros escondendo
        STATE.finTab = "pay";
        PERIOD_STORE["payPP"] = periodSeed("all");
        PAY_FORCE_ALL = true;
        if (can("financeiro")) STATE.view = "financeiro";
        toast(n > 1
          ? `Entrada registrada · ${n} parcelas geradas no contas a pagar (venc. ${fmtDate(res.parts[0].due)} a ${fmtDate(res.parts[n - 1].due)})`
          : `Entrada registrada · conta a pagar gerada para ${fmtDate(res.parts[0].due)}`, "ok");
      } else {
        toast(`Entrada salva, mas nenhuma parcela foi gravada no contas a pagar${res.error ? ": " + res.error : ""}. Abra o Financeiro › Contas a pagar e use "Gerar títulos faltantes".`, "err");
      }
    } else if (mode === "imediato" && accId) {
      await finAdd({
        date: eDate, kind: "compra", amount: finTotal, accountId: accId,
        description: `Compra ${p.name} (${q} un)`, party: $("#e_supplier").value.trim(),
        refKind: "entry", refId: entRef.key
      });
      toast(`Entrada registrada · ${money(finTotal)} debitado de ${accName(accId)}`, "ok");
    } else {
      toast(`Entrada registrada. Novo custo médio: ${money(newAvg)}`, "ok");
    }
    renderView();
  };
  preview();
}

/* ================= PARCELAMENTO / AUTOMAÇÕES DE TÍTULOS ================= */
/* Aplica juros (+) ou desconto (-) percentual — usado na modalidade cartão de crédito. */
function withRate(total, ratePct) {
  const v = num(total) * (1 + num(ratePct) / 100);
  return Number(v.toFixed(2));
}
/* Divide um total em N parcelas mensais a partir de uma data (ajusta centavos na última). */
function installmentPlan(total, n, firstDue) {
  n = Math.max(1, Math.min(12, parseInt(n) || 1));
  const cents = Math.round(num(total) * 100);
  const base = Math.floor(cents / n);
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = (i === n - 1 ? cents - base * (n - 1) : base) / 100;
    out.push({ i: i + 1, amount: Number(v.toFixed(2)), due: addMonthsISO(firstDue, i) });
  }
  return out;
}
function addMonthsISO(iso, months) {
  const [y, m, d] = String(iso || todayISO()).split("-").map(Number);
  const last = new Date(y, m - 1 + months + 1, 0).getDate();
  const dt = new Date(y, m - 1 + months, Math.min(d, last));
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/* Cria os títulos a pagar de uma entrada a prazo. Retorna {created, parts, error}. */
async function createPayablesForEntry(o) {
  const n = Math.max(1, Math.min(12, parseInt(o.n) || 1));
  const parts = installmentPlan(o.total, n, o.first || todayISO());
  let created = 0, error = "";
  try {
    for (const part of parts) {
      await push(ref(db, "payables"), {
        description: `Compra ${o.productName} (${o.qty} un)` + (n > 1 ? ` — parcela ${part.i}/${n}` : ""),
        supplier: o.supplier || "",
        amount: part.amount, due: part.due, status: "pendente", accountId: o.accountId || "",
        category: "Compra de mercadoria", refKind: "entry", refId: o.entryId,
        installment: part.i, installments: n, autoPay: !!o.autoPay, createdAt: Date.now()
      });
      created++;
    }
    await update(ref(db, "entries/" + o.entryId), { installments: n, firstDue: parts[0].due, autoPay: !!o.autoPay });
  } catch (err) {
    console.error("Falha ao gerar as parcelas em payables", err);
    error = err?.message || String(err);
  }
  return { created, parts, error };
}

/* Entradas a prazo que ainda não possuem título no contas a pagar. */
function entriesMissingPayables() {
  const pays = list(STATE.payables);
  return list(STATE.entries)
    .filter(e => e.settlement === "prazo")
    .filter(e => !pays.some(p => p.refKind === "entry" && p.refId === e.id));
}

/* Repara entradas a prazo sem título (falha de gravação, regras, offline etc.). */
async function reconcilePayables(silent) {
  const missing = entriesMissingPayables();
  if (!missing.length) { if (!silent) toast("Todas as entradas a prazo já possuem título no contas a pagar", "ok"); return 0; }
  let total = 0, lastError = "";
  for (const e of missing) {
    const r = await createPayablesForEntry({
      entryId: e.id, productName: e.productName || "item", qty: num(e.qty), total: num(e.total),
      n: num(e.installments) || 1, first: e.firstDue || e.date || todayISO(),
      supplier: e.supplier || "", accountId: e.accountId || "", autoPay: !!e.autoPay
    });
    total += r.created;
    if (r.error) lastError = r.error;
  }
  if (!silent) {
    if (total) toast(`${total} título(s) gerados no contas a pagar`, "ok");
    else toast(`Não foi possível gravar os títulos${lastError ? ": " + lastError : ""}`, "err");
  }
  return total;
}

/* Quita automaticamente as parcelas a pagar cuja data de vencimento chegou. */
let AUTO_PAY_RUNNING = false;
async function autoSettleDuePayables() {
  if (AUTO_PAY_RUNNING) return;
  AUTO_PAY_RUNNING = true;
  try {
    const t = todayISO();
    for (const r of list(STATE.payables)) {
      if (r.status === "pago" || !r.autoPay || !r.accountId) continue;
      if (!r.due || r.due > t) continue;
      // nunca quitar automaticamente um título criado hoje: ele precisa aparecer
      // em aberto no Contas a pagar antes de qualquer débito automático
      if (r.createdAt && new Date(r.createdAt).toISOString().slice(0, 10) >= t) continue;
      if (finList().some(f => f.refKind === "payables" && f.refId === r.id)) continue;
      await update(ref(db, "payables/" + r.id), {
        status: "pago", settledAt: r.due, settledAmount: num(r.amount), autoSettled: true
      });
      await finAdd({
        date: r.due, kind: "compra", dir: "out", accountId: r.accountId, amount: num(r.amount),
        description: r.description, party: r.supplier || "",
        category: r.category || "Compra de mercadoria", refKind: "payables", refId: r.id
      });
      toast(`Parcela quitada automaticamente: ${r.description} · ${money(r.amount)}`, "ok");
    }
  } catch (e) { console.warn(e); }
  finally { AUTO_PAY_RUNNING = false; }
}

/* Credita automaticamente as parcelas a receber com quitação automática vencidas. */
let AUTO_REC_RUNNING = false;
async function autoSettleDueReceivables() {
  if (AUTO_REC_RUNNING) return;
  AUTO_REC_RUNNING = true;
  try {
    const t = todayISO();
    for (const r of list(STATE.receivables)) {
      if (r.status === "recebido" || !r.autoPay || !r.accountId) continue;
      if (!r.due || r.due > t) continue;
      if (r.createdAt && new Date(r.createdAt).toISOString().slice(0, 10) >= t) continue;
      if (finList().some(f => f.refKind === "receivables" && f.refId === r.id)) continue;
      await update(ref(db, "receivables/" + r.id), {
        status: "recebido", settledAt: r.due, settledAmount: num(r.amount), autoSettled: true
      });
      await finAdd({
        date: r.due, kind: r.category === "Venda" ? "venda" : "ajuste_in", dir: "in",
        accountId: r.accountId, amount: num(r.amount), description: r.description,
        party: r.customer || "", category: r.category || "Recebimento",
        refKind: "receivables", refId: r.id
      });
      toast(`Parcela recebida automaticamente: ${r.description} · ${money(r.amount)}`, "ok");
    }
  } catch (e) { console.warn(e); }
  finally { AUTO_REC_RUNNING = false; }
}

/* Alerta de títulos a receber vencidos/vencendo: quitar ou postergar. */
const RECV_SNOOZE = new Set();
let RECV_ALERT_OPEN = false;
function checkReceivableAlerts() {
  if (RECV_ALERT_OPEN) return;
  if (!$("#modalBackdrop").classList.contains("hidden")) return;
  const t = todayISO();
  const r = list(STATE.receivables)
    .filter(x => x.status !== "recebido" && x.due && x.due <= t && !RECV_SNOOZE.has(x.id))
    .filter(x => !(x.autoPay && x.accountId))
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""))[0];
  if (!r) return;
  RECV_ALERT_OPEN = true;
  const close = () => { RECV_ALERT_OPEN = false; closeModal(); };
  openModal("Título a receber vencido", `
    <p>O título abaixo venceu em <strong>${fmtDate(r.due)}</strong>. Já foi quitado?</p>
    <div class="card" style="background:var(--panel-2)">
      <strong>${esc(r.description || "Título")}</strong>
      <div class="muted">${esc(r.customer || "—")} · ${esc(r.category || "Recebimento")}</div>
      <div style="margin-top:6px;font-size:18px"><strong>${money(r.amount)}</strong></div>
    </div>
    <div class="grid2" style="margin-top:12px">
      <label class="field"><span>Conta que recebe / vai receber *</span><select id="ra_acc">${accountOptions(r.accountId)}</select></label>
      <label class="field"><span>Data do recebimento (se já quitado)</span><input id="ra_date" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Novo prazo (se ainda não quitado)</span><input id="ra_new" type="date" value="${addMonthsISO(todayISO(), 0)}"></label>
      <label class="field"><span>Valor (R$)</span><input id="ra_amount" type="number" step="0.01" value="${num(r.amount)}"></label>
    </div>
    <p class="muted">Ao postergar, o título continua em aberto com o novo vencimento e cairá na conta selecionada quando for quitado.</p>
  `, `<button class="btn" id="ra_later">Decidir depois</button>
      <button class="btn" id="ra_post">Não — postergar</button>
      <button class="btn btn-primary" id="ra_paid">Sim — já foi quitado</button>`);

  $("#ra_later").onclick = () => { RECV_SNOOZE.add(r.id); close(); checkReceivableAlerts(); };
  $("#ra_post").onclick = async () => {
    const nd = $("#ra_new").value;
    if (!nd || nd <= r.due) return toast("Escolha uma data de prazo posterior ao vencimento", "err");
    await update(ref(db, "receivables/" + r.id), {
      due: nd, accountId: $("#ra_acc").value, status: "pendente",
      postponedFrom: r.due, postponedAt: Date.now()
    });
    RECV_SNOOZE.add(r.id);
    close(); toast(`Pagamento postergado para ${fmtDate(nd)}`, "ok");
  };
  $("#ra_paid").onclick = async () => {
    const accId = $("#ra_acc").value;
    if (!accId) return toast("Cadastre/escolha uma conta", "err");
    const date = $("#ra_date").value || todayISO();
    const amount = num($("#ra_amount").value) || num(r.amount);
    await update(ref(db, "receivables/" + r.id), { status: "recebido", settledAt: date, accountId: accId, settledAmount: amount });
    await finAdd({
      date, kind: r.category === "Venda" ? "venda" : "ajuste_in", dir: "in", accountId: accId, amount,
      description: r.description, party: r.customer || "", category: r.category || "Recebimento",
      refKind: "receivables", refId: r.id
    });
    RECV_SNOOZE.add(r.id);
    close(); toast("Recebimento lançado no saldo", "ok");
  };
}

/* Desfaz o efeito de uma entrada no produto (estoque + custo médio) */
function revertEntry(e) {
  const p = STATE.products[e.productId];
  if (!p) return null;
  const curQty = num(p.qty), curAvg = num(p.avgCost);
  const qty = Math.max(0, curQty - num(e.qty));
  const valor = curQty * curAvg - num(e.qty) * num(e.unitCost);
  const avgCost = qty > 0 ? Math.max(0, valor / qty) : 0;
  return { qty: Number(qty.toFixed(4)), avgCost: Number(avgCost.toFixed(4)) };
}

/* Edição de uma entrada já lançada */
function entryForm(id) {
  const e = { id, ...STATE.entries[id] };
  const p = STATE.products[e.productId] || {};
  openModal("Editar entrada", `
    <p class="muted">Produto: <strong>${esc(p.name || e.productName || "—")}</strong></p>
    <div class="grid3">
      <label class="field"><span>Quantidade</span><input id="x_qty" type="number" step="0.001" value="${num(e.qty)}"></label>
      <label class="field"><span>Custo unitário (R$)</span><input id="x_unit" type="number" step="0.01" value="${num(e.unitCost)}"></label>
      <label class="field"><span>Frete rateado (R$)</span><input id="x_freight" type="number" step="0.01" value="${num(e.freight)}"></label>
      <label class="field"><span>Fornecedor</span><input id="x_supplier" value="${esc(e.supplier || "")}"></label>
      <label class="field"><span>Documento</span><input id="x_doc" value="${esc(e.doc || "")}"></label>
      <label class="field"><span>Data</span><input id="x_date" type="date" value="${esc(e.date || todayISO())}"></label>
    </div>
    <div class="card" style="margin-top:12px;background:var(--panel-2)"><div id="x_preview" class="muted"></div></div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar alterações</button>`);

  const base = revertEntry(e) || { qty: 0, avgCost: 0 };
  const calc = () => {
    const q = num($("#x_qty").value), unit = num($("#x_unit").value);
    const newQty = base.qty + q;
    const newAvg = newQty > 0 ? (base.qty * base.avgCost + q * unit) / newQty : 0;
    return { q, unit, newQty, newAvg };
  };
  const draw = () => {
    const c = calc();
    $("#x_preview").innerHTML = `Sem esta entrada o estoque seria <strong>${base.qty}</strong> com custo médio ${money(base.avgCost)}.
      Com os valores atuais: estoque <strong>${c.newQty}</strong> · custo médio <strong style="color:var(--primary)">${money(c.newAvg)}</strong>.`;
  };
  ["x_qty", "x_unit"].forEach(i => $("#" + i).oninput = draw);
  draw();

  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const c = calc();
    if (c.q <= 0) return toast("Informe a quantidade", "err");
    if (c.unit <= 0) return toast("Informe o custo unitário", "err");
    await update(ref(db, "products/" + e.productId), {
      qty: Number(c.newQty.toFixed(4)), avgCost: Number(c.newAvg.toFixed(4))
    });
    await update(ref(db, "entries/" + id), {
      qty: c.q, unitCost: Number(c.unit.toFixed(4)), total: Number((c.q * c.unit).toFixed(2)),
      freight: num($("#x_freight").value), prevAvg: base.avgCost, newAvg: Number(c.newAvg.toFixed(4)),
      supplier: $("#x_supplier").value.trim(), doc: $("#x_doc").value.trim(),
      date: $("#x_date").value || todayISO(), updatedAt: Date.now(), editedBy: STATE.user?.email || ""
    });
    if (e.settlement === "prazo") {
      const linked = list(STATE.payables).filter(x => x.refKind === "entry" && x.refId === id);
      if (linked.some(x => x.status === "pago")) {
        toast("Atenção: há parcelas já pagas desta entrada — os títulos do Contas a pagar não foram alterados", "err");
      } else if (linked.length) {
        for (const r of linked) { await finRemoveByRef("payables", r.id); await remove(ref(db, "payables/" + r.id)); }
        await createPayablesForEntry({
          entryId: id, productName: p.name || e.productName || "item", qty: c.q,
          total: withRate(c.q * c.unit, num(e.cardRate)), n: num(e.installments) || 1,
          first: e.firstDue || $("#x_date").value || todayISO(),
          supplier: $("#x_supplier").value.trim(), accountId: e.accountId || "", autoPay: !!e.autoPay
        });
        toast("Parcelas do Contas a pagar recalculadas", "ok");
      }
    }
    closeModal();
    toast("Entrada atualizada e estoque recalculado", "ok");
    renderView();
  };
}

/* ================= VENDAS ================= */
function viewVendas(root) {
  const pid = "vendP";
  root.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Vendas</h3><div style="flex:1"></div>
      <div class="toolbar">
        ${periodBar(pid, "month")}
        <input id="v_q" placeholder="Buscar cliente, item ou pagamento">
        <button class="btn" id="v_csv">CSV</button>
        <button class="btn" id="v_pdf">PDF</button>
        <button class="btn btn-primary" id="sNew">+ Nova venda</button>
      </div>
    </div>
    <div id="vBody" style="margin-top:12px"></div>
  </div>`;
  let rows = [];
  const draw = () => {
    const q = ($("#v_q").value || "").toLowerCase();
    rows = list(STATE.sales)
      .filter(s => inPeriod(s.date, pid))
      .filter(s => !q || [s.customer, s.payment, (s.items || []).map(i => i.name).join(" ")].some(v => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const rev = rows.reduce((a, s) => a + num(s.total), 0);
    const cost = rows.reduce((a, s) => a + num(s.cost), 0);
    $("#vBody").innerHTML = `
      <div class="stats" style="margin-bottom:14px">
        ${stat("Faturamento do período", money(rev), rows.length + " venda(s)")}
        ${stat("Custo das vendas", money(cost))}
        ${stat("Lucro bruto", money(rev - cost), rev > 0 ? pct((rev - cost) / rev * 100) : "")}
        ${stat("Ticket médio", money(rows.length ? rev / rows.length : 0), periodLabel(pid))}
      </div>
      ${rows.length ? tbl(["Data", "Cliente", "Itens", "Pagamento", "Recebimento", "Custo", "Total", "Lucro (R$ · %)", "Ações"],
      paged("venPg", rows).map(s => `<tr><td>${fmtDate(s.date)}</td><td>${esc(s.customer || "—")}</td>
      <td>${(s.items || []).map(i => `${num(i.qty)}× ${esc(i.name)}`).join("<br>")}</td>
      <td>${esc(s.payment || "—")}</td>
      <td>${s.settlement === "prazo" ? `<span class="pill warn">a receber</span>` : `<span class="pill ok">${esc(accName(s.accountId))}</span>`}</td>
      <td class="right">${money(s.cost)}</td>
      <td class="right"><strong>${money(s.total)}</strong></td>
      <td class="right">${marginCell(num(s.total) - num(s.cost), num(s.total) > 0 ? (num(s.total) - num(s.cost)) / num(s.total) * 100 : 0, num(s.total) > 0)}</td>
      <td><button class="btn btn-sm" data-edit="${s.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${s.id}">Excluir</button></td></tr>`).join("")) + pagerHTML("venPg", rows.length)
      : `<div class="empty">Nenhuma venda no período.</div>`}`;
    bindPager("venPg", draw);
    $$("[data-edit]", root).forEach(b => b.onclick = () => saleForm(b.dataset.edit));
    $$("[data-del]", root).forEach(b => b.onclick = () => confirmDialog("Excluir a venda? Os lançamentos financeiros e títulos gerados por ela também serão desfeitos (o estoque não é devolvido automaticamente).", async () => {
      const id = b.dataset.del;
      await finRemoveByRef("sale", id);
      for (const r of list(STATE.receivables).filter(r => r.refKind === "sale" && r.refId === id)) {
        await finRemoveByRef("receivables", r.id);
        await remove(ref(db, "receivables/" + r.id));
      }
      await remove(ref(db, "sales/" + id));
      toast("Venda excluída e saldo ajustado", "ok");
    }));
  };
  $("#sNew").onclick = () => saleForm();
  $("#v_q").oninput = draw;
  $("#v_csv").onclick = () => downloadCsv(`vendas_${periodOf(pid).from || "tudo"}`,
    [["Data", "Cliente", "Pagamento", "Recebimento", "Conta", "Itens", "Custo", "Total", "Lucro"],
    ...rows.map(s => [s.date, s.customer || "", s.payment || "", s.settlement || "", accName(s.accountId),
      (s.items || []).map(i => `${num(i.qty)}x ${i.name}`).join(" | "),
      num(s.cost).toFixed(2), num(s.total).toFixed(2), (num(s.total) - num(s.cost)).toFixed(2)])]);
  $("#v_pdf").onclick = () => printHTML(`Vendas — ${periodLabel(pid)}`,
    kpiHTML([["Faturamento", money(rows.reduce((a, s) => a + num(s.total), 0))],
    ["Custo", money(rows.reduce((a, s) => a + num(s.cost), 0))],
    ["Lucro bruto", money(rows.reduce((a, s) => a + num(s.total) - num(s.cost), 0))],
    ["Vendas", String(rows.length)]]) +
    tblHTML(["Data", "Cliente", "Pagamento", "Custo", "Total", "Lucro"],
      rows.map(s => `<tr><td>${fmtDate(s.date)}</td><td>${esc(s.customer || "")}</td><td>${esc(s.payment || "")}</td>
      <td class="right">${money(s.cost)}</td><td class="right">${money(s.total)}</td>
      <td class="right">${money(num(s.total) - num(s.cost))}</td></tr>`).join("")));
  bindPeriod(pid, draw);
  draw();
}

function saleForm(id) {
  const editing = id ? { id, ...(STATE.sales[id] || {}) } : null;
  let items = editing ? (editing.items || []).map(i => ({ ...i })) : [];
  const opts = [
    ...list(STATE.products).map(p => `<option value="p:${p.id}">${esc(p.name)} — ${money(p.price)}</option>`),
    ...list(STATE.kits).map(k => `<option value="k:${k.id}">[KIT] ${esc(k.name)} — ${money(k.price)}</option>`)
  ].join("");
  openModal(editing ? "Editar venda" : "Nova venda", `
    <div class="grid3">
      <label class="field"><span>Cliente</span><input id="s_customer" value="${esc(editing?.customer || "")}"></label>
      <label class="field"><span>Data</span><input id="s_date" type="date" value="${esc(editing?.date || todayISO())}"></label>
      <label class="field"><span>Forma de pagamento</span><select id="s_pay">
        <option>Dinheiro</option><option>PIX</option><option>Débito</option><option>Crédito</option><option>Boleto</option><option>A prazo</option></select></label>
      <label class="field"><span>Desconto (R$)</span><input id="s_disc" type="number" step="0.01" value="${num(editing?.discount)}"></label>
      <label class="field"><span>Frete cobrado (R$)</span><input id="s_freight" type="number" step="0.01" value="${num(editing?.freight)}"></label>
      <label class="field"><span>Recebimento</span><select id="s_rec">
        <option value="imediato">À vista — credita no saldo agora</option>
        <option value="prazo">A prazo — gera conta a receber</option></select></label>
      <label class="field"><span>Conta de destino</span><select id="s_acc">${accountOptions(editing?.accountId || defaultAccount())}</select></label>
      <label class="field"><span>Juros/desconto cartão de crédito (%)</span>
        <input id="s_juros" type="number" step="0.01" value="${num(editing?.cardRate)}" placeholder="Ex.: 2,99 = juros · -3 = desconto"></label>
      <label class="field hidden" id="s_instWrap"><span>Parcelas (a prazo)</span>
        <select id="s_inst">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}x</option>`).join("")}</select></label>
      <label class="field hidden" id="s_firstWrap"><span>Vencimento da 1ª parcela</span>
        <input id="s_first" type="date" value="${addMonthsISO(editing?.date || todayISO(), 1)}"></label>
      <label class="field hidden" id="s_autoWrap"><span>Recebimento das parcelas</span><select id="s_auto">
        <option value="0" selected>Manual — fica em aberto no Contas a receber</option>
        <option value="1">Automático — quita na data do vencimento</option></select></label>
    </div>
    ${editing ? `<p class="muted">Ao salvar, o estoque dos itens antigos é devolvido e o dos novos itens é baixado; os lançamentos financeiros e os títulos a receber ligados à venda são refeitos.</p>` : ""}
    <div class="hidden" id="s_instPrev" style="margin-top:8px"></div>
    <div class="section-title">Itens da venda</div>
    <div class="toolbar">
      <select id="s_item" style="flex:1">${opts}</select>
      <input id="s_qty" type="number" step="0.001" value="1" style="max-width:100px">
      <button class="btn" id="s_add">Adicionar</button>
    </div>
    <div id="s_list"></div>
    <div class="stat" style="margin-top:6px"><small>Total da venda</small><b id="s_total">R$ 0,00</b><div class="delta" id="s_info"></div></div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">${editing ? "Salvar alterações" : "Registrar venda"}</button>`);

  if (editing) {
    $("#s_pay").value = editing.payment || "Dinheiro";
    $("#s_rec").value = editing.settlement || "imediato";
    $("#s_inst").value = String(Math.max(1, Math.min(12, num(editing.installments) || 1)));
    $("#s_first").value = editing.firstDue || addMonthsISO(editing.date || todayISO(), 1);
    $("#s_auto").value = editing.autoPay ? "1" : "0";
    $("#s_first").dataset.touched = "1";
  }

  const draw = () => {
    $("#s_list").innerHTML = items.length ? tbl(["Item", "Qtd", "Preço unit.", "Custo unit.", "Subtotal", ""],
      items.map((it, i) => `<tr><td>${esc(it.name)}</td><td>${num(it.qty)}</td>
      <td><input type="number" step="0.01" value="${num(it.price)}" data-price="${i}" style="max-width:110px"></td>
      <td class="right">${money(it.cost)}</td><td class="right">${money(num(it.price) * num(it.qty))}</td>
      <td><button class="btn btn-sm btn-danger" data-rm="${i}">×</button></td></tr>`).join(""))
      : `<div class="empty">Nenhum item.</div>`;
    $$("[data-rm]", $("#s_list")).forEach(b => b.onclick = () => { items.splice(+b.dataset.rm, 1); draw(); });
    $$("[data-price]", $("#s_list")).forEach(inp => inp.onchange = () => { items[+inp.dataset.price].price = num(inp.value); draw(); });
    const sub = items.reduce((s, i) => s + num(i.price) * num(i.qty), 0);
    const cost = items.reduce((s, i) => s + num(i.cost) * num(i.qty), 0);
    const base = sub - num($("#s_disc").value) + num($("#s_freight").value);
    const rate = num($("#s_juros").value);
    const total = withRate(base, rate);
    $("#s_total").textContent = money(total);
    $("#s_info").textContent = `Custo ${money(cost)} · Lucro estimado ${money(total - cost)}`
      + (rate ? ` · ${rate > 0 ? "juros" : "desconto"} de cartão ${pct(Math.abs(rate))} (${money(total - base)})` : "");
    saleInstPreview(total);
  };
  $("#s_add").onclick = () => {
    const v = $("#s_item").value; if (!v) return toast("Cadastre produtos ou kits", "err");
    const [t, id] = v.split(":"); const q = num($("#s_qty").value) || 1;
    if (t === "p") { const p = STATE.products[id]; items.push({ type: "product", id, name: p.name, qty: q, price: num(p.promo) || num(p.price), cost: num(p.avgCost) }); }
    else { const k = STATE.kits[id]; items.push({ type: "kit", id, name: "[KIT] " + k.name, qty: q, price: num(k.price), cost: kitCost(k) }); }
    draw();
  };
  const saleInstPreview = (total) => {
    const prazo = $("#s_rec").value === "prazo";
    ["s_instWrap", "s_firstWrap", "s_autoWrap", "s_instPrev"].forEach(id => $("#" + id).classList.toggle("hidden", !prazo));
    if (!prazo) return;
    const n = Math.max(1, Math.min(12, parseInt($("#s_inst").value) || 1));
    const first = $("#s_first").value || $("#s_date").value || todayISO();
    const parts = installmentPlan(total, n, first);
    $("#s_instPrev").innerHTML = total > 0
      ? `<div class="card" style="background:var(--panel-2)"><strong>Parcelamento:</strong> ${n}x · ${parts.map(x => `${fmtDate(x.due)} — ${money(x.amount)}`).join(" · ")}
         <div class="muted" style="margin-top:6px">${$("#s_auto").value === "1"
        ? "Cada parcela será creditada automaticamente na conta escolhida na data do vencimento."
        : "As parcelas ficam em aberto no Contas a receber para quitação manual."}</div></div>`
      : `<div class="muted">Adicione itens para simular as parcelas.</div>`;
  };
  ["s_disc", "s_freight", "s_juros"].forEach(i => $("#" + i).oninput = draw);
  ["s_rec", "s_inst", "s_first", "s_auto", "s_date", "s_pay"].forEach(i => $("#" + i).addEventListener("change", draw));
  $("#s_date").addEventListener("change", () => { if (!$("#s_first").dataset.touched) $("#s_first").value = addMonthsISO($("#s_date").value || todayISO(), 1); });
  $("#s_first").addEventListener("change", () => { $("#s_first").dataset.touched = "1"; });
  $("#s_pay").addEventListener("change", () => {
    if ($("#s_pay").value === "A prazo") { $("#s_rec").value = "prazo"; draw(); }
  });
  draw();

  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    if (!items.length) return toast("Adicione itens à venda", "err");
    const sub = items.reduce((s, i) => s + num(i.price) * num(i.qty), 0);
    const cost = items.reduce((s, i) => s + num(i.cost) * num(i.qty), 0);
    const cardRate = num($("#s_juros").value);
    const total = withRate(sub - num($("#s_disc").value) + num($("#s_freight").value), cardRate);
    if (editing) {
      const linked = list(STATE.receivables).filter(r => r.refKind === "sale" && r.refId === id);
      if (linked.some(r => r.status === "recebido"))
        return toast("Esta venda possui parcelas já recebidas no financeiro. Reabra os títulos em Contas a receber antes de editar.", "err");
    }
    // estoque: devolve os itens antigos (na edição) e baixa os novos
    const updates = {};
    const addQty = (pid, delta) => {
      const key = "products/" + pid + "/qty";
      updates[key] = (key in updates ? updates[key] : num(STATE.products[pid]?.qty)) + delta;
    };
    if (editing) for (const it of editing.items || []) {
      if (it.type === "product") addQty(it.id, num(it.qty));
      else for (const ki of (STATE.kits[it.id]?.items || [])) { if (!STATE.products[ki.productId]) continue; addQty(ki.productId, num(ki.qty) * num(it.qty)); }
    }
    for (const it of items) {
      if (it.type === "product") addQty(it.id, -num(it.qty));
      else for (const ki of (STATE.kits[it.id]?.items || [])) { if (!STATE.products[ki.productId]) continue; addQty(ki.productId, -num(ki.qty) * num(it.qty)); }
    }
    await update(ref(db), updates);
    const settlement = $("#s_rec").value;
    const accId = $("#s_acc") ? $("#s_acc").value : "";
    const sale = {
      customer: $("#s_customer").value.trim(), date: $("#s_date").value || todayISO(),
      payment: $("#s_pay").value, discount: num($("#s_disc").value), freight: num($("#s_freight").value),
      cardRate, items, subtotal: sub, cost, total,
      settlement, accountId: settlement === "imediato" ? accId : "",
      user: editing ? (editing.user || STATE.user.email) : STATE.user.email
    };
    let saleId;
    if (editing) {
      saleId = id;
      await finRemoveByRef("sale", id);
      for (const r of list(STATE.receivables).filter(r => r.refKind === "sale" && r.refId === id)) {
        await finRemoveByRef("receivables", r.id);
        await remove(ref(db, "receivables/" + r.id));
      }
      await update(ref(db, "sales/" + id), { ...sale, createdAt: editing.createdAt || Date.now(), updatedAt: Date.now(), editedBy: STATE.user?.email || "" });
    } else {
      saleId = (await push(ref(db, "sales"), { ...sale, createdAt: Date.now() })).key;
    }
    if (settlement === "prazo") {
      const n = Math.max(1, Math.min(12, parseInt($("#s_inst").value) || 1));
      const first = $("#s_first").value || sale.date;
      const autoReceive = $("#s_auto").value === "1";
      const parts = installmentPlan(total, n, first);
      for (const part of parts) {
        await push(ref(db, "receivables"), {
          description: "Venda " + (sale.customer || "balcão") + (n > 1 ? ` — parcela ${part.i}/${n}` : ""),
          customer: sale.customer, amount: part.amount, due: part.due, status: "pendente",
          category: "Venda", accountId: accId, refKind: "sale", refId: saleId,
          installment: part.i, installments: n, autoPay: autoReceive, createdAt: Date.now()
        });
      }
      await update(ref(db, "sales/" + saleId), { installments: n, firstDue: parts[0].due, autoPay: autoReceive });
      STATE.finTab = "rec";
      toast((editing ? "Venda atualizada · " : "Venda registrada · ") + (n > 1
        ? `${n} parcelas geradas no contas a receber (venc. ${fmtDate(parts[0].due)} a ${fmtDate(parts[n - 1].due)})`
        : "conta a receber gerada"), "ok");
    } else if (accId) {
      await finAdd({
        date: sale.date, kind: "venda", amount: total, accountId: accId,
        description: "Venda " + (sale.customer || "balcão"), party: sale.customer,
        refKind: "sale", refId: saleId
      });
      toast(`${editing ? "Venda atualizada" : "Venda registrada"} · ${money(total)} creditado em ${accName(accId)}`, "ok");
    } else {
      toast(editing ? "Venda atualizada (sem conta de destino, nada foi creditado no saldo)" : "Venda registrada, mas cadastre uma conta no Financeiro para creditar o saldo", editing ? "ok" : "err");
    }
    closeModal();
  };
}

/* ================= FINANCEIRO ================= */
const FIN_TABS = [
  ["contas", "Contas & saldos"], ["mov", "Movimentos"], ["rec", "Contas a receber"],
  ["pay", "Contas a pagar"], ["verbas", "Verbas & investimentos"], ["doacoes", "Doações"],
  ["flux", "Fluxo de caixa"]
];
function viewFinanceiro(root) {
  root.innerHTML = `<div class="tabs">${FIN_TABS.map(([t, l]) => `<button class="tab" data-t="${t}">${l}</button>`).join("")}</div><div id="finBody"></div>`;
  const tabs = $$(".tab", root);
  const show = t => {
    STATE.finTab = t;
    tabs.forEach(b => b.classList.toggle("active", b.dataset.t === t));
    const el = $("#finBody");
    if (t === "contas") accountsView(el);
    else if (t === "mov") finLedger(el, Object.keys(FIN_KINDS), "Movimentos financeiros", "mov", "ajuste_in");
    else if (t === "rec") accountsPanel(el, "receivables", "Contas a receber", "recebido", "Cliente");
    else if (t === "pay") accountsPanel(el, "payables", "Contas a pagar", "pago", "Fornecedor");
    else if (t === "verbas") finLedger(el, ["aporte", "investimento", "resgate"], "Injeções de verba e investimentos", "verbas", "aporte");
    else if (t === "doacoes") finLedger(el, ["doacao_in", "doacao_out"], "Doações recebidas e efetuadas", "doa", "doacao_in");
    else cashFlow(el);
  };
  tabs.forEach(b => b.onclick = () => show(b.dataset.t));
  show(FIN_TABS.some(x => x[0] === STATE.finTab) ? STATE.finTab : "contas");
}

/* ---------- Contas (Pix / espécie / banco) ---------- */
function accountsView(el) {
  const pid = "accP";
  el.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Contas e saldos</h3><div style="flex:1"></div>
      <div class="toolbar">
        ${periodBar(pid, "month")}
        <button class="btn" id="accTransfer">⇄ Transferência</button>
        <button class="btn btn-primary" id="accAdd">+ Nova conta</button>
      </div>
    </div>
    <p class="muted">Saldo = saldo inicial + todas as entradas − todas as saídas registradas nos movimentos. Vendas creditam e compras/despesas debitam automaticamente.</p>
    <div id="accBody" style="margin-top:12px"></div>
  </div>`;
  const draw = () => {
    const accs = accList();
    const movs = finList().filter(f => inPeriod(f.date, pid));
    const inP = id => movs.filter(f => f.accountId === id && f.dir === "in").reduce((s, f) => s + num(f.amount), 0);
    const outP = id => movs.filter(f => f.accountId === id && f.dir === "out").reduce((s, f) => s + num(f.amount), 0);
    $("#accBody").innerHTML = `
      <div class="stats" style="margin-bottom:14px">
        ${stat("Saldo total consolidado", money(totalBalance()), accs.length + " conta(s)")}
        ${stat("Entradas do período", money(movs.filter(f => f.dir === "in").reduce((s, f) => s + num(f.amount), 0)), periodLabel(pid))}
        ${stat("Saídas do período", money(movs.filter(f => f.dir === "out").reduce((s, f) => s + num(f.amount), 0)), periodLabel(pid))}
        ${stat("Resultado do período", money(movs.reduce((s, f) => s + (f.dir === "in" ? num(f.amount) : -num(f.amount)), 0)))}
      </div>
      ${accs.length ? tbl(["Conta", "Tipo", "Saldo inicial", "Entradas do período", "Saídas do período", "Saldo atual", "Ações"],
      accs.map(a => `<tr>
        <td><strong>${esc(a.name)}</strong><br><small class="muted">${esc(a.bank || a.notes || "")}</small></td>
        <td><span class="pill">${esc(ACC_TYPES[a.type] || a.type)}</span></td>
        <td class="right">${money(a.opening)}</td>
        <td class="right">${money(inP(a.id))}</td>
        <td class="right">${money(outP(a.id))}</td>
        <td class="right"><strong class="pill ${accBalance(a.id) >= 0 ? "ok" : "dan"}">${money(accBalance(a.id))}</strong></td>
        <td><button class="btn btn-sm" data-aedit="${a.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-adel="${a.id}">Excluir</button></td></tr>`).join(""))
      : `<div class="empty">Nenhuma conta cadastrada. Crie sua conta digital (Pix), o caixa em espécie e as contas bancárias.</div>`}`;
    $$("[data-aedit]", el).forEach(b => b.onclick = () => accountEditForm(b.dataset.aedit));
    $$("[data-adel]", el).forEach(b => b.onclick = () => confirmDialog("Excluir esta conta? Os movimentos ligados a ela continuarão registrados.", async () => {
      await remove(ref(db, "accounts/" + b.dataset.adel)); toast("Conta excluída", "ok");
    }));
  };
  $("#accAdd").onclick = () => accountEditForm();
  $("#accTransfer").onclick = transferForm;
  bindPeriod(pid, draw);
  draw();
}
function accountEditForm(id) {
  const a = id ? { id, ...STATE.accounts[id] } : {};
  openModal(id ? "Editar conta" : "Nova conta", `
    <div class="grid2">
      <label class="field"><span>Nome da conta *</span><input id="ac_name" value="${esc(a.name || "")}" placeholder="Ex.: Pix Nubank, Caixa da loja"></label>
      <label class="field"><span>Tipo *</span><select id="ac_type">
        ${Object.entries(ACC_TYPES).map(([v, l]) => `<option value="${v}" ${a.type === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="field"><span>Banco / instituição</span><input id="ac_bank" value="${esc(a.bank || "")}"></label>
      <label class="field"><span>Saldo inicial (R$)</span><input id="ac_open" type="number" step="0.01" value="${num(a.opening)}"></label>
    </div>
    <label class="field"><span>Observações</span><textarea id="ac_notes">${esc(a.notes || "")}</textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar conta</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const name = $("#ac_name").value.trim();
    if (!name) return toast("Informe o nome da conta", "err");
    const data = {
      name, type: $("#ac_type").value, bank: $("#ac_bank").value.trim(),
      opening: num($("#ac_open").value), notes: $("#ac_notes").value.trim(), updatedAt: Date.now()
    };
    if (id) await update(ref(db, "accounts/" + id), data);
    else await push(ref(db, "accounts"), { ...data, createdAt: Date.now() });
    closeModal(); toast("Conta salva", "ok");
  };
}
function transferForm() {
  if (accList().length < 2) return toast("Cadastre pelo menos duas contas", "err");
  openModal("Transferência entre contas", `
    <div class="grid2">
      <label class="field"><span>De *</span><select id="tr_from">${accountOptions()}</select></label>
      <label class="field"><span>Para *</span><select id="tr_to">${accountOptions()}</select></label>
      <label class="field"><span>Valor (R$) *</span><input id="tr_amount" type="number" step="0.01"></label>
      <label class="field"><span>Data</span><input id="tr_date" type="date" value="${todayISO()}"></label>
    </div>
    <label class="field"><span>Descrição</span><input id="tr_desc" placeholder="Ex.: Sangria do caixa para o banco"></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Transferir</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const from = $("#tr_from").value, to = $("#tr_to").value, amount = num($("#tr_amount").value);
    if (!amount) return toast("Informe o valor", "err");
    if (from === to) return toast("Escolha contas diferentes", "err");
    const date = $("#tr_date").value || todayISO();
    const desc = $("#tr_desc").value.trim() || `Transferência ${accName(from)} → ${accName(to)}`;
    const gid = uid();
    await finAdd({ date, kind: "transfer_out", accountId: from, amount, description: desc, refKind: "transfer", refId: gid });
    await finAdd({ date, kind: "transfer_in", accountId: to, amount, description: desc, refKind: "transfer", refId: gid });
    closeModal(); toast("Transferência registrada", "ok");
  };
}

/* ---------- Livro de movimentos (genérico, usado em vários painéis) ---------- */
function finLedger(el, kinds, title, pidBase, defaultKind) {
  const pid = pidBase + "P";
  el.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>${title}</h3><div style="flex:1"></div>
      <div class="toolbar">
        ${periodBar(pid, "month")}
        <select id="${pidBase}_acc"><option value="">Todas as contas</option>${accList().map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select>
        <select id="${pidBase}_kind"><option value="">Todos os tipos</option>${kinds.map(k => `<option value="${k}">${kindLabel(k)}</option>`).join("")}</select>
        <input id="${pidBase}_q" placeholder="Buscar descrição/pessoa">
        <button class="btn" id="${pidBase}_csv">CSV</button>
        <button class="btn" id="${pidBase}_pdf">PDF</button>
        <button class="btn btn-primary" id="${pidBase}_new">+ Novo lançamento</button>
      </div>
    </div>
    <div id="${pidBase}_body" style="margin-top:12px"></div>
  </div>`;
  let rows = [];
  const draw = () => {
    const accF = $("#" + pidBase + "_acc").value, kF = $("#" + pidBase + "_kind").value;
    const q = ($("#" + pidBase + "_q").value || "").toLowerCase();
    rows = finList()
      .filter(f => kinds.includes(f.kind))
      .filter(f => inPeriod(f.date, pid))
      .filter(f => !accF || f.accountId === accF)
      .filter(f => !kF || f.kind === kF)
      .filter(f => !q || [f.description, f.party, f.category].some(v => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const tin = rows.filter(f => f.dir === "in").reduce((s, f) => s + num(f.amount), 0);
    const tout = rows.filter(f => f.dir === "out").reduce((s, f) => s + num(f.amount), 0);
    $("#" + pidBase + "_body").innerHTML = `
      <div class="stats" style="margin-bottom:14px">
        ${stat("Entradas", money(tin), periodLabel(pid))}
        ${stat("Saídas", money(tout), periodLabel(pid))}
        ${stat("Líquido", money(tin - tout), rows.length + " lançamento(s)")}
      </div>
      ${rows.length ? tbl(["Data", "Tipo", "Descrição", "Pessoa / empresa", "Conta", "Entrada", "Saída", "Origem", "Ações"],
      paged(pidBase + "Pg", rows).map(f => `<tr><td>${fmtDate(f.date)}</td>
        <td><span class="pill ${f.dir === "in" ? "ok" : "dan"}">${esc(kindLabel(f.kind))}</span></td>
        <td>${esc(f.description || "—")}</td><td>${esc(f.party || "—")}</td><td>${esc(accName(f.accountId))}</td>
        <td class="right">${f.dir === "in" ? money(f.amount) : "—"}</td>
        <td class="right">${f.dir === "out" ? money(f.amount) : "—"}</td>
        <td><small class="muted">${esc(f.refKind || "manual")}</small></td>
        <td>${f.refKind && f.refKind !== "manual" ? `<span class="muted">automático</span>` :
        `<button class="btn btn-sm" data-fedit="${f.id}">Editar</button>
             <button class="btn btn-sm btn-danger" data-fdel="${f.id}">Excluir</button>`}</td></tr>`).join("")) + pagerHTML(pidBase + "Pg", rows.length)
      : `<div class="empty">Nenhum movimento no período.</div>`}`;
    bindPager(pidBase + "Pg", draw);
    $$("[data-fedit]", el).forEach(b => b.onclick = () => finForm(kinds, defaultKind, b.dataset.fedit));
    $$("[data-fdel]", el).forEach(b => b.onclick = () => confirmDialog("Excluir este movimento? O saldo será recalculado.", async () => {
      await remove(ref(db, "fin/" + b.dataset.fdel)); toast("Movimento excluído", "ok");
    }));
  };
  $("#" + pidBase + "_new").onclick = () => finForm(kinds, defaultKind);
  ["_acc", "_kind"].forEach(s => $("#" + pidBase + s).onchange = draw);
  $("#" + pidBase + "_q").oninput = draw;
  $("#" + pidBase + "_csv").onclick = () => downloadCsv(`${pidBase}_${periodOf(pid).from || "tudo"}_${periodOf(pid).to || ""}`,
    [["Data", "Tipo", "Descrição", "Pessoa", "Conta", "Entrada", "Saída"],
    ...rows.map(f => [f.date, kindLabel(f.kind), f.description, f.party, accName(f.accountId),
      f.dir === "in" ? num(f.amount).toFixed(2) : "", f.dir === "out" ? num(f.amount).toFixed(2) : ""])]);
  $("#" + pidBase + "_pdf").onclick = () => printHTML(`${title} — ${periodLabel(pid)}`,
    kpiHTML([["Entradas", money(rows.filter(f => f.dir === "in").reduce((s, f) => s + num(f.amount), 0))],
    ["Saídas", money(rows.filter(f => f.dir === "out").reduce((s, f) => s + num(f.amount), 0))],
    ["Saldo total das contas", money(totalBalance())]]) +
    tblHTML(["Data", "Tipo", "Descrição", "Pessoa", "Conta", "Entrada", "Saída"],
      rows.map(f => `<tr><td>${fmtDate(f.date)}</td><td>${esc(kindLabel(f.kind))}</td><td>${esc(f.description || "")}</td>
      <td>${esc(f.party || "")}</td><td>${esc(accName(f.accountId))}</td>
      <td class="right">${f.dir === "in" ? money(f.amount) : ""}</td>
      <td class="right">${f.dir === "out" ? money(f.amount) : ""}</td></tr>`).join("")));
  bindPeriod(pid, draw);
  draw();
}
function finForm(kinds, defaultKind, id) {
  if (!accList().length) return toast("Cadastre uma conta primeiro", "err");
  const f = id ? { id, ...STATE.fin[id] } : {};
  openModal(id ? "Editar movimento" : "Novo movimento", `
    <div class="grid2">
      <label class="field"><span>Tipo *</span><select id="fm_kind">
        ${kinds.map(k => `<option value="${k}" ${(f.kind || defaultKind) === k ? "selected" : ""}>${kindLabel(k)}</option>`).join("")}</select></label>
      <label class="field"><span>Conta *</span><select id="fm_acc">${accountOptions(f.accountId)}</select></label>
      <label class="field"><span>Valor (R$) *</span><input id="fm_amount" type="number" step="0.01" value="${num(f.amount) || ""}"></label>
      <label class="field"><span>Data</span><input id="fm_date" type="date" value="${esc(f.date || todayISO())}"></label>
      <label class="field"><span>Descrição *</span><input id="fm_desc" value="${esc(f.description || "")}"></label>
      <label class="field"><span>Pessoa / empresa</span><input id="fm_party" value="${esc(f.party || "")}"></label>
    </div>
    <label class="field"><span>Observações</span><textarea id="fm_notes">${esc(f.notes || "")}</textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const kind = $("#fm_kind").value, amount = num($("#fm_amount").value), desc = $("#fm_desc").value.trim();
    if (!amount || !desc) return toast("Informe descrição e valor", "err");
    const data = {
      kind, dir: FIN_KINDS[kind][1], accountId: $("#fm_acc").value, amount,
      date: $("#fm_date").value || todayISO(), description: desc, party: $("#fm_party").value.trim(),
      category: kindLabel(kind), notes: $("#fm_notes").value.trim(), updatedAt: Date.now()
    };
    if (id) await update(ref(db, "fin/" + id), data);
    else await push(ref(db, "fin"), { ...data, refKind: "manual", refId: "", createdAt: Date.now(), user: STATE.user?.email || "" });
    closeModal(); toast("Movimento salvo", "ok");
  };
}

/* ---------- Contas a pagar / a receber ---------- */
let PAY_FORCE_ALL = false;
function accountsPanel(el, node, title, doneStatus, partyLabel) {
  const pidBase = node === "payables" ? "payP" : "recP";
  const pid = pidBase + "P";
  el.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>${title}</h3><div style="flex:1"></div>
      <div class="toolbar">
        ${periodBar(pid, "all")}
        <select id="${pidBase}_st">
          <option value="">Todas as situações</option>
          <option value="pend">Em aberto</option>
          <option value="late">Vencidos</option>
          <option value="done">Liquidados</option>
        </select>
        <input id="${pidBase}_q" placeholder="Buscar descrição, ${partyLabel.toLowerCase()} ou categoria">
        <button class="btn" id="${pidBase}_csv">CSV</button>
        <button class="btn" id="${pidBase}_pdf">PDF</button>
        ${node === "payables" ? `<button class="btn" id="payFix">Gerar títulos faltantes</button>` : ""}
        <button class="btn btn-primary" id="accNew">+ Novo lançamento</button>
      </div>
    </div>
    <p class="muted">Filtro de vencimento: <strong>${periodLabel(pid)}</strong> — por padrão mostra <strong>todos</strong> os títulos, inclusive parcelas com vencimento em meses futuros. Ao liquidar, o valor entra ou sai da conta escolhida e o saldo é atualizado.</p>
    <div id="${pidBase}_body" style="margin-top:12px"></div>
  </div>`;
  if (node === "payables" && PAY_FORCE_ALL) {
    PAY_FORCE_ALL = false;
    PERIOD_STORE[pid] = periodSeed("all");
    const md = $("#" + pid + "_mode"), fr = $("#" + pid + "_from"), to = $("#" + pid + "_to");
    if (md) md.value = "all"; if (fr) fr.value = ""; if (to) to.value = "";
    const st = $("#" + pidBase + "_st"); if (st) st.value = "";
  }
  let rows = [];
  const draw = () => {
    const stF = $("#" + pidBase + "_st").value, q = ($("#" + pidBase + "_q").value || "").toLowerCase();
    const everything = list(STATE[node]);
    const all = everything.filter(r => !r.due || inPeriod(r.due, pid));
    const hidden = everything.length - all.length;
    rows = all
      .filter(r => {
        const done = r.status === doneStatus, late = !done && (r.due || "") < todayISO();
        if (stF === "pend") return !done;
        if (stF === "late") return late;
        if (stF === "done") return done;
        return true;
      })
      .filter(r => !q || [r.description, r.supplier, r.customer, r.category].some(v => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    const pend = rows.filter(r => r.status !== doneStatus);
    const overdue = pend.filter(r => (r.due || "") < todayISO());
    $("#" + pidBase + "_body").innerHTML = `
      <div class="stats" style="margin-bottom:14px">
        ${stat("Em aberto no período", money(pend.reduce((s, r) => s + num(r.amount), 0)), pend.length + " título(s)")}
        ${stat("Vencidos", money(overdue.reduce((s, r) => s + num(r.amount), 0)), overdue.length + " título(s)")}
        ${stat("Liquidado no período", money(rows.filter(r => r.status === doneStatus).reduce((s, r) => s + num(r.amount), 0)))}
        ${stat("Saldo total das contas", money(totalBalance()))}
      </div>
      ${node === "payables" && entriesMissingPayables().length ? `<div class="alert" style="margin-bottom:12px">${entriesMissingPayables().length} entrada(s) a prazo do Estoque/Compras ainda sem título aqui. Clique em <strong>Gerar títulos faltantes</strong>.</div>` : ""}
      ${hidden ? `<div class="alert" style="margin-bottom:12px">${hidden} título(s) com vencimento fora do filtro <strong>${periodLabel(pid)}</strong> estão ocultos. Selecione <strong>Tudo</strong> no período para ver as parcelas futuras.</div>` : ""}
      ${rows.length ? tbl(["Vencimento", "Descrição", partyLabel, "Categoria", "Valor", "Situação", "Conta / liquidação", "Ações"],
      paged(pidBase + "Pg", rows).map(r => {
        const done = r.status === doneStatus;
        const late = !done && (r.due || "") < todayISO();
        const autoTag = r.autoPay ? ` <span class="pill" title="Será liquidado automaticamente na conta escolhida, na data do vencimento">${node === "payables" ? "débito automático" : "recebimento automático"}</span>` : "";
        const autoInfo = r.autoPay && !done
          ? `<small class="muted">auto em ${fmtDate(r.due)} · ${esc(accName(r.accountId))}</small>`
          : "—";
        return `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}${autoTag}</td>
        <td>${esc(r.supplier || r.customer || "—")}</td><td>${esc(r.category || "—")}</td>
        <td class="right">${money(r.amount)}</td>
        <td><span class="pill ${done ? "ok" : late ? "dan" : "warn"}">${done ? doneStatus : late ? "vencido" : "pendente"}</span></td>
        <td>${done ? `${esc(accName(r.accountId))}<br><small class="muted">${fmtDate(r.settledAt)}${r.autoSettled ? " · automático" : ""}</small>` : autoInfo}</td>
        <td>${done ? `<button class="btn btn-sm" data-undo="${r.id}">Reabrir</button> ` :
          `<button class="btn btn-sm btn-ok" data-ok="${r.id}">Liquidar</button> ` +
          `<button class="btn btn-sm" data-auto="${r.id}">${r.autoPay ? "Desligar auto" : "Ligar auto"}</button> `}
            <button class="btn btn-sm btn-danger" data-del="${r.id}">Excluir</button></td></tr>`;
      }).join("")) + pagerHTML(pidBase + "Pg", rows.length) : `<div class="empty">Nenhum lançamento no período.</div>`}`;

    bindPager(pidBase + "Pg", draw);
    $$("[data-ok]", el).forEach(b => b.onclick = () => settleForm(node, b.dataset.ok, doneStatus));
    $$("[data-auto]", el).forEach(b => b.onclick = async () => {
      const r = STATE[node][b.dataset.auto] || {};
      if (!r.autoPay && !r.accountId) return toast("Defina a conta do título antes de ligar a quitação automática", "err");
      await update(ref(db, node + "/" + b.dataset.auto), { autoPay: !r.autoPay });
      toast(!r.autoPay ? "Quitação automática ligada" : "Quitação automática desligada", "ok");
      autoSettleDuePayables(); autoSettleDueReceivables();
    });

    $$("[data-undo]", el).forEach(b => b.onclick = () => confirmDialog("Reabrir o título e desfazer o lançamento no saldo?", async () => {
      await finRemoveByRef(node, b.dataset.undo);
      await update(ref(db, node + "/" + b.dataset.undo), { status: "pendente", settledAt: "", accountId: "" });
      toast("Título reaberto", "ok");
    }));
    $$("[data-del]", el).forEach(b => b.onclick = () => confirmDialog("Excluir lançamento? Movimentos de saldo ligados a ele serão desfeitos.", async () => {
      await finRemoveByRef(node, b.dataset.del);
      await remove(ref(db, node + "/" + b.dataset.del)); toast("Excluído", "ok");
    }));
  };
  if (node === "payables") {
    const fixBtn = $("#payFix");
    if (fixBtn) fixBtn.onclick = async () => {
      fixBtn.disabled = true;
      try { await reconcilePayables(false); } finally { fixBtn.disabled = false; }
      renderView();
    };
  }
  $("#accNew").onclick = () => accountForm(node, partyLabel);
  $("#" + pidBase + "_st").onchange = draw;
  $("#" + pidBase + "_q").oninput = draw;
  $("#" + pidBase + "_csv").onclick = () => downloadCsv(`${node}_${periodOf(pid).from || "tudo"}`,
    [["Vencimento", "Descrição", partyLabel, "Categoria", "Valor", "Situação", "Conta", "Liquidado em"],
    ...rows.map(r => [r.due, r.description, r.supplier || r.customer || "", r.category || "",
      num(r.amount).toFixed(2), r.status, accName(r.accountId), r.settledAt || ""])]);
  $("#" + pidBase + "_pdf").onclick = () => printHTML(`${title} — ${periodLabel(pid)}`,
    kpiHTML([["Em aberto", money(rows.filter(r => r.status !== doneStatus).reduce((s, r) => s + num(r.amount), 0))],
    ["Liquidado", money(rows.filter(r => r.status === doneStatus).reduce((s, r) => s + num(r.amount), 0))]]) +
    tblHTML(["Vencimento", "Descrição", partyLabel, "Categoria", "Valor", "Situação"],
      rows.map(r => `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}</td><td>${esc(r.supplier || r.customer || "")}</td>
      <td>${esc(r.category || "")}</td><td class="right">${money(r.amount)}</td><td>${esc(r.status)}</td></tr>`).join("")));
  bindPeriod(pid, draw);
  draw();
}
function settleForm(node, id, doneStatus) {
  if (!accList().length) return toast("Cadastre uma conta no Financeiro antes de liquidar", "err");
  const r = { id, ...STATE[node][id] };
  const isIn = node === "receivables";
  openModal((isIn ? "Receber título" : "Pagar título"), `
    <p class="muted">${esc(r.description)} — <strong>${money(r.amount)}</strong></p>
    <div class="grid2">
      <label class="field"><span>${isIn ? "Conta que recebeu" : "Conta que pagou"} *</span><select id="st_acc">${accountOptions(r.accountId)}</select></label>
      <label class="field"><span>Data da liquidação</span><input id="st_date" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Valor liquidado (R$)</span><input id="st_amount" type="number" step="0.01" value="${num(r.amount)}"></label>
    </div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Confirmar</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const accId = $("#st_acc").value, date = $("#st_date").value || todayISO(), amount = num($("#st_amount").value);
    await update(ref(db, node + "/" + id), { status: doneStatus, settledAt: date, accountId: accId, settledAmount: amount });
    await finAdd({
      date, kind: isIn ? (r.category === "Venda" ? "venda" : "ajuste_in") : (r.category === "Compra de mercadoria" ? "compra" : "ajuste_out"),
      dir: isIn ? "in" : "out", accountId: accId, amount,
      description: r.description, party: r.supplier || r.customer || "",
      category: r.category || (isIn ? "Recebimento" : "Pagamento"), refKind: node, refId: id
    });
    closeModal(); toast(isIn ? "Recebimento lançado no saldo" : "Pagamento lançado no saldo", "ok");
  };
}
function accountForm(node, partyLabel) {
  openModal("Novo lançamento", `
    <div class="grid2">
      <label class="field"><span>Descrição *</span><input id="a_desc"></label>
      <label class="field"><span>${partyLabel}</span><input id="a_party"></label>
      <label class="field"><span>Valor (R$) *</span><input id="a_amount" type="number" step="0.01"></label>
      <label class="field"><span>Vencimento</span><input id="a_due" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Categoria</span><input id="a_cat" placeholder="Ex.: Fornecedor, Aluguel, Serviço"></label>
      <label class="field"><span>Parcelas (repetir mensalmente, até 12x)</span>
        <select id="a_inst">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}x</option>`).join("")}</select></label>
      <label class="field"><span>Juros/desconto cartão de crédito (%)</span>
        <input id="a_juros" type="number" step="0.01" value="0" placeholder="Ex.: 2,99 = juros · -3 = desconto"></label>
      <label class="field"><span>Quitação automática</span><select id="a_auto">
        <option value="0" selected>Manual — liquidar no botão Liquidar</option>
        <option value="1">Automática — na data do vencimento (exige conta prevista)</option></select></label>
      <label class="field"><span>Conta prevista</span><select id="a_acc"><option value="">Definir na liquidação</option>${accountOptions()}</select></label>
    </div>
    <label class="field"><span>Observações</span><textarea id="a_notes"></textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const d = $("#a_desc").value.trim(), amount = num($("#a_amount").value);
    if (!d || !amount) return toast("Informe descrição e valor", "err");
    const n = Math.max(1, Math.min(12, parseInt($("#a_inst").value) || 1));
    const autoPay = $("#a_auto").value === "1";
    const accId = $("#a_acc").value;
    if (autoPay && !accId) return toast("Escolha a conta prevista para usar a quitação automática", "err");
    const totalWithRate = withRate(amount * n, num($("#a_juros").value));
    const parts = installmentPlan(totalWithRate, n, $("#a_due").value || todayISO());
    for (const part of parts) {
      await push(ref(db, node), {
        description: n > 1 ? `${d} (${part.i}/${n})` : d,
        [node === "payables" ? "supplier" : "customer"]: $("#a_party").value.trim(),
        amount: part.amount, due: part.due, category: $("#a_cat").value.trim(),
        accountId: accId, notes: $("#a_notes").value.trim(), status: "pendente",
        installment: part.i, installments: n, autoPay, cardRate: num($("#a_juros").value), createdAt: Date.now()
      });
    }
    closeModal(); toast("Lançamento salvo", "ok");
  };
}

/* ---------- Fluxo de caixa ---------- */
function cashFlow(el) {
  const pid = "fluxP";
  el.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Fluxo de caixa</h3><div style="flex:1"></div>
      <div class="toolbar">${periodBar(pid, "month")}
        <button class="btn" id="fx_csv">CSV</button>
        <button class="btn" id="fx_pdf">PDF</button></div>
    </div>
    <div id="fx_body" style="margin-top:12px"></div>
  </div>`;
  let byKind = [], movs = [];
  const draw = () => {
    movs = finList().filter(f => inPeriod(f.date, pid));
    const tin = movs.filter(f => f.dir === "in").reduce((s, f) => s + num(f.amount), 0);
    const tout = movs.filter(f => f.dir === "out").reduce((s, f) => s + num(f.amount), 0);
    const map = {};
    movs.forEach(f => {
      const k = kindLabel(f.kind);
      map[k] = map[k] || { in: 0, out: 0 };
      map[k][f.dir] += num(f.amount);
    });
    byKind = Object.entries(map).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out));
    const byDay = {};
    movs.forEach(f => byDay[f.date] = (byDay[f.date] || 0) + (f.dir === "in" ? num(f.amount) : -num(f.amount)));
    const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    const maxDay = Math.max(1, ...days.map(d => Math.abs(d[1])));
    const expP = list(STATE.expenses).filter(e => inPeriod(e.date, pid)).reduce((s, e) => s + num(e.amount), 0);
    const salesP = list(STATE.sales).filter(s => inPeriod(s.date, pid));
    const upPay = list(STATE.payables).filter(r => r.status !== "pago" && r.due).sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    const upRec = list(STATE.receivables).filter(r => r.status !== "recebido" && r.due).sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    $("#fx_body").innerHTML = `
      <div class="stats">
        ${stat("Entradas do período", money(tin))}
        ${stat("Saídas do período", money(tout))}
        ${stat("Resultado de caixa", money(tin - tout), periodLabel(pid))}
        ${stat("Saldo total atual", money(totalBalance()), accList().length + " conta(s)")}
        ${stat("Vendas do período", money(salesP.reduce((s, v) => s + num(v.total), 0)), salesP.length + " venda(s)")}
        ${stat("Despesas do período", money(expP))}
      </div>
      <div class="grid2">
        <div class="card"><div class="card-head"><h3>Por tipo de movimento</h3></div>
          ${byKind.length ? tbl(["Tipo", "Entradas", "Saídas", "Líquido"], byKind.map(([k, v]) =>
      `<tr><td>${esc(k)}</td><td class="right">${money(v.in)}</td><td class="right">${money(v.out)}</td>
             <td class="right">${marginCell(v.in - v.out, 0, false)}</td></tr>`).join(""))
        : `<div class="empty">Sem movimentos no período.</div>`}</div>
        <div class="card"><div class="card-head"><h3>Saldo por conta</h3></div>
          ${accList().length ? tbl(["Conta", "Tipo", "Saldo"], accList().map(a =>
          `<tr><td>${esc(a.name)}</td><td>${esc(ACC_TYPES[a.type] || a.type)}</td>
             <td class="right"><strong>${money(accBalance(a.id))}</strong></td></tr>`).join(""))
        : `<div class="empty">Cadastre suas contas.</div>`}</div>
      </div>
      <div class="card"><div class="card-head"><h3>Resultado diário de caixa</h3></div>
        ${days.length ? `<div class="bars">${days.map(([d, v]) =>
          `<div class="bar-row"><span>${fmtDate(d)}</span><div class="bar"><i style="width:${(Math.abs(v) / maxDay * 100).toFixed(1)}%;background:${v >= 0 ? "var(--ok)" : "var(--danger)"}"></i></div><span class="right">${money(v)}</span></div>`).join("")}</div>`
        : `<div class="empty">Sem movimentos no período.</div>`}</div>
      <div class="card"><div class="card-head"><h3>Saídas por categoria</h3></div>${barsByCategory(pid)}</div>
      <div class="grid2">
        <div class="card"><div class="card-head"><h3>Programado a pagar — próximos vencimentos</h3></div>
          ${upPay.length ? tbl(["Vencimento", "Descrição", "Fornecedor", "Valor"],
            upPay.slice(0, 10).map(r => `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}</td><td>${esc(r.supplier || "—")}</td>
              <td class="right"><strong>${money(r.amount)}</strong></td></tr>`).join("") +
            `<tr><td colspan="3"><strong>Total em aberto</strong></td><td class="right"><strong>${money(upPay.reduce((s, r) => s + num(r.amount), 0))}</strong></td></tr>`)
          : `<div class="empty">Nenhum título a pagar em aberto.</div>`}</div>
        <div class="card"><div class="card-head"><h3>Programado a receber — próximos vencimentos</h3></div>
          ${upRec.length ? tbl(["Vencimento", "Descrição", "Cliente", "Valor"],
            upRec.slice(0, 10).map(r => `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}</td><td>${esc(r.customer || "—")}</td>
              <td class="right"><strong>${money(r.amount)}</strong></td></tr>`).join("") +
            `<tr><td colspan="3"><strong>Total em aberto</strong></td><td class="right"><strong>${money(upRec.reduce((s, r) => s + num(r.amount), 0))}</strong></td></tr>`)
          : `<div class="empty">Nenhum título a receber em aberto.</div>`}</div>
      </div>`;
  };
  $("#fx_csv").onclick = () => downloadCsv(`fluxo_${periodOf(pid).from || "tudo"}`,
    [["Data", "Tipo", "Descrição", "Conta", "Entrada", "Saída"],
    ...movs.sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(f => [f.date, kindLabel(f.kind), f.description,
      accName(f.accountId), f.dir === "in" ? num(f.amount).toFixed(2) : "", f.dir === "out" ? num(f.amount).toFixed(2) : ""])]);
  $("#fx_pdf").onclick = () => printHTML(`Fluxo de caixa — ${periodLabel(pid)}`,
    kpiHTML([["Entradas", money(movs.filter(f => f.dir === "in").reduce((s, f) => s + num(f.amount), 0))],
    ["Saídas", money(movs.filter(f => f.dir === "out").reduce((s, f) => s + num(f.amount), 0))],
    ["Saldo total atual", money(totalBalance())]]) +
    "<h2>Por tipo</h2>" + tblHTML(["Tipo", "Entradas", "Saídas", "Líquido"],
      byKind.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="right">${money(v.in)}</td><td class="right">${money(v.out)}</td><td class="right">${money(v.in - v.out)}</td></tr>`).join("")) +
    "<h2>Saldo por conta</h2>" + tblHTML(["Conta", "Tipo", "Saldo"],
      accList().map(a => `<tr><td>${esc(a.name)}</td><td>${esc(ACC_TYPES[a.type] || a.type)}</td><td class="right">${money(accBalance(a.id))}</td></tr>`).join("")));
  bindPeriod(pid, draw);
  draw();
}
function barsByCategory(pid) {
  const map = {};
  finList().filter(f => f.dir === "out" && inPeriod(f.date, pid))
    .forEach(f => { const k = f.category || kindLabel(f.kind) || "Outros"; map[k] = (map[k] || 0) + num(f.amount); });
  const arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!arr.length) return `<div class="empty">Sem saídas no período.</div>`;
  const max = arr[0][1];
  return `<div class="bars">${arr.map(([k, v]) =>
    `<div class="bar-row"><span>${esc(k)}</span><div class="bar"><i style="width:${(v / max * 100).toFixed(1)}%"></i></div><span class="right">${money(v)}</span></div>`).join("")}</div>`;
}

/* ================= DESPESAS GERAIS ================= */
const EXP_CATS = ["Entregas / Frete", "Combustível", "Manutenção de veículo", "Manutenção geral", "Aluguel", "Energia", "Água", "Internet / Telefone", "Salários", "Impostos", "Marketing", "Material de escritório", "Embalagens", "Outros"];
function viewDespesas(root) {
  const pid = "despP";
  root.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Despesas gerais</h3><div style="flex:1"></div>
      <div class="toolbar">
        ${periodBar(pid, "month")}
        <select id="dFilter"><option value="">Todas as categorias</option>${EXP_CATS.map(c => `<option>${c}</option>`).join("")}</select>
        <input id="dQ" placeholder="Buscar descrição, responsável ou veículo">
        <button class="btn" id="dCsv">CSV</button>
        <button class="btn" id="dPdf">PDF</button>
        <button class="btn btn-primary" id="dNew">+ Nova despesa</button>
      </div>
    </div>
    <div id="dBody" style="margin-top:12px"></div>
  </div>`;
  let rows = [];
  const draw = () => {
    const f = $("#dFilter").value, q = ($("#dQ").value || "").toLowerCase();
    rows = list(STATE.expenses)
      .filter(r => inPeriod(r.date, pid))
      .filter(r => !f || r.category === f)
      .filter(r => !q || [r.description, r.party, r.vehicle, r.payment].some(v => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const total = rows.reduce((s2, r) => s2 + num(r.amount), 0);
    const byCat = Object.entries(rows.reduce((m, r) => { m[r.category || "Outros"] = (m[r.category || "Outros"] || 0) + num(r.amount); return m; }, {}))
      .sort((a, b) => b[1] - a[1]);
    $("#dBody").innerHTML = `
      <div class="stats" style="margin-bottom:14px">
        ${stat("Despesas do período", money(total), periodLabel(pid))}
        ${stat("Lançamentos", String(rows.length))}
        ${stat("Média por lançamento", money(rows.length ? total / rows.length : 0))}
        ${stat("Maior categoria", byCat[0] ? byCat[0][0] : "—", byCat[0] ? money(byCat[0][1]) : "")}
      </div>
      ${rows.length ? tbl(["Data", "Categoria", "Descrição", "Fornecedor/Responsável", "Conta", "Veículo/Placa", "Km", "Pagamento", "Valor", "Ações"],
      paged("despPg", rows).map(r => `<tr><td>${fmtDate(r.date)}</td><td><span class="pill">${esc(r.category)}</span></td>
      <td>${esc(r.description)}</td><td>${esc(r.party || "—")}</td><td>${esc(r.accountId ? accName(r.accountId) : "—")}</td>
      <td>${esc(r.vehicle || "—")}</td><td>${r.km ? num(r.km) : "—"}</td><td>${esc(r.payment || "—")}</td>
      <td class="right"><strong>${money(r.amount)}</strong></td>
      <td><button class="btn btn-sm" data-edit="${r.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${r.id}">Excluir</button></td></tr>`).join("")) + pagerHTML("despPg", rows.length)
      : `<div class="empty">Nenhuma despesa no período.</div>`}
      <div class="card" style="margin-top:14px"><div class="card-head"><h3>Por categoria</h3></div>
        ${byCat.length ? tbl(["Categoria", "Total"], byCat.map(([c, v]) => `<tr><td>${esc(c)}</td><td class="right">${money(v)}</td></tr>`).join("")) : `<div class="empty">Sem dados.</div>`}</div>`;
    bindPager("despPg", draw);
    $$("[data-edit]", $("#dBody")).forEach(b => b.onclick = () => expenseForm(b.dataset.edit));
    $$("[data-del]", $("#dBody")).forEach(b => b.onclick = () => confirmDialog("Excluir despesa? O lançamento no saldo também será desfeito.", async () => {
      await finRemoveByRef("expense", b.dataset.del);
      await remove(ref(db, "expenses/" + b.dataset.del)); toast("Excluída", "ok");
    }));
  };
  $("#dFilter").onchange = draw; $("#dQ").oninput = draw; $("#dNew").onclick = () => expenseForm();
  $("#dCsv").onclick = () => downloadCsv(`despesas_${periodOf(pid).from || "tudo"}`,
    [["Data", "Categoria", "Descrição", "Responsável", "Conta", "Veículo", "Km", "Pagamento", "Valor"],
    ...rows.map(r => [r.date, r.category, r.description, r.party || "", accName(r.accountId), r.vehicle || "",
      num(r.km) || "", r.payment || "", num(r.amount).toFixed(2)])]);
  $("#dPdf").onclick = () => printHTML(`Despesas gerais — ${periodLabel(pid)}`,
    kpiHTML([["Total", money(rows.reduce((s2, r) => s2 + num(r.amount), 0))], ["Lançamentos", String(rows.length)]]) +
    tblHTML(["Data", "Categoria", "Descrição", "Responsável", "Valor"],
      rows.map(r => `<tr><td>${fmtDate(r.date)}</td><td>${esc(r.category)}</td><td>${esc(r.description)}</td>
      <td>${esc(r.party || "")}</td><td class="right">${money(r.amount)}</td></tr>`).join("")));
  bindPeriod(pid, draw);
  draw();
}
function expenseForm(id) {
  const e = id ? { id, ...STATE.expenses[id] } : {};
  openModal(id ? "Editar despesa" : "Nova despesa", `
    <div class="grid2">
      <label class="field"><span>Categoria *</span><select id="x_cat">${EXP_CATS.map(c => `<option ${e.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
      <label class="field"><span>Data</span><input id="x_date" type="date" value="${e.date || todayISO()}"></label>
      <label class="field"><span>Descrição *</span><input id="x_desc" value="${esc(e.description || "")}"></label>
      <label class="field"><span>Valor (R$) *</span><input id="x_amount" type="number" step="0.01" value="${num(e.amount) || ""}"></label>
      <label class="field"><span>Fornecedor / Responsável</span><input id="x_party" value="${esc(e.party || "")}"></label>
      <label class="field"><span>Forma de pagamento</span><input id="x_pay" value="${esc(e.payment || "")}"></label>
      <label class="field"><span>Veículo / Placa (entregas)</span><input id="x_vehicle" value="${esc(e.vehicle || "")}"></label>
      <label class="field"><span>Km rodados</span><input id="x_km" type="number" step="0.1" value="${num(e.km) || ""}"></label>
      <label class="field"><span>Documento / Recibo</span><input id="x_doc" value="${esc(e.doc || "")}"></label>
      <label class="field"><span>Conta de saída (debita do saldo)</span><select id="x_acc">
        <option value="">Não lançar no saldo</option>${accountOptions(e.accountId || defaultAccount())}</select></label>
    </div>
    <label class="field"><span>Observações</span><textarea id="x_notes">${esc(e.notes || "")}</textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const data = {
      category: $("#x_cat").value, date: $("#x_date").value || todayISO(), description: $("#x_desc").value.trim(),
      amount: num($("#x_amount").value), party: $("#x_party").value.trim(), payment: $("#x_pay").value.trim(),
      vehicle: $("#x_vehicle").value.trim(), km: num($("#x_km").value), doc: $("#x_doc").value.trim(),
      notes: $("#x_notes").value.trim(), accountId: $("#x_acc").value, updatedAt: Date.now()
    };
    if (!data.description || !data.amount) return toast("Informe descrição e valor", "err");
    let expId = id;
    if (id) { await update(ref(db, "expenses/" + id), data); await finRemoveByRef("expense", id); }
    else expId = (await push(ref(db, "expenses"), { ...data, createdAt: Date.now(), user: STATE.user.email })).key;
    if (data.accountId) {
      await finAdd({
        date: data.date, kind: "despesa", amount: data.amount, accountId: data.accountId,
        description: data.description, party: data.party, category: data.category,
        refKind: "expense", refId: expId
      });
    }
    closeModal(); toast("Despesa salva", "ok");
  };
}

/* ================= RELATÓRIOS ================= */
function viewRelatorios(root) {
  root.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Filtros do relatório</h3></div>
    <div class="toolbar">
      <select id="rPeriod">
        <option value="day">Diário (hoje)</option>
        <option value="month" selected>Mensal (mês atual)</option>
        <option value="year">Anual (ano atual)</option>
        <option value="custom">Período personalizado</option>
      </select>
      <input type="date" id="rFrom" value="${todayISO().slice(0, 8)}01">
      <input type="date" id="rTo" value="${todayISO()}">
      <button class="btn btn-primary" id="rGo">Gerar relatório</button>
      <button class="btn" id="rCsv">Exportar CSV</button>
      <button class="btn" id="rPrint">Imprimir / PDF</button>
    </div>
  </div>
  <div id="rOut"></div>`;
  const setDates = () => {
    const p = $("#rPeriod").value, t = todayISO();
    if (p === "day") { $("#rFrom").value = t; $("#rTo").value = t; }
    else if (p === "month") { $("#rFrom").value = t.slice(0, 8) + "01"; $("#rTo").value = t; }
    else if (p === "year") { $("#rFrom").value = t.slice(0, 4) + "-01-01"; $("#rTo").value = t; }
  };
  $("#rPeriod").onchange = () => { setDates(); build(); };
  $("#rGo").onclick = build;
  $("#rPrint").onclick = () => window.print();
  $("#rCsv").onclick = exportCsv;

  let cache = [];
  function build() {
    const from = $("#rFrom").value, to = $("#rTo").value;
    const sales = list(STATE.sales).filter(s => inRange(s.date, from, to));
    const exps = list(STATE.expenses).filter(e => inRange(e.date, from, to));
    const buys = list(STATE.entries).filter(e => inRange(e.date, from, to));
    const rev = sales.reduce((s, v) => s + num(v.total), 0);
    const cost = sales.reduce((s, v) => s + num(v.cost), 0);
    const expT = exps.reduce((s, v) => s + num(v.amount), 0);
    const buyT = buys.reduce((s, v) => s + num(v.total), 0);
    cache = sales;

    // ranking de produtos
    const rank = {};
    sales.forEach(s => (s.items || []).forEach(i => {
      rank[i.name] = rank[i.name] || { qty: 0, total: 0, profit: 0 };
      rank[i.name].qty += num(i.qty);
      rank[i.name].total += num(i.price) * num(i.qty);
      rank[i.name].profit += (num(i.price) - num(i.cost)) * num(i.qty);
    }));
    const rk = Object.entries(rank).sort((a, b) => b[1].total - a[1].total);

    // por dia
    const byDay = {};
    sales.forEach(s => byDay[s.date] = (byDay[s.date] || 0) + num(s.total));
    const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    const maxDay = Math.max(1, ...days.map(d => d[1]));

    $("#rOut").innerHTML = `
    <div class="stats">
      ${stat("Faturamento", money(rev), sales.length + " venda(s)")}
      ${stat("Custo das vendas", money(cost))}
      ${stat("Lucro bruto", money(rev - cost))}
      ${stat("Despesas", money(expT))}
      ${stat("Compras de mercadoria", money(buyT))}
      ${stat("Resultado líquido", money(rev - cost - expT))}
    </div>
    <div class="card"><div class="card-head"><h3>Faturamento por dia</h3></div>
      ${days.length ? `<div class="bars">${days.map(([d, v]) =>
        `<div class="bar-row"><span>${fmtDate(d)}</span><div class="bar"><i style="width:${(v / maxDay * 100).toFixed(1)}%"></i></div><span class="right">${money(v)}</span></div>`).join("")}</div>`
        : `<div class="empty">Sem vendas no período.</div>`}</div>
    <div class="card"><div class="card-head"><h3>Produtos e kits mais vendidos</h3></div>
      ${rk.length ? tbl(["Item", "Qtd", "Faturamento", "Lucro (R$ · %)"], rk.map(([n, v]) =>
        `<tr><td>${esc(n)}</td><td>${v.qty}</td><td class="right">${money(v.total)}</td>
        <td class="right">${marginCell(v.profit, v.total > 0 ? v.profit / v.total * 100 : 0, v.total > 0)}</td></tr>`).join(""))
        : `<div class="empty">Sem dados.</div>`}</div>
    <div class="card"><div class="card-head"><h3>Despesas por categoria</h3></div>
      ${exps.length ? tbl(["Categoria", "Lançamentos", "Total"], Object.entries(exps.reduce((m, e) => {
        m[e.category || "Outros"] = m[e.category || "Outros"] || { n: 0, v: 0 };
        m[e.category || "Outros"].n++; m[e.category || "Outros"].v += num(e.amount); return m;
      }, {})).sort((a, b) => b[1].v - a[1].v).map(([c, v]) =>
        `<tr><td>${esc(c)}</td><td>${v.n}</td><td class="right">${money(v.v)}</td></tr>`).join(""))
        : `<div class="empty">Sem despesas no período.</div>`}</div>
    <div class="card"><div class="card-head"><h3>Posição de estoque (atual)</h3></div>
      ${(() => {
        const ps = list(STATE.products).sort((a, b) => num(b.qty) * num(b.avgCost) - num(a.qty) * num(a.avgCost));
        const totCost = ps.reduce((s2, p) => s2 + num(p.qty) * num(p.avgCost), 0);
        const totSale = ps.reduce((s2, p) => s2 + num(p.qty) * (num(p.promo) || num(p.price)), 0);
        return tbl(["Produto", "Qtd", "Custo médio", "Custo total", "Preço venda", "Margem un. (R$ · %)", "Venda total", "Margem total (R$ · %)"],
          ps.map(p => {
            const m = margin(p);
            const c = num(p.qty) * m.cost, v = num(p.qty) * m.price;
            return `<tr><td>${esc(p.name)}</td><td>${num(p.qty)}</td><td class="right">${money(m.cost)}</td>
            <td class="right">${money(c)}</td><td class="right">${money(m.price)}</td>
            <td class="right">${marginCell(m.value, m.pct, m.price > 0, m.markup)}</td>
            <td class="right">${money(v)}</td>
            <td class="right">${marginCell(v - c, v > 0 ? (v - c) / v * 100 : 0, v > 0)}</td></tr>`;
          }).join("") +
          `<tr><td colspan="3"><strong>Total</strong></td><td class="right"><strong>${money(totCost)}</strong></td>
           <td colspan="2"></td><td class="right"><strong>${money(totSale)}</strong></td>
           <td class="right"><strong>${money(totSale - totCost)}${totSale > 0 ? " · " + pct((totSale - totCost) / totSale * 100) : ""}</strong></td></tr>`);
      })()}
    </div>`;
  }
  function exportCsv() {
    const rows = [["Data", "Cliente", "Pagamento", "Itens", "Custo", "Total", "Lucro"]];
    cache.forEach(s => rows.push([s.date, s.customer || "", s.payment || "",
      (s.items || []).map(i => `${num(i.qty)}x ${i.name}`).join(" | "), num(s.cost).toFixed(2), num(s.total).toFixed(2),
      (num(s.total) - num(s.cost)).toFixed(2)]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `relatorio_${$("#rFrom").value}_a_${$("#rTo").value}.csv`; a.click();
  }
  build();
}

/* ================= USUÁRIOS & PERMISSÕES ================= */
function viewUsuarios(root) {
  if (!STATE.isAdmin) { root.innerHTML = `<div class="card"><div class="empty">Apenas o administrador geral (${ADMIN_EMAIL}) pode gerenciar usuários e permissões.</div></div>`; return; }
  const users = list(STATE.users);
  root.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Usuários do sistema</h3><div style="flex:1"></div>
      <button class="btn btn-primary" id="uNew">+ Criar usuário</button></div>
    <p class="muted">Os usuários são autenticados pelo Firebase Authentication. As funções e permissões abaixo são armazenadas no Realtime Database e definem o que cada um pode acessar.</p>
    <div style="margin-top:12px">${users.length ? tbl(["Nome", "E-mail", "Telefone", "Função", "Permissões", "Ações"],
      paged("usrPg", users).map(u => `<tr>
        <td>${esc(((u.firstName || "") + " " + (u.lastName || "")).trim() || "—")}</td>
        <td>${esc(u.email)}</td><td>${esc(u.phone || "—")}</td>
        <td><span class="pill ${u.email === ADMIN_EMAIL ? "ok" : ""}">${esc(u.email === ADMIN_EMAIL ? "admin geral" : (u.role || "colaborador"))}</span></td>
        <td>${PERMS.filter(p => (u.perms || {})[p[0]]).map(p => p[1]).join(", ") || "—"}</td>
        <td>${u.email === ADMIN_EMAIL ? "<span class='muted'>protegido</span>" :
          `<button class="btn btn-sm" data-perm="${u.id}">Permissões</button>
           <button class="btn btn-sm btn-danger" data-del="${u.id}">Remover</button>`}</td></tr>`).join(""))
      : `<div class="empty">Nenhum usuário registrado ainda.</div>`}
    ${users.length ? pagerHTML("usrPg", users.length) : ""}</div>
  </div>`;
  bindPager("usrPg", renderView);
  $("#uNew").onclick = createUserForm;
  $$("[data-perm]", root).forEach(b => b.onclick = () => permsForm(b.dataset.perm));
  $$("[data-del]", root).forEach(b => b.onclick = () => confirmDialog("Remover o perfil e as permissões deste usuário? (A conta de login continua no Firebase Authentication e deve ser excluída pelo console)", async () => {
    await remove(ref(db, "users/" + b.dataset.del)); toast("Perfil removido", "ok");
  }));
}
function createUserForm() {
  openModal("Criar usuário", `
    <p class="muted">O novo usuário será criado no Firebase Authentication. Após a criação, você será redirecionado para o login novamente por segurança do Firebase.</p>
    <div class="grid2">
      <label class="field"><span>Nome</span><input id="u_first"></label>
      <label class="field"><span>Sobrenome</span><input id="u_last"></label>
      <label class="field"><span>E-mail *</span><input id="u_email" type="email"></label>
      <label class="field"><span>Telefone</span><input id="u_phone"></label>
      <label class="field"><span>Senha provisória *</span><input id="u_pass" type="password"></label>
      <label class="field"><span>Função</span><input id="u_role" value="colaborador"></label>
    </div>
    <div class="section-title">Permissões de acesso</div>
    <div class="perm-grid">${PERMS.map(p => `<label class="chk"><input type="checkbox" data-p="${p[0]}" ${p[0] === "dashboard" ? "checked" : ""}> ${p[1]}</label>`).join("")}</div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Criar usuário</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const email = $("#u_email").value.trim(), pass = $("#u_pass").value;
    if (!email || pass.length < 6) return toast("Informe e-mail e senha (mín. 6 caracteres)", "err");
    const perms = {}; $$("[data-p]").forEach(c => perms[c.dataset.p] = c.checked);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: `${$("#u_first").value} ${$("#u_last").value}`.trim() });
      await set(ref(db, "users/" + cred.user.uid), {
        email, firstName: $("#u_first").value.trim(), lastName: $("#u_last").value.trim(),
        phone: $("#u_phone").value.trim(), role: $("#u_role").value.trim() || "colaborador",
        perms, createdAt: Date.now()
      });
      closeModal(); toast("Usuário criado com sucesso", "ok");
    } catch (ex) { toast(fbErr(ex), "err"); }
  };
}
function permsForm(id) {
  const u = STATE.users[id] || {};
  openModal("Permissões — " + (u.email || ""), `
    <div class="grid2">
      <label class="field"><span>Função</span><input id="pf_role" value="${esc(u.role || "colaborador")}"></label>
      <label class="field"><span>Telefone</span><input id="pf_phone" value="${esc(u.phone || "")}"></label>
    </div>
    <div class="section-title">O que este usuário pode acessar</div>
    <div class="perm-grid">${PERMS.map(p => `<label class="chk"><input type="checkbox" data-p="${p[0]}" ${(u.perms || {})[p[0]] ? "checked" : ""}> ${p[1]}</label>`).join("")}</div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar permissões</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const perms = {}; $$("[data-p]").forEach(c => perms[c.dataset.p] = c.checked);
    await update(ref(db, "users/" + id), { perms, role: $("#pf_role").value.trim(), phone: $("#pf_phone").value.trim() });
    closeModal(); toast("Permissões atualizadas", "ok");
  };
}

/* ================= PERFIL ================= */
function viewPerfil(root) {
  const p = STATE.profile || {};
  root.innerHTML = `
  <div class="card" style="max-width:680px">
    <div class="card-head"><h3>Foto de perfil</h3></div>
    <p class="muted">Use um link externo ou envie um arquivo do seu dispositivo (convertido em base64 e salvo no banco de dados).</p>
    <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:12px">
      <div class="logo-box" style="width:112px;height:112px;border-radius:50%">
        ${p.photo ? `<img id="me_prev" src="${p.photo}" style="display:block;width:112px;height:112px;object-fit:cover">`
      : `<div class="logo-fallback" id="me_prevEmpty">sem foto</div><img id="me_prev" style="display:none;width:112px;height:112px;object-fit:cover">`}
      </div>
      <div style="flex:1;min-width:240px">
        <label class="field"><span>Foto por link (URL)</span>
          <input id="me_photoUrl" placeholder="https://..." value="${p.photo && !String(p.photo).startsWith("data:") ? esc(p.photo) : ""}"></label>
        <label class="field" style="margin-top:10px"><span>Foto por arquivo (base64)</span>
          <input id="me_photoFile" type="file" accept="image/*"></label>
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" id="me_photoSave">Salvar foto</button>
          ${p.photo ? `<button class="btn btn-danger" id="me_photoRm">Remover foto</button>` : ""}
        </div>
      </div>
    </div>
  </div>
  <div class="card" style="max-width:680px">
    <div class="card-head"><h3>Meus dados</h3></div>
    <div class="grid2">
      <label class="field"><span>Nome</span><input id="me_first" value="${esc(p.firstName || "")}"></label>
      <label class="field"><span>Sobrenome</span><input id="me_last" value="${esc(p.lastName || "")}"></label>
      <label class="field"><span>Telefone</span><input id="me_phone" value="${esc(p.phone || "")}"></label>
      <label class="field"><span>E-mail (não editável)</span><input value="${esc(p.email || "")}" disabled></label>
    </div>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" id="me_save">Salvar alterações</button>
      <button class="btn" id="me_reset">Redefinir minha senha por e-mail</button>
    </div>
  </div>`;

  const setPreview = src => {
    const img = $("#me_prev"), empty = $("#me_prevEmpty");
    if (img) { img.src = src; img.style.display = src ? "block" : "none"; }
    if (empty) empty.classList.toggle("hidden", !!src);
  };
  $("#me_photoUrl").oninput = () => setPreview($("#me_photoUrl").value.trim());
  $("#me_photoFile").onchange = async () => {
    const f = $("#me_photoFile").files[0]; if (!f) return;
    try { setPreview(await fileToBase64(f, 320)); toast("Imagem carregada. Clique em Salvar foto.", "ok"); }
    catch { toast("Falha ao processar a imagem", "err"); }
  };
  const savePhoto = async photo => {
    await update(ref(db, "users/" + STATE.user.uid), { photo });
    STATE.profile = { ...STATE.profile, photo };
    try { await updateProfile(auth.currentUser, { photoURL: photo && !photo.startsWith("data:") ? photo : "" }); } catch {}
    renderShell();
  };
  $("#me_photoSave").onclick = async () => {
    const url = $("#me_photoUrl").value.trim();
    const f = $("#me_photoFile").files[0];
    let photo = url;
    if (f) { try { photo = await fileToBase64(f, 320); } catch { return toast("Falha ao processar a imagem", "err"); } }
    if (!photo) return toast("Informe um link ou selecione um arquivo", "err");
    await savePhoto(photo); toast("Foto de perfil atualizada", "ok");
  };
  if ($("#me_photoRm")) $("#me_photoRm").onclick = () => confirmDialog("Remover sua foto de perfil?", async () => {
    await savePhoto(""); toast("Foto removida", "ok");
  });

  $("#me_save").onclick = async () => {
    const d = { firstName: $("#me_first").value.trim(), lastName: $("#me_last").value.trim(), phone: $("#me_phone").value.trim() };
    await update(ref(db, "users/" + STATE.user.uid), d);
    STATE.profile = { ...STATE.profile, ...d };
    try { await updateProfile(auth.currentUser, { displayName: `${d.firstName} ${d.lastName}`.trim() }); } catch {}
    renderShell(); toast("Perfil atualizado", "ok");
  };
  $("#me_reset").onclick = async () => {
    try { await sendPasswordResetEmail(auth, p.email); toast("Link de redefinição enviado para seu e-mail", "ok"); }
    catch (e) { toast(fbErr(e), "err"); }
  };
}

/* ================= CONFIGURAÇÕES ================= */
function viewConfig(root) {
  const st = STATE.settings || {};
  root.innerHTML = `
  <div class="card" style="max-width:760px">
    <div class="card-head"><h3>Identidade da empresa</h3></div>
    <div class="grid2">
      <label class="field"><span>Nome da empresa</span><input id="c_name" value="${esc(st.companyName || "")}"></label>
      <label class="field"><span>CNPJ</span><input id="c_cnpj" value="${esc(st.cnpj || "")}"></label>
      <label class="field"><span>Telefone</span><input id="c_phone" value="${esc(st.phone || "")}"></label>
      <label class="field"><span>Endereço</span><input id="c_addr" value="${esc(st.address || "")}"></label>
      <label class="field"><span>Logo por link externo (128×128)</span><input id="c_logoUrl" placeholder="https://..." value="${st.logo && !String(st.logo).startsWith("data:") ? esc(st.logo) : ""}"></label>
      <label class="field"><span>Logo por arquivo (base64 no Realtime Database)</span><input id="c_logoFile" type="file" accept="image/*"></label>
    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:14px">
      <div class="logo-box" style="width:96px;height:96px">${st.logo ? `<img src="${st.logo}" style="display:block;width:96px;height:96px;object-fit:contain">` : `<div class="logo-fallback">sem logo</div>`}</div>
      <button class="btn btn-primary" id="c_save">Salvar configurações</button>
      ${st.logo ? `<button class="btn btn-danger" id="c_rmlogo">Remover logo</button>` : ""}
    </div>
  </div>
  <div class="card" style="max-width:760px">
    <div class="card-head"><h3>Interface</h3></div>
    <div class="grid2">
      <label class="field"><span>Tema</span><select id="c_theme">
        <option value="dark" ${html.getAttribute("data-theme") === "dark" ? "selected" : ""}>Escuro (padrão)</option>
        <option value="light" ${html.getAttribute("data-theme") === "light" ? "selected" : ""}>Claro</option></select></label>
      <label class="field"><span>Densidade das tabelas</span><select id="c_density">
        <option value="normal" ${html.getAttribute("data-density") === "normal" ? "selected" : ""}>Confortável</option>
        <option value="compact" ${html.getAttribute("data-density") === "compact" ? "selected" : ""}>Compacta</option></select></label>
    </div>
  </div>
  <div class="card" style="max-width:760px">
    <div class="card-head"><h3>Dados</h3></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" id="c_export">Exportar backup (JSON)</button>
    </div>
  </div>`;
  $("#c_theme").onchange = e => applyTheme(e.target.value);
  $("#c_density").onchange = e => applyDensity(e.target.value);
  $("#c_save").onclick = async () => {
    let logo = $("#c_logoUrl").value.trim() || (st.logo && String(st.logo).startsWith("data:") ? st.logo : "");
    const f = $("#c_logoFile").files[0];
    if (f) logo = await fileToBase64(f, 256);
    await update(ref(db, "settings"), {
      companyName: $("#c_name").value.trim(), cnpj: $("#c_cnpj").value.trim(),
      phone: $("#c_phone").value.trim(), address: $("#c_addr").value.trim(), logo
    });
    toast("Configurações salvas", "ok");
  };
  if ($("#c_rmlogo")) $("#c_rmlogo").onclick = async () => { await update(ref(db, "settings"), { logo: "" }); toast("Logo removida", "ok"); };
  $("#c_export").onclick = () => {
    const data = { products: STATE.products, kits: STATE.kits, entries: STATE.entries, sales: STATE.sales,
      payables: STATE.payables, receivables: STATE.receivables, expenses: STATE.expenses,
      accounts: STATE.accounts, fin: STATE.fin, settings: STATE.settings };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `backup_${todayISO()}.json`; a.click();
  };
}

/* ==========================================================================
   MENSAGENS — E-mail interno + Chat online (Firebase Auth + Realtime Database)
   Estrutura no Realtime Database:
     presence/{uid}          -> { online, name, email, at, lastSeen }
     mail/{uid}/{box}/{id}   -> { from, fromName, to[], toNames, subject, body, at, read, starred }
                                box = inbox | sent | drafts | trash
     chats/{chatId}          -> { type: direct|group, name, members:{uid:true}, createdBy, createdAt, lastAt, lastText }
     chatMessages/{chatId}/{msgId} -> { uid, name, text, at, deleted, deletedBy }
     users/{uid}.chatRole    -> "moderador" | "membro"   (gerenciado pelo admin)
     users/{uid}.chatMuted / .chatBanned -> boolean
   ========================================================================== */
const MSG = { tab: "mail", box: "inbox", chatId: null, _mounted: null, mail: {}, chats: {}, presence: {}, msgs: {}, unsubs: [], msgUnsub: null };

function msgClear() {
  MSG.unsubs.forEach(u => { try { u(); } catch (e) {} });
  MSG.unsubs = [];
  if (MSG.msgUnsub) { try { MSG.msgUnsub(); } catch (e) {} MSG.msgUnsub = null; }
  MSG.mail = {}; MSG.chats = {}; MSG.presence = {}; MSG.msgs = {}; MSG.chatId = null; MSG._mounted = null;
}

function myName(u = STATE.profile, email = STATE.user?.email) {
  return (((u?.firstName || "") + " " + (u?.lastName || "")).trim()) || email || "Usuário";
}
function userName(uid) {
  const u = STATE.users[uid];
  if (!u) return MSG.presence[uid]?.name || "Usuário";
  return (((u.firstName || "") + " " + (u.lastName || "")).trim()) || u.email || "Usuário";
}
function isOnline(uid) { return !!MSG.presence[uid]?.online; }
function isChatMod() { return STATE.isAdmin || (STATE.profile?.chatRole === "moderador"); }
function canChat() { return !(STATE.profile?.chatBanned); }
function fmtWhen(ts) {
  if (!ts) return "—";
  const d = new Date(ts), t = new Date();
  const sameDay = d.toDateString() === t.toDateString();
  return sameDay ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function mailUnread() {
  return Object.values(MSG.mail.inbox || {}).filter(m => !m.read).length;
}
function chatUnread() {
  const uid = STATE.user?.uid;
  return list(MSG.chats).filter(c => (c.members || {})[uid])
    .filter(c => c.lastAt && c.lastAt > (STATE.profile?.chatSeen?.[c.id] || 0) && c.lastBy !== uid).length;
}
function refreshMsgBadge() {
  const b = document.querySelector('#nav .nav-item[data-view="mensagens"] .badge');
  const n = mailUnread() + chatUnread();
  if (b) { b.textContent = n > 99 ? "99+" : String(n); b.classList.toggle("hidden", !n); }
}

/* ---------- presença online ---------- */
function startMessaging() {
  const user = STATE.user; if (!user) return;
  msgClear();
  const meRef = ref(db, "presence/" + user.uid);
  const info = { name: myName(), email: user.email };
  const un = onValue(ref(db, ".info/connected"), snap => {
    if (snap.val() === false) return;
    onDisconnect(meRef).set({ ...info, online: false, lastSeen: Date.now() })
      .then(() => set(meRef, { ...info, online: true, at: Date.now() }))
      .catch(e => console.warn("presença", e));
  });
  MSG.unsubs.push(un);
  window.addEventListener("beforeunload", () => { try { set(meRef, { ...info, online: false, lastSeen: Date.now() }); } catch (e) {} });

  const bind = (path, key) => {
    const u = onValue(ref(db, path), s => {
      MSG[key] = s.val() || {};
      refreshMsgBadge();
      const modalOpen = !document.getElementById("modalBackdrop")?.classList.contains("hidden");
      // não re-renderiza enquanto um formulário/modal está aberto (evita perder o que foi digitado)
      if (STATE.view === "mensagens" && !modalOpen) renderMensagensBody();
    }, err => console.warn("Sem permissão para ler /" + path, err));
    MSG.unsubs.push(u);
  };
  bind("mail/" + user.uid, "mail");
  bind("chats", "chats");
  bind("presence", "presence");
}
async function stopMessaging() {
  const uid = STATE.user?.uid;
  if (uid) { try { await set(ref(db, "presence/" + uid), { name: myName(), email: STATE.user.email, online: false, lastSeen: Date.now() }); } catch (e) {} }
  msgClear();
}

/* ================= VIEW PRINCIPAL ================= */
function viewMensagens(root) {
  root.innerHTML = `
    <div class="tabs">
      <button class="tab" data-mt="mail">✉ Caixa de e-mail</button>
      <button class="tab" data-mt="chat">💬 Chat online</button>
      ${isChatMod() ? `<button class="tab" data-mt="admin">🛡 Moderação & usuários</button>` : ""}
    </div>
    <div id="msgBody"></div>`;
  $$(".tab", root).forEach(b => b.onclick = () => { MSG.tab = b.dataset.mt; renderMensagensBody(); });
  renderMensagensBody();
}
function renderMensagensBody() {
  const el = $("#msgBody"); if (!el) return;
  if (MSG.tab === "admin" && !isChatMod()) MSG.tab = "mail";
  $$("#content .tab").forEach(b => b.classList.toggle("active", b.dataset.mt === MSG.tab));
  if (MSG.tab === "mail") mailView(el);
  else if (MSG.tab === "chat") chatView(el);
  else chatAdminView(el);
}

/* ================= E-MAIL INTERNO ================= */
const MAIL_BOXES = [["inbox", "Caixa de entrada", "📥"], ["sent", "Enviados", "📤"],
["drafts", "Rascunhos", "📝"], ["starred", "Favoritos", "★"], ["trash", "Lixeira", "🗑"]];

function mailList(box) {
  if (box === "starred") {
    return [...list(MSG.mail.inbox || {}).map(m => ({ ...m, _box: "inbox" })),
    ...list(MSG.mail.sent || {}).map(m => ({ ...m, _box: "sent" }))].filter(m => m.starred);
  }
  return list(MSG.mail[box] || {}).map(m => ({ ...m, _box: box }));
}
function mailView(el) {
  const box = MSG.box;
  const rows = mailList(box).sort((a, b) => (b.at || 0) - (a.at || 0));
  el.innerHTML = `
  <div class="msg-layout">
    <aside class="card msg-side">
      <button class="btn btn-primary btn-block" id="mailNew">✎ Escrever e-mail</button>
      <div class="msg-folders">
        ${MAIL_BOXES.map(([k, l, ic]) => {
          const n = k === "inbox" ? mailUnread() : mailList(k).length;
          return `<button class="msg-folder ${k === box ? "active" : ""}" data-box="${k}">
            <span>${ic} ${l}</span>${n ? `<span class="pill">${n}</span>` : ""}</button>`;
        }).join("")}
      </div>
      <p class="muted" style="margin-top:10px">Mensagens internas entre os usuários do sistema, salvas no Realtime Database.</p>
    </aside>
    <section class="card msg-main">
      <div class="card-head"><h3>${MAIL_BOXES.find(b => b[0] === box)[1]}</h3><div style="flex:1"></div>
        <div class="toolbar"><input id="mailQ" placeholder="Buscar assunto, remetente ou texto" style="min-width:220px"></div>
      </div>
      <div id="mailRows" style="margin-top:12px"></div>
    </section>
  </div>`;
  $$("[data-box]", el).forEach(b => b.onclick = () => { MSG.box = b.dataset.box; renderMensagensBody(); });
  $("#mailNew").onclick = () => mailCompose();

  const draw = () => {
    const q = ($("#mailQ").value || "").toLowerCase();
    const data = rows.filter(m => !q || [m.subject, m.body, m.fromName, m.toNames].some(v => (v || "").toLowerCase().includes(q)));
    $("#mailRows").innerHTML = data.length ? `<div class="mail-list">${paged("mailPg", data).map(m => `
      <div class="mail-row ${m.read || box === "sent" || box === "drafts" ? "" : "unread"}" data-open="${m._box}:${m.id}">
        <button class="star ${m.starred ? "on" : ""}" data-star="${m._box}:${m.id}" title="Favoritar">★</button>
        <div class="mail-who">${esc(box === "sent" || box === "drafts" ? "Para: " + (m.toNames || "—") : (m.fromName || "—"))}</div>
        <div class="mail-sub"><strong>${esc(m.subject || "(sem assunto)")}</strong>
          <span class="muted"> — ${esc((m.body || "").slice(0, 80))}</span></div>
        <div class="mail-date muted">${fmtWhen(m.at)}</div>
        <button class="btn btn-sm btn-danger" data-mdel="${m._box}:${m.id}">${box === "trash" ? "Excluir" : "Lixeira"}</button>
      </div>`).join("")}</div>` + pagerHTML("mailPg", data.length)
      : `<div class="empty">Nenhuma mensagem nesta pasta.</div>`;

    $$("[data-open]", el).forEach(r => r.onclick = ev => {
      if (ev.target.closest("button")) return;
      const [b, id] = r.dataset.open.split(":"); mailOpen(b, id);
    });
    $$("[data-star]", el).forEach(b => b.onclick = async () => {
      const [bx, id] = b.dataset.star.split(":");
      const m = (MSG.mail[bx] || {})[id] || {};
      await update(ref(db, `mail/${STATE.user.uid}/${bx}/${id}`), { starred: !m.starred });
    });
    $$("[data-mdel]", el).forEach(b => b.onclick = async () => {
      const [bx, id] = b.dataset.mdel.split(":");
      const m = (MSG.mail[bx] || {})[id]; if (!m) return;
      if (bx === "trash") { await remove(ref(db, `mail/${STATE.user.uid}/trash/${id}`)); return toast("Mensagem excluída", "ok"); }
      await set(ref(db, `mail/${STATE.user.uid}/trash/${id}`), { ...m, fromBox: bx });
      await remove(ref(db, `mail/${STATE.user.uid}/${bx}/${id}`));
      toast("Movida para a lixeira", "ok");
    });
    bindPager("mailPg", draw);
  };
  $("#mailQ").oninput = draw;
  draw();
}

function mailUserOptions(selected = []) {
  return list(STATE.users).filter(u => u.id !== STATE.user.uid)
    .map(u => `<option value="${u.id}" ${selected.includes(u.id) ? "selected" : ""}>${esc(userName(u.id))} — ${esc(u.email)}${isOnline(u.id) ? " ● online" : ""}</option>`).join("");
}
function mailCompose(draft = {}) {
  openModal(draft.id ? "Editar rascunho" : "Novo e-mail", `
    <label class="field"><span>Destinatários (segure Ctrl para escolher vários) *</span>
      <select id="ml_to" multiple size="6">${mailUserOptions(draft.to || [])}</select></label>
    <label class="field" style="margin-top:10px"><span>Assunto</span><input id="ml_sub" value="${esc(draft.subject || "")}"></label>
    <label class="field" style="margin-top:10px"><span>Mensagem</span><textarea id="ml_body" rows="8">${esc(draft.body || "")}</textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button>
      <button class="btn" id="mlDraft">Salvar rascunho</button>
      <button class="btn btn-primary" id="mlSend">Enviar</button>`);
  $("#mCancel").onclick = closeModal;
  const collect = () => {
    const to = Array.from($("#ml_to").selectedOptions).map(o => o.value);
    return {
      to, toNames: to.map(userName).join(", "),
      subject: $("#ml_sub").value.trim(), body: $("#ml_body").value,
      from: STATE.user.uid, fromName: myName(), fromEmail: STATE.user.email, at: Date.now()
    };
  };
  $("#mlDraft").onclick = async () => {
    const m = collect();
    if (draft.id) await set(ref(db, `mail/${STATE.user.uid}/drafts/${draft.id}`), m);
    else await push(ref(db, `mail/${STATE.user.uid}/drafts`), m);
    closeModal(); toast("Rascunho salvo", "ok");
  };
  $("#mlSend").onclick = async () => {
    const m = collect();
    if (!m.to.length) return toast("Escolha ao menos um destinatário", "err");
    try {
      for (const uid of m.to) await push(ref(db, `mail/${uid}/inbox`), { ...m, read: false });
      await push(ref(db, `mail/${STATE.user.uid}/sent`), { ...m, read: true });
      if (draft.id) await remove(ref(db, `mail/${STATE.user.uid}/drafts/${draft.id}`));
      closeModal(); toast("E-mail enviado", "ok");
    } catch (e) { toast("Falha ao enviar: " + (e?.message || e), "err"); }
  };
}
async function mailOpen(box, id) {
  const m = (MSG.mail[box] || {})[id]; if (!m) return;
  if (box === "drafts") return mailCompose({ id, ...m });
  if (box === "inbox" && !m.read) await update(ref(db, `mail/${STATE.user.uid}/inbox/${id}`), { read: true });
  openModal(m.subject || "(sem assunto)", `
    <div class="muted">De: <strong>${esc(m.fromName || "—")}</strong> ${esc(m.fromEmail || "")}<br>
      Para: ${esc(m.toNames || "—")}<br>${fmtWhen(m.at)}</div>
    <div class="card" style="margin-top:12px;background:var(--panel-2);white-space:pre-wrap">${esc(m.body || "")}</div>
  `, `<button class="btn" id="mCancel">Fechar</button>
      <button class="btn" id="mlChat">Abrir chat com o remetente</button>
      <button class="btn btn-primary" id="mlReply">Responder</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mlChat").onclick = () => { closeModal(); openDirectChat(m.from); };
  $("#mlReply").onclick = () => mailCompose({
    to: [m.from], subject: (m.subject || "").startsWith("Re:") ? m.subject : "Re: " + (m.subject || ""),
    body: `\n\n--- Em ${fmtWhen(m.at)}, ${m.fromName} escreveu ---\n${m.body || ""}`
  });
}

/* ================= CHAT ONLINE ================= */
function myChats() {
  const uid = STATE.user.uid;
  return list(MSG.chats).filter(c => (c.members || {})[uid]).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
}
function chatTitle(c) {
  if (c.type === "group") return c.name || "Grupo";
  const other = Object.keys(c.members || {}).find(u => u !== STATE.user.uid);
  return userName(other);
}
function chatView(el) {
  const chats = myChats();
  if (MSG.chatId && !chats.some(c => c.id === MSG.chatId)) { MSG.chatId = null; MSG._mounted = null; }
  if (!el.querySelector("#chatLayout")) {
    el.innerHTML = `
    <div class="msg-layout chat-layout" id="chatLayout">
      <aside class="card msg-side" id="chatSide"></aside>
      <section class="card msg-main" id="chatPane"></section>
    </div>`;
    MSG._mounted = null;
  }
  const layout = el.querySelector("#chatLayout");
  if (layout) layout.classList.toggle("chat-open", !!MSG.chatId);
  renderChatSide();
  if (MSG.chatId) {
    if (MSG._mounted !== MSG.chatId) openChat(MSG.chatId);
    else refreshChatHeader(MSG.chatId);
  } else {
    if (MSG.msgUnsub) { try { MSG.msgUnsub(); } catch (e) {} MSG.msgUnsub = null; }
    MSG._mounted = null;
    const pane = $("#chatPane");
    if (pane) pane.innerHTML = `<div class="empty">Escolha uma conversa ou inicie uma nova.</div>`;
  }
}

function renderChatSide() {
  const side = $("#chatSide"); if (!side) return;
  const chats = myChats();
  const online = list(STATE.users).filter(u => u.id !== STATE.user.uid && isOnline(u.id));
  const others = list(STATE.users).filter(u => u.id !== STATE.user.uid && !isOnline(u.id));
  side.innerHTML = `
    <div class="toolbar" style="gap:6px">
      <button class="btn btn-primary" id="chNewDirect" style="flex:1">+ Conversa</button>
      <button class="btn" id="chNewGroup" style="flex:1">+ Grupo</button>
    </div>
    <div class="section-title">Conversas</div>
    <div class="msg-folders">${chats.length ? chats.map(c => `
      <button class="msg-folder ${c.id === MSG.chatId ? "active" : ""}" data-chat="${c.id}">
        <span>${c.type === "group" ? "👥" : `<span class="dot ${isOnline(Object.keys(c.members || {}).find(u => u !== STATE.user.uid)) ? "on" : ""}"></span>`}
          ${esc(chatTitle(c))}</span>
        <small class="muted">${fmtWhen(c.lastAt)}</small>
      </button>`).join("") : `<div class="empty">Nenhuma conversa ainda.</div>`}</div>
    <div class="section-title">Quem está online (${online.length})</div>
    <div class="msg-folders">${online.length ? online.map(u => `
      <button class="msg-folder" data-dm="${u.id}"><span><span class="dot on"></span>${esc(userName(u.id))}</span>
      ${u.chatRole === "moderador" ? `<span class="pill">mod</span>` : ""}</button>`).join("")
      : `<div class="empty">Ninguém online no momento.</div>`}</div>
    <div class="section-title">Outros usuários</div>
    <div class="msg-folders">${others.length ? others.map(u => `
      <button class="msg-folder" data-dm="${u.id}"><span><span class="dot"></span>${esc(userName(u.id))}</span></button>`).join("")
      : `<div class="empty">Nenhum outro usuário cadastrado.</div>`}</div>`;
  $$("[data-chat]", side).forEach(b => b.onclick = () => selectChat(b.dataset.chat));
  $$("[data-dm]", side).forEach(b => b.onclick = () => openDirectChat(b.dataset.dm));
  $("#chNewDirect").onclick = () => newDirectForm();
  $("#chNewGroup").onclick = () => newGroupForm();
}

function selectChat(chatId) {
  if (MSG.chatId === chatId && MSG._mounted === chatId) return;
  MSG.chatId = chatId;
  renderMensagensBody();
}

function refreshChatHeader(chatId) {
  const c = MSG.chats[chatId]; const info = $("#chatInfo");
  if (!c || !info) return;
  const members = Object.keys(c.members || {});
  info.textContent = c.type === "group"
    ? members.length + " participante(s) · " + members.filter(isOnline).length + " online"
    : (isOnline(members.find(u => u !== STATE.user.uid)) ? "online agora" : "offline");
}

function newDirectForm() {
  openModal("Nova conversa", `<label class="field"><span>Usuário</span>
    <select id="nd_user">${mailUserOptions()}</select></label>`,
    `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Abrir conversa</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = () => { const u = $("#nd_user").value; closeModal(); openDirectChat(u); };
}
async function openDirectChat(otherUid) {
  if (!otherUid) return;
  const uid = STATE.user.uid;
  const found = list(MSG.chats).find(c => c.type === "direct" && (c.members || {})[uid] && (c.members || {})[otherUid]);
  let id = found?.id;
  if (!id) {
    const r = await push(ref(db, "chats"), {
      type: "direct", members: { [uid]: true, [otherUid]: true },
      createdBy: uid, createdAt: Date.now(), lastAt: Date.now(), lastText: ""
    });
    id = r.key;
  }
  MSG.tab = "chat"; MSG.chatId = id; MSG._mounted = null;
  if (STATE.view !== "mensagens") { STATE.view = "mensagens"; renderView(); } else renderMensagensBody();
}
function newGroupForm() {
  openModal("Novo grupo", `
    <label class="field"><span>Nome do grupo *</span><input id="ng_name" placeholder="Ex.: Equipe de vendas"></label>
    <label class="field" style="margin-top:10px"><span>Participantes (Ctrl para vários)</span>
      <select id="ng_users" multiple size="7">${mailUserOptions()}</select></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Criar grupo</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const name = $("#ng_name").value.trim();
    if (!name) return toast("Informe o nome do grupo", "err");
    const members = { [STATE.user.uid]: true };
    Array.from($("#ng_users").selectedOptions).forEach(o => members[o.value] = true);
    const r = await push(ref(db, "chats"), {
      type: "group", name, members, createdBy: STATE.user.uid,
      createdAt: Date.now(), lastAt: Date.now(), lastText: ""
    });
    MSG.tab = "chat"; MSG.chatId = r.key; MSG._mounted = null; closeModal(); toast("Grupo criado", "ok"); renderMensagensBody();
  };
}
function openChat(chatId) {
  const c = MSG.chats[chatId]; const pane = $("#chatPane");
  if (!c || !pane) return;
  MSG._mounted = chatId;
  MSG.msgs = {};
  const canSend = canChat() && !STATE.profile?.chatMuted;
  pane.innerHTML = `
    <div class="card-head chat-head">
      <button class="btn btn-sm chat-back" id="chBack">←</button>
      <h3>${esc(chatTitle({ ...c, id: chatId }))}</h3>
      <div style="flex:1"></div>
      <div class="toolbar">
        <span class="muted" id="chatInfo"></span>
        ${c.type === "group" ? `<button class="btn btn-sm" id="chMembers">Participantes</button>` : ""}
        ${(c.createdBy === STATE.user.uid || isChatMod()) ? `<button class="btn btn-sm btn-danger" id="chDel">Excluir</button>` : ""}
      </div>
    </div>
    <div class="chat-box" id="chatBox"><div class="empty">Carregando mensagens...</div></div>
    <form class="chat-send" id="chatForm">
      <input id="chatInput" placeholder="${canSend ? "Escreva sua mensagem..." : "Você está sem permissão para enviar mensagens"}"
        ${canSend ? "" : "disabled"} autocomplete="off" enterkeyhint="send">
      <button class="btn btn-primary" type="submit" ${canSend ? "" : "disabled"}>Enviar</button>
    </form>`;

  refreshChatHeader(chatId);
  $("#chBack").onclick = () => { MSG.chatId = null; MSG._mounted = null; renderMensagensBody(); };
  if ($("#chMembers")) $("#chMembers").onclick = () => groupMembersForm(chatId);
  if ($("#chDel")) $("#chDel").onclick = () => confirmDialog("Excluir a conversa e todas as mensagens?", async () => {
    try {
      await remove(ref(db, "chatMessages/" + chatId));
      await remove(ref(db, "chats/" + chatId));
      MSG.chatId = null; MSG._mounted = null; toast("Conversa excluída", "ok"); renderMensagensBody();
    } catch (e) { toast("Não foi possível excluir: " + e.message, "err"); }
  });

  if (MSG.msgUnsub) { try { MSG.msgUnsub(); } catch (e) {} MSG.msgUnsub = null; }
  let got = false;
  const q = query(ref(db, "chatMessages/" + chatId), limitToLast(300));
  MSG.msgUnsub = onValue(q, snap => {
    got = true;
    if (MSG._mounted !== chatId) return;
    MSG.msgs = snap.val() || {};
    drawChatMessages(chatId);
    refreshMsgBadge();
    update(ref(db, "users/" + STATE.user.uid + "/chatSeen"), { [chatId]: Date.now() }).catch(() => {});
  }, err => {
    got = true;
    const b = $("#chatBox");
    if (b) b.innerHTML = `<div class="empty">Não foi possível carregar as mensagens: ${esc(err.message)}<br>
      Verifique se as regras do Realtime Database foram publicadas.</div>`;
  });
  setTimeout(() => {
    if (got || MSG._mounted !== chatId) return;
    const b = $("#chatBox");
    if (b) b.innerHTML = `<div class="empty">Sem resposta do servidor. Verifique sua conexão com a internet
      e se as regras do Realtime Database foram publicadas no Firebase.</div>`;
  }, 8000);

  const input = $("#chatInput");
  const form = $("#chatForm");
  form.onsubmit = async ev => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    input.value = "";
    input.focus(); // mantém o teclado aberto no celular
    try {
      await push(ref(db, "chatMessages/" + chatId), {
        uid: STATE.user.uid, name: myName(), text, at: Date.now()
      });
      await update(ref(db, "chats/" + chatId), { lastAt: Date.now(), lastText: text.slice(0, 60), lastBy: STATE.user.uid });
    } catch (e) {
      input.value = text;
      toast("Não foi possível enviar: " + e.message, "err");
    }
  };
  if (input) {
    input.addEventListener("focus", () => setTimeout(() => {
      const box = $("#chatBox"); if (box) box.scrollTop = box.scrollHeight;
      form.scrollIntoView({ block: "nearest" });
    }, 250));
    if (!("ontouchstart" in window)) input.focus();
  }
}

function drawChatMessages(chatId) {
  const box = $("#chatBox"); if (!box) return;
  const msgs = list(MSG.msgs).sort((a, b) => (a.at || 0) - (b.at || 0));
  box.innerHTML = msgs.length ? msgs.map(m => {
    const mine = m.uid === STATE.user.uid;
    const canDel = !m.deleted && (mine || isChatMod());
    return `<div class="chat-msg ${mine ? "mine" : ""}">
      <div class="bubble">
        ${mine ? "" : `<div class="chat-author">${esc(m.name || userName(m.uid))}${isOnline(m.uid) ? ` <span class="dot on"></span>` : ""}</div>`}
        <div class="chat-text">${m.deleted ? `<em class="muted">mensagem removida${m.deletedBy ? " por " + esc(m.deletedBy) : ""}</em>` : esc(m.text || "")}</div>
        <div class="chat-time muted">${fmtWhen(m.at)}${canDel ? ` · <button class="link-btn" data-msgdel="${m.id}">apagar</button>` : ""}</div>
      </div></div>`;
  }).join("") : `<div class="empty">Nenhuma mensagem ainda. Diga olá!</div>`;
  box.scrollTop = box.scrollHeight;
  $$("[data-msgdel]", box).forEach(b => b.onclick = async () => {
    await update(ref(db, `chatMessages/${chatId}/${b.dataset.msgdel}`), {
      deleted: true, text: "", deletedBy: myName()
    });
  });
}
function groupMembersForm(chatId) {
  const c = MSG.chats[chatId] || {};
  const members = Object.keys(c.members || {});
  const canManage = c.createdBy === STATE.user.uid || isChatMod();
  openModal("Participantes — " + (c.name || "Grupo"), `
    <div class="msg-folders">${members.map(uid => `
      <div class="msg-folder"><span><span class="dot ${isOnline(uid) ? "on" : ""}"></span>${esc(userName(uid))}
        ${STATE.users[uid]?.chatRole === "moderador" ? `<span class="pill">mod</span>` : ""}</span>
        ${canManage && uid !== c.createdBy ? `<button class="btn btn-sm btn-danger" data-rmv="${uid}">Remover</button>` : ""}</div>`).join("")}</div>
    ${canManage ? `<label class="field" style="margin-top:12px"><span>Adicionar participantes</span>
      <select id="gm_add" multiple size="5">${list(STATE.users).filter(u => !members.includes(u.id))
        .map(u => `<option value="${u.id}">${esc(userName(u.id))}</option>`).join("")}</select></label>` : ""}
  `, `<button class="btn" id="mCancel">Fechar</button>${canManage ? `<button class="btn btn-primary" id="mSave">Adicionar</button>` : ""}`);
  $("#mCancel").onclick = closeModal;
  $$("[data-rmv]").forEach(b => b.onclick = async () => {
    await remove(ref(db, `chats/${chatId}/members/${b.dataset.rmv}`));
    toast("Participante removido", "ok"); closeModal(); renderMensagensBody();
  });
  if ($("#mSave")) $("#mSave").onclick = async () => {
    const add = {};
    Array.from($("#gm_add").selectedOptions).forEach(o => add[o.value] = true);
    if (!Object.keys(add).length) return closeModal();
    await update(ref(db, `chats/${chatId}/members`), add);
    closeModal(); toast("Participantes adicionados", "ok"); renderMensagensBody();
  };
}

/* ================= MODERAÇÃO / GESTÃO DE USUÁRIOS DO CHAT ================= */
function chatAdminView(el) {
  const users = list(STATE.users);
  el.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Usuários do chat e moderação</h3><div style="flex:1"></div>
      <span class="muted">${users.filter(u => isOnline(u.id)).length} online de ${users.length}</span></div>
    <p class="muted">O administrador pode conceder o cargo de <strong>moderador de chat</strong> (pode apagar mensagens de qualquer usuário e gerenciar grupos),
      silenciar ou bloquear o acesso de um usuário ao chat.</p>
    <div style="margin-top:12px">${users.length ? tbl(["Usuário", "E-mail", "Situação", "Cargo no chat", "Ações"],
      users.map(u => `<tr>
        <td><span class="dot ${isOnline(u.id) ? "on" : ""}"></span> ${esc(userName(u.id))}</td>
        <td>${esc(u.email || "—")}</td>
        <td>${isOnline(u.id) ? `<span class="pill ok">online</span>`
          : `<span class="pill">offline${MSG.presence[u.id]?.lastSeen ? " · " + fmtWhen(MSG.presence[u.id].lastSeen) : ""}</span>`}
          ${u.chatMuted ? ` <span class="pill warn">silenciado</span>` : ""}${u.chatBanned ? ` <span class="pill dan">bloqueado</span>` : ""}</td>
        <td>${u.email === ADMIN_EMAIL ? `<span class="pill ok">admin geral</span>`
          : `<span class="pill ${u.chatRole === "moderador" ? "ok" : ""}">${esc(u.chatRole || "membro")}</span>`}</td>
        <td>${u.id === STATE.user.uid || u.email === ADMIN_EMAIL ? `<span class="muted">—</span>` : `
          ${STATE.isAdmin ? `<button class="btn btn-sm" data-role="${u.id}">${u.chatRole === "moderador" ? "Remover moderação" : "Tornar moderador"}</button>` : ""}
          <button class="btn btn-sm" data-mute="${u.id}">${u.chatMuted ? "Reativar fala" : "Silenciar"}</button>
          ${STATE.isAdmin ? `<button class="btn btn-sm btn-danger" data-ban="${u.id}">${u.chatBanned ? "Desbloquear" : "Bloquear chat"}</button>` : ""}
          <button class="btn btn-sm btn-ok" data-open="${u.id}">Conversar</button>`}</td></tr>`).join(""))
      : `<div class="empty">Nenhum usuário cadastrado.</div>`}</div>
  </div>`;
  $$("[data-role]", el).forEach(b => b.onclick = async () => {
    const u = STATE.users[b.dataset.role] || {};
    await update(ref(db, "users/" + b.dataset.role), { chatRole: u.chatRole === "moderador" ? "membro" : "moderador" });
    toast("Cargo de chat atualizado", "ok");
  });
  $$("[data-mute]", el).forEach(b => b.onclick = async () => {
    const u = STATE.users[b.dataset.mute] || {};
    await update(ref(db, "users/" + b.dataset.mute), { chatMuted: !u.chatMuted });
    toast(!u.chatMuted ? "Usuário silenciado no chat" : "Usuário reativado", "ok");
  });
  $$("[data-ban]", el).forEach(b => b.onclick = async () => {
    const u = STATE.users[b.dataset.ban] || {};
    await update(ref(db, "users/" + b.dataset.ban), { chatBanned: !u.chatBanned });
    toast(!u.chatBanned ? "Acesso ao chat bloqueado" : "Acesso ao chat liberado", "ok");
  });
  $$("[data-open]", el).forEach(b => b.onclick = () => openDirectChat(b.dataset.open));
}
