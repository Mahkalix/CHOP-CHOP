import Phaser from 'phaser';

import { stations, closestStation } from './stations';
import { createInventory, interact, itemLabels, type ItemKind, type Inventory } from './interactions';

export type InteractionStatus = { carried: string | null; target: string | null; message: string };

const chefs = ['Miso', 'Pipa', 'Basile', 'Alba', 'Nori', 'Gaspard'];

export class KitchenScene extends Phaser.Scene {
  private inventory: Inventory = createInventory();
  private interactionKey!: Phaser.Input.Keyboard.Key;
  private targetId: string | null = null;
  private placedItems!: Phaser.GameObjects.Graphics;
  private carriedItem!: Phaser.GameObjects.Graphics;
  private stationSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private player!: Phaser.Physics.Arcade.Sprite;
  private arrows!: Phaser.Types.Input.Keyboard.CursorKeys;
  private letters!: Record<'Z' | 'Q' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  preload() {
    this.load.image('floor', '/kitchen/floor.png');
    for (const key of new Set(stations.map(station => station.texture))) {
      this.load.image(key, `/kitchen/${key}.png`);
    }
    const selected = sessionStorage.getItem('chef') ?? 'Miso';
    this.load.image('chef', `/menu/${chefs.includes(selected) ? selected : 'Miso'}.png`);
  }

  create() {
    this.inventory = createInventory();
    this.targetId = null;
    this.stationSprites.clear();
    this.add.image(0, 0, 'floor').setOrigin(0);
    const obstacles = this.physics.add.staticGroup();
    for (const { id, texture, label, x, y } of stations) {
      const sprite = obstacles.create(x + 72, y + 72, texture).setDisplaySize(144, 144).refreshBody();
      this.stationSprites.set(id, sprite);
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
    this.interactionKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.interactionKey.on('down', this.useClosestStation, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.interactionKey.off('down', this.useClosestStation, this));
    this.placedItems = this.add.graphics().setDepth(10);
    this.carriedItem = this.add.graphics().setDepth(20);
    this.publishStatus(null, 'Approche-toi d’un poste puis appuie sur E.');
  }

  update() {
    const horizontal = Number(this.arrows.right.isDown || this.letters.D.isDown)
      - Number(this.arrows.left.isDown || this.letters.Q.isDown);
    const vertical = Number(this.arrows.down.isDown || this.letters.S.isDown)
      - Number(this.arrows.up.isDown || this.letters.Z.isDown);
    const speed = horizontal && vertical ? 260 / Math.SQRT2 : 260;
    this.player.setVelocity(horizontal * speed, vertical * speed);
    if (horizontal) this.player.setFlipX(horizontal < 0);
    this.carriedItem.setPosition(this.player.x + (this.player.flipX ? -44 : 44), this.player.y - 12);
    const feet = (this.player.body as Phaser.Physics.Arcade.Body).center;
    const target = closestStation(feet.x, feet.y);
    if ((target?.id ?? null) !== this.targetId) {
      this.stationSprites.get(this.targetId ?? '')?.clearTint();
      this.targetId = target?.id ?? null;
      this.stationSprites.get(this.targetId ?? '')?.setTint(0xffe293);
      this.publishStatus(target, target ? 'E : prendre, poser ou utiliser ce poste.' : 'Approche-toi d’un poste pour interagir.');
    }
  }

  private useClosestStation() {
    const feet = (this.player.body as Phaser.Physics.Arcade.Body).center;
    const target = closestStation(feet.x, feet.y);
    if (!target) { this.publishStatus(null, 'Tu es trop loin d’un poste.'); return; }
    const result = interact(this.inventory, target);
    this.inventory = result.inventory;
    this.drawItems();
    this.publishStatus(target, result.message);
  }

  private publishStatus(target: (typeof stations)[number] | null, message: string) {
    this.game.events.emit('kitchen-interaction', {
      carried: this.inventory.carried ? itemLabels[this.inventory.carried.kind] : null,
      target: target ? target.label || 'PLAN DE TRAVAIL' : null,
      message,
    } satisfies InteractionStatus);
  }

  private drawItems() {
    this.placedItems.clear(); this.carriedItem.clear();
    for (const station of stations) {
      const item = this.inventory.surfaces[station.id];
      if (item) this.drawItem(this.placedItems, item.kind, station.x + 72, station.y + 68);
    }
    if (this.inventory.carried) this.drawItem(this.carriedItem, this.inventory.carried.kind, 0, 0);
  }

  private drawItem(graphics: Phaser.GameObjects.Graphics, kind: ItemKind, x: number, y: number) {
    graphics.lineStyle(3, 0x201710);
    if (kind === 'meat') {
      graphics.fillStyle(0xcc826c).fillRoundedRect(x - 22, y - 14, 44, 28, 8).strokeRoundedRect(x - 22, y - 14, 44, 28, 8);
    } else {
      const radius = kind === 'plate' ? 24 : 18;
      graphics.fillStyle(kind === 'plate' ? 0xffffff : 0xd84731).fillCircle(x, y, radius).strokeCircle(x, y, radius);
      if (kind === 'tomato') graphics.fillStyle(0x387342).fillRect(x - 3, y - 23, 6, 10);
    }
  }
}
