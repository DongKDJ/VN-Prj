// =====================================================
// Monster - 일반 몬스터
// =====================================================
class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, monsterType) {
    super(scene, x, y, monsterType);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.monsterType = monsterType;
    const cfg        = CONFIG.MONSTERS[monsterType];

    this.maxHp   = cfg.maxHp;
    this.hp      = cfg.maxHp;
    this.spd     = cfg.speed;
    this.dmg     = cfg.damage;
    this.xpValue = cfg.xp;

    // 데미지 쿨다운 (스킬별)
    this.damageCooldowns = {};
    // 마지막 플레이어 접촉 시간
    this.lastContactTime = 0;
    this.contactCooldown = 800;

    this.setDepth(5);
    const r = cfg.size / 2;
    this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    // HP 바
    this.hpBarBg = scene.add.rectangle(0, 0, cfg.size, 4, 0x333333).setDepth(6);
    this.hpBar   = scene.add.rectangle(0, 0, cfg.size, 4, 0x22cc22).setDepth(7);
  }

  update(player) {
    if (!this.active || !player) return;

    // 플레이어를 향해 이동
    this.scene.physics.moveToObject(this, player, this.spd);

    // HP 바 위치 갱신
    const hpPct = this.hp / this.maxHp;
    const bw    = this.width;
    this.hpBarBg.setPosition(this.x, this.y - this.height / 2 - 6);
    this.hpBar.setPosition(this.x - bw / 2 + (bw * hpPct) / 2, this.y - this.height / 2 - 6);
    this.hpBar.setSize(bw * hpPct, 4);
  }

  // 데미지 받기 (skillKey로 중복 피격 방지)
  takeDamage(amount, skillKey) {
    const now = Date.now();
    if (skillKey) {
      const last = this.damageCooldowns[skillKey] || 0;
      if (now - last < 500) return false;
      this.damageCooldowns[skillKey] = now;
    }
    this.hp -= amount;

    // 피격 플래시
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });

    if (this.hp <= 0) {
      this.die();
      return true; // 죽음
    }
    return false;
  }

  // 플레이어 접촉 데미지
  contactDamage(player) {
    const now = Date.now();
    if (now - this.lastContactTime < this.contactCooldown) return;
    this.lastContactTime = now;
    player.takeDamage(this.dmg);
  }

  die() {
    // XP 오브 드랍은 GameScene에서 처리
    this.scene.events.emit('monsterDied', this);
    this.hpBarBg.destroy();
    this.hpBar.destroy();
    this.destroy();
  }

  deactivate() {
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBar)   this.hpBar.destroy();
    this.destroy();
  }
}
