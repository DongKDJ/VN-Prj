// =====================================================
// Boss - 보스 몬스터
// =====================================================
class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, bossCfg) {
    super(scene, x, y, bossCfg.id);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.bossCfg = bossCfg;
    this.maxHp   = bossCfg.maxHp;
    this.hp      = bossCfg.maxHp;
    this.spd     = bossCfg.speed;
    this.dmg     = bossCfg.damage;
    this.xpValue = bossCfg.xp;
    this.bossId  = bossCfg.id;

    this.damageCooldowns  = {};
    this.lastContactTime  = 0;
    this.contactCooldown  = 1000;

    this.setDepth(8);
    const r = bossCfg.size / 2;
    this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
    this.setScale(1);

    // 보스 이름 텍스트
    this.nameText = scene.add.text(x, y - bossCfg.size / 2 - 14, bossCfg.name, {
      fontSize: '11px', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
      fontFamily: 'sans-serif'
    }).setOrigin(0.5, 1).setDepth(9);

    // 입장 연출
    this.setAlpha(0);
    scene.tweens.add({
      targets: this, alpha: 1, duration: 800, ease: 'Power2'
    });

    // 특수 패턴 타이머 (보스별)
    this.specialTimer = 0;
    this.specialCooldown = this._getSpecialCooldown();
  }

  _getSpecialCooldown() {
    const map = {
      angry_slime: 3000,
      sad_slime: 6000,
      fear_slime: 4000,
      adhesion_slime: 5000
    };
    return map[this.bossId] || 5000;
  }

  update(player, time) {
    if (!this.active || !player) return;

    // 기본 이동
    this.scene.physics.moveToObject(this, player, this.spd);

    // 이름 텍스트 위치
    this.nameText.setPosition(this.x, this.y - this.bossCfg.size / 2 - 6);

    // 특수 패턴
    if (time - this.specialTimer > this.specialCooldown) {
      this.specialTimer = time;
      this._doSpecial(player);
    }
  }

  _doSpecial(player) {
    switch(this.bossId) {
      case 'angry_slime':
        // 순간 돌진
        this.scene.physics.moveToObject(this, player, this.spd * 3);
        this.scene.time.delayedCall(400, () => {
          if (this.active) this.scene.physics.moveToObject(this, player, this.spd);
        });
        // 붉은 플래시
        this.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
        break;

      case 'sad_slime':
        // 눈물(슬로우 존) - 시각 효과만
        const tearCount = 5;
        for (let i = 0; i < tearCount; i++) {
          const angle = (i / tearCount) * Math.PI * 2;
          const tx = this.x + Math.cos(angle) * 80;
          const ty = this.y + Math.sin(angle) * 80;
          const t = this.scene.add.circle(tx, ty, 10, 0x6699ff, 0.6).setDepth(6);
          this.scene.time.delayedCall(2000, () => t.destroy());
        }
        this.setTint(0x4488ff);
        this.scene.time.delayedCall(300, () => { if (this.active) this.clearTint(); });
        break;

      case 'fear_slime':
        // 공포 펄스 - 주위에 어두운 파동
        const ring = this.scene.add.circle(this.x, this.y, 10, 0x111111, 0.5).setDepth(6);
        this.scene.tweens.add({
          targets: ring, scaleX: 12, scaleY: 12, alpha: 0, duration: 600,
          onComplete: () => ring.destroy()
        });
        break;

      case 'adhesion_slime':
        // 집착 - 순간이동으로 플레이어 위치로
        if (player) {
          const angle = Phaser.Math.Between(0, 360);
          const dist  = 120;
          this.x = player.x + Math.cos(Phaser.Math.DegToRad(angle)) * dist;
          this.y = player.y + Math.sin(Phaser.Math.DegToRad(angle)) * dist;
        }
        this.setTint(0xcc55ff);
        this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
        break;
    }
  }

  takeDamage(amount, skillKey) {
    const now = Date.now();
    if (skillKey) {
      const last = this.damageCooldowns[skillKey] || 0;
      if (now - last < 500) return false;
      this.damageCooldowns[skillKey] = now;
    }
    this.hp -= amount;

    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });

    this.scene.events.emit('bossHpChanged', this);

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  contactDamage(player) {
    const now = Date.now();
    if (now - this.lastContactTime < this.contactCooldown) return;
    this.lastContactTime = now;
    player.takeDamage(this.dmg);
  }

  die() {
    this.scene.events.emit('bossDied', this);
    if (this.nameText) this.nameText.destroy();
    this.destroy();
  }
}
