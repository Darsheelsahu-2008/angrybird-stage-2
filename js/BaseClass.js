class BaseClass {
    constructor(x, y,width,height,angle, opts) {
      opts = opts || {};
      // ORIGINAL density was a flat 1.5 for everything — ~1500x Matter's normal
      // mass, which made every material behave identically. Now per-material.
      var options = {
        'density': opts.density || 0.0015,
        'friction': opts.friction || 1.0,
        'restitution': opts.restitution !== undefined ? opts.restitution : 0.3
      };
      this.body = Bodies.rectangle(x, y, width, height, options);
      // Back-reference so the collision handler can find the entity behind a body.
      this.body.plugin.entity = this;
      this.width = width;
      this.height =height;
      this.image = SPRITES.base || loadImage("sprites/base.png")
      this.kind = opts.kind || 'body';
      this.hp = opts.hp !== undefined ? opts.hp : 40;
      this.score = opts.score || 0;
      this.alive = true;
      this.material = opts.material || 'wood';
      World.add(world, this.body);
    };
    // Impact damage. Returns true when this entity was destroyed by it.
    takeDamage(amount) {
      if (!this.alive || amount <= 0) return false;
      this.hp -= amount;
      if (this.chip) {                            // splinters, where set
        var p = this.body.position;
        Game.burst(p.x, p.y, this.chip, 3);
      }
      if (this.hp > 0) return false;
      this.destroy();
      return true;
    };
    destroy() {
      if (!this.alive) return;
      this.alive = false;
      World.remove(world, this.body);
      Game.onEntityDestroyed(this);
    };
    // Speed in px/step — used for "is the world asleep yet" checks.
    speed() {
      var v = this.body.velocity;
      return Math.sqrt(v.x * v.x + v.y * v.y);
    };
    display(){
      if (!this.alive) return;

      var angle = this.body.angle;
      push();
      translate(this.body.position.x,this.body.position.y);
      rotate(angle);
      imageMode(CENTER)
     image(this.image,0, 0, this.width, this.height);
      pop();
    };
  };
