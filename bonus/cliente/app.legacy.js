function applyCoverShape(img) {
  if (!img) return;
  var box = img.parentElement;
  if (!box) return;
  var decide = function () {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    if (w / h > 0.85) { if (box.className.indexOf("is-cd") === -1) box.className += " is-cd"; }
    else box.className = box.className.replace(/\s*is-cd/g, "");
  };
  box.className = box.className.replace(/\s*is-cd/g, "");
  if (img.complete && img.naturalWidth) decide();
  img.onload = decide;
}
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _excluded = ["id"],
  _excluded2 = ["id"],
  _excluded3 = ["id"];
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* =====================================================================
   Workin'Store | Bônus — app.js
   ---------------------------------------------------------------------
   1) TROQUE AS CREDENCIAIS ABAIXO pelas do seu projeto Firebase.
   2) Firebase Console > Authentication > ative "E-mail/senha" e crie
      MANUALMENTE o usuário admin@admin.com (não há cadastro público).
   3) Realtime Database > Regras sugeridas:

   {
     "rules": {
       "games":    { ".read": true,
                     ".write": "auth != null && auth.token.email === 'admin@admin.com'" },
       "settings": { ".read": true,
                     ".write": "auth != null && auth.token.email === 'admin@admin.com'" }
     }
   }
   ===================================================================== */

var firebaseConfig = {
  apiKey: "AIzaSyBpoQKy0-dEgsM4cljmwbFgKWxhQkpjDkk",
  authDomain: "bonus2-ec9d5.firebaseapp.com",
  databaseURL: "https://bonus2-ec9d5-default-rtdb.firebaseio.com/",
  projectId: "bonus2-ec9d5",
  storageBucket: "bonus2-ec9d5.firebasestorage.app",
  messagingSenderId: "463777197593",
  appId: "1:463777197593:web:2b8fa4c1c062eb31df4488"
};
var ADMIN_EMAIL = "admin@admin.com";
var PUBLIC_PER_PAGE = 15; // 15 jogos por página (desktop e mobile)
var PAGE_WINDOW = 5; // mostra no máximo 5 números de página
var MAX_IMAGE_KB = 220; // limite do base64 salvo no Realtime Database

/* ============ MODO LEGADO (navegadores antigos / 32 bits) ============ */
(function () {
  var el = document.documentElement;
  var lowMem = navigator.deviceMemory && navigator.deviceMemory <= 2 || navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  var is32 = /WOW64|Win32|i686|i386/i.test(navigator.userAgent || navigator.platform || "") && !/x64|Win64|x86_64/i.test(navigator.userAgent || "");
  var oldUA = /MSIE |Trident\/|Edge\/1[0-8]\./.test(navigator.userAgent || "");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lowMem || is32 || oldUA || reduce) {
    if (el.className.indexOf("legacy-mode") === -1) el.className += " legacy-mode";
  }
})();

/* ================= PROTEÇÃO (anti cópia / código-fonte) ================= */
document.addEventListener("contextmenu", function (e) {
  return e.preventDefault();
});
document.addEventListener("dragstart", function (e) {
  if (e.target.tagName === "IMG" || e.target.tagName === "A") e.preventDefault();
});
document.addEventListener("keydown", function (e) {
  var k = (e.key || "").toLowerCase();
  var blockedCtrl = ["u", "s", "p"];
  var blockedCtrlShift = ["i", "j", "c", "k", "e"];
  if (k === "f12" || (e.ctrlKey || e.metaKey) && e.shiftKey && blockedCtrlShift.includes(k) || (e.ctrlKey || e.metaKey) && blockedCtrl.includes(k)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

/* ================= LINKS OCULTOS ================= */
var _linkVault = new Map();
var _linkSeq = 0;
function cloak(url) {
  if (!url) return "";
  var key = "lk" + (++_linkSeq).toString(36) + Math.random().toString(36).slice(2, 8);
  _linkVault.set(key, String(url));
  return key;
}
function revealLink(key) {
  return _linkVault.get(key) || "";
}
function openCloaked(key, sameTab) {
  var url = revealLink(key);
  if (!url) return;
  if (sameTab) {
    location.href = url;
    return;
  }
  var w = null;
  try {
    w = window.open(url, "_blank");
  } catch (e) {
    w = null;
  }
  if (w) {
    try {
      w.opener = null;
    } catch (e) {}
    return;
  }
  var a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    return a.remove();
  }, 0);
}
/* Carrega imagens sem expor a URL no DOM (usa blob local) */
function loadHiddenImage(_x, _x2) {
  return _loadHiddenImage.apply(this, arguments);
}
/* ================= ESTADO ================= */
function _loadHiddenImage() {
  _loadHiddenImage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(img, url) {
    var res, blob, _t12;
    return _regenerator().w(function (_context11) {
      while (1) switch (_context11.p = _context11.n) {
        case 0:
          if (img) {
            _context11.n = 1;
            break;
          }
          return _context11.a(2);
        case 1:
          if (url) {
            _context11.n = 2;
            break;
          }
          img.removeAttribute("src");
          return _context11.a(2);
        case 2:
          _context11.p = 2;
          _context11.n = 3;
          return fetch(url, {
            mode: "cors"
          });
        case 3:
          res = _context11.v;
          if (res.ok) {
            _context11.n = 4;
            break;
          }
          throw new Error("fail");
        case 4:
          _context11.n = 5;
          return res.blob();
        case 5:
          blob = _context11.v;
          img.src = URL.createObjectURL(blob);
          _context11.n = 7;
          break;
        case 6:
          _context11.p = 6;
          _t12 = _context11.v;
          img.src = url;
        case 7:
          return _context11.a(2);
      }
    }, _callee11, null, [[2, 6]]);
  }));
  return _loadHiddenImage.apply(this, arguments);
}
var state = {
  games: [],
  settings: {},
  menus: [],
  isAdmin: false,
  pubPage: 1,
  admPage: 1,
  admPerPage: 10,
  admQuery: "",
  step: 1,
  menuEditIndex: null,
  activeMenuCategory: ""
};

/* ================= HELPERS ================= */
var $ = function $(s) {
  var r = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
  return r.querySelector(s);
};
var $$ = function $$(s) {
  var r = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
  return Array.from(r.querySelectorAll(s));
};

/* ============ ROLAGEM SUAVE COM FALLBACK ============ */
var SUPPORTS_SCROLL_OPTIONS = function () {
  var ok = false;
  try {
    var opts = Object.defineProperty({}, "behavior", {
      get: function get() {
        ok = true;
        return "smooth";
      }
    });
    window.addEventListener("testscroll", null, opts);
    window.removeEventListener("testscroll", null, opts);
  } catch (e) {
    ok = false;
  }
  return ok && "scrollBehavior" in document.documentElement.style;
}();
function animateScroll(to) {
  var start = window.pageYOffset || document.documentElement.scrollTop || 0;
  var diff = to - start;
  var dur = Math.min(600, Math.max(200, Math.abs(diff) * 0.5));
  var t0 = null;
  function step(ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    window.scrollTo(0, start + diff * e);
    if (p < 1) requestAnimationFrame(step);
  }
  if (window.requestAnimationFrame) requestAnimationFrame(step);else window.scrollTo(0, to);
}
function smoothScrollTo(top) {
  if (SUPPORTS_SCROLL_OPTIONS) {
    try {
      window.scrollTo({
        top: top,
        behavior: "smooth"
      });
      return;
    } catch (e) {}
  }
  animateScroll(top);
}
function smoothScrollToEl(el) {
  if (!el) return;
  var rect = el.getBoundingClientRect();
  var top = rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0) - 8;
  smoothScrollTo(top);
}

/* ============ MENU HAMBÚRGUER / RETRÁTIL ============ */
var MENU_BREAKPOINT = 900;
function menuIsCompact() {
  return (window.innerWidth || document.documentElement.clientWidth) <= MENU_BREAKPOINT;
}
function setMenuOpen(open) {
  var bar = document.getElementById("menuBar");
  var btn = document.getElementById("menuToggle");
  if (!bar || !btn) return;
  if (open) bar.className = bar.className.replace(/\s*is-open/g, "") + " is-open";else bar.className = bar.className.replace(/\s*is-open/g, "");
  if (open) btn.className = btn.className.replace(/\s*is-open/g, "") + " is-open";else btn.className = btn.className.replace(/\s*is-open/g, "");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}
function syncMenuMode() {
  var bar = document.getElementById("menuBar");
  var btn = document.getElementById("menuToggle");
  if (!bar || !btn) return;
  var hasItems = !!bar.querySelector(".menu-link");
  var compact = menuIsCompact();
  btn.classList.toggle("is-available", hasItems);
  bar.classList.toggle("is-collapsible", compact && hasItems);
  bar.classList.toggle("hidden", !hasItems);
  if (!compact || !hasItems) setMenuOpen(false);
}
document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("menuToggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var bar = document.getElementById("menuBar");
      var open = bar && bar.className.indexOf("is-open") === -1;
      setMenuOpen(!!open);
    });
  }
  syncMenuMode();
});
var _menuResizeTimer = null;
window.addEventListener("resize", function () {
  if (_menuResizeTimer) clearTimeout(_menuResizeTimer);
  _menuResizeTimer = setTimeout(syncMenuMode, 120);
});
window.addEventListener("orientationchange", function () {
  setTimeout(syncMenuMode, 200);
});
var esc = function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c];
  });
};
var norm = function norm(v) {
  return String(v == null ? "" : v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
var toastTimer;
function toast(msg) {
  var t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    return t.hidden = true;
  }, 2600);
}
function openModal(id) {
  $(id).hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal(el) {
  el.hidden = true;
  var anyOpen = $$(".modal-backdrop").some(function (m) {
    return !m.hidden;
  });
  document.body.style.overflow = anyOpen ? "hidden" : "";
}
$$(".modal-backdrop").forEach(function (bd) {
  bd.addEventListener("click", function (e) {
    if (e.target === bd) closeModal(bd);
  });
  bd.querySelectorAll("[data-close]").forEach(function (b) {
    return b.addEventListener("click", function () {
      return closeModal(bd);
    });
  });
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") $$(".modal-backdrop").forEach(function (b) {
    if (!b.hidden) closeModal(b);
  });
});

/* tamanho em MB a partir dos campos salvos */
function sizeInMb(g) {
  if (typeof g.sizeMb === "number" && !isNaN(g.sizeMb)) return g.sizeMb;
  var m = String(g.size || "").match(/([\d.,]+)\s*(gb|mb|kb)?/i);
  if (!m) return null;
  var n = parseFloat(m[1].replace(",", "."));
  if (isNaN(n)) return null;
  var u = (m[2] || "gb").toLowerCase();
  return u === "gb" ? n * 1024 : u === "kb" ? n / 1024 : n;
}
function sizeLabel(g) {
  if (g.size) return g.size;
  var mb = sizeInMb(g);
  if (mb == null) return "";
  return mb >= 1024 ? "".concat((mb / 1024).toFixed(mb % 1024 ? 1 : 0), " GB") : "".concat(Math.round(mb), " MB");
}

/* ================= TEMA ================= */
var DEFAULT_THEME = {
  defaultTheme: "dark",
  allowToggle: true,
  font: '"Segoe UI", system-ui, -apple-system, sans-serif',
  radius: 14,
  dark: {
    bg: "#0a0c12",
    surface: "#151a27",
    border: "#262d3d",
    text: "#eef2ff",
    primary: "#17e6a1",
    accent: "#7c5cff"
  },
  light: {
    bg: "#f5f7fb",
    surface: "#ffffff",
    border: "#dfe4ee",
    text: "#131722",
    primary: "#0aa87a",
    accent: "#5b3ff0"
  }
};
function mixHex(hex, other, amount) {
  var p = function p(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) {
      return c + c;
    }).join("");
    return [0, 2, 4].map(function (i) {
      return parseInt(h.slice(i, i + 2), 16);
    });
  };
  var _p = p(hex),
    _p2 = _slicedToArray(_p, 3),
    r1 = _p2[0],
    g1 = _p2[1],
    b1 = _p2[2],
    _p3 = p(other),
    _p4 = _slicedToArray(_p3, 3),
    r2 = _p4[0],
    g2 = _p4[1],
    b2 = _p4[2];
  var c = function c(a, b) {
    return Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
  };
  return "#".concat(c(r1, r2)).concat(c(g1, g2)).concat(c(b1, b2));
}
function inkFor(hex) {
  var h = hex.replace("#", "");
  var _map = [0, 2, 4].map(function (i) {
      return parseInt(h.slice(i, i + 2), 16);
    }),
    _map2 = _slicedToArray(_map, 3),
    r = _map2[0],
    g = _map2[1],
    b = _map2[2];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#08121a" : "#ffffff";
}
function applyTheme() {
  var t = _objectSpread(_objectSpread({}, DEFAULT_THEME), state.settings.theme || {});
  t.dark = _objectSpread(_objectSpread({}, DEFAULT_THEME.dark), t.dark || {});
  t.light = _objectSpread(_objectSpread({}, DEFAULT_THEME.light), t.light || {});
  var saved = localStorage.getItem("gv-theme");
  var mode = t.allowToggle === false ? t.defaultTheme || "dark" : saved || t.defaultTheme || "dark";
  document.documentElement.dataset.theme = mode;
  $("#themeBtn").classList.toggle("hidden", t.allowToggle === false);
  var c = mode === "light" ? t.light : t.dark;
  var isLight = mode === "light";
  var r = document.documentElement.style;
  r.setProperty("--bg", c.bg);
  r.setProperty("--bg-2", mixHex(c.bg, isLight ? "#ffffff" : "#ffffff", isLight ? 1 : 0.04));
  r.setProperty("--surface", c.surface);
  r.setProperty("--surface-2", mixHex(c.surface, isLight ? "#000000" : "#ffffff", 0.06));
  r.setProperty("--border", c.border);
  r.setProperty("--text", c.text);
  r.setProperty("--muted", mixHex(c.text, c.bg, 0.45));
  r.setProperty("--primary", c.primary);
  r.setProperty("--primary-ink", inkFor(c.primary));
  r.setProperty("--accent", c.accent);
  r.setProperty("--font", t.font || DEFAULT_THEME.font);
  r.setProperty("--radius", (t.radius == null ? 14 : t.radius) + "px");
  return t;
}
$("#themeBtn").addEventListener("click", function () {
  var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("gv-theme", next);
  applyTheme();
});
$("#year").textContent = new Date().getFullYear();

/* ================= FIREBASE ================= */
var db = null,
  auth = null,
  firebaseReady = false;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  auth = firebase.auth();
  firebaseReady = true;
} catch (err) {
  console.warn("Firebase não inicializado — verifique as credenciais no topo de app.js.", err);
}

/* =====================================================================
   CAMPOS DE IMAGEM: link externo OU upload convertido em base64
   ===================================================================== */
function compressToBase64(file) {
  var maxDim = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 900;
  var quality = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.82;
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function () {
      return reject(new Error("Falha ao ler o arquivo."));
    };
    reader.onload = function () {
      var raw = reader.result;
      if (file.type === "image/svg+xml") return resolve(raw);
      var img = new Image();
      img.onerror = function () {
        return reject(new Error("Imagem inválida."));
      };
      img.onload = function () {
        var w = img.width,
          h = img.height;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        var cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        var hasAlpha = file.type === "image/png";
        var out = cv.toDataURL(hasAlpha ? "image/png" : "image/jpeg", quality);
        var q = quality;
        while (out.length / 1024 > MAX_IMAGE_KB && q > 0.35) {
          q -= 0.12;
          out = cv.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}
function setupImageField(root) {
  var urlInput = $(".img-url", root);
  var fileWrap = $(".img-file-wrap", root);
  var fileInput = $(".img-file", root);
  var preview = $(".img-preview img", root);
  var sizeInfo = $(".img-size", root);
  var chips = $$(".chip", root);
  root._value = "";
  var paint = function paint(v) {
    root._value = v || "";
    if (v) {
      preview.src = v;
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    sizeInfo.textContent = v && v.startsWith("data:") ? "Base64 \xB7 ~".concat(Math.round(v.length / 1024), " KB") : v ? "Link externo" : "Nenhuma imagem";
  };
  var setMode = function setMode(mode) {
    chips.forEach(function (c) {
      return c.classList.toggle("active", c.dataset.src === mode);
    });
    urlInput.classList.toggle("hidden", mode !== "url");
    fileWrap.classList.toggle("hidden", mode !== "upload");
  };
  chips.forEach(function (c) {
    return c.addEventListener("click", function () {
      return setMode(c.dataset.src);
    });
  });
  urlInput.addEventListener("input", function () {
    return paint(urlInput.value.trim());
  });
  fileInput.addEventListener("change", /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(e) {
      var file, b64, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            file = e.target.files[0];
            if (file) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            _context.p = 1;
            sizeInfo.textContent = "Convertendo...";
            _context.n = 2;
            return compressToBase64(file);
          case 2:
            b64 = _context.v;
            if (!(b64.length / 1024 > MAX_IMAGE_KB * 1.6)) {
              _context.n = 3;
              break;
            }
            toast("Imagem muito pesada, escolha uma menor.");
            sizeInfo.textContent = "Imagem muito pesada.";
            return _context.a(2);
          case 3:
            urlInput.value = "";
            paint(b64);
            toast("Imagem convertida para base64.");
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            sizeInfo.textContent = _t.message;
          case 5:
            _context.p = 5;
            e.target.value = "";
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[1, 4, 5, 6]]);
    }));
    return function (_x3) {
      return _ref.apply(this, arguments);
    };
  }());
  root.getValue = function () {
    return root._value;
  };
  root.setValue = function (v) {
    v = v || "";
    if (v.startsWith("data:")) {
      setMode("upload");
      urlInput.value = "";
    } else {
      setMode("url");
      urlInput.value = v;
    }
    paint(v);
  };
  root.setValue("");
  return root;
}
var imgFields = {};
$$(".imgfield").forEach(function (f) {
  imgFields[f.dataset.img] = setupImageField(f);
});

/* =====================================================================
   BUSCA + FILTROS + RENDER PÚBLICO
   ===================================================================== */
function searchBlob(g) {
  return norm([g.title, g.code, g.category, g.platform, g.year, g.description, g.requirements, sizeLabel(g), (g.tags || []).join(" ")].filter(Boolean).join(" "));
}
function visibleGames() {
  var terms = norm($("#searchInput").value).split(/\s+/).filter(Boolean);
  var cat = $("#categoryFilter").value || state.activeMenuCategory;
  var plat = $("#platformFilter").value;
  var tag = $("#tagFilter").value;
  var year = $("#yearFilter").value;
  var sizeRange = $("#sizeFilter").value;
  var sort = $("#sortFilter").value;
  var list = state.games.filter(function (g) {
    return g.published !== false;
  });
  if (cat) list = list.filter(function (g) {
    return norm(g.category) === norm(cat);
  });
  if (plat) list = list.filter(function (g) {
    return norm(g.platform).includes(norm(plat));
  });
  if (tag) list = list.filter(function (g) {
    return (g.tags || []).some(function (t) {
      return norm(t) === norm(tag);
    });
  });
  if (year) list = list.filter(function (g) {
    return String(g.year || "") === year;
  });
  if (sizeRange) {
    var _sizeRange$split$map = sizeRange.split("-").map(Number),
      _sizeRange$split$map2 = _slicedToArray(_sizeRange$split$map, 2),
      min = _sizeRange$split$map2[0],
      max = _sizeRange$split$map2[1];
    list = list.filter(function (g) {
      var mb = sizeInMb(g);
      return mb != null && mb >= min && mb < max;
    });
  }
  if (terms.length) {
    list = list.filter(function (g) {
      var blob = searchBlob(g);
      return terms.every(function (t) {
        return blob.includes(t);
      });
    });
  }
  var byTitle = function byTitle(a, b) {
    return (a.title || "").localeCompare(b.title || "", "pt-BR");
  };
  var s = {
    az: byTitle,
    za: function za(a, b) {
      return byTitle(b, a);
    }
  }[sort];
  if (s) list.sort(s);else if (sort === "size-asc") list.sort(function (a, b) {
    return (sizeInMb(a) == null ? Infinity : sizeInMb(a)) - (sizeInMb(b) == null ? Infinity : sizeInMb(b));
  });else if (sort === "size-desc") list.sort(function (a, b) {
    return (sizeInMb(b) == null ? -1 : sizeInMb(b)) - (sizeInMb(a) == null ? -1 : sizeInMb(a));
  });else if (sort === "year-desc") list.sort(function (a, b) {
    return (b.year || 0) - (a.year || 0);
  });else if (sort === "year-asc") list.sort(function (a, b) {
    return (a.year || 9999) - (b.year || 9999);
  });else if (sort === "rating-desc") list.sort(function (a, b) {
    return (b.rating || 0) - (a.rating || 0);
  });else if (sort === "recent") list.sort(function (a, b) {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  return list;
}
function renderFilterOptions() {
  var fill = function fill(sel, values, allLabel) {
    var cur = sel.value;
    sel.innerHTML = "<option value=\"\">".concat(allLabel, "</option>") + values.map(function (v) {
      return "<option value=\"".concat(esc(v), "\">").concat(esc(v), "</option>");
    }).join("");
    if (values.map(String).includes(cur)) sel.value = cur;
  };
  var uniq = function uniq(arr) {
    return _toConsumableArray(new Set(arr.filter(Boolean)));
  };
  var cats = uniq(state.games.map(function (g) {
    return g.category;
  })).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });
  var plats = uniq(state.games.flatMap(function (g) {
    return String(g.platform || "").split(/[,/]/).map(function (p) {
      return p.trim();
    });
  })).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });
  var tags = uniq(state.games.flatMap(function (g) {
    return g.tags || [];
  })).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });
  var years = uniq(state.games.map(function (g) {
    return g.year;
  })).sort(function (a, b) {
    return b - a;
  });
  fill($("#categoryFilter"), cats, "Todas");
  fill($("#platformFilter"), plats, "Todas");
  fill($("#tagFilter"), tags, "Todas");
  fill($("#yearFilter"), years, "Todos");
  $("#catList").innerHTML = cats.map(function (c) {
    return "<option value=\"".concat(esc(c), "\">");
  }).join("");
  $("#platList").innerHTML = plats.map(function (c) {
    return "<option value=\"".concat(esc(c), "\">");
  }).join("");
}
function renderPager(pages) {
  var pager = $("#publicPager");
  pager.classList.toggle("hidden", pages <= 1);
  if (pages <= 1) return;
  var start = Math.max(1, state.pubPage - Math.floor(PAGE_WINDOW / 2));
  var end = Math.min(pages, start + PAGE_WINDOW - 1);
  start = Math.max(1, end - PAGE_WINDOW + 1);
  var nums = [];
  for (var i = start; i <= end; i++) {
    nums.push("<button class=\"page-btn ".concat(i === state.pubPage ? "active" : "", "\" data-page=\"").concat(i, "\">").concat(i, "</button>"));
  }
  $("#pageNumbers").innerHTML = nums.join("");
  $$("#pageNumbers .page-btn").forEach(function (b) {
    return b.addEventListener("click", function () {
      return goToPage(+b.dataset.page);
    });
  });
  var many = pages > PAGE_WINDOW;
  $("[data-pub-first]").classList.toggle("hidden", !many);
  $("[data-pub-last]").classList.toggle("hidden", !many);
  $("[data-pub-first]").disabled = state.pubPage === 1;
  $("[data-pub-prev]").disabled = state.pubPage <= 1;
  $("[data-pub-next]").disabled = state.pubPage >= pages;
  $("[data-pub-last]").disabled = state.pubPage === pages;
  pager.dataset.pages = pages;
}
function goToPage(n) {
  var pages = +$("#publicPager").dataset.pages || 1;
  state.pubPage = Math.min(pages, Math.max(1, n));
  renderGames();
  smoothScrollTo(0);
}
function renderGames() {
  var list = visibleGames();
  var pages = Math.max(1, Math.ceil(list.length / PUBLIC_PER_PAGE));
  if (state.pubPage > pages) state.pubPage = pages;
  var slice = list.slice((state.pubPage - 1) * PUBLIC_PER_PAGE, state.pubPage * PUBLIC_PER_PAGE);
  $("#gamesGrid").innerHTML = slice.map(function (g) {
    return "\n    <div class=\"card\" role=\"button\" tabindex=\"0\" data-id=\"".concat(esc(g.id), "\">\n      <div class=\"card-cover\">\n        ").concat(g.cover ? "<img data-cover=\"".concat(esc(cloak(g.cover)), "\" alt=\"").concat(esc(g.title), "\" loading=\"lazy\" />") : "", "\n        ").concat(g.category ? "<span class=\"card-badge\">".concat(esc(g.category), "</span>") : "", "\n        ").concat(g.rating ? "<span class=\"card-rating\">".concat(esc(g.rating), "</span>") : "", "\n      </div>\n      <div class=\"card-info\">\n        <p class=\"card-title\" title=\"").concat(esc(g.title), "\">").concat(esc(g.title), "</p>\n        <span class=\"card-sub\">").concat([g.year, g.platform, sizeLabel(g)].filter(Boolean).map(esc).join(" · ") || "Detalhes", "</span>\n        <button type=\"button\" class=\"card-dl\" data-more=\"1\" aria-label=\"Saiba mais sobre ").concat(esc(g.title), "\"><span class=\"card-dl-icon\">\u2139</span><span class=\"card-dl-text\">Saiba mais...</span></button>\n      </div>\n    </div>");
  }).join("");
  $$("#gamesGrid .card").forEach(function (c) {
    c.addEventListener("click", function (e) {
      if (e.target.closest(".card-dl")) return;
      openGame(c.dataset.id);
    });
    c.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest(".card-dl")) return;
        e.preventDefault();
        openGame(c.dataset.id);
      }
    });
  });
  $$("#gamesGrid [data-cover]").forEach(function (img) {
    return loadHiddenImage(img, revealLink(img.dataset.cover));
  });
  $$("#gamesGrid .card-dl").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      var card = a.closest(".card");
      a.classList.remove("is-clicked");
      void a.offsetWidth;
      a.classList.add("is-clicked");
      setTimeout(function () {
        return a.classList.remove("is-clicked");
      }, 650);
      if (card) openGame(card.dataset.id);
    });
  });
  var modalDl = $("#gmDownload");
  if (modalDl && !modalDl.dataset.animBound) {
    modalDl.dataset.animBound = "1";
    modalDl.addEventListener("click", function (e) {
      e.stopPropagation();
      openCloaked(modalDl.dataset.dl, modalDl.dataset.blank === "0");
      modalDl.classList.remove("is-clicked");
      void modalDl.offsetWidth;
      modalDl.classList.add("is-clicked");
      setTimeout(function () {
        return modalDl.classList.remove("is-clicked");
      }, 650);
    });
  }
  $("#emptyState").classList.toggle("hidden", list.length > 0);
  $("#resultInfo").textContent = list.length ? "".concat(list.length, " jogo(s) encontrado(s) \xB7 p\xE1gina ").concat(state.pubPage, " de ").concat(pages) : "";
  renderPager(pages);
}
$("[data-pub-first]").addEventListener("click", function () {
  return goToPage(1);
});
$("[data-pub-prev]").addEventListener("click", function () {
  return goToPage(state.pubPage - 1);
});
$("[data-pub-next]").addEventListener("click", function () {
  return goToPage(state.pubPage + 1);
});
$("[data-pub-last]").addEventListener("click", function () {
  return goToPage(+$("#publicPager").dataset.pages || 1);
});
$("#searchInput").addEventListener("input", function () {
  state.pubPage = 1;
  renderGames();
});
["#categoryFilter", "#platformFilter", "#tagFilter", "#yearFilter", "#sizeFilter", "#sortFilter"].forEach(function (id) {
  return $(id).addEventListener("change", function () {
    state.pubPage = 1;
    state.activeMenuCategory = "";
    renderGames();
  });
});
$("#filtersBtn").addEventListener("click", function () {
  return $("#filtersPanel").classList.toggle("hidden");
});
$("#clearFilters").addEventListener("click", function () {
  ["#categoryFilter", "#platformFilter", "#tagFilter", "#yearFilter", "#sizeFilter"].forEach(function (id) {
    return $(id).value = "";
  });
  $("#sortFilter").value = "az";
  $("#searchInput").value = "";
  state.activeMenuCategory = "";
  $$("#menuBarInner .menu-link").forEach(function (x) {
    return x.classList.remove("active");
  });
  state.pubPage = 1;
  renderGames();
});

/* ================= MODAL DO JOGO ================= */
function openGame(id) {
  var g = state.games.find(function (x) {
    return x.id === id;
  });
  if (!g) return;
  var cover = $("#gmCover");
  if (g.cover) {
    applyCoverShape(cover);
    loadHiddenImage(cover, g.cover);
    cover.alt = g.title || "";
    cover.parentElement.hidden = false;
  } else cover.parentElement.hidden = true;
  $("#gmTitle").textContent = g.title || "Sem título";
  $("#gmMeta").textContent = [g.category, g.year, g.platform].filter(Boolean).join(" · ");
  $("#gmTags").innerHTML = (g.tags || []).map(function (t) {
    return "<span class=\"tag\">".concat(esc(t), "</span>");
  }).join("");
  $("#gmDesc").textContent = g.description || "";
  var specs = [["Código", g.code], ["Tamanho", sizeLabel(g)], ["Nota", g.rating], ["Requisitos", g.requirements]].filter(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
      v = _ref3[1];
    return v;
  });
  $("#gmSpecs").innerHTML = specs.map(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
      k = _ref5[0],
      v = _ref5[1];
    return "<dt>".concat(esc(k), "</dt><dd>").concat(esc(v), "</dd>");
  }).join("");
  var dl = $("#gmDownload");
  if (g.download) {
    dl.dataset.dl = cloak(g.download);
    dl.dataset.blank = g.downloadBlank === false ? "0" : "1";
    dl.classList.remove("hidden");
  } else dl.classList.add("hidden");
  openModal("#gameModal");
}

/* ================= MENUS DO TOPO ================= */
function renderMenuBar() {
  var menus = state.menus || [];
  $("#menuBar").classList.toggle("hidden", menus.length === 0);
  $("#menuBarInner").innerHTML = menus.map(function (m, i) {
    return "<button type=\"button\" class=\"menu-link\" data-menu=\"".concat(i, "\" data-href=\"").concat(esc(cloak(m.url || "")), "\">").concat(esc(m.label), "</button>");
  }).join("");
  syncMenuMode();
  $$("#menuBarInner .menu-link").forEach(function (a) {
    return a.addEventListener("click", function (e) {
      var m = menus[+a.dataset.menu];
      if (!m) return;
      if (menuIsCompact()) setMenuOpen(false);
      if (m.category) {
        e.preventDefault();
        $$("#menuBarInner .menu-link").forEach(function (x) {
          return x.classList.remove("active");
        });
        a.classList.add("active");
        $("#categoryFilter").value = "";
        state.activeMenuCategory = m.category;
        state.pubPage = 1;
        renderGames();
        smoothScrollToEl($("#gamesGrid"));
        return;
      }
      var url = revealLink(a.dataset.href);
      if (!url) return;
      if (url.startsWith("#")) {
        var el = document.querySelector(url);
        if (el) smoothScrollToEl(el);
        return;
      }
      openCloaked(a.dataset.href, !m.blank);
    });
  });
}
function renderMenuAdmin() {
  var menus = state.menus || [];
  $("#menuList").innerHTML = menus.length ? menus.map(function (m, i) {
    return "\n      <div class=\"admin-item\">\n        <div class=\"ai-main\">\n          <div class=\"ai-title\">".concat(esc(m.label), "</div>\n          <div class=\"ai-sub\">").concat(esc(m.url || "")).concat(m.category ? " · categoria: " + esc(m.category) : "").concat(m.blank ? " · nova aba" : "", "</div>\n        </div>\n        <button class=\"btn btn-ghost\" data-mup=\"").concat(i, "\" title=\"Subir\">\u2191</button>\n        <button class=\"btn btn-ghost\" data-mdown=\"").concat(i, "\" title=\"Descer\">\u2193</button>\n        <button class=\"btn btn-ghost\" data-medit=\"").concat(i, "\">Editar</button>\n        <button class=\"btn btn-danger\" data-mdel=\"").concat(i, "\">Excluir</button>\n      </div>");
  }).join("") : "<p class=\"muted small\">Nenhum menu cadastrado.</p>";
  var save = /*#__PURE__*/function () {
    var _save = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(arr) {
      var _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (state.isAdmin) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2, toast("Somente admin."));
          case 1:
            _context2.p = 1;
            _context2.n = 2;
            return db.ref("settings/menus").set(arr);
          case 2:
            toast("Menus atualizados.");
            _context2.n = 4;
            break;
          case 3:
            _context2.p = 3;
            _t2 = _context2.v;
            toast("Erro ao salvar menus: " + writeError(_t2));
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 3]]);
    }));
    function save(_x4) {
      return _save.apply(this, arguments);
    }
    return save;
  }();
  $$("#menuList [data-mup]").forEach(function (b) {
    return b.addEventListener("click", function () {
      var i = +b.dataset.mup;
      if (i === 0) return;
      var a = _toConsumableArray(menus);
      var _ref6 = [a[i], a[i - 1]];
      a[i - 1] = _ref6[0];
      a[i] = _ref6[1];
      save(a);
    });
  });
  $$("#menuList [data-mdown]").forEach(function (b) {
    return b.addEventListener("click", function () {
      var i = +b.dataset.mdown;
      if (i >= menus.length - 1) return;
      var a = _toConsumableArray(menus);
      var _ref7 = [a[i], a[i + 1]];
      a[i + 1] = _ref7[0];
      a[i] = _ref7[1];
      save(a);
    });
  });
  $$("#menuList [data-medit]").forEach(function (b) {
    return b.addEventListener("click", function () {
      var i = +b.dataset.medit,
        m = menus[i];
      state.menuEditIndex = i;
      $("#mLabel").value = m.label || "";
      $("#mUrl").value = m.url || "";
      $("#mCategory").value = m.category || "";
      $("#mBlank").checked = !!m.blank;
      $("#menuSave").textContent = "Salvar alterações";
    });
  });
  $$("#menuList [data-mdel]").forEach(function (b) {
    return b.addEventListener("click", function () {
      if (!confirm("Excluir este menu?")) return;
      save(menus.filter(function (_, i) {
        return i !== +b.dataset.mdel;
      }));
    });
  });
}
$("#menuForm").addEventListener("submit", /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(e) {
    var item, arr, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          e.preventDefault();
          if (state.isAdmin) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2, toast("Somente admin."));
        case 1:
          item = {
            label: $("#mLabel").value.trim(),
            url: $("#mUrl").value.trim() || "#",
            category: $("#mCategory").value.trim(),
            blank: $("#mBlank").checked
          };
          if (item.label) {
            _context3.n = 2;
            break;
          }
          return _context3.a(2, toast("Informe o nome do menu."));
        case 2:
          arr = _toConsumableArray(state.menus || []);
          if (state.menuEditIndex != null) arr[state.menuEditIndex] = item;else arr.push(item);
          _context3.p = 3;
          _context3.n = 4;
          return db.ref("settings/menus").set(arr);
        case 4:
          toast(state.menuEditIndex != null ? "Menu atualizado!" : "Menu adicionado!");
          resetMenuForm();
          _context3.n = 6;
          break;
        case 5:
          _context3.p = 5;
          _t3 = _context3.v;
          toast("Erro ao salvar menu: " + writeError(_t3));
        case 6:
          return _context3.a(2);
      }
    }, _callee3, null, [[3, 5]]);
  }));
  return function (_x5) {
    return _ref8.apply(this, arguments);
  };
}());
function resetMenuForm() {
  state.menuEditIndex = null;
  $("#menuForm").reset();
  $("#menuSave").textContent = "Adicionar menu";
}
$("#menuCancel").addEventListener("click", resetMenuForm);

/* ================= IDENTIDADE + AJUDA ================= */
function renderSettings() {
  var s = state.settings || {};
  state.menus = Array.isArray(s.menus) ? s.menus : Object.values(s.menus || {});
  applyTheme();
  var sq = $("#logoSquare"),
    wd = $("#logoWord"),
    fb = $("#brandFallback");
  if (s.logoSquare) {
    loadHiddenImage(sq, s.logoSquare);
    sq.hidden = false;
  } else sq.hidden = true;
  if (s.logoWord) {
    loadHiddenImage(wd, s.logoWord);
    wd.hidden = false;
  } else wd.hidden = true;
  fb.textContent = s.siteName || "Workin'Store | Bônus";
  fb.hidden = !!s.logoWord;
  if (s.favicon) {
    if (s.favicon.startsWith("data:")) $("#faviconTag").href = s.favicon;else fetch(s.favicon, {
      mode: "cors"
    }).then(function (r) {
      return r.blob();
    }).then(function (b) {
      $("#faviconTag").href = URL.createObjectURL(b);
    }).catch(function () {
      $("#faviconTag").href = s.favicon;
    });
  }
  $("#heroTitle").textContent = s.heroTitle || "Sua biblioteca de jogos";
  $("#heroSubtitle").textContent = s.heroSubtitle || "Clique em um jogo para ver detalhes e baixar.";
  $("#footerText").textContent = s.footerText || "\xA9 ".concat(new Date().getFullYear(), " ").concat(s.siteName || "Workin'Store | Bônus");
  document.title = (s.siteName || "Workin'Store | Bônus") + " — Biblioteca de Jogos";
  var help = s.help || "Navegue pelos jogos na página inicial.\nUse a busca por título, plataforma ou código único.\nClique em um card para ver as informações completas.";
  $("#helpContent").innerHTML = help.split("\n").filter(Boolean).map(function (p) {
    return "<p>".concat(esc(p), "</p>");
  }).join("");

  // formulários do admin
  imgFields.logoSquare.setValue(s.logoSquare || "");
  imgFields.logoWord.setValue(s.logoWord || "");
  imgFields.favicon.setValue(s.favicon || "");
  $("#bSiteName").value = s.siteName || "";
  $("#bHeroTitle").value = s.heroTitle || "";
  $("#bHeroSubtitle").value = s.heroSubtitle || "";
  $("#bFooter").value = s.footerText || "";
  $("#hContent").value = s.help || "";
  var t = _objectSpread(_objectSpread({}, DEFAULT_THEME), s.theme || {});
  t.dark = _objectSpread(_objectSpread({}, DEFAULT_THEME.dark), t.dark || {});
  t.light = _objectSpread(_objectSpread({}, DEFAULT_THEME.light), t.light || {});
  $("#tDefault").value = t.defaultTheme;
  $("#tAllowToggle").checked = t.allowToggle !== false;
  $("#tFont").value = t.font;
  $("#tRadius").value = t.radius;
  ["bg", "surface", "border", "text", "primary", "accent"].forEach(function (k) {
    $("#td" + k[0].toUpperCase() + k.slice(1)).value = t.dark[k];
    $("#tl" + k[0].toUpperCase() + k.slice(1)).value = t.light[k];
  });
  renderMenuBar();
  renderMenuAdmin();
}
$("#helpBtn").addEventListener("click", function () {
  return openModal("#helpModal");
});

/* ================= AUTH ================= */
$("#discreetLoginBtn").addEventListener("click", function () {
  if (state.isAdmin) openModal("#adminModal");else {
    openModal("#loginModal");
    setTimeout(function () {
      return $("#loginEmail").focus();
    }, 60);
  }
});
$("#adminPanelBtn").addEventListener("click", function () {
  return openModal("#adminModal");
});

// Enter no e-mail pula para a senha; Enter na senha envia
$("#loginEmail").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    $("#loginPass").focus();
  }
});
$("#loginPass").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    $("#loginForm").requestSubmit();
  }
});
function setLoginLoading(on) {
  var btn = $("#loginSubmit");
  btn.classList.toggle("is-loading", on);
  btn.disabled = on;
  $(".spinner", btn).hidden = !on;
  $(".btn-label", btn).textContent = on ? "Entrando..." : "Entrar";
}
$("#loginForm").addEventListener("submit", /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(e) {
    var err, email, _t4;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          e.preventDefault();
          err = $("#loginError");
          err.classList.add("hidden");
          if (firebaseReady) {
            _context4.n = 1;
            break;
          }
          err.textContent = "Firebase não configurado. Preencha as credenciais em app.js.";
          err.classList.remove("hidden");
          return _context4.a(2);
        case 1:
          email = $("#loginEmail").value.trim().toLowerCase();
          if (!(email !== ADMIN_EMAIL)) {
            _context4.n = 2;
            break;
          }
          err.textContent = "Acesso permitido somente ao administrador.";
          err.classList.remove("hidden");
          return _context4.a(2);
        case 2:
          setLoginLoading(true);
          _context4.p = 3;
          _context4.n = 4;
          return auth.signInWithEmailAndPassword(email, $("#loginPass").value);
        case 4:
          closeModal($("#loginModal"));
          $("#loginForm").reset();
          toast("Bem-vindo, admin!");
          openModal("#adminModal");
          _context4.n = 6;
          break;
        case 5:
          _context4.p = 5;
          _t4 = _context4.v;
          err.textContent = "E-mail ou senha inválidos.";
          err.classList.remove("hidden");
        case 6:
          _context4.p = 6;
          setLoginLoading(false);
          return _context4.f(6);
        case 7:
          return _context4.a(2);
      }
    }, _callee4, null, [[3, 5, 6, 7]]);
  }));
  return function (_x6) {
    return _ref9.apply(this, arguments);
  };
}());
$("#logoutBtn").addEventListener("click", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
  return _regenerator().w(function (_context5) {
    while (1) switch (_context5.n) {
      case 0:
        if (!auth) {
          _context5.n = 1;
          break;
        }
        _context5.n = 1;
        return auth.signOut();
      case 1:
        toast("Sessão encerrada.");
      case 2:
        return _context5.a(2);
    }
  }, _callee5);
})));
function applyAdminUI() {
  $("#adminPanelBtn").classList.toggle("hidden", !state.isAdmin);
  $("#logoutBtn").classList.toggle("hidden", !state.isAdmin);
  if (!state.isAdmin) closeModal($("#adminModal"));
}
if (firebaseReady) {
  auth.onAuthStateChanged(function (user) {
    state.isAdmin = !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL;
    applyAdminUI();
    renderAdminList();
  });
}

/* ================= TABS DO PAINEL ================= */
$$(".tab").forEach(function (t) {
  return t.addEventListener("click", function () {
    $$(".tab").forEach(function (x) {
      return x.classList.remove("active");
    });
    $$(".tabpanel").forEach(function (x) {
      return x.classList.remove("active");
    });
    t.classList.add("active");
    $("#" + t.dataset.tab).classList.add("active");
  });
});

/* ================= CADASTRO EM 3 ETAPAS ================= */
var TOTAL_STEPS = 3;
function showStep(n) {
  state.step = Math.min(TOTAL_STEPS, Math.max(1, n));
  $$(".form-step").forEach(function (f) {
    return f.classList.toggle("active", +f.dataset.step === state.step);
  });
  $$("#formSteps .step").forEach(function (s) {
    return s.classList.toggle("active", +s.dataset.step === state.step);
  });
  $("#stepPrev").disabled = state.step === 1;
  $("#stepNext").classList.toggle("hidden", state.step === TOTAL_STEPS);
  $("#formSave").classList.toggle("hidden", state.step !== TOTAL_STEPS);
}
$("#stepPrev").addEventListener("click", function () {
  return showStep(state.step - 1);
});
$("#stepNext").addEventListener("click", function () {
  if (state.step === 1 && !$("#fTitle").value.trim()) {
    formError("Informe o título do jogo.");
    return;
  }
  formError("");
  showStep(state.step + 1);
});
$$("#formSteps .step").forEach(function (s) {
  return s.addEventListener("click", function () {
    return showStep(+s.dataset.step);
  });
});
function writeError(ex) {
  var m = String(ex && ex.message || ex || "");
  if (/permission[_ ]denied/i.test(m)) {
    return "Permissão negada pelo Firebase. Entre como " + ADMIN_EMAIL + " e confira as regras do Realtime Database (games/settings com .write para esse e-mail).";
  }
  return m || "Erro desconhecido.";
}
function formError(msg) {
  var el = $("#formError");
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}
function nextCode() {
  var nums = state.games.map(function (g) {
    return String(g.code || "").match(/(\d+)\s*$/);
  }).filter(Boolean).map(function (m) {
    return +m[1];
  });
  var n = (nums.length ? Math.max.apply(Math, _toConsumableArray(nums)) : 0) + 1;
  return "GV-" + String(n).padStart(4, "0");
}
function resetForm() {
  $("#gameForm").reset();
  $("#gameId").value = "";
  $("#fPublished").checked = true;
  $("#fDownloadBlank").checked = true;
  $("#fSizeUnit").value = "GB";
  $("#fCode").value = nextCode();
  imgFields.cover.setValue("");
  formError("");
  showStep(1);
}
$("#formReset").addEventListener("click", resetForm);
function collectForm() {
  var val = parseFloat($("#fSizeValue").value);
  var unit = $("#fSizeUnit").value;
  var hasSize = !isNaN(val);
  return {
    title: $("#fTitle").value.trim(),
    code: $("#fCode").value.trim(),
    category: $("#fCategory").value.trim(),
    cover: imgFields.cover.getValue(),
    description: $("#fDesc").value.trim(),
    year: $("#fYear").value ? Number($("#fYear").value) : null,
    sizeMb: hasSize ? unit === "GB" ? val * 1024 : val : null,
    size: hasSize ? "".concat(val, " ").concat(unit) : "",
    platform: $("#fPlatform").value.trim(),
    rating: $("#fRating").value ? Number($("#fRating").value) : null,
    tags: $("#fTags").value.split(",").map(function (t) {
      return t.trim();
    }).filter(Boolean),
    download: $("#fDownload").value.trim(),
    downloadBlank: $("#fDownloadBlank").checked,
    requirements: $("#fReq").value.trim(),
    published: $("#fPublished").checked
  };
}
function fillForm(g) {
  $("#gameId").value = g.id;
  $("#fTitle").value = g.title || "";
  $("#fCode").value = g.code || "";
  $("#fCategory").value = g.category || "";
  imgFields.cover.setValue(g.cover || "");
  $("#fDesc").value = g.description || "";
  $("#fYear").value = g.year || "";
  var mb = sizeInMb(g);
  if (mb != null && mb >= 1024) {
    $("#fSizeValue").value = +(mb / 1024).toFixed(2);
    $("#fSizeUnit").value = "GB";
  } else if (mb != null) {
    $("#fSizeValue").value = Math.round(mb);
    $("#fSizeUnit").value = "MB";
  } else {
    $("#fSizeValue").value = "";
    $("#fSizeUnit").value = "GB";
  }
  $("#fPlatform").value = g.platform || "";
  $("#fRating").value = g.rating == null ? "" : g.rating;
  $("#fTags").value = (g.tags || []).join(", ");
  $("#fDownload").value = g.download || "";
  $("#fDownloadBlank").checked = g.downloadBlank !== false;
  $("#fReq").value = g.requirements || "";
  $("#fPublished").checked = g.published !== false;
  formError("");
  showStep(1);
  $$(".tab").forEach(function (x) {
    return x.classList.remove("active");
  });
  $$(".tabpanel").forEach(function (x) {
    return x.classList.remove("active");
  });
  $('.tab[data-tab="tab-new"]').classList.add("active");
  $("#tab-new").classList.add("active");
}
$("#gameForm").addEventListener("submit", /*#__PURE__*/function () {
  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(e) {
    var data, id, _t5;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          e.preventDefault();
          if (state.isAdmin) {
            _context6.n = 1;
            break;
          }
          formError("Somente o administrador pode salvar.");
          return _context6.a(2);
        case 1:
          data = collectForm();
          id = $("#gameId").value;
          if (data.title) {
            _context6.n = 2;
            break;
          }
          formError("Título é obrigatório.");
          showStep(1);
          return _context6.a(2);
        case 2:
          if (data.code) {
            _context6.n = 3;
            break;
          }
          formError("Código único é obrigatório.");
          showStep(1);
          return _context6.a(2);
        case 3:
          if (!state.games.some(function (g) {
            return g.id !== id && norm(g.code) === norm(data.code);
          })) {
            _context6.n = 4;
            break;
          }
          formError("Já existe um jogo com este código único.");
          showStep(1);
          return _context6.a(2);
        case 4:
          if (data.download) {
            _context6.n = 5;
            break;
          }
          formError("Link de download é obrigatório.");
          showStep(3);
          return _context6.a(2);
        case 5:
          _context6.p = 5;
          if (!id) {
            _context6.n = 7;
            break;
          }
          _context6.n = 6;
          return db.ref("games/" + id).update(data);
        case 6:
          _context6.n = 8;
          break;
        case 7:
          _context6.n = 8;
          return db.ref("games").push(_objectSpread(_objectSpread({}, data), {}, {
            createdAt: Date.now()
          }));
        case 8:
          toast(id ? "Jogo atualizado!" : "Jogo cadastrado!");
          resetForm();
          _context6.n = 10;
          break;
        case 9:
          _context6.p = 9;
          _t5 = _context6.v;
          formError("Erro ao salvar: " + writeError(_t5));
        case 10:
          return _context6.a(2);
      }
    }, _callee6, null, [[5, 9]]);
  }));
  return function (_x7) {
    return _ref1.apply(this, arguments);
  };
}());

/* ================= LISTA ADMIN ================= */
$("#adminSearch").addEventListener("input", function (e) {
  state.admQuery = norm(e.target.value);
  state.admPage = 1;
  renderAdminList();
});
$("#adminPerPage").addEventListener("change", function (e) {
  state.admPerPage = +e.target.value;
  state.admPage = 1;
  renderAdminList();
});
$("[data-adm-prev]").addEventListener("click", function () {
  state.admPage--;
  renderAdminList();
});
$("[data-adm-next]").addEventListener("click", function () {
  state.admPage++;
  renderAdminList();
});
function renderAdminList() {
  var list = state.games.filter(function (g) {
    return !state.admQuery || searchBlob(g).includes(state.admQuery);
  }).sort(function (a, b) {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  var per = state.admPerPage;
  var pages = Math.max(1, Math.ceil(list.length / per));
  if (state.admPage > pages) state.admPage = pages;
  var slice = list.slice((state.admPage - 1) * per, state.admPage * per);
  $("#adminList").innerHTML = slice.length ? slice.map(function (g) {
    return "\n      <div class=\"admin-item\">\n        <img src=\"".concat(esc(g.cover || ""), "\" alt=\"\" />\n        <div class=\"ai-main\">\n          <div class=\"ai-title\">").concat(esc(g.title || "Sem título")).concat(g.code ? " <span class=\"muted small\">\xB7 ".concat(esc(g.code), "</span>") : "", "</div>\n          <div class=\"ai-sub\"><span class=\"dot ").concat(g.published !== false ? "on" : "", "\"></span>").concat(esc(g.category || "sem categoria")).concat(g.platform ? " · " + esc(g.platform) : "").concat(g.year ? " · " + esc(g.year) : "", "</div>\n        </div>\n        <button class=\"btn btn-ghost\" data-edit=\"").concat(esc(g.id), "\">Editar</button>\n        <button class=\"btn btn-danger\" data-del=\"").concat(esc(g.id), "\">Excluir</button>\n      </div>");
  }).join("") : "<p class=\"muted small\">Nenhum jogo encontrado.</p>";
  $$("#adminList [data-edit]").forEach(function (b) {
    return b.addEventListener("click", function () {
      var g = state.games.find(function (x) {
        return x.id === b.dataset.edit;
      });
      if (g) fillForm(g);
    });
  });
  $$("#adminList [data-del]").forEach(function (b) {
    return b.addEventListener("click", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
      var _t6;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            if (confirm("Excluir este jogo definitivamente?")) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2);
          case 1:
            _context7.p = 1;
            _context7.n = 2;
            return db.ref("games/" + b.dataset.del).remove();
          case 2:
            toast("Jogo excluído.");
            _context7.n = 4;
            break;
          case 3:
            _context7.p = 3;
            _t6 = _context7.v;
            toast("Erro ao excluir: " + writeError(_t6));
          case 4:
            return _context7.a(2);
        }
      }, _callee7, null, [[1, 3]]);
    })));
  });
  $("[data-adm-info]").textContent = "P\xE1gina ".concat(state.admPage, " de ").concat(pages, " \xB7 ").concat(list.length, " jogo(s)");
  $("[data-adm-prev]").disabled = state.admPage <= 1;
  $("[data-adm-next]").disabled = state.admPage >= pages;
}

/* ================= IDENTIDADE / TEMA / AJUDA (salvar) ================= */
$("#brandForm").addEventListener("submit", /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(e) {
    var _t7;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.p = _context8.n) {
        case 0:
          e.preventDefault();
          if (state.isAdmin) {
            _context8.n = 1;
            break;
          }
          return _context8.a(2, toast("Somente admin."));
        case 1:
          _context8.p = 1;
          _context8.n = 2;
          return db.ref("settings").update({
            logoSquare: imgFields.logoSquare.getValue(),
            logoWord: imgFields.logoWord.getValue(),
            favicon: imgFields.favicon.getValue(),
            siteName: $("#bSiteName").value.trim(),
            heroTitle: $("#bHeroTitle").value.trim(),
            heroSubtitle: $("#bHeroSubtitle").value.trim(),
            footerText: $("#bFooter").value.trim()
          });
        case 2:
          toast("Identidade salva!");
          _context8.n = 4;
          break;
        case 3:
          _context8.p = 3;
          _t7 = _context8.v;
          toast("Erro ao salvar identidade: " + writeError(_t7));
        case 4:
          return _context8.a(2);
      }
    }, _callee8, null, [[1, 3]]);
  }));
  return function (_x8) {
    return _ref11.apply(this, arguments);
  };
}());
function collectTheme() {
  var pick = function pick(p) {
    return {
      bg: $("#" + p + "Bg").value,
      surface: $("#" + p + "Surface").value,
      border: $("#" + p + "Border").value,
      text: $("#" + p + "Text").value,
      primary: $("#" + p + "Primary").value,
      accent: $("#" + p + "Accent").value
    };
  };
  return {
    defaultTheme: $("#tDefault").value,
    allowToggle: $("#tAllowToggle").checked,
    font: $("#tFont").value,
    radius: Number($("#tRadius").value) || 14,
    dark: pick("td"),
    light: pick("tl")
  };
}

// pré-visualização ao vivo
$("#themeForm").addEventListener("input", function () {
  var backup = state.settings.theme;
  state.settings.theme = collectTheme();
  applyTheme();
  state.settings.theme = backup;
});
$("#themeForm").addEventListener("submit", /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(e) {
    var _t8;
    return _regenerator().w(function (_context9) {
      while (1) switch (_context9.p = _context9.n) {
        case 0:
          e.preventDefault();
          if (state.isAdmin) {
            _context9.n = 1;
            break;
          }
          return _context9.a(2, toast("Somente admin."));
        case 1:
          _context9.p = 1;
          _context9.n = 2;
          return db.ref("settings/theme").set(collectTheme());
        case 2:
          toast("Personalização salva!");
          _context9.n = 4;
          break;
        case 3:
          _context9.p = 3;
          _t8 = _context9.v;
          toast("Erro ao salvar personalização: " + writeError(_t8));
        case 4:
          return _context9.a(2);
      }
    }, _callee9, null, [[1, 3]]);
  }));
  return function (_x9) {
    return _ref12.apply(this, arguments);
  };
}());
$("#themeReset").addEventListener("click", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
  var _t9;
  return _regenerator().w(function (_context0) {
    while (1) switch (_context0.p = _context0.n) {
      case 0:
        if (state.isAdmin) {
          _context0.n = 1;
          break;
        }
        return _context0.a(2, toast("Somente admin."));
      case 1:
        _context0.p = 1;
        _context0.n = 2;
        return db.ref("settings/theme").set(DEFAULT_THEME);
      case 2:
        toast("Tema restaurado.");
        _context0.n = 4;
        break;
      case 3:
        _context0.p = 3;
        _t9 = _context0.v;
        toast("Erro ao restaurar tema: " + writeError(_t9));
      case 4:
        return _context0.a(2);
    }
  }, _callee0, null, [[1, 3]]);
})));
$("#helpForm").addEventListener("submit", /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(e) {
    var _t0;
    return _regenerator().w(function (_context1) {
      while (1) switch (_context1.p = _context1.n) {
        case 0:
          e.preventDefault();
          if (state.isAdmin) {
            _context1.n = 1;
            break;
          }
          return _context1.a(2, toast("Somente admin."));
        case 1:
          _context1.p = 1;
          _context1.n = 2;
          return db.ref("settings").update({
            help: $("#hContent").value
          });
        case 2:
          toast("Ajuda salva!");
          _context1.n = 4;
          break;
        case 3:
          _context1.p = 3;
          _t0 = _context1.v;
          toast("Erro ao salvar ajuda: " + writeError(_t0));
        case 4:
          return _context1.a(2);
      }
    }, _callee1, null, [[1, 3]]);
  }));
  return function (_x0) {
    return _ref14.apply(this, arguments);
  };
}());

/* ================= BACKUP ================= */
function log(msg) {
  $("#backupLog").textContent = msg;
}
$("#exportBtn").addEventListener("click", function () {
  var payload = {
    _meta: {
      app: "Workin'Store | Bônus",
      version: 2,
      exportedAt: new Date().toISOString()
    },
    settings: state.settings || {},
    games: state.games.reduce(function (acc, g) {
      var id = g.id,
        rest = _objectWithoutProperties(g, _excluded);
      acc[id] = rest;
      return acc;
    }, {})
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Workin'Store - B\xF4nus-backup-".concat(new Date().toISOString().slice(0, 10), ".json");
  a.click();
  URL.revokeObjectURL(a.href);
  log("Exportado: ".concat(state.games.length, " jogo(s) + menus/identidade/tema/ajuda."));
});
$("#importFile").addEventListener("change", /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(e) {
    var file, data, games, gameList, mode, map, _iterator, _step, g, id, rest, _t1, _t10, _t11;
    return _regenerator().w(function (_context10) {
      while (1) switch (_context10.p = _context10.n) {
        case 0:
          file = e.target.files[0];
          if (file) {
            _context10.n = 1;
            break;
          }
          return _context10.a(2);
        case 1:
          if (state.isAdmin) {
            _context10.n = 2;
            break;
          }
          log("Somente o administrador pode importar.");
          e.target.value = "";
          return _context10.a(2);
        case 2:
          _context10.p = 2;
          _t1 = JSON;
          _context10.n = 3;
          return file.text();
        case 3:
          data = _t1.parse.call(_t1, _context10.v);
          games = data.games || {};
          gameList = Array.isArray(games) ? games : Object.entries(games).map(function (_ref16) {
            var _ref17 = _slicedToArray(_ref16, 2),
              id = _ref17[0],
              g = _ref17[1];
            return _objectSpread({
              id: id
            }, g);
          });
          if (!(!gameList.length && !data.settings)) {
            _context10.n = 4;
            break;
          }
          throw new Error("Arquivo sem dados reconhecíveis.");
        case 4:
          mode = $("#importMode").value;
          if (!(mode === "replace" && !confirm("Substituir TODOS os dados atuais? Esta ação não pode ser desfeita."))) {
            _context10.n = 5;
            break;
          }
          e.target.value = "";
          return _context10.a(2);
        case 5:
          if (!(mode === "replace")) {
            _context10.n = 8;
            break;
          }
          map = {};
          gameList.forEach(function (g, i) {
            var id = g.id,
              rest = _objectWithoutProperties(g, _excluded2);
            map[id || "imp_".concat(Date.now(), "_").concat(i)] = rest;
          });
          _context10.n = 6;
          return db.ref("games").set(map);
        case 6:
          if (!data.settings) {
            _context10.n = 7;
            break;
          }
          _context10.n = 7;
          return db.ref("settings").set(data.settings);
        case 7:
          _context10.n = 18;
          break;
        case 8:
          _iterator = _createForOfIteratorHelper(gameList);
          _context10.p = 9;
          _iterator.s();
        case 10:
          if ((_step = _iterator.n()).done) {
            _context10.n = 14;
            break;
          }
          g = _step.value;
          id = g.id, rest = _objectWithoutProperties(g, _excluded3);
          if (!id) {
            _context10.n = 12;
            break;
          }
          _context10.n = 11;
          return db.ref("games/" + id).update(rest);
        case 11:
          _context10.n = 13;
          break;
        case 12:
          _context10.n = 13;
          return db.ref("games").push(_objectSpread(_objectSpread({}, rest), {}, {
            createdAt: Date.now()
          }));
        case 13:
          _context10.n = 10;
          break;
        case 14:
          _context10.n = 16;
          break;
        case 15:
          _context10.p = 15;
          _t10 = _context10.v;
          _iterator.e(_t10);
        case 16:
          _context10.p = 16;
          _iterator.f();
          return _context10.f(16);
        case 17:
          if (!data.settings) {
            _context10.n = 18;
            break;
          }
          _context10.n = 18;
          return db.ref("settings").update(data.settings);
        case 18:
          log("Importa\xE7\xE3o conclu\xEDda (".concat(mode === "replace" ? "substituição" : "mesclagem", "): ").concat(gameList.length, " jogo(s)."));
          toast("Backup importado!");
          _context10.n = 20;
          break;
        case 19:
          _context10.p = 19;
          _t11 = _context10.v;
          log("Erro na importação: " + _t11.message);
        case 20:
          _context10.p = 20;
          e.target.value = "";
          return _context10.f(20);
        case 21:
          return _context10.a(2);
      }
    }, _callee10, null, [[9, 15, 16, 17], [2, 19, 20, 21]]);
  }));
  return function (_x1) {
    return _ref15.apply(this, arguments);
  };
}());

/* ================= BOOT ================= */
applyTheme();
renderSettings();
renderFilterOptions();
renderGames();
showStep(1);
renderAdminList();
$("#fCode").value = nextCode();
if (firebaseReady) {
  db.ref("games").on("value", function (snap) {
    var val = snap.val() || {};
    state.games = Object.entries(val).map(function (_ref18) {
      var _ref19 = _slicedToArray(_ref18, 2),
        id = _ref19[0],
        g = _ref19[1];
      return _objectSpread({
        id: id
      }, g);
    });
    renderFilterOptions();
    renderGames();
    renderAdminList();
    if (!$("#gameId").value) $("#fCode").value = nextCode();
  }, function (err) {
    return console.warn("Leitura de games falhou:", err.message);
  });
  db.ref("settings").on("value", function (snap) {
    state.settings = snap.val() || {};
    renderSettings();
    renderGames();
  }, function (err) {
    return console.warn("Leitura de settings falhou:", err.message);
  });
}
