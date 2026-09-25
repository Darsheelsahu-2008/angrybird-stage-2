class Bird extends BaseClass{
  constructor(x,y)
  {
    super(x,y,50,50, undefined, {
      kind: 'bird',
      hp: 1e9,                 // the bird is never damaged
      density: 0.0022,
      restitution: 0.45,
      friction: 0.4,
      // No air drag. Matter's default 0.01 bleeds ~1% of the speed per step, and
      // the trajectory preview integrates without drag — with drag on, the dots
      // promised a landing ~150px short of the real one, so shots felt random.
      frictionAir: 0
    });
    this.image = SPRITES.bird || loadImage("sprites/bird.png");
    this.mode = 'sling';      // 'sling' = steered by cursor, 'fly' = free body
    this.boosted = false;
  }

  // One mid-flight speed burst, once per bird. Feels like the real thing's
  // special birds without needing a whole ability system.
  boost() {
    if (this.mode !== 'fly' || this.boosted || !this.alive) return false;
    this.boosted = true;
    var v = this.body.velocity;
    var len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
    Matter.Body.setVelocity(this.body, {
      x: v.x / len * (len + 7),
      y: v.y / len * (len + 7)
    });
    Game.burst(this.body.position.x, this.body.position.y, [232, 176, 104], 10);
    return true;
  }

  takeDamage() { return false; }   // indestructible

  display()
  {
    // ORIGINAL (preserved, not deleted — disabled by comment): the bird snapped
    // to the cursor in every mode, so a launched bird teleported back to the
    // mouse and could never fly. Drawing also moved the body, which meant the
    // physics body lagged a frame behind the sprite; the drag is now applied in
    // Game.step() and this method only draws.
    //   this.body.position.x=mouseX;
    //   this.body.position.y=mouseY;
    super.display();
  }
}
