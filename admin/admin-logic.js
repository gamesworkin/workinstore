// Certifique-se de preencher abaixo com seu config real
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// Lógica de Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('pass').value;
        firebase.auth().signInWithEmailAndPassword(email, pass)
            .then(() => window.location.href = "painel.html")
            .catch(err => alert("Erro: " + err.message));
    });
}

// Lógica do Painel
if (window.location.pathname.includes('painel.html')) {
    firebase.auth().onAuthStateChanged(user => { if (!user) window.location.href = "index.html"; });
    
    window.add = (path) => {
        const data = { title: document.getElementById('t').value, url: document.getElementById('u').value };
        if(path === 'servicos') { data.desc = document.getElementById('d').value; data.logo = document.getElementById('l').value; }
        firebase.database().ref(path).push(data).then(() => alert("Adicionado!"));
    };

    window.del = (p, k) => firebase.database().ref(p + '/' + k).remove();

    window.render = (path) => {
        firebase.database().ref(path).on('value', snap => {
            const list = document.getElementById('list');
            list.innerHTML = '';
            snap.forEach(c => {
                list.innerHTML += `<div class="item-row">${c.val().title} <button style="width:auto;background:red" onclick="del('${path}','${c.key}')">X</button></div>`;
            });
        });
    };
}
