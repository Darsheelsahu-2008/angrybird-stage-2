class Log extends BaseClass {
    constructor(x, y, height, angle) {
      // Logs never break — they are the bulldozer. Dense, so they shove crates.
      super (x,y,20,height,angle, {
        kind: 'log',
        hp: 1e9,
        density: 0.0026,
        score: 500,             // a plank, not a block: half a block's value
        friction: 0.9,
        restitution: 0.1
      })
      this.image = SPRITES.wood2 || loadImage("sprites/wood2.png")
      Matter.Body.setAngle(this.body,angle)
    }
    takeDamage() { return false; }   // indestructible
  }
