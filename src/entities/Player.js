// =====================================================
// Player - 플레이어 (전사 / 궁수 공통)
// =====================================================
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charType) {
    super(scene, x, y, charType);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.charType = charType;
    const cfg     = CONFIG.PLAYER[charType];

    // 스탯
    this.maxHp   = cfg.maxHp;
    this.hp      = cfg.maxHp;
    this.speed   = cfg.speed;
    this.defense = cfg.defense;

    // 무적 프레임
    this.invincible     = false;
    this.invincibleTime = 500; // ms

    // 실드 (Holy Barrier)
    this.shieldHp  = 0;
    this.shieldMax = 0;

    // Guard Break 데미지 쿨다운
    this.gbCooldowns = new Map();

    this.setDepth(10);
    this.body.setSize(20, 24);
    this.body.setCollideWorldBounds(false);

    // 쉐도우
    this.shadow = scene.add.ellipse(x, y + 14, 22, 8, 0x000000, 0.25).setDepth(9);
    // 실드 그래픽
    this.shieldGfx = scene.add.graphics().setDepth(11);
  }

  // 데미지 받기
  takeDamage(amount) {
    if (this.invincible) return;

    let dmg = Math.max(0, amount - this.defense);

    // 실드가 있으면 먼저 차감
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

      // 피격 깜빡임
      this.setTint(0xff4444);
      this.scene.time.delayedCall(150, () => this.clearTint());
    }

    // 무적 시간
    this.invincible = true;
    this.scene.time.delayedCall(this.invincibleTime, () => { this.invincible = false; });
  }

  update(cursors, wasd) {
    let vx = 0, vy = 0;

    if (cursors.left.isDown  || wasd.left.isDown)  vx = -1;
    if (cursors.right.isDown || wasd.right.isDown) vx =  1;
    if (cursors.up.isDown    || wasd.up.isDown)    vy = -1;
    if (cursors.down.isDown  || wasd.down.isDown)  vy =  1;

    // 대각선 정규화
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.body.setVelocity(vx * this.speed, vy * this.speed);

    // 그림자 위치
    this.shadow.setPosition(this.x, this.y + 14);

    // 실드 그리기
    this.shieldGfx.clear();
    if (this.shieldHp > 0) {
      const alpha = 0.3 + 0.4 * (this.shieldHp / this.shieldMax);
      this.shieldGfx.lineStyle(3, 0xffd700, alpha);
      this.shieldGfx.strokeCircle(this.x, this.y, 28);
    }
  }

  destroy() {
    this.shadow.destroy();
    this.shieldGfx.destroy();
    super.destroy();
  }
}
