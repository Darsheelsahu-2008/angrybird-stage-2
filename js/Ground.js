// Static platform. The main ground is drawn as a tiled sprite strip in
// Render.ground(); this display() only covers the smaller ledges, so they can
// be any size without stretching the tile.
class Ground {
    constructor(x,y,width,height) {
      var options = {
          isStatic: true
      }
      this.body = Bodies.rectangle(x,y,width,height,options);
      this.body.plugin.entity = this;
      this.width = width;
      this.height = height;
      this.kind = 'ground';
      this.alive = true;
      this.hp = Infinity;
      World.add(world, this.body);
    }
    takeDamage() { return false; }   // nothing to break
    speed() { return 0; }            // grounds never move; allAsleep reads this
    display(){
      if (this.permanent) return;     // the big one is the tiled strip, not this
      var pos = this.body.position;
      var h = this.height;
      var grass = Math.min(6, h / 2);
      push();
      translate(pos.x, pos.y);
      rotate(this.body.angle);
      rectMode(CORNER);
      noStroke();
      fill(150, 96, 58);   rect(-this.width / 2, -h / 2, this.width, h);
      fill(120, 74, 44);   rect(-this.width / 2, h / 2 - 3, this.width, 3);
      fill(126, 200, 80);  rect(-this.width / 2, -h / 2, this.width, grass);
      fill(94, 164, 58);   rect(-this.width / 2, -h / 2, this.width, 2);
      pop();
      rectMode(CENTER);
    }
  };

/* ORIGINAL (preserved, not deleted — disabled by comment): flat brown rectangle,
   which read as a placeholder bar rather than ground. Kept for reference.

    display(){
      var pos =this.body.position;
      rectMode(CENTER);
      fill("brown");
      rect(pos.x, pos.y, this.width, this.height);
    }
*/
