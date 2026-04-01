// =====================================================
// Player - 플레이어 (키보드 + 가상 조이스틱 지원)
// =====================================================
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charType) {
    super(scene, x, y, charType);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.charType = charType;
    const cfg     = CONFIG.PLAYER[charType];

    this.maxHp   = cfg.maxHp;
    this.hp      = cfg.maxHp;
    this.speed   = cfg.speed;
    this.defense = cfg.defense;

    this.invincible     = false;
    this.invincibleTime = 500;

    this.shieldHp  = 0;
    this.shieldMax = 0;

    this.gbCooldowns = new Map();

    this.setDepth(10);
    this.body.setSize(20, 24);
    this.body.setCollideWorldBounds(false);

    this.shadow   = scene.add.ellipse(x, y + 14, 22, 8, 0x000000, 0.25).setDepth(9);
    this.shieldGfx = scene.add.graphics().setDepth(11);
  }

  takeDamage(amount) {
    if (this.invincible) return;

    let dmg = Math.max(0, amount - this.defense);

    if (this.shieldHp > 0) {
      if (this.shieldHp >= dmg) {
        this.shieldHp -= dmg;
        dmg = 0;
      } else {
        dmg -= this.shieldHp;
        this.shieldHp = 0;
        this.scene.events.emit('shieldBroke');
      }
    }

    if (dmg > 0) {
      this.hp = Math.max(0, this.hp - dmg);
      this.scene.events.emit('playerDamaged', this.hp);
      this.setTint(0xff4444);
      this.scene.time.delayedCall(150, () => this.clearTint());
    }

    this.invincible = true;
    this.scene.time.delayedCall(this.invincibleTime, () => { this.invincible = false; });
  }

  update(cursors, wasd) {
    let vx = 0, vy = 0;

    // ── 키보드 입력 ──────────────────────────────
    if (cursors.left.isDown  || wasd.left.isDown)  vx = -1;
    if (cursors.right.isDown || wasd.right.isDown) vx =  1;
    if (cursors.up.isDown    || wasd.up.isDown)    vy = -1;
    if (cursors.down.isDown  || wasd.down.isDown)  vy =  1;

    // 키보드 대각선 정규화
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    // ── 가상 조이스틱 (레지스트리에서 읽기) ─────
    const jx = this.scene.registry.get('joystickDx') || 0;
    const jy = this.scene.registry.get('joystickDy') || 0;
    if (Math.abs(jx) > 0.05 || Math.abs(jy) > 0.05) {
      // 조이스틱이 활성화되면 키보드 입력 덮어쓰기
      vx = jx;
      vy = jy;
    }

    this.body.setVelocity(vx * this.speed, vy * this.speed);

    this.shadow.setPosition(this.x, this.y + 14);

    this.shieldGfx.clear();
    if (this.shieldHp > 0) {
      const alpha = 0.3 + 0.4 * (this.shieldHp / this.shieldMax);
      this.shieldGfx.lineStyle(3, 0xffd700, alpha);
      this.shieldGfx.strokeCircle(this.x, this.y, 28);
    }
  }

  destroy() {
    if (this.shadow)    this.shadow.destroy();
    if (this.shieldGfx) this.shieldGfx.destroy();
    super.destroy();
  }
}
