class Box extends BaseClass {
  constructor(x, y, width, height, material) {
 
    super(x,y,width,height, undefined, {
      kind: 'box',
      material: material || 'wood',
      hp: MATERIALS[material || 'wood'].hp,
      density: MATERIALS[material || 'wood'].density,
      score: MATERIALS[material || 'wood'].score,
      friction: 0.7
    })
    // ORIGINAL always loaded wood1.png:
    this.image = SPRITES.wood1 || loadImage("sprites/wood1.png");
    if ((material || 'wood') === 'stone') this.image = SPRITES.stone || loadImage("sprites/stone.png");
    // Splinter colour; BaseClass.takeDamage throws these on every hit.
    this.chip = MATERIALS[material || 'wood'].colour;
  }
}
