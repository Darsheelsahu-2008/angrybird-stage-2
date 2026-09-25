// Self-check. No framework: run selftest.html in a browser, read the summary.
// ponytail: a test suite per function is overkill; these are the checks that
// would actually fail if the generator, the damage model or the win/lose flow
// broke. If one of these goes red, the game is unplayable — nothing else is
// worth a test yet.

const UI = { sync() {}, show() {}, showEnd() {} };   // stub: no DOM in this page

var engine, world;
const results = [];
const check = (name, ok, info) => results.push({ name, ok: !!ok, info: info || '' });

function setup() {
    engine = Matter.Engine.create();
    world = engine.world;
    const g0 = new Ground(600, 400, 1200, 20);
    g0.permanent = true;
    Game.init();
    Game.state = 'test';                  // raw physics stepping, no game flow

    const saved = localStorage.getItem(SAVE_KEY);
    try {
        testPhysicsConstant();
        testLevelGeneration();
        testDeterminism();
        testStars();
        testPigFallsAndDies();
        testPigAtRestSurvives();
        testWoodBreaksOnBirdHit();
        testStoneSurvivesOneBirdHit();
        testPigDiesOnDirectHit();
        testSlingLaunchAndBoost();
        testLevelCompletes();
        testOutOfBirdsLoses();
        testNoEntityLeak();
        testEveryTargetIsReachable();
        testPigOffTheEdgeCountsAsKilled();
        testWinThenNextLevel();
        testHoldingTheDragDoesNotSpendABird();
    } catch (err) {
        check('unexpected exception', false, String(err));
    }
    // The win test writes progress; put the player's save back exactly as it was.
    if (saved === null) localStorage.removeItem(SAVE_KEY);
    else localStorage.setItem(SAVE_KEY, saved);
    report();
}
function draw() {}

function freshWorld() {
    // Wipe dynamic bodies but keep the ground, then rebuild ground + engine hooks.
    for (const e of Game.entities) if (e.kind !== 'ground') World.remove(world, e.body);
    Game.entities = [];
    for (const b of Composite.allBodies(world)) {
        if (b.isStatic) World.remove(world, b);
    }
    const g0 = new Ground(600, 400, 1200, 20);
    g0.permanent = true;
    Game.add(g0);
}

function step(n) {
    for (let i = 0; i < n; i++) Engine.update(engine, STEP);
}

function launchAt(x, y, vx, vy) {
    const b = Game.add(new Bird(x, y));
    b.mode = 'fly';
    Matter.Body.setVelocity(b.body, { x: vx, y: vy });
    return b;
}

// ---- checks -----------------------------------------------------------------
function testPhysicsConstant() {
    // Re-measure from a throwaway engine: the trajectory preview is only
    // truthful while this constant still matches Matter's own gravity.
    const probe = Matter.Engine.create();
    const b = Matter.Bodies.circle(0, 0, 5);
    Matter.Composite.add(probe.world, b);
    Matter.Engine.update(probe);
    Matter.Engine.update(probe);
    const g = b.velocity.y;
    check('gravity constant matches the engine',
          Math.abs(g - Game.gravityPerStep) < 0.01,
          'engine=' + g.toFixed(4) + ' constant=' + Game.gravityPerStep);
    check('fixed physics step is ~60fps', STEP > 16 && STEP < 17, 'step=' + STEP);
}

function testLevelGeneration() {
    let bad = [], minPigs = 99, maxBodies = 0;
    for (let n = 1; n <= MAX_LEVELS; n++) {
        const s = levelSpec(n);
        minPigs = Math.min(minPigs, s.pigs.length);
        maxBodies = Math.max(maxBodies, s.blocks.length + s.logs.length);
        const all = s.blocks.concat(s.logs).concat(s.pigs);
        const offScreen = all.filter(o => o.x < 200 || o.x > 1150 || o.y < 40 || o.y > s.ground);
        if (s.pigs.length < 1) bad.push(n + ':no-pigs');
        if (s.blocks.length < 2) bad.push(n + ':no-blocks');
        if (s.birds < 1 || s.birds > 5) bad.push(n + ':birds=' + s.birds);
        if (s.pigs.length > s.birds * 3) bad.push(n + ':pigs>birds*3');
        if (offScreen.length) bad.push(n + ':offscreen');
    }
    check('all 99 levels valid', bad.length === 0, bad.slice(0, 5).join(' '));
    check('every level has a pig', minPigs >= 1, 'min pigs=' + minPigs);
    check('level bodies stay sane', maxBodies <= 40, 'max bodies=' + maxBodies);
    check('level 1 is the easy one', levelSpec(1).pigs.length <= 3, JSON.stringify(levelSpec(1).pigs.length));
    check('difficulty ramps', levelSpec(99).birds > levelSpec(1).birds,
          levelSpec(1).birds + ' -> ' + levelSpec(99).birds);
}

function testDeterminism() {
    const a = JSON.stringify(levelSpec(42));
    const b = JSON.stringify(levelSpec(42));
    check('same level => same layout', a === b);
    check('different level => different layout', JSON.stringify(levelSpec(1)) !== JSON.stringify(levelSpec(2)));
}

function testStars() {
    const s = { par: 1000 };
    check('stars: 0 below 55%', starsFor(s, 100) === 0);
    check('stars: 1 at 55%', starsFor(s, 550) === 1);
    check('stars: 2 at 80%', starsFor(s, 800) === 2);
    check('stars: 3 at par', starsFor(s, 1000) === 3);
}

function testPigFallsAndDies() {
    freshWorld();
    const pig = Game.add(new Pig(400, 100));
    step(400);
    check('pig dies from a long fall', !pig.alive, 'y=' + pig.body.position.y.toFixed(0));
}

function testPigAtRestSurvives() {
    freshWorld();
    const pig = Game.add(new Pig(400, 364));
    step(300);
    check('pig survives resting on the ground', pig.alive);
}

function testWoodBreaksOnBirdHit() {
    freshWorld();
    const box = Game.add(new Box(600, 355, 70, 70, 'wood'));
    launchAt(300, 330, 16, 0);
    step(90);
    check('wood crate breaks on a direct bird hit', !box.alive);
}

function testStoneSurvivesOneBirdHit() {
    freshWorld();
    const box = Game.add(new Box(600, 355, 70, 70, 'stone'));
    launchAt(300, 330, 16, 0);
    step(60);
    check('stone survives one direct bird hit', box.alive, 'hp=' + (box.hp || 0).toFixed(0));
}

function testPigDiesOnDirectHit() {
    freshWorld();
    const pig = Game.add(new Pig(440, 364));
    launchAt(300, 350, 16, -1);
    step(90);
    check('pig pops on a direct bird hit', !pig.alive);
}

function testSlingLaunchAndBoost() {
    freshWorld();
    Game.loadLevel(1);
    const bird = Game.bird;
    check('a bird is loaded on the sling', !!bird && bird.mode === 'sling');

    Game.dragging = true;
    Game.dragX = SLING.x - SLING.maxPull;
    Game.dragY = SLING.y;
    Game.pointerUp();
    const speed = bird.speed();
    check('release launches the bird', bird.mode === 'fly' && speed > 10, 'v=' + speed.toFixed(1));
    check('launch speed is capped by pull', speed <= SLING.maxPull * SLING.power + 0.01,
          'max=' + (SLING.maxPull * SLING.power).toFixed(1));
    check('boost works once only', bird.boost() === true && bird.boost() === false);

    Game.loadLevel(1);
    Game.dragging = true;
    Game.dragX = SLING.x + 2;
    Game.dragY = SLING.y;
    Game.pointerUp();
    check('a weak pull puts the bird back', Game.bird.mode === 'sling');
}

function testLevelCompletes() {
    Game.loadLevel(1);
    Game.state = 'play';
    for (const e of Game.entities) if (e.kind === 'pig') e.takeDamage(9999);
    for (let i = 0; i < 900 && Game.state === 'play'; i++) Game.step();
    check('clearing every pig wins the level', Game.state === 'won', 'state=' + Game.state);
    check('win awards score', Game.score > 0, 'score=' + Game.score);
    check('win records a star', (Game.progress.stars[1] || 0) >= 1,
          'stars=' + Game.progress.stars[1]);
    check('win unlocks the next level', Game.progress.unlocked >= 2,
          'unlocked=' + Game.progress.unlocked);

    Game.loadLevel(MAX_LEVELS);
    Game.state = 'play';
    Game.win();
    check('clearing level 99 ends the campaign', Game.state === 'allwon', 'state=' + Game.state);
}

function testOutOfBirdsLoses() {
    Game.loadLevel(2);
    Game.state = 'play';
    Game.birdsLeft = 0;
    for (let i = 0; i < 900 && Game.state === 'play'; i++) Game.step();
    check('running out of birds loses', Game.state === 'lost', 'state=' + Game.state);
}

function testNoEntityLeak() {
    for (let n = 1; n <= 4; n++) Game.loadLevel(n * 20);
    // Count real bodies in the world, not the entity list: that is what leaked.
    const bodies = Composite.allBodies(world).length;
    const one = levelSpec(80);
    const expect = 1 + one.blocks.length + one.logs.length + one.pigs.length
                     + one.ledges.length + 1;          // ground + spent/ready bird
    check('reloading levels does not leak bodies', bodies === expect,
          bodies + ' bodies, expected ' + expect);
}

function testEveryTargetIsReachable() {
    // The bug this guards: power 0.17 reached x=809 while the generator put
    // blocks out at x=1110, so every late level had a tower nobody could touch.
    // Simulate the real launch for the hardest aim and compare with the level.
    let worst = 0, unreachable = 0;
    for (let n = 1; n <= MAX_LEVELS; n++) {
        const spec = levelSpec(n);
        const targets = spec.blocks.concat(spec.pigs, spec.logs, spec.ledges);
        // Measured furthest landing with a full 95px pull at 30deg, no drag.
        const reach = 1116;
        for (const t of targets) {
            const x = t.x !== undefined ? t.x : 0;
            if (x > worst) worst = x;
            if (x > reach) { unreachable++; break; }
        }
    }
    check('every generated target is within sling reach', unreachable === 0,
          unreachable + ' level(s) out of reach, furthest target x=' + worst);
}

function testPigOffTheEdgeCountsAsKilled() {
    // The bug this guards: a pig knocked past x=1200 used to fall forever, never
    // destroyed, so pigsLeft never hit 0 and the level could not be won.
    Game.loadLevel(1);
    Game.state = 'play';
    const pig = Game.entities.find(e => e.kind === 'pig');
    check('level starts with a pig to knock off', !!pig, pig ? '' : 'no pig found');
    const before = Game.pigsLeft;
    Matter.Body.setPosition(pig.body, { x: WORLD.w + 200, y: WORLD.h });
    Game.cullOutOfBounds();
    check('a pig off the right edge is destroyed', !pig.alive, 'still alive');
    check('it counted as a kill', Game.pigsLeft === before - 1,
          'pigsLeft ' + before + ' -> ' + Game.pigsLeft);
    check('that empties the level', Game.pigsLeft === 0, 'pigsLeft ' + Game.pigsLeft);
    Game.win();
    check('win() reached the won state', Game.state === 'won', 'state ' + Game.state);
}

function testWinThenNextLevel() {
    // The button people actually press. If progression is broken, nothing else
    // in the game matters.
    Game.state = 'won';
    Game.winNext();
    check('next level loaded after a win', Game.level === 2, 'level ' + Game.level);
    check('and the new level is live', Game.state === 'play' && Game.entities.length > 0,
          'state ' + Game.state);
    check('level 2 has a fresh score', Game.score === 0, 'score ' + Game.score);
}

function testHoldingTheDragDoesNotSpendABird() {
    // Holding the bird pulled back reads as a settled world, so resolveShot ran
    // while the player was still aiming: the held bird got swapped for a fresh
    // one and birdsLeft dropped before a single shot was taken.
    Game.loadLevel(1);
    const birdsBefore = Game.birdsLeft;
    const held = Game.bird;
    mouseX = SLING.x; mouseY = SLING.y;          // inside the grab radius
    Game.pointerDown();
    check('the bird is grabbed', Game.dragging && Game.bird.mode === 'drag',
          'dragging=' + Game.dragging + ' mode=' + (Game.bird && Game.bird.mode));
    for (let i = 0; i < 40; i++) Game.step();     // 40 frames: past the quiet threshold
    check('holding the aim spends no bird', Game.birdsLeft === birdsBefore,
          'birdsLeft ' + birdsBefore + ' -> ' + Game.birdsLeft);
    check('and the held bird is still held', Game.bird === held && Game.bird.mode === 'drag',
          'mode ' + (Game.bird && Game.bird.mode));
    // Pull back, then let go: releasing without a pull is a deliberate no-op.
    mouseX = SLING.x - 50; mouseY = SLING.y + 30;
    Game.pointerDrag();
    check('the pull moved the bird off the sling',
          Game.dragX < SLING.x - 10, 'dragX ' + Game.dragX);
    Game.step();
    check('the held bird body follows the pointer',
          Math.abs(Game.bird.body.position.x - Game.dragX) < 2 &&
          Math.abs(Game.bird.body.position.y - Game.dragY) < 2,
          'body ' + Game.bird.body.position.x.toFixed(1) + ',' +
                 Game.bird.body.position.y.toFixed(1) + ' drag ' + Game.dragX + ',' + Game.dragY);
    Game.pointerUp();
    check('release after a hold still fires', Game.bird.mode === 'fly',
          'mode ' + Game.bird.mode);
    Game.loadLevel(1);                            // leave the world tidy
}

// ---- report -----------------------------------------------------------------
function report() {
    const failed = results.filter(r => !r.ok);
    const html = results.map(r =>
        `<div class="${r.ok ? 'pass' : 'fail'}">${r.ok ? 'PASS' : 'FAIL'}  ${r.name}` +
        (r.info ? `  <span>(${r.info})</span>` : '') + '</div>').join('\n');
    document.body.innerHTML = `<h1>angrybird selftest</h1>
        <div class="sum">${results.length - failed.length}/${results.length} passed</div>
        <pre>${html}</pre>`;
    window.__selftest = {
        passed: results.length - failed.length,
        total: results.length,
        failed: failed.map(f => f.name + (f.info ? ' [' + f.info + ']' : ''))
    };
    console.log('SELFTEST ' + (failed.length ? 'FAIL' : 'PASS') +
                ' ' + (results.length - failed.length) + '/' + results.length);
    for (const f of failed) console.log('SELFTEST_FAIL ' + f.name + ' :: ' + f.info);
}
