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

// Login com Feedback
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.innerText = "Autenticando..."; btn.disabled = true;
        firebase.auth().signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('pass').value)
            .then(() => window.location.href = "painel.html")
            .catch(err => { alert(err.message); btn.innerText = "Autenticar"; btn.disabled = false; });
    });
}

// CRUD Painel
window.add = (path) => {
    const t = document.getElementById('t').value;
    const url = document.getElementById('u').value;
    const obj = { title: t, url: url };
    if(path === 'servicos') { obj.desc = document.getElementById('d').value; obj.logo = document.getElementById('l').value; }
    firebase.database().ref(path).push(obj).then(() => alert("Adicionado!"));
};

window.del = (p, k) => {
    firebase.database().ref(p + '/' + k).remove().then(() => alert("Removido!"));
};

window.render = (path) => {
    firebase.database().ref(path).on('value', snap => {
        const list = document.getElementById('list'); list.innerHTML = '';
        snap.forEach(c => {
            list.innerHTML += `<div style="display:flex; justify-content:space-between; background:#222; padding:10px; margin:5px;">
            ${c.val().title} <button style="width:auto; background:red" onclick="del('${path}','${c.key}')">X</button></div>`;
        });
    });
};
