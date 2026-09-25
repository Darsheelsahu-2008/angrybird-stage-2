// All drawing lives here. Game.js holds state and rules; nothing in this file
// changes anything — if you are about to mutate game state, you are in the
// wrong file.

const Render = {
    // ---- scene ---------------------------------------------------------------
    background(img) { background(img); },

    ground(img) {
        // Tile the 24px grass/dirt strip across the play area. The permanent
        // ground body sits at y=390, so the tile's grass line lands there.
        for (let x = 0; x < WORLD.w; x += img.width) image(img, x, WORLD.groundTop - 6);
    },

    // ---- actors --------------------------------------------------------------
    entities() {
        for (const e of Game.entities) e.display();
    },

    // Where the bands are pinched right now: the bird while it is loaded or
    // held, otherwise the empty pouch resting at the fork. The bands are elastic
    // and let go at launch, so a bird in flight has nothing attached to it.
    bandTarget() {
        const b = Game.bird;
        if (!b || !b.alive) return SLING.pouch;
        if (b.mode === 'drag') return { x: Game.dragX, y: Game.dragY };
        if (b.mode === 'sling') return b.body.position;
        return SLING.pouch;
    },

    sling(img) {
        image(img, SLING.x - 28, SLING.y - 44);
        stroke(70, 44, 30);
        strokeWeight(4);
        noFill();
        const p = this.bandTarget();
        line(SLING.tipL.x, SLING.tipL.y, p.x, p.y);
        line(SLING.tipR.x, SLING.tipR.y, p.x, p.y);
        noStroke();
        fill(96, 60, 38);                       // leather pouch
        rect(p.x - 7, p.y - 3, 14, 7);
        fill(140, 92, 58);
        rect(p.x - 7, p.y - 3, 14, 2);
    },

    // ---- feedback ------------------------------------------------------------
    trajectory() {
        if (!Game.showAim || !Game.bird) return;
        const vx = (SLING.x - Game.dragX) * SLING.power;
        const vy = (SLING.y - Game.dragY) * SLING.power;
        noStroke();
        for (let i = 4; i < 120; i++) {
            const x = SLING.x + vx * i;
            const y = SLING.y + vy * i + 0.5 * Game.gravityPerStep * i * i;
            if (y > Game.spec.ground) break;
            // Bigger, brighter dots up close; they thin out as they go.
            const s = i < 30 ? 5 : 3;
            fill(255, 255, 255, 230 - i * 1.6);
            rect(x - s / 2, y - s / 2, s, s);
        }
    },

    particles() {
        noStroke();
        for (const p of Game.particles) {
            const a = Math.min(255, p.life * 6);
            fill(p.colour[0], p.colour[1], p.colour[2], a);
            rect(p.x - 2, p.y - 2, 4, 4);
        }
    },

    // Whole frame, with screen shake wrapped around the scene.
    frame(shake) {
        if (shake > 0.2) {
            push();
            translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        }
        this.sling(SPRITES.sling);
        this.entities();
        this.trajectory();
        this.particles();
        if (shake > 0.2) pop();
    }
};
