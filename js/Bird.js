class Bird extends BaseClass{
  constructor(x,y)
  {
    super(x,y,50,50, undefined, {
      kind: 'bird',
      hp: 1e9,                 // the bird is never damaged
      density: 0.0022,
      restitution: 0.45,
      friction: 0.4
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
    // While being pulled back, the bird sits at the clamped drag point.
    if (this.mode === 'drag') {
      this.body.position.x = Game.dragX;
      this.body.position.y = Game.dragY;
    }
    // ORIGINAL (preserved, not deleted — disabled by comment): the bird snapped
    // to the cursor in every mode, so a launched bird teleported back to the
    // mouse and could never fly.
    //   this.body.position.x=mouseX;
    //   this.body.position.y=mouseY;
    super.display();
  }
}
