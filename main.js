// main.js - Portal Principal
const config = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };
if (!firebase.apps.length) firebase.initializeApp(config);

const db = firebase.database();
db.ref().on('value', snap => {
    const data = snap.val();
    const nav = document.getElementById('nav-header'), grid = document.getElementById('grid');
    if(nav) nav.innerHTML = '<a href="index.html" class="nav-link">HOME</a>';
    if(grid) grid.innerHTML = '';
    
    if(data.header) Object.values(data.header).forEach(i => nav.innerHTML += `<a href="${i.url}" class="nav-link">${i.title}</a>`);
    if(data.servicos) Object.entries(data.servicos).forEach(([key, i]) => {
        const div = document.createElement('div'); div.className = 'card';
        div.innerHTML = `<h2>${i.title}</h2><p>${i.desc}</p>`;
        div.onclick = () => {
            const m = document.getElementById('modal');
            m.style.display = 'flex';
            m.innerHTML = `<div class="modal-content"><h2>${i.title}</h2><p style="margin:20px 0">${i.desc}</p><a href="${i.url}"><button>ACESSAR</button></a><button style="background:#444" onclick="document.getElementById('modal').style.display='none'">FECHAR</button></div>`;
        };
        grid.appendChild(div);
    });
});
