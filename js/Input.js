// Every input path, in one place: mouse, touch, keyboard. Each one just hands
// off to Game — the rules live there, not here.

function followTouch() {
    if (typeof touches !== 'undefined' && touches.length) {
        // The sling reads mouseX/mouseY, so a touch has to stand in for a mouse.
        mouseX = touches[0].x;
        mouseY = touches[0].y;
    }
}

function mousePressed()  { Game.pointerDown(); }
function mouseDragged()  { Game.pointerDrag(); }
function mouseReleased() { Game.pointerUp(); }
function touchStarted()  { followTouch(); Game.pointerDown(); return false; }
function touchMoved()    { followTouch(); Game.pointerDrag();  return false; }
function touchEnded()    { followTouch(); Game.pointerUp();   return false; }

document.addEventListener('keydown', e => {
    // e.key, not p5's global `key`: this listener is on `document` and fires
    // before p5's on `window`, so p5's copy is still the previous keystroke.
    if (Input.key(e)) e.preventDefault();
    if (e.key === 'Escape' && Game.state === 'play') {
        UI.sync();
        UI.show('select');
    }
});

const Input = {
    key(e) {
        if (Game.state !== 'play') return false;
        if (e.key === ' ' && Game.bird) { Game.bird.boost(); return true; }
        if (e.key === 'r' || e.key === 'R') { Game.loadLevel(Game.level); return true; }
        return false;
    }
};
