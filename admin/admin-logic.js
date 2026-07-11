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

window.add = (path) => {
    const data = { title: document.getElementById('t').value, url: document.getElementById('u').value };
    if(path === 'servicos') { data.desc = document.getElementById('d').value; data.logo = document.getElementById('l').value; }
    firebase.database().ref(path).push(data).then(() => { alert("Adicionado!"); location.reload(); });
};

window.del = (p, k) => {
    firebase.database().ref(p + '/' + k).remove().then(() => { alert("Apagado!"); location.reload(); });
};
