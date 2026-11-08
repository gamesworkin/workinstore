// Alternância de temas: Padrão (escuro + azul) → Alternativo (preto + verde) → Claro (branco + azul)
(function () {
    var THEMES = [
        { id: 'padrao', label: 'Padrão', icon: '🌙' },
        { id: 'alternativo', label: 'Alternativo', icon: '🟢' },
        { id: 'claro', label: 'Claro', icon: '☀️' }
    ];
    var KEY = 'gw-theme';

    function current() {
        var t = document.documentElement.getAttribute('data-theme');
        for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === t) return i;
        return 0;
    }

    function apply(index, btn) {
        var t = THEMES[index];
        document.documentElement.setAttribute('data-theme', t.id);
        try { localStorage.setItem(KEY, t.id); } catch (e) {}
        if (btn) {
            btn.querySelector('.theme-dot').textContent = t.icon;
            btn.querySelector('.theme-label').textContent = 'Tema: ' + t.label;
            btn.setAttribute('aria-label', 'Trocar tema (atual: ' + t.label + ')');
        }
    }

    function init() {
        var btn = document.getElementById('btn-theme-toggle');
        if (!btn) return;
        apply(current(), btn);
        btn.addEventListener('click', function (ev) {
            var next = (current() + 1) % THEMES.length;
            document.body.classList.add('theme-switching');
            apply(next, btn);

            btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');

            var r = btn.getBoundingClientRect();
            var wave = document.createElement('span');
            wave.className = 'theme-wave';
            wave.style.left = (r.left + 22 - 10) + 'px';
            wave.style.top = (r.top + r.height / 2 - 10) + 'px';
            document.body.appendChild(wave);
            setTimeout(function () { wave.remove(); }, 750);
            setTimeout(function () { document.body.classList.remove('theme-switching'); }, 600);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
