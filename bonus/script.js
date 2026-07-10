const bar = document.getElementById('pb'); 
const pct = document.getElementById('percent');
let val = 0;

function update() {
    val += 0.8; // Velocidade do carregamento
    
    if(val >= 100) {
        val = 100;
        bar.style.width = val + '%';
        pct.innerText = '100%';
        
        // Aguarda 1 segundo antes de reiniciar
        setTimeout(() => {
            val = 0;
            update();
        }, 1000);
    } else {
        bar.style.width = val + '%';
        pct.innerText = Math.floor(val) + '%';
        requestAnimationFrame(update);
    }
}

update();

// Efeito de pulsação suave no botão do WhatsApp
const waButton = document.querySelector('.whatsapp-float');
if (waButton) {
    waButton.style.animation = "pulse 2s infinite";
    
    // Injetando o keyframe da animação via JS para não precisar mexer no CSS
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
    `;
    document.head.appendChild(style);
}
