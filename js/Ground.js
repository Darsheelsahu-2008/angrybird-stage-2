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
      var pos =this.body.position;
      rectMode(CENTER);
      fill("brown");
      rect(pos.x, pos.y, this.width, this.height);
    }
  };
