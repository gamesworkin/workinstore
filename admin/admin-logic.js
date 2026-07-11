// Certifique-se de preencher abaixo com seu config real
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };
firebase.initializeApp(firebaseConfig);

const form = document.getElementById('login-form');
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    btn.innerText = "Autenticando...";
    try {
        await firebase.auth().signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('pass').value);
        window.location.href = "painel.html";
    } catch(err) { alert(err.message); btn.innerText = "Autenticar"; }
});


// Exportar Backup
function exportJSON() {
    firebase.database().ref('/').once('value').then(snap => {
        const data = JSON.stringify(snap.val());
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'backup.json'; a.click();
    });
}

function importJSON(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        firebase.database().ref('/').set(data).then(() => alert("Backup importado com sucesso!"));
    };
    reader.readAsText(file);
}



