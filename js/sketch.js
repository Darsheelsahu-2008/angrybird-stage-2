
// p5 bootstrap: load the art, make the canvas, run the loop. No game rules and
// no drawing here — that is Game.js and Render.js.
//
// The retro pass (4x chunky upscale + 16-colour quantise + CRT scanlines) is
// gone. Sprites are now authored at the exact size they are drawn, so the game
// renders 1:1 with no resampling and no per-frame palette pass.

var engine, world;
var ground;
var backgroundImg;

function preload() {
    backgroundImg = loadImage("sprites/bg.png");
    SPRITES.base      = loadImage("sprites/base.png");
    SPRITES.bird      = loadImage("sprites/bird.png");
    SPRITES.wood1     = loadImage("sprites/wood1.png");
    SPRITES.wood2     = loadImage("sprites/wood2.png");
    SPRITES.stone     = loadImage("sprites/stone.png");
    SPRITES.enemy     = loadImage("sprites/enemy.png");
    SPRITES.enemy_big = loadImage("sprites/enemy_big.png");
    SPRITES.sling     = loadImage("sprites/sling.png");
    SPRITES.ground    = loadImage("sprites/ground.png");
}

function setup() {
    const canvas = createCanvas(WORLD.w, WORLD.h);
    canvas.parent('stage');
    pixelDensity(1);
    noSmooth();
    engine = Engine.create();
    world = engine.world;

    // The permanent ground. Everything else is torn down and rebuilt per level.
    ground = new Ground(WORLD.w / 2, WORLD.groundTop + 10, WORLD.w, 20);
    ground.permanent = true;

    Game.init();
    Game.add(ground);       // after init: clearWorld keeps permanents in the list
    UI.show('title');
}

function draw() {
    Render.background(backgroundImg);
    Render.ground(SPRITES.ground);
    Game.step();
    Render.frame(Game.shake);
}

/* ORIGINAL (preserved, not deleted — disabled by comment): stage-2 had a single
   hardcoded scene with no input, no scoring and no levels, and rendered it
   through a 4x chunky upscale with a 16-colour quantise pass plus CSS CRT
   scanlines. Kept for reference.

function setup(){
    var canvas = createCanvas(1200,400);
    engine = Engine.create();
    world = engine.world;

    ground = new Ground(600,height,1200,20)

    box1 = new Box(700,320,70,70);
    box2 = new Box(920,320,70,70);
    pig1 = new Pig(810, 350);
    log1 = new Log(810,260,300, PI/2);

    box3 = new Box(700,240,70,70);
    box4 = new Box(920,240,70,70);
    pig3 = new Pig(810, 220);

    log3 =  new Log(810,180,300, PI/2);

    box5 = new Box(810,160,70,70);
    log4 = new Log(760,120,150, PI/7);
    log5 = new Log(870,120,150, -PI/7);

    bird = new Bird(100,100);
}

function draw(){
    background(backgroundImg);
    Engine.update(engine);
    console.log(box2.body.position.x);
    console.log(box2.body.position.y);
    console.log(box2.body.angle);
    box1.display();
    box2.display();
    ground.display();
    pig1.display();
    log1.display();

    box3.display();
    box4.display();
    pig3.display();
    log3.display();

    box5.display();
    log4.display();
    log5.display();

    bird.display();
}
*/
