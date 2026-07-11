// Certifique-se de preencher abaixo com seu config real 
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

window.add = (path) => {
    const t = document.getElementById('t').value, d = document.getElementById('d').value, u = document.getElementById('u').value;
    db.ref(path).push({ title: t, desc: d, url: u }).then(() => alert("Adicionado!"));
};

window.del = (p, k) => db.ref(p + '/' + k).remove().then(() => alert("Apagado!"));

// Renderiza Painel sem duplicação
db.ref().on('value', snap => {
    const list = document.getElementById('list');
    if(!list) return;
    list.innerHTML = '';
    ['header', 'servicos'].forEach(path => {
        if(snap.val()[path]) Object.entries(snap.val()[path]).forEach(([k, v]) => {
            list.innerHTML += `<div class="card" style="margin:10px 0; display:flex; justify-content:space-between;">
            ${v.title} <button style="width:auto; background:red" onclick="del('${path}','${k}')">APAGAR</button></div>`;
        });
    });
});
