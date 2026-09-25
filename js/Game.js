// Game core: level lifecycle, sling input, impact damage, scoring, progress.
//
// Design note: physics runs on a FIXED 16.666ms step, not p5's deltaTime. The
// trajectory preview integrates the same constant, so the dotted line is
// truthful; a variable step would make the preview lie and change outcomes
// depending on frame rate.
// ponytail: per-frame collision checks are event-driven (collisionStart), not an
// O(n^2) proximity scan, so a 40-body level costs the same as a 5-body one.

const Engine = Matter.Engine;
const World= Matter.World;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;

// The play area. Kept as numbers rather than p5's width/height so the rules
// work in the self-test page, which has no canvas.
const WORLD = { w: 1200, h: 400, groundTop: 390, killMargin: 90 };
// power 0.20 is measured, not guessed: with the bird's drag off, a 95px pull at
// 30deg lands at x=1116, which covers every target the generator places
// (max x=1070). At 0.17 it only reached 809, so the right-hand tower of every
// late level was literally unhittable.
const SLING = { x: 165, y: 300, maxPull: 95, power: 0.20 };
const STEP = 1000 / 60;
const DAMAGE = { minImpact: 5, scale: 26 };
const ARMOUR = { pig: 1, wood: 0.8, stone: 0.55 };
const BIRD_BONUS = 2500;
// Sprite cache. Declared here (not in sketch.js) because the entity classes read
// it and the self-test page loads the game without the p5 entry point.
const SPRITES = { base:null, bg:null, bird:null, wood1:null, wood2:null,
                  enemy:null, enemy_big:null, stone:null };
const SAVE_KEY = 'angrybird.v1';
const Events = Matter.Events;

const Game = {
    state: 'title',            // title | select | play | won | lost | allwon
    level: 1,
    spec: null,
    score: 0,
    birdsLeft: 0,
    pigsLeft: 0,
    entities: [],
    particles: [],
    bird: null,
    dragging: false,
    dragX: SLING.x,
    dragY: SLING.y,
    shake: 0,
    quietFrames: 0,
    shotFrames: 0,
    showAim: false,
    progress: null,

    // Gravity in px/step^2, measured off Matter 0.19. The self-test re-measures
    // it and fails if the engine ever changes, so the constant can't rot.
    gravityPerStep: 0.5528,

    init() {
        this.progress = this.loadProgress();
        Events.on(engine, 'collisionStart', e => this.onCollision(e));
    },

    // ---- persistence -------------------------------------------------------
    loadProgress() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                p.stars = p.stars || {};
                p.best = p.best || {};
                return p;
            }
        } catch (e) { /* private mode / file:// — play unsaved */ }
        return { unlocked: 1, stars: {}, best: {} };
    },
    saveProgress() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress)); } catch (e) {}
    },
    totalStars() {
        return Object.keys(this.progress.stars).reduce((a, k) => a + this.progress.stars[k], 0);
    },

    // ---- level lifecycle ---------------------------------------------------
    loadLevel(n) {
        this.level = Math.max(1, Math.min(MAX_LEVELS, n));
        this.clearWorld();
        this.spec = levelSpec(this.level);
        this.score = 0;
        this.particles = [];
        this.shake = 0;
        this.quietFrames = 0;
        this.shotFrames = 0;
        this.bird = null;
        this.dragging = false;

        for (const l of this.spec.ledges) this.add(new Ground(l.x, l.y, l.w, l.h));
        for (const b of this.spec.blocks) this.add(new Box(b.x, b.y, b.w, b.h, b.m));
        for (const l of this.spec.logs) this.add(new Log(l.x, l.y, l.len, l.a));
        for (const p of this.spec.pigs) this.add(new Pig(p.x, p.y, p.big));

        this.pigsLeft = this.spec.pigs.length;
        this.birdsLeft = this.spec.birds;
        this.state = 'play';
        this.nextBird();
        UI.sync();
    },

    clearWorld() {
        // Keep the permanent ground in the list (it still has to be drawn);
        // drop everything else, or last level's ledges pile up in the world.
        this.entities = this.entities.filter(e => {
            if (!e.permanent) World.remove(world, e.body);
            return e.permanent;
        });
    },

    add(e) { this.entities.push(e); return e; },

    nextBird() {
        if (this.birdsLeft <= 0) { this.bird = null; return null; }
        this.birdsLeft--;
        const b = this.add(new Bird(SLING.x, SLING.y));
        b.mode = 'sling';
        Matter.Body.setStatic(b.body, true);
        this.bird = b;
        return b;
    },

    // ---- input -------------------------------------------------------------
    pointerDown() {
        if (this.state !== 'play' || !this.bird || this.bird.mode !== 'sling') return;
        const d = Math.hypot(mouseX - SLING.x, mouseY - SLING.y);
        if (d > 70) return;                      // clicked too far from the sling
        this.dragging = true;
        this.bird.mode = 'drag';
        this.moveDragged();
    },
    pointerDrag() { if (this.dragging) this.moveDragged(); },
    moveDragged() {
        let dx = mouseX - SLING.x, dy = mouseY - SLING.y;
        const d = Math.hypot(dx, dy);
        if (d > SLING.maxPull) { dx = dx / d * SLING.maxPull; dy = dy / d * SLING.maxPull; }
        this.dragX = SLING.x + dx;
        this.dragY = SLING.y + dy;
    },
    pointerUp() {
        if (!this.dragging) return;
        this.dragging = false;
        const pull = Math.hypot(SLING.x - this.dragX, SLING.y - this.dragY);
        if (pull < 12 || !this.bird) {          // too weak a pull: put it back
            this.bird.mode = 'sling';
            Matter.Body.setPosition(this.bird.body, { x: SLING.x, y: SLING.y });
            return;
        }
        Matter.Body.setStatic(this.bird.body, false);
        Matter.Body.setVelocity(this.bird.body, {
            x: (SLING.x - this.dragX) * SLING.power,
            y: (SLING.y - this.dragY) * SLING.power
        });
        this.bird.mode = 'fly';
        this.quietFrames = 0;
        this.shotFrames = 0;
        this.showAim = false;
    },
    // ---- damage ------------------------------------------------------------
    onCollision(e) {
        for (const pair of e.pairs) {
            const A = pair.bodyA.plugin && pair.bodyA.plugin.entity;
            const B = pair.bodyB.plugin && pair.bodyB.plugin.entity;
            if (!A || !B || !A.alive || !B.alive) continue;
            const av = A.body.velocity, bv = B.body.velocity;
            const rel = Math.hypot(av.x - bv.x, av.y - bv.y);
            if (rel < DAMAGE.minImpact) continue;
            const base = (rel - DAMAGE.minImpact) * DAMAGE.scale;
            this.applyDamage(A, base, B);
            this.applyDamage(B, base, A);
            this.shake = Math.min(6, this.shake + Math.min(3, (rel - 5) * 0.25));
        }
    },
    applyDamage(target, amount, source) {
        if (!target.alive || !target.kind) return;
        const armour = ARMOUR[target.material || target.kind] || 1;
        if (target.kind === 'bird') {
            // A bird body-check knocks things around; Bird.takeDamage is a no-op.
            Matter.Body.applyForce(target.body, target.body.position, {
                x: (source.body.position.x - target.body.position.x) * 0.0006,
                y: (source.body.position.y - target.body.position.y) * 0.0006
            });
        }
        target.takeDamage(amount * armour);
    },

    onEntityDestroyed(entity) {
        if (entity.kind === 'pig') {
            this.pigsLeft--;
            this.score += entity.score;
            this.burst(entity.body.position.x, entity.body.position.y, [140, 214, 90], 22);
            this.shake = Math.min(8, this.shake + 4);
        } else if (entity.kind === 'box') {
            this.score += entity.score;
            this.burst(entity.body.position.x, entity.body.position.y,
                       MATERIALS[entity.material].colour, 14);
        }
        UI.sync();
    },

    burst(x, y, colour, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.5,
                life: 26 + Math.random() * 20,
                colour
            });
        }
    },

    // Anything that leaves the play area is gone. A pig knocked off the right
    // edge used to fall forever: never destroyed, so pigsLeft never hit 0 and
    // the level could not be won no matter how well it was shot.
    cullOutOfBounds() {
        for (const e of this.entities) {
            if (!e.alive || e.permanent) continue;
            const p = e.body.position;
            if (p.y > WORLD.h + WORLD.killMargin ||
                p.x < -WORLD.killMargin || p.x > WORLD.w + WORLD.killMargin) {
                e.destroy();
            }
        }
    },

    // ---- per-frame ---------------------------------------------------------
    step() {
        // A held bird is parked where the pointer is. This used to happen inside
        // Bird.display(), so the body only moved at draw time and every collision
        // test that frame ran against the stale position on the sling.
        if (this.dragging && this.bird) {
            Matter.Body.setPosition(this.bird.body, { x: this.dragX, y: this.dragY });
            Matter.Body.setVelocity(this.bird.body, { x: 0, y: 0 });
        }
        Engine.update(engine, STEP);
        this.cullOutOfBounds();
        this.shotFrames++;
        if (this.shake > 0) this.shake *= 0.86;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.98;
            if (--p.life <= 0) this.particles.splice(i, 1);
        }
        if (this.state === 'play') this.updatePlay();
    },

    updatePlay() {
        // Keep the aim dots up while dragging, and for the first frames of flight.
        if (this.dragging || (this.bird && this.bird.mode === 'fly' && this.shotFrames < 40)) {
            this.showAim = true;
        }
        if (this.allAsleep()) this.resolveShot();
    },

    allAsleep() {
        let moving = false;
        for (const e of this.entities) {
            if (e.kind === 'ground' || !e.alive) continue;
            if (e.mode === 'sling' || e.mode === 'drag') continue;
            if (e.speed() > 0.35) { moving = true; break; }
        }
        if (moving) { this.quietFrames = 0; return false; }
        this.quietFrames++;
        // 30 quiet frames, or a 15s cap so a log rolling downhill can't stall
        // the level. 8s was short enough to cut off long shots mid-flight.
        return this.quietFrames > 30 || this.shotFrames > 900;
    },

    resolveShot() {
        this.quietFrames = 0;
        this.shotFrames = 0;
        if (this.pigsLeft <= 0) return this.win();
        if (this.birdsLeft <= 0) return this.lose();
        // Nothing has been shot yet: the bird is on the sling or held on the
        // drag. Without this guard the world reads as "asleep" every frame while
        // the player is still aiming, and a phantom bird spawns mid-aim.
        if (!this.bird || this.bird.mode === 'sling' || this.bird.mode === 'drag') return;
        this.nextBird();
    },

    win() {
        this.score += this.birdsLeft * BIRD_BONUS;
        const stars = starsFor(this.spec, this.score);
        const prevStars = this.progress.stars[this.level] || 0;
        this.progress.stars[this.level] = Math.max(prevStars, stars);
        this.progress.best[this.level] = Math.max(this.progress.best[this.level] || 0, this.score);
        this.progress.unlocked = Math.max(this.progress.unlocked,
                                          Math.min(MAX_LEVELS, this.level + 1));
        this.saveProgress();
        this.state = this.level >= MAX_LEVELS ? 'allwon' : 'won';
        this.confetti();
        UI.showEnd(this.state);
    },
    lose() {
        this.state = 'lost';
        UI.showEnd(this.state);
    },
    // The "next level" button, as a rule rather than a click handler: advancing
    // is game state, so it belongs here where the self-test can reach it.
    winNext() {
        this.loadLevel(this.level + 1);
        UI.show('play');
    },
    confetti() {
        const cols = [[232, 86, 68], [246, 214, 150], [140, 214, 90], [150, 204, 220]];
        for (let i = 0; i < 10; i++) {
            this.burst(200 + Math.random() * 800, 40 + Math.random() * 80,
                       cols[i % 4], 6);
        }
    },

};
