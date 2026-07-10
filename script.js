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
