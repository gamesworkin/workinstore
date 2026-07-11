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

window.add = (path) => {
    const data = { title: document.getElementById('t').value, url: document.getElementById('u').value };
    if(path === 'servicos') { data.desc = document.getElementById('d').value; }
    firebase.database().ref(path).push(data).then(() => alert("Adicionado!"));
};

// Exclusão corrigida: referencia direta
window.del = (p, k) => {
    firebase.database().ref(p + '/' + k).remove().then(() => alert("Apagado!"));
};

// Renderização única sem duplicação
firebase.database().ref().on('value', snap => {
    const list = document.getElementById('list');
    if(!list) return;
    list.innerHTML = '';
    ['header', 'servicos'].forEach(path => {
        if(snap.val()[path]) Object.entries(snap.val()[path]).forEach(([k, v]) => {
            list.innerHTML += `<div class="card" style="display:flex; justify-content:space-between; margin:10px;">${v.title} <button style="background:red" onclick="del('${path}','${k}')">APAGAR</button></div>`;
        });
    });
});
