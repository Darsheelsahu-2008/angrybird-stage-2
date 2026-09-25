// DOM UI: HUD, 99-level select, win/lose overlays, title screen.
// Kept out of the canvas on purpose — text stays crisp and selectable, and the
// retro pass would have quantised it into mush.

const UI = {
    el: {},

    init() {
        const id = s => document.getElementById(s);
        this.el = {
            hud: id('hud'),
            level: id('hud-level'),
            score: id('hud-score'),
            birds: id('hud-birds'),
            overlay: id('overlay'),
            panel: id('panel'),
            select: id('select'),
            title: id('title')
        };
        this.buildLevelGrid();
        this.show('title');
    },

    // ---- screens -----------------------------------------------------------
    show(which) {
        const t = this.el.title, s = this.el.select, o = this.el.overlay;
        t.classList.toggle('on', which === 'title');
        s.classList.toggle('on', which === 'select');
        o.classList.toggle('on', which === 'overlay');
        this.el.hud.classList.toggle('on', which === 'play');
        document.getElementById('stage').classList.toggle('dim', which !== 'play');
    },

    showEnd(state) {
        const won = state === 'won', all = state === 'allwon';
        const stars = all ? Game.totalStars() : (Game.progress.stars[Game.level] || 0);
        const best = Game.progress.best[Game.level] || 0;
        const title = all ? 'ALL 99 CLEARED' : won ? 'LEVEL CLEAR' : 'OUT OF BIRDS';
        const body = all
            ? `You finished every level.<br><span class="dimtxt">${stars} / ${MAX_LEVELS * 3} stars</span>`
            : won
                ? `<div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                   <div>${Game.score.toLocaleString()} pts${best > Game.score ? ' · best ' + best.toLocaleString() : ''}</div>`
                : `<div>The pigs survived. <span class="dimtxt">Level ${Game.level}</span></div>`;

        this.el.panel.innerHTML = `
            <h2>${title}</h2>
            <div class="panel-body">${body}</div>
            <div class="btns">
                ${won && !all ? '<button data-act="next">Next Level ▶</button>' : ''}
                <button data-act="retry">Retry</button>
                <button data-act="select">Levels</button>
            </div>`;
        this.el.overlay.classList.toggle('win', won);
        this.el.overlay.classList.toggle('fail', !won);
        this.show('overlay');
        this.sync();
    },

    buildLevelGrid() {
        const grid = document.getElementById('grid');
        let html = '';
        for (let n = 1; n <= MAX_LEVELS; n++) {
            html += `<button class="lvl" data-lvl="${n}">${n}<i></i></button>`;
        }
        grid.innerHTML = html;
        grid.addEventListener('click', e => {
            const b = e.target.closest('.lvl');
            if (!b || b.classList.contains('locked')) return;
            Game.loadLevel(+b.dataset.lvl);
            this.show('play');
        });
    },

    sync() {
        const p = Game.progress;
        if (!p) return;
        this.el.level.textContent = Game.level + '/' + MAX_LEVELS;
        this.el.score.textContent = Game.score.toLocaleString();
        const ready = Game.birdsLeft + (Game.bird ? 1 : 0);   // includes the bird on the sling
        this.el.birds.innerHTML = '●'.repeat(Math.max(0, ready))
                                + '○'.repeat(Math.max(0, (Game.spec ? Game.spec.birds : 0) - ready));
        document.getElementById('progress').textContent =
            `LEVEL ${Game.level} · ${p.unlocked}/${MAX_LEVELS} UNLOCKED · ${Game.totalStars()}★`;

        for (const b of document.querySelectorAll('.lvl')) {
            const n = +b.dataset.lvl;
            const locked = n > p.unlocked;
            b.classList.toggle('locked', locked);
            b.classList.toggle('done', !!p.stars[n]);
            b.querySelector('i').textContent = p.stars[n] ? '★'.repeat(p.stars[n]) : '';
        }
    }
};

// ---- wiring -----------------------------------------------------------------
function uiAction(act) {
    if (act === 'next') { Game.loadLevel(Game.level + 1); UI.show('play'); }
    else if (act === 'retry') { Game.loadLevel(Game.level); UI.show('play'); }
    else if (act === 'select') { UI.sync(); UI.show('select'); }
    else if (act === 'play') { Game.loadLevel(Game.progress.unlocked); UI.show('play'); }
    else if (act === 'title') { UI.show('title'); }
}

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    document.getElementById('panel').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (b) uiAction(b.dataset.act);
    });
    document.getElementById('select').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (b) uiAction(b.dataset.act);
    });
    document.getElementById('title').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (b) uiAction(b.dataset.act);
    });
    document.addEventListener('keydown', e => {
        if (Game.keyPressed(e.key)) e.preventDefault();
        if (e.key === 'Escape') { UI.show('select'); }
    });
});
