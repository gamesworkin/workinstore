const qrCode = new QRCodeStyling({ 
    width: 250,  
    height: 250, 
    dotsOptions: { type: "extra-rounded" },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 }
});
qrCode.append(document.getElementById("qrPreview"));

const dynamicInputs = document.getElementById('dynamicInputs');
const qrType = document.getElementById('qrType');

const templates = {
    url: '<input type="text" id="mainVal" placeholder="URL ou Texto">',
    wifi: '<input type="text" id="wifiSSID" placeholder="Nome da rede (SSID)"><input type="password" id="wifiPass" placeholder="Senha">',
    vcard: '<input type="text" id="vName" placeholder="Nome"><input type="tel" id="vTel" placeholder="Telefone">',
    whatsapp: '<input type="text" id="waNum" placeholder="Número (com DDD)">',
    location: '<input type="text" id="lat" placeholder="Latitude"><input type="text" id="lng" placeholder="Longitude">'
};

function updateFields() { dynamicInputs.innerHTML = templates[qrType.value] || ""; }
qrType.addEventListener('change', updateFields);
updateFields();

function getBaseConfig() {
    let data = "";
    const type = qrType.value;
    if (type === 'url') data = document.getElementById('mainVal').value;
    else if (type === 'wifi') data = `WIFI:T:WPA;S:${document.getElementById('wifiSSID').value};P:${document.getElementById('wifiPass').value};;`;
    else if (type === 'vcard') data = `BEGIN:VCARD\nFN:${document.getElementById('vName').value}\nTEL:${document.getElementById('vTel').value}\nEND:VCARD`;
    else if (type === 'whatsapp') data = `https://wa.me/${document.getElementById('waNum').value}`;
    else if (type === 'location') data = `geo:${document.getElementById('lat').value},${document.getElementById('lng').value}`;
    
    return {
        data: data,
        dotsOptions: { color: document.getElementById('dotColor').value, type: document.getElementById('dotStyle').value }
    };
}

document.getElementById('generateBtn').addEventListener('click', () => {
    const config = getBaseConfig();
    config.width = 250;
    config.height = 250;
    const logoFile = document.getElementById('logoUpload').files[0];
    if (logoFile) {
        const reader = new FileReader();
        reader.onload = (e) => { config.image = e.target.result; qrCode.update(config); };
        reader.readAsDataURL(logoFile);
    } else { qrCode.update(config); }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const size = parseInt(document.getElementById('resSelect').value);
    const config = getBaseConfig();
    const logoFile = document.getElementById('logoUpload').files[0];
    
    config.width = size;
    config.height = size;
    
    if (logoFile) {
        const reader = new FileReader();
        reader.onload = (e) => { 
            config.image = e.target.result;
            qrCode.update(config);
            setTimeout(() => { 
                qrCode.download({ name: "qr-workin-hq", extension: "png" }); 
                qrCode.update({ width: 250, height: 250 }); // Volta ao normal após o clique
            }, 500);
        };
        reader.readAsDataURL(logoFile);
    } else {
        qrCode.update(config);
        setTimeout(() => { 
            qrCode.download({ name: "qr-workin-hq", extension: "png" }); 
            qrCode.update({ width: 250, height: 250 }); // Volta ao normal
        }, 500);
    }
});
