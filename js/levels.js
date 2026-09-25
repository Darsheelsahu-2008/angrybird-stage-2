// Level data + seeded generator.
//
// ponytail: levels are GENERATED, not hand-authored. 99 hand-built layouts would
// be ~2000 lines of data to balance and re-tune; this gives a stable, replayable
// level per number with one difficulty curve. If a level ever needs an exact
// puzzle shape, add a HAND table keyed by level number and fall back to this.

const MAX_LEVELS = 99;

// Material toughness. Also drives density, so stone hits back harder.
// Glass < wood < stone, the real game's order. Glass is the weak one: barely
// any mass, and it shatters from a nudge. Its higher ARMOUR number means it
// takes *more* damage per impact than the others.
const MATERIALS = {
    glass: { hp: 16,  density: 0.0006, score: 1000, colour: [176, 226, 242] },
    wood:  { hp: 42,  density: 0.0012, score: 1000, colour: [180, 118,  62] },
    stone: { hp: 120, density: 0.0030, score: 1000, colour: [140, 140, 150] }
};

// mulberry32 — small, fast, deterministic. Same seed => same level, forever.
function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        var t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function levelSpec(n) {
    var rnd = makeRng(n * 2654435761 + 1013904223);
    var t = (n - 1) / (MAX_LEVELS - 1);            // 0..1 difficulty ramp
    var spec = {
        ground: 390,
        blocks: [],
        pigs: [],
        logs: [],
        ledges: []
    };

    // Tutorial ramp: level 1 is a single wood crate with one pig, no stone.
    var towers = 1 + (t > 0.10 ? 1 : 0) + (t > 0.55 ? 1 : 0);
    // The furthest thing the sling can reach is x=1116 (see SLING.power), and
    // the blocks sit tx+70, so the last tower has to start at 1040 or less.
    var spacing = 195;
    var startX = 520 + Math.floor(rnd() * 20);

    for (var i = 0; i < towers; i++) {
        var tx = startX + i * spacing;
        var rows = Math.max(2, Math.min(4, 2 + Math.floor(rnd() * 2 + t * 2)));
        // A glass tower: rarer than stone, and only in the back half, so the
        // third material shows up late the way it does in the real game.
        var stoneRow = t > 0.35 && rnd() < 0.4;
        var glassTower = t > 0.45 && !stoneRow && rnd() < 0.3;
        var topY = spec.ground;
        var pigsBefore = spec.pigs.length;

        for (var r = 0; r < rows; r++) {
            var y = spec.ground - 35 - r * 70;
            var mat = glassTower ? 'glass'
                    : (stoneRow && r === 0) ? 'stone'
                    : (t > 0.5 && rnd() < 0.25) ? 'stone' : 'wood';
            spec.blocks.push({ x: tx,      y: y, w: 70, h: 70, m: mat });
            spec.blocks.push({ x: tx + 140, y: y, w: 70, h: 70, m: mat });
            // Pig in the gap: has to be knocked loose by collapsing the crate.
            if (rnd() < 0.45 + t * 0.35) {
                spec.pigs.push({ x: tx + 70, y: y, big: t > 0.7 && rnd() < 0.3 });
            }
            topY = y;
        }
        // Pig sitting on the roof, and a log on top of some towers.
        if (rnd() < 0.5) spec.pigs.push({ x: tx + 70, y: topY - 45, big: false });
        if (t > 0.15 && rnd() < 0.6) {
            spec.logs.push({ x: tx + 70, y: topY - 70, len: 150, a: 0 });
        }
        if (t > 0.3 && rnd() < 0.45) {
            // Extra buttress column — makes towers topple sideways instead of
            // straight down, so you have to hit them off-balance.
            spec.blocks.push({ x: tx - 70, y: spec.ground - 35, w: 70, h: 70, m: 'wood' });
        }
        // Every tower gets at least one pig — otherwise a level can roll with
        // nothing to shoot at, which reads as a bug, not a puzzle.
        if (spec.pigs.length === pigsBefore) {
            spec.pigs.push({ x: tx + 70, y: spec.ground - 35, big: false });
        }
    }

    // Ledges: static platforms for the later, taller levels.
    if (t > 0.25) {
        var lw = 90 + Math.floor(rnd() * 60);
        spec.ledges.push({ x: 400 + Math.floor(rnd() * 60), y: spec.ground - 150, w: lw, h: 24 });
        if (t > 0.7) {
            spec.blocks.push({ x: spec.ledges[0].x, y: spec.ledges[0].y - 35, w: 70, h: 70, m: 'stone' });
            spec.pigs.push({ x: spec.ledges[0].x, y: spec.ledges[0].y - 100, big: false });
        }
    }

    // Keep everything on screen regardless of how the dice fell. Logs get a
    // higher floor: they are 150 tall, so y=60 would put their top off-screen.
    var floors = [[spec.blocks, 30], [spec.logs, 40], [spec.pigs, 30]];
    for (var f = 0; f < floors.length; f++) {
        for (var o = 0; o < floors[f][0].length; o++) {
            var e = floors[f][0][o];
            e.x = Math.max(240, Math.min(1140, e.x));
            e.y = Math.max(60, Math.min(spec.ground - floors[f][1], e.y));
        }
    }

    // A level is only fair if the bird count tracks the pig count. The ramp is
    // the floor; the pig count is what can force an extra bird.
    spec.birds = Math.max(Math.min(5, 2 + Math.round(t * 3) + (n % 5 === 0 ? 1 : 0)),
                          Math.min(5, Math.ceil(spec.pigs.length / 1.5) + 1));

    // par = everything on the field at full value, so 3 stars means nothing was wasted
    spec.par = spec.pigs.length * 5000 + spec.blocks.length * 1000 + spec.logs.length * 500;
    return spec;
}

// Star thresholds, cheapest to compute first.
function starsFor(spec, score) {
    if (score >= spec.par) return 3;
    if (score >= spec.par * 0.8) return 2;
    if (score >= spec.par * 0.55) return 1;
    return 0;
}
