class Pig extends BaseClass {
    constructor(x, y, big) {
      // Big pigs are tougher, worth more, and need a real hit to pop.
      var size = big ? 70 : 50;
      super(x,y,size,size, undefined, {
        kind: 'pig',
        hp: big ? 170 : 100,
        density: 0.0014,
        score: big ? 8000 : 5000,
        friction: 0.9,
        restitution: 0.35
      })
      this.big = !!big;
      this.image = SPRITES.enemy || loadImage("sprites/enemy.png");
      if (big) this.image = SPRITES.enemy_big || loadImage("sprites/enemy_big.png");
      this.flash = 0;
    }
    // A pig that survives a hit blinks — the only "health" readout it gets.
    takeDamage(amount) {
      this.flash = 8;
      return super.takeDamage(amount);
    }
    display() {
        if (this.flash > 0) {
            this.flash--;
            tint(255, 150, 150);
            super.display();      // same transform, just tinted
            noTint();
            return;
        }
        super.display();
    }
  }
