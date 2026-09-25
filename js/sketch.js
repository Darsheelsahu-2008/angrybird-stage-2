
// Retro pass: render the scene at 1/PIXELS scale, then blow it back up with
// nearest-neighbour so every art pixel becomes a chunky PIXELS x PIXELS block.
const PIXELS = 4;

// Fixed 16-colour ramp — quantising the frame to it is what sells "pixel art"
// over "blurry upscale". Colours are [r,g,b].
const PALETTE = [
    [ 22,  18,  33], [ 44,  34,  70], [ 86,  64, 124], [140, 116, 178],
    [ 40,  78, 116], [ 72, 136, 176], [150, 204, 220], [ 44, 104,  58],
    [ 96, 168,  76], [140, 214,  90], [116,  60,  38], [180, 118,  62],
    [232, 176, 104], [232,  86,  68], [246, 214, 150], [252, 246, 232]
];

var engine, world;
var ground;              // the one permanent body; see Game.clearWorld
var backgroundImg;

function preload() {
    backgroundImg = loadImage("sprites/bg.png");
    SPRITES.base      = loadImage("sprites/base.png");
    SPRITES.bird      = loadImage("sprites/bird.png");
    SPRITES.wood1     = loadImage("sprites/wood1.png");
    SPRITES.wood2     = loadImage("sprites/wood2.png");
    SPRITES.enemy     = loadImage("sprites/enemy.png");
    SPRITES.enemy_big = loadImage("sprites/enemy_big.png");
    SPRITES.stone     = loadImage("sprites/stone.png");
}

function setup(){
    var canvas = createCanvas(1200,400);
    canvas.parent('stage');
    pixelDensity(1);
    noSmooth();
    engine = Engine.create();
    world = engine.world;

    // The permanent ground. Everything else is torn down and rebuilt per level.
    ground = new Ground(600,height,1200,20);
    ground.permanent = true;

    Game.init();
    Game.add(ground);       // after init: clearWorld keeps permanents in the list
    UI.show('title');
}

// ---- input ------------------------------------------------------------------
function mousePressed()  { Game.pointerDown(); }
function mouseDragged()  { Game.pointerDrag(); }
function mouseReleased() { Game.pointerUp(); }
function touchStarted()  { followTouch(); Game.pointerDown(); return false; }
function touchMoved()    { followTouch(); Game.pointerDrag();  return false; }
function touchEnded()    { followTouch(); Game.pointerUp();   return false; }
// The sling reads mouseX/mouseY, so a touch has to stand in for the mouse.
function followTouch() {
    if (typeof touches !== 'undefined' && touches.length) {
        mouseX = touches[0].x;
        mouseY = touches[0].y;
    }
}

function draw(){
    push();
    scale(1/PIXELS);
    background(backgroundImg);
    Game.step();
    Game.render();
    pop();
    retro();
}

// ponytail: get() + the palette loop cost ~3.5ms of the 16ms frame budget at
// 300x100x16. If frames ever drop, cut PALETTE to 8 colours, or run retro()
// on alternate frames — the upscale alone still gives the pixel look.
function retro(){
    var small = get(0, 0, width/PIXELS, height/PIXELS);
    small.loadPixels();
    for (var i = 0; i < small.pixels.length; i += 4) {
        var r = small.pixels[i], g = small.pixels[i+1], b = small.pixels[i+2];
        var best = 0, bestDist = Infinity;
        for (var p = 0; p < PALETTE.length; p++) {
            var c = PALETTE[p];
            var dr = r-c[0], dg = g-c[1], db = b-c[2];
            // luma-weighted distance: cheap, and keeps perceived brightness
            var dist = dr*dr*0.3 + dg*dg*0.59 + db*db*0.11;
            if (dist < bestDist) {
                bestDist = dist;
                best = p;
            }
        }
        small.pixels[i]   = PALETTE[best][0];
        small.pixels[i+1] = PALETTE[best][1];
        small.pixels[i+2] = PALETTE[best][2];
    }
    small.updatePixels();
    clear();
    noSmooth();
    image(small, 0, 0, width, height);
}

/* ORIGINAL (preserved, not deleted — disabled by comment): stage-2 had a single
   hardcoded scene with no input, no scoring and no levels. Kept for reference.

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
