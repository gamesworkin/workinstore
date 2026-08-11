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
  getDatabase, ref, set, get, push, update, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ------------------------------------------------------------------
   1) CONFIGURAÇÃO DO FIREBASE  —  SUBSTITUA PELOS SEUS DADOS
   Console Firebase > Configurações do projeto > Seus apps (Web)
   Ative: Authentication (E-mail/senha) e Realtime Database.
------------------------------------------------------------------ */
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx"
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
  view: "dashboard", unsubs: []
};

const PERMS = [
  ["dashboard", "Dashboard"], ["produtos", "Cadastro de Itens"], ["kits", "Kits"],
  ["estoque", "Estoque / Compras"], ["vendas", "Vendas"], ["financeiro", "Financeiro"],
  ["despesas", "Despesas Gerais"], ["relatorios", "Relatórios"],
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
  renderShell();
});

function can(p) { return STATE.isAdmin || p === "perfil" || p === "dashboard" ? true : !!STATE.perms[p]; }

/* ================= Bindings do Realtime Database ================= */
function bindNode(path, key, cb) {
  const un = onValue(ref(db, path), s => { STATE[key] = s.val() || {}; cb && cb(); });
  STATE.unsubs.push(un);
}
function bindData() {
  const rerender = () => { if (STATE.ready) renderView(); };
  ["products", "kits", "entries", "sales", "payables", "receivables", "expenses", "users", "settings"]
    .forEach(k => bindNode(k, k, rerender));
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
  $("#avatarInitials").textContent = ((p.firstName || p.email || "?")[0] + (p.lastName || "")[0] || "").toUpperCase();
  $$("#nav .nav-item").forEach(b => {
    b.classList.toggle("hidden", !can(b.dataset.perm));
    b.onclick = () => { STATE.view = b.dataset.view; $("#sidebar").classList.remove("open"); renderView(); };
  });
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
  relatorios: ["Relatórios", viewRelatorios], usuarios: ["Usuários & Permissões", viewUsuarios],
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
function inRange(dateStr, from, to) {
  if (!dateStr) return false;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

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
  </div>`;
}
const stat = (l, v, d = "") => `<div class="stat"><small>${l}</small><b>${v}</b><div class="delta">${d}</div></div>`;
const tbl = (heads, rows) => `<div class="tbl-wrap"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;

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
      ["", "Produto", "SKU", "Cód. barras", "Categoria", "Estoque", "Custo médio", "Preço venda", "Total", "Ações"],
      rows.map(p => `<tr>
        <td>${p.image ? `<img class="thumb" src="${p.image}" alt="">` : `<div class="thumb"></div>`}</td>
        <td><strong>${esc(p.name)}</strong><br><small class="muted">${esc(p.brand || "")} ${esc(p.model || "")}</small></td>
        <td>${esc(p.sku || "—")}</td><td>${esc(p.barcode || "—")}</td><td>${esc(p.category || "—")}</td>
        <td><span class="pill ${num(p.qty) <= num(p.minQty || 0) ? "dan" : "ok"}">${num(p.qty)} ${esc(p.unit || "un")}</span></td>
        <td class="right">${money(p.avgCost)}</td><td class="right">${money(p.price)}</td>
        <td class="right">${money(num(p.qty) * num(p.avgCost))}</td>
        <td><button class="btn btn-sm" data-edit="${p.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button></td></tr>`).join("")
    ) : `<div class="empty">Nenhum item encontrado. Cadastre o primeiro produto.</div>`;
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
    ["Kit", "Composição", "Custo dos itens", "Adicional", "Custo total", "Preço venda", "Margem", "Montáveis", "Ações"],
    kits.map(k => {
      const base = (k.items || []).reduce((s, it) => s + num(STATE.products[it.productId]?.avgCost) * num(it.qty), 0);
      const total = base + num(k.extraCost);
      const marg = num(k.price) - total;
      return `<tr>
        <td><strong>${esc(k.name)}</strong><br><small class="muted">${esc(k.sku || "")}</small></td>
        <td>${(k.items || []).map(it => `${num(it.qty)}× ${esc(STATE.products[it.productId]?.name || "item removido")}`).join("<br>") || "—"}</td>
        <td class="right">${money(base)}</td><td class="right">${money(k.extraCost)}</td>
        <td class="right"><strong>${money(total)}</strong></td><td class="right">${money(k.price)}</td>
        <td class="right"><span class="pill ${marg >= 0 ? "ok" : "dan"}">${money(marg)}</span></td>
        <td>${kitAvailable(k)}</td>
        <td><button class="btn btn-sm" data-edit="${k.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-del="${k.id}">Excluir</button></td></tr>`;
    }).join("")
  ) : `<div class="empty">Nenhum kit criado. Combine itens do catálogo para formar kits.</div>`;
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
  root.innerHTML = `
  <div class="stats">
    ${stat("Valor total em estoque", money(stockValue()))}
    ${stat("Itens distintos", String(list(STATE.products).length))}
    ${stat("Entradas registradas", String(entries.length))}
  </div>
  <div class="card">
    <div class="card-head"><h3>Entrada de mercadoria (compra)</h3></div>
    <p class="muted">Ao registrar a entrada, o custo médio é recalculado automaticamente:
      (qtd atual × custo médio + qtd comprada × custo unitário) ÷ (qtd total).</p>
    <div class="grid3" style="margin-top:12px">
      <label class="field"><span>Produto</span><select id="e_prod">${list(STATE.products)
        .sort((a,b)=>(a.name||"").localeCompare(b.name||""))
        .map(p => `<option value="${p.id}">${esc(p.name)} (estoque: ${num(p.qty)} · médio ${money(p.avgCost)})</option>`).join("")}</select></label>
      <label class="field"><span>Quantidade comprada</span><input id="e_qty" type="number" step="0.001" placeholder="10"></label>
      <label class="field"><span>Valor total da remessa (R$)</span><input id="e_total" type="number" step="0.01" placeholder="250,00"></label>
      <label class="field"><span>Ou custo unitário (R$)</span><input id="e_unit" type="number" step="0.01" placeholder="25,00"></label>
      <label class="field"><span>Fornecedor</span><input id="e_supplier"></label>
      <label class="field"><span>Nota fiscal / documento</span><input id="e_doc"></label>
      <label class="field"><span>Data</span><input id="e_date" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Frete rateado (R$)</span><input id="e_freight" type="number" step="0.01" value="0"></label>
      <label class="field"><span>Gerar conta a pagar?</span><select id="e_pay"><option value="nao">Não</option><option value="sim">Sim</option></select></label>
    </div>
    <div class="card" style="margin-top:12px;background:var(--panel-2)"><div id="e_preview" class="muted">Preencha os campos para ver a simulação do novo custo médio.</div></div>
    <div style="margin-top:12px"><button class="btn btn-primary" id="e_save">Registrar entrada</button></div>
  </div>
  <div class="card">
    <div class="card-head"><h3>Histórico de entradas</h3></div>
    ${entries.length ? tbl(["Data", "Produto", "Qtd", "Custo unit.", "Total", "Custo médio anterior", "Novo custo médio", "Fornecedor"],
      entries.map(e => `<tr><td>${fmtDate(e.date)}</td><td>${esc(STATE.products[e.productId]?.name || e.productName || "—")}</td>
      <td>${num(e.qty)}</td><td class="right">${money(e.unitCost)}</td><td class="right">${money(e.total)}</td>
      <td class="right">${money(e.prevAvg)}</td><td class="right"><strong>${money(e.newAvg)}</strong></td>
      <td>${esc(e.supplier || "—")}</td></tr>`).join(""))
      : `<div class="empty">Nenhuma entrada registrada.</div>`}
  </div>`;

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

  $("#e_save").onclick = async () => {
    const pid = $("#e_prod").value, p = STATE.products[pid];
    if (!p) return toast("Cadastre um produto antes", "err");
    const q = num($("#e_qty").value);
    if (q <= 0) return toast("Informe a quantidade", "err");
    const freight = num($("#e_freight").value);
    const unit = num($("#e_unit").value) || (num($("#e_total").value) + freight) / q;
    if (unit <= 0) return toast("Informe o valor da compra", "err");
    const total = unit * q;
    const prevAvg = num(p.avgCost), prevQty = num(p.qty);
    const newQty = prevQty + q;
    const newAvg = (prevQty * prevAvg + q * unit) / newQty;
    await update(ref(db, "products/" + pid), { qty: newQty, avgCost: Number(newAvg.toFixed(4)) });
    await push(ref(db, "entries"), {
      productId: pid, productName: p.name, qty: q, unitCost: Number(unit.toFixed(4)), total,
      freight, prevAvg, newAvg: Number(newAvg.toFixed(4)), supplier: $("#e_supplier").value.trim(),
      doc: $("#e_doc").value.trim(), date: $("#e_date").value || todayISO(), createdAt: Date.now(),
      user: STATE.user.email
    });
    if ($("#e_pay").value === "sim") {
      await push(ref(db, "payables"), {
        description: `Compra ${p.name} (${q} un)`, supplier: $("#e_supplier").value.trim(),
        amount: total, due: $("#e_date").value || todayISO(), status: "pendente",
        category: "Compra de mercadoria", createdAt: Date.now()
      });
    }
    toast(`Entrada registrada. Novo custo médio: ${money(newAvg)}`, "ok");
    renderView();
  };
  preview();
}

/* ================= VENDAS ================= */
function viewVendas(root) {
  const sales = list(STATE.sales).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  root.innerHTML = `
  <div class="card">
    <div class="card-head"><h3>Vendas</h3><div style="flex:1"></div>
      <button class="btn btn-primary" id="sNew">+ Nova venda</button></div>
    ${sales.length ? tbl(["Data", "Cliente", "Itens", "Pagamento", "Custo", "Total", "Lucro", "Ações"],
      sales.map(s => `<tr><td>${fmtDate(s.date)}</td><td>${esc(s.customer || "—")}</td>
      <td>${(s.items || []).map(i => `${num(i.qty)}× ${esc(i.name)}`).join("<br>")}</td>
      <td>${esc(s.payment || "—")}</td><td class="right">${money(s.cost)}</td>
      <td class="right"><strong>${money(s.total)}</strong></td>
      <td class="right"><span class="pill ${num(s.total) - num(s.cost) >= 0 ? "ok" : "dan"}">${money(num(s.total) - num(s.cost))}</span></td>
      <td><button class="btn btn-sm btn-danger" data-del="${s.id}">Excluir</button></td></tr>`).join(""))
      : `<div class="empty">Nenhuma venda registrada.</div>`}
  </div>`;
  $("#sNew").onclick = saleForm;
  $$("[data-del]", root).forEach(b => b.onclick = () => confirmDialog("Excluir a venda? O estoque não será devolvido automaticamente.", async () => {
    await remove(ref(db, "sales/" + b.dataset.del)); toast("Venda excluída", "ok");
  }));
}

function saleForm() {
  let items = [];
  const opts = [
    ...list(STATE.products).map(p => `<option value="p:${p.id}">${esc(p.name)} — ${money(p.price)}</option>`),
    ...list(STATE.kits).map(k => `<option value="k:${k.id}">[KIT] ${esc(k.name)} — ${money(k.price)}</option>`)
  ].join("");
  openModal("Nova venda", `
    <div class="grid3">
      <label class="field"><span>Cliente</span><input id="s_customer"></label>
      <label class="field"><span>Data</span><input id="s_date" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Forma de pagamento</span><select id="s_pay">
        <option>Dinheiro</option><option>PIX</option><option>Débito</option><option>Crédito</option><option>Boleto</option><option>A prazo</option></select></label>
      <label class="field"><span>Desconto (R$)</span><input id="s_disc" type="number" step="0.01" value="0"></label>
      <label class="field"><span>Frete cobrado (R$)</span><input id="s_freight" type="number" step="0.01" value="0"></label>
      <label class="field"><span>Gerar conta a receber?</span><select id="s_rec"><option value="nao">Não</option><option value="sim">Sim</option></select></label>
    </div>
    <div class="section-title">Itens da venda</div>
    <div class="toolbar">
      <select id="s_item" style="flex:1">${opts}</select>
      <input id="s_qty" type="number" step="0.001" value="1" style="max-width:100px">
      <button class="btn" id="s_add">Adicionar</button>
    </div>
    <div id="s_list"></div>
    <div class="stat" style="margin-top:6px"><small>Total da venda</small><b id="s_total">R$ 0,00</b><div class="delta" id="s_info"></div></div>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Registrar venda</button>`);

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
    const total = sub - num($("#s_disc").value) + num($("#s_freight").value);
    $("#s_total").textContent = money(total);
    $("#s_info").textContent = `Custo ${money(cost)} · Lucro estimado ${money(total - cost)}`;
  };
  $("#s_add").onclick = () => {
    const v = $("#s_item").value; if (!v) return toast("Cadastre produtos ou kits", "err");
    const [t, id] = v.split(":"); const q = num($("#s_qty").value) || 1;
    if (t === "p") { const p = STATE.products[id]; items.push({ type: "product", id, name: p.name, qty: q, price: num(p.promo) || num(p.price), cost: num(p.avgCost) }); }
    else { const k = STATE.kits[id]; items.push({ type: "kit", id, name: "[KIT] " + k.name, qty: q, price: num(k.price), cost: kitCost(k) }); }
    draw();
  };
  $("#s_disc").oninput = draw; $("#s_freight").oninput = draw;
  draw();

  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    if (!items.length) return toast("Adicione itens à venda", "err");
    const sub = items.reduce((s, i) => s + num(i.price) * num(i.qty), 0);
    const cost = items.reduce((s, i) => s + num(i.cost) * num(i.qty), 0);
    const total = sub - num($("#s_disc").value) + num($("#s_freight").value);
    // baixa de estoque
    const updates = {};
    for (const it of items) {
      if (it.type === "product") {
        const p = STATE.products[it.id];
        updates["products/" + it.id + "/qty"] = num(p.qty) - num(it.qty);
      } else {
        for (const ki of (STATE.kits[it.id].items || [])) {
          const p = STATE.products[ki.productId]; if (!p) continue;
          const key = "products/" + ki.productId + "/qty";
          const cur = key in updates ? updates[key] : num(p.qty);
          updates[key] = cur - num(ki.qty) * num(it.qty);
        }
      }
    }
    await update(ref(db), updates);
    const sale = {
      customer: $("#s_customer").value.trim(), date: $("#s_date").value || todayISO(),
      payment: $("#s_pay").value, discount: num($("#s_disc").value), freight: num($("#s_freight").value),
      items, subtotal: sub, cost, total, user: STATE.user.email, createdAt: Date.now()
    };
    await push(ref(db, "sales"), sale);
    if ($("#s_rec").value === "sim") {
      await push(ref(db, "receivables"), {
        description: "Venda " + (sale.customer || "balcão"), customer: sale.customer,
        amount: total, due: sale.date, status: "pendente", category: "Venda", createdAt: Date.now()
      });
    }
    closeModal(); toast("Venda registrada e estoque atualizado", "ok");
  };
}

/* ================= FINANCEIRO ================= */
function viewFinanceiro(root) {
  root.innerHTML = `
    <div class="tabs">
      <button class="tab active" data-t="pay">Contas a pagar</button>
      <button class="tab" data-t="rec">Contas a receber</button>
      <button class="tab" data-t="flux">Fluxo de caixa</button>
    </div><div id="finBody"></div>`;
  const tabs = $$(".tab", root);
  const show = t => {
    tabs.forEach(b => b.classList.toggle("active", b.dataset.t === t));
    if (t === "pay") accountsPanel($("#finBody"), "payables", "Contas a pagar", "pago", "Fornecedor");
    else if (t === "rec") accountsPanel($("#finBody"), "receivables", "Contas a receber", "recebido", "Cliente");
    else cashFlow($("#finBody"));
  };
  tabs.forEach(b => b.onclick = () => show(b.dataset.t));
  show("pay");
}

function accountsPanel(el, node, title, doneStatus, partyLabel) {
  const rows = list(STATE[node]).sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const pend = rows.filter(r => r.status !== doneStatus);
  const total = pend.reduce((s, r) => s + num(r.amount), 0);
  const overdue = pend.filter(r => (r.due || "") < todayISO());
  el.innerHTML = `
  <div class="stats" style="margin-bottom:16px">
    ${stat("Em aberto", money(total), pend.length + " título(s)")}
    ${stat("Vencidos", money(overdue.reduce((s, r) => s + num(r.amount), 0)), overdue.length + " título(s)")}
    ${stat("Liquidado (total)", money(rows.filter(r => r.status === doneStatus).reduce((s, r) => s + num(r.amount), 0)))}
  </div>
  <div class="card">
    <div class="card-head"><h3>${title}</h3><div style="flex:1"></div><button class="btn btn-primary" id="accNew">+ Novo lançamento</button></div>
    ${rows.length ? tbl(["Vencimento", "Descrição", partyLabel, "Categoria", "Valor", "Situação", "Ações"],
      rows.map(r => {
        const done = r.status === doneStatus;
        const late = !done && (r.due || "") < todayISO();
        return `<tr><td>${fmtDate(r.due)}</td><td>${esc(r.description)}</td>
        <td>${esc(r.supplier || r.customer || "—")}</td><td>${esc(r.category || "—")}</td>
        <td class="right">${money(r.amount)}</td>
        <td><span class="pill ${done ? "ok" : late ? "dan" : "warn"}">${done ? doneStatus : late ? "vencido" : "pendente"}</span></td>
        <td>${done ? "" : `<button class="btn btn-sm btn-ok" data-ok="${r.id}">Liquidar</button> `}
            <button class="btn btn-sm btn-danger" data-del="${r.id}">Excluir</button></td></tr>`;
      }).join("")) : `<div class="empty">Nenhum lançamento.</div>`}
  </div>`;
  $("#accNew").onclick = () => accountForm(node, partyLabel);
  $$("[data-ok]", el).forEach(b => b.onclick = async () => {
    await update(ref(db, node + "/" + b.dataset.ok), { status: doneStatus, settledAt: todayISO() });
    toast("Título liquidado", "ok");
  });
  $$("[data-del]", el).forEach(b => b.onclick = () => confirmDialog("Excluir lançamento?", async () => {
    await remove(ref(db, node + "/" + b.dataset.del)); toast("Excluído", "ok");
  }));
}

function accountForm(node, partyLabel) {
  openModal("Novo lançamento", `
    <div class="grid2">
      <label class="field"><span>Descrição *</span><input id="a_desc"></label>
      <label class="field"><span>${partyLabel}</span><input id="a_party"></label>
      <label class="field"><span>Valor (R$) *</span><input id="a_amount" type="number" step="0.01"></label>
      <label class="field"><span>Vencimento</span><input id="a_due" type="date" value="${todayISO()}"></label>
      <label class="field"><span>Categoria</span><input id="a_cat" placeholder="Ex.: Fornecedor, Aluguel, Serviço"></label>
      <label class="field"><span>Parcelas (repetir mensalmente)</span><input id="a_inst" type="number" value="1" min="1"></label>
    </div>
    <label class="field"><span>Observações</span><textarea id="a_notes"></textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const d = $("#a_desc").value.trim(), amount = num($("#a_amount").value);
    if (!d || !amount) return toast("Informe descrição e valor", "err");
    const n = Math.max(1, parseInt($("#a_inst").value) || 1);
    for (let i = 0; i < n; i++) {
      const due = new Date($("#a_due").value || todayISO());
      due.setMonth(due.getMonth() + i);
      await push(ref(db, node), {
        description: n > 1 ? `${d} (${i + 1}/${n})` : d,
        [node === "payables" ? "supplier" : "customer"]: $("#a_party").value.trim(),
        amount, due: due.toISOString().slice(0, 10), category: $("#a_cat").value.trim(),
        notes: $("#a_notes").value.trim(), status: "pendente", createdAt: Date.now()
      });
    }
    closeModal(); toast("Lançamento salvo", "ok");
  };
}

function cashFlow(el) {
  const month = todayISO().slice(0, 7);
  const inflow = list(STATE.sales).filter(s => (s.date || "").startsWith(month)).reduce((s, v) => s + num(v.total), 0);
  const recOK = list(STATE.receivables).filter(r => r.status === "recebido" && (r.settledAt || "").startsWith(month)).reduce((s, v) => s + num(v.amount), 0);
  const payOK = list(STATE.payables).filter(r => r.status === "pago" && (r.settledAt || "").startsWith(month)).reduce((s, v) => s + num(v.amount), 0);
  const exp = list(STATE.expenses).filter(e => (e.date || "").startsWith(month)).reduce((s, v) => s + num(v.amount), 0);
  el.innerHTML = `
  <div class="stats">
    ${stat("Entradas (vendas do mês)", money(inflow))}
    ${stat("Recebimentos liquidados", money(recOK))}
    ${stat("Pagamentos liquidados", money(payOK))}
    ${stat("Despesas gerais", money(exp))}
    ${stat("Saldo do mês", money(inflow - payOK - exp))}
  </div>
  <div class="card"><div class="card-head"><h3>Resumo por categoria de saída — mês atual</h3></div>${barsByCategory(month)}</div>`;
}
function barsByCategory(month) {
  const map = {};
  list(STATE.expenses).filter(e => (e.date || "").startsWith(month)).forEach(e => map[e.category || "Outros"] = (map[e.category || "Outros"] || 0) + num(e.amount));
  list(STATE.payables).filter(p => p.status === "pago" && (p.settledAt || "").startsWith(month)).forEach(p => map[p.category || "Contas"] = (map[p.category || "Contas"] || 0) + num(p.amount));
  const arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!arr.length) return `<div class="empty">Sem saídas no período.</div>`;
  const max = arr[0][1];
  return `<div class="bars">${arr.map(([k, v]) =>
    `<div class="bar-row"><span>${esc(k)}</span><div class="bar"><i style="width:${(v / max * 100).toFixed(1)}%"></i></div><span class="right">${money(v)}</span></div>`).join("")}</div>`;
}

/* ================= DESPESAS GERAIS ================= */
const EXP_CATS = ["Entregas / Frete", "Combustível", "Manutenção de veículo", "Manutenção geral", "Aluguel", "Energia", "Água", "Internet / Telefone", "Salários", "Impostos", "Marketing", "Material de escritório", "Embalagens", "Outros"];
function viewDespesas(root) {
  const rows = list(STATE.expenses).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const month = todayISO().slice(0, 7);
  const mTotal = rows.filter(r => (r.date || "").startsWith(month)).reduce((s, r) => s + num(r.amount), 0);
  root.innerHTML = `
  <div class="stats">
    ${stat("Despesas do mês", money(mTotal))}
    ${stat("Total acumulado", money(rows.reduce((s, r) => s + num(r.amount), 0)))}
    ${stat("Lançamentos", String(rows.length))}
  </div>
  <div class="card">
    <div class="card-head"><h3>Despesas gerais</h3><div style="flex:1"></div>
      <select id="dFilter" style="max-width:220px"><option value="">Todas as categorias</option>${EXP_CATS.map(c => `<option>${c}</option>`).join("")}</select>
      <button class="btn btn-primary" id="dNew">+ Nova despesa</button></div>
    <div id="dTable"></div>
  </div>`;
  const draw = () => {
    const f = $("#dFilter").value;
    const r2 = rows.filter(r => !f || r.category === f);
    $("#dTable").innerHTML = r2.length ? tbl(["Data", "Categoria", "Descrição", "Fornecedor/Responsável", "Veículo/Placa", "Km", "Pagamento", "Valor", ""],
      r2.map(r => `<tr><td>${fmtDate(r.date)}</td><td><span class="pill">${esc(r.category)}</span></td>
      <td>${esc(r.description)}</td><td>${esc(r.party || "—")}</td><td>${esc(r.vehicle || "—")}</td>
      <td>${r.km ? num(r.km) : "—"}</td><td>${esc(r.payment || "—")}</td>
      <td class="right"><strong>${money(r.amount)}</strong></td>
      <td><button class="btn btn-sm" data-edit="${r.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${r.id}">Excluir</button></td></tr>`).join(""))
      : `<div class="empty">Nenhuma despesa lançada.</div>`;
    $$("[data-edit]", $("#dTable")).forEach(b => b.onclick = () => expenseForm(b.dataset.edit));
    $$("[data-del]", $("#dTable")).forEach(b => b.onclick = () => confirmDialog("Excluir despesa?", async () => {
      await remove(ref(db, "expenses/" + b.dataset.del)); toast("Excluída", "ok");
    }));
  };
  $("#dFilter").onchange = draw; $("#dNew").onclick = () => expenseForm();
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
    </div>
    <label class="field"><span>Observações</span><textarea id="x_notes">${esc(e.notes || "")}</textarea></label>
  `, `<button class="btn" id="mCancel">Cancelar</button><button class="btn btn-primary" id="mSave">Salvar</button>`);
  $("#mCancel").onclick = closeModal;
  $("#mSave").onclick = async () => {
    const data = {
      category: $("#x_cat").value, date: $("#x_date").value || todayISO(), description: $("#x_desc").value.trim(),
      amount: num($("#x_amount").value), party: $("#x_party").value.trim(), payment: $("#x_pay").value.trim(),
      vehicle: $("#x_vehicle").value.trim(), km: num($("#x_km").value), doc: $("#x_doc").value.trim(),
      notes: $("#x_notes").value.trim(), updatedAt: Date.now()
    };
    if (!data.description || !data.amount) return toast("Informe descrição e valor", "err");
    if (id) await update(ref(db, "expenses/" + id), data);
    else await push(ref(db, "expenses"), { ...data, createdAt: Date.now(), user: STATE.user.email });
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
      ${rk.length ? tbl(["Item", "Qtd", "Faturamento", "Lucro"], rk.map(([n, v]) =>
        `<tr><td>${esc(n)}</td><td>${v.qty}</td><td class="right">${money(v.total)}</td><td class="right">${money(v.profit)}</td></tr>`).join(""))
        : `<div class="empty">Sem dados.</div>`}</div>
    <div class="card"><div class="card-head"><h3>Despesas por categoria</h3></div>
      ${exps.length ? tbl(["Categoria", "Lançamentos", "Total"], Object.entries(exps.reduce((m, e) => {
        m[e.category || "Outros"] = m[e.category || "Outros"] || { n: 0, v: 0 };
        m[e.category || "Outros"].n++; m[e.category || "Outros"].v += num(e.amount); return m;
      }, {})).sort((a, b) => b[1].v - a[1].v).map(([c, v]) =>
        `<tr><td>${esc(c)}</td><td>${v.n}</td><td class="right">${money(v.v)}</td></tr>`).join(""))
        : `<div class="empty">Sem despesas no período.</div>`}</div>
    <div class="card"><div class="card-head"><h3>Posição de estoque (atual)</h3></div>
      ${tbl(["Produto", "Qtd", "Custo médio", "Valor total"], list(STATE.products)
        .sort((a, b) => num(b.qty) * num(b.avgCost) - num(a.qty) * num(a.avgCost))
        .map(p => `<tr><td>${esc(p.name)}</td><td>${num(p.qty)}</td><td class="right">${money(p.avgCost)}</td>
        <td class="right">${money(num(p.qty) * num(p.avgCost))}</td></tr>`).join("") +
        `<tr><td colspan="3"><strong>Total</strong></td><td class="right"><strong>${money(stockValue())}</strong></td></tr>`)}
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
      users.map(u => `<tr>
        <td>${esc(((u.firstName || "") + " " + (u.lastName || "")).trim() || "—")}</td>
        <td>${esc(u.email)}</td><td>${esc(u.phone || "—")}</td>
        <td><span class="pill ${u.email === ADMIN_EMAIL ? "ok" : ""}">${esc(u.email === ADMIN_EMAIL ? "admin geral" : (u.role || "colaborador"))}</span></td>
        <td>${PERMS.filter(p => (u.perms || {})[p[0]]).map(p => p[1]).join(", ") || "—"}</td>
        <td>${u.email === ADMIN_EMAIL ? "<span class='muted'>protegido</span>" :
          `<button class="btn btn-sm" data-perm="${u.id}">Permissões</button>
           <button class="btn btn-sm btn-danger" data-del="${u.id}">Remover</button>`}</td></tr>`).join(""))
      : `<div class="empty">Nenhum usuário registrado ainda.</div>`}</div>
  </div>`;
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
  <div class="card" style="max-width:640px">
    <div class="card-head"><h3>Meus dados</h3></div>
    <div class="grid2">
      <label class="field"><span>Nome</span><input id="me_first" value="${esc(p.firstName || "")}"></label>
      <label class="field"><span>Sobrenome</span><input id="me_last" value="${esc(p.lastName || "")}"></label>
      <label class="field"><span>Telefone</span><input id="me_phone" value="${esc(p.phone || "")}"></label>
      <label class="field"><span>E-mail (não editável)</span><input value="${esc(p.email || "")}" disabled></label>
    </div>
    <div style="margin-top:14px;display:flex;gap:10px">
      <button class="btn btn-primary" id="me_save">Salvar alterações</button>
      <button class="btn" id="me_reset">Redefinir minha senha por e-mail</button>
    </div>
  </div>`;
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
      payables: STATE.payables, receivables: STATE.receivables, expenses: STATE.expenses, settings: STATE.settings };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `backup_${todayISO()}.json`; a.click();
  };
}
