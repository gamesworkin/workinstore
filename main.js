// main.js - Portal Principal
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

firebase.database().ref().on('value', snap => {
    const data = snap.val();
    const nav = document.getElementById('nav-header');
    const grid = document.getElementById('grid');
    if(nav) nav.innerHTML = ''; 
    if(grid) grid.innerHTML = '';
    
    if(data.header) Object.values(data.header).forEach(i => nav.innerHTML += `<a href="${i.url}" style="color:#fff; margin:0 10px; text-decoration:none">${i.title}</a>`);
    if(data.servicos) Object.values(data.servicos).forEach(i => grid.innerHTML += `<div class="card"><h3>${i.title}</h3><p>${i.desc}</p><a href="${i.url}">Acessar</a></div>`);
});
