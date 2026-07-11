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

function addHeader() {
    firebase.database().ref('header/').push({title: document.getElementById('h-title').value, url: document.getElementById('h-url').value});
    alert("Adicionado!");
}

function addService() {
    firebase.database().ref('servicos/').push({
        title: document.getElementById('s-title').value,
        desc: document.getElementById('s-desc').value,
        url: document.getElementById('s-url').value,
        logo: document.getElementById('s-logo').value
    });
    alert("Serviço salvo!");
}

function exportJSON() {
    firebase.database().ref('/').once('value').then(snap => {
        const a = document.createElement('a');
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snap.val()));
        a.download = "backup.json"; a.click();
    });
}

function importJSON(e) {
    const reader = new FileReader();
    reader.onload = (ev) => firebase.database().ref('/').set(JSON.parse(ev.target.result)).then(() => alert("Importado!"));
    reader.readAsText(e.target.files[0]);
}

function logout() { firebase.auth().signOut().then(() => window.location.href = "index.html"); }
