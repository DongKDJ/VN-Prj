// =====================================================
// XP 오브 - 경험치 젬
// =====================================================
class XPOrb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, value) {
    const key = value >= 15 ? 'orb_large' : value >= 8 ? 'orb_mid' : 'orb_small';
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.xpValue   = value;
    this.attracted = false;
    this.attractSpeed = 250;

    this.setDepth(2);
    this.body.setCircle(this.width / 2);
    // 처음엔 약간 튀어나오는 효과
    const angle = Phaser.Math.Between(0, 360);
    scene.physics.velocityFromAngle(angle, 60, this.body.velocity);
    scene.time.delayedCall(300, () => { if (this.active) this.body.velocity.set(0, 0); });
  }

  update(player) {
    if (!this.active || !player) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 180 || this.attracted) {
      this.attracted = true;
      this.scene.physics.moveToObject(this, player, this.attractSpeed + (180 - Math.min(dist, 180)) * 1.5);
    }
  }
}
