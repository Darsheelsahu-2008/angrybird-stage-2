// material -> sprite, so a new material is one line here plus its sprite.
const BOX_ART = { wood: 'wood1', stone: 'stone', glass: 'glass' };

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
    // ORIGINAL always loaded wood1.png (preserved above): one sprite for every
    // material, so stone and glass were drawn as wood. The map is now the single
    // place that knows which art a material uses.
    this.image = SPRITES[BOX_ART[material || 'wood']] || SPRITES.wood1;
    // Splinter colour; BaseClass.takeDamage throws these on every hit.
    this.chip = MATERIALS[material || 'wood'].colour;
  }
}
