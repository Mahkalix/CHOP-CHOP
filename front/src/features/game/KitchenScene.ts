import Phaser from 'phaser';

// Top-left corners in the 1440 × 900 level-one Figma frame.
const stations = [
  ['tomato', 'TOMATES', 240, 300], ['chop', 'DÉCOUPER', 384, 300],
  ['meat', 'VIANDE CRUE', 528, 300], ['grill', 'CUIRE', 672, 300],
  ['plates', 'ASSIETTES', 960, 300], ['worktop', '', 1104, 300],
  ['assembly', 'ASSEMBLER', 960, 580], ['delivery', 'SERVIR', 1294, 478],
  ['trash', 'POUBELLE', 96, 580], ['worktop', '', 240, 660],
  ['worktop', '', 384, 660],
] as const;
const chefs = ['Miso', 'Pipa', 'Basile', 'Alba', 'Nori', 'Gaspard'];

export class KitchenScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private arrows!: Phaser.Types.Input.Keyboard.CursorKeys;
  private letters!: Record<'Z' | 'Q' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  preload() {
    this.load.image('floor', '/kitchen/floor.png');
    for (const key of new Set(stations.map(([texture]) => texture))) {
      this.load.image(key, `/kitchen/${key}.png`);
    }
    const selected = sessionStorage.getItem('chef') ?? 'Miso';
    this.load.image('chef', `/menu/${chefs.includes(selected) ? selected : 'Miso'}.png`);
  }

  create() {
    this.add.image(0, 0, 'floor').setOrigin(0);
    const obstacles = this.physics.add.staticGroup();
    for (const [texture, label, x, y] of stations) {
      obstacles.create(x + 72, y + 72, texture).setDisplaySize(144, 144).refreshBody();
      if (label) {
        this.add.text(x + 72, y + 148, label, {
          fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#000000',
          backgroundColor: '#f7f1e6', fixedWidth: 144, align: 'center', padding: { y: 3 },
        }).setOrigin(0.5, 0);
      }
    }
    this.player = this.physics.add.sprite(456, 554, 'chef').setDisplaySize(128, 160);
    // The feet occupy the floor tile. The hat can overlap the back of a counter.
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.player.width * .38, this.player.height * .18);
    body.setOffset(this.player.width * .31, this.player.height * .78);
    this.physics.world.setBounds(40, 110, 1360, 720);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, obstacles);
    const keyboard = this.input.keyboard!;
    this.arrows = keyboard.createCursorKeys();
    this.letters = keyboard.addKeys('Z,Q,S,D') as typeof this.letters;
  }

  update() {
    const horizontal = Number(this.arrows.right.isDown || this.letters.D.isDown)
      - Number(this.arrows.left.isDown || this.letters.Q.isDown);
    const vertical = Number(this.arrows.down.isDown || this.letters.S.isDown)
      - Number(this.arrows.up.isDown || this.letters.Z.isDown);
    const speed = horizontal && vertical ? 260 / Math.SQRT2 : 260;
    this.player.setVelocity(horizontal * speed, vertical * speed);
    if (horizontal) this.player.setFlipX(horizontal < 0);
  }
}
