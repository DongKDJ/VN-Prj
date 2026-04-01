// =====================================================
// Boss - 보스 몬스터 (탄막 패턴 포함)
// =====================================================
class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, bossCfg) {
    super(scene, x, y, bossCfg.id);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.bossCfg  = bossCfg;
    this.maxHp    = bossCfg.maxHp;
    this.hp       = bossCfg.maxHp;
    this.spd      = bossCfg.speed;
    this.dmg      = bossCfg.damage;
    this.xpValue  = bossCfg.xp;
    this.bossId   = bossCfg.id;
    this.bulletDmg = bossCfg.bulletDmg || 8;

    this.damageCooldowns = {};
    this.lastContactTime = 0;
    this.contactCooldown = 1000;

    // 탄막 패턴 상태
    this.attackPhase      = 0;
    this.attackTimer      = 0;
    this.spiralAngle      = 0;
    this.phase2Triggered  = false;
    this.specialTimer     = 0;
    this.bossProjectiles  = null; // update 시 주입됨

    this.setDepth(8);
    const r = bossCfg.size / 2;
    this.body.setCircle(r, this.width/2 - r, this.height/2 - r);

    // 보스 이름 텍스트
    this.nameText = scene.add.text(x, y - bossCfg.size/2 - 14, bossCfg.name, {
      fontSize: '12px', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3, fontFamily: 'sans-serif'
    }).setOrigin(0.5, 1).setDepth(9);

    // 등장 연출
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 800, ease: 'Power2' });
  }

  // ── 공격 간격 (보스별) ─────────────────────────
  _getAttackInterval() {
    const map = {
      angry_slime: 1800,
      sad_slime:   1600,
      fear_slime:  1200
    };
    return (map[this.bossId] || 2000) * (this.phase2Triggered ? 0.7 : 1);
  }

  update(player, time, bossProjectiles) {
    if (!this.active || !player) return;
    this.bossProjectiles = bossProjectiles; // 저장 (지연 발사용)

    // 기본 이동 (플레이어 추적)
    this.scene.physics.moveToObject(this, player, this.spd);

    // 이름 위치 동기화
    if (this.nameText) {
      this.nameText.setPosition(this.x, this.y - this.bossCfg.size/2 - 6);
    }

    // 탄막 공격 타이머
    if (time >= this.attackTimer) {
      this.attackTimer = time + this._getAttackInterval();
      this._doAttackPattern(player, time);
      this.attackPhase++;
    }

    // 페이즈2 전환 (HP 50% 이하)
    if (!this.phase2Triggered && this.hp < this.maxHp * 0.5) {
      this.phase2Triggered = true;
      this._triggerPhase2(player);
    }
  }

  // ── 탄막 패턴 선택 ──────────────────────────────
  _doAttackPattern(player, time) {
    if (!this.bossProjectiles) return;
    const phase = this.attackPhase % 3;

    switch(this.bossId) {
      case 'angry_slime': this._angryPattern(player, phase); break;
      case 'sad_slime':   this._sadPattern(player, phase, time); break;
      case 'fear_slime':  this._fearPattern(player, phase); break;
    }
  }

  // ── 분노의 슬라임 패턴 ──────────────────────────
  _angryPattern(player, phase) {
    const extra = this.phase2Triggered;

    if (phase === 0) {
      // 8방향 (페이즈2: 12방향) 방사형 탄막
      const count = extra ? 12 : 8;
      const spd   = extra ? 230 : 190;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        this._fire(this.x, this.y, Math.cos(a)*spd, Math.sin(a)*spd, 0xff2222);
      }
    } else if (phase === 1) {
      // 플레이어 방향 집중 3발 (페이즈2: 5발)
      const count  = extra ? 5 : 3;
      const spread = extra ? 0.22 : 0.28;
      const base   = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const half   = Math.floor(count / 2);
      for (let i = -half; i <= half; i++) {
        const a = base + i * spread;
        this._fire(this.x, this.y, Math.cos(a)*270, Math.sin(a)*270, 0xff5500);
      }
    } else {
      // 돌진 + 고속 단발
      const spd = extra ? 400 : 320;
      const a   = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this._fire(this.x, this.y, Math.cos(a)*spd, Math.sin(a)*spd, 0xffaa00);
      // 시각 경고 (빨간 플래시)
      this.setTint(0xff0000);
      this.scene.physics.moveToObject(this, player, this.spd * 3.5);
      this.scene.time.delayedCall(350, () => {
        if (this.active) {
          this.clearTint();
          this.scene.physics.moveToObject(this, player, this.spd);
        }
      });
    }
  }

  // ── 우울의 슬라임 패턴 ──────────────────────────
  _sadPattern(player, phase, time) {
    const extra = this.phase2Triggered;

    if (phase === 0) {
      // 나선형 탄막 (회전각 조금씩 증가)
      const count = extra ? 8 : 6;
      const spd   = extra ? 170 : 140;
      for (let i = 0; i < count; i++) {
        const a = this.spiralAngle + (i / count) * Math.PI * 2;
        this._fire(this.x, this.y, Math.cos(a)*spd, Math.sin(a)*spd, 0x4488ff);
      }
      this.spiralAngle += 0.45; // 회전
    } else if (phase === 1) {
      // 눈물비 - 5방향 (페이즈2: 7방향)
      const count  = extra ? 7 : 5;
      const base   = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const spread = 0.3;
      const half   = Math.floor(count / 2);
      for (let i = -half; i <= half; i++) {
        const a = base + i * spread;
        this._fire(this.x, this.y, Math.cos(a)*190, Math.sin(a)*190, 0x88aaff);
      }
    } else {
      // 울음 산탄 - 지연 후 전방위 폭발 (경고 → 발사)
      const count = extra ? 18 : 12;
      // 경고 원
      const warn = this.scene.add.circle(this.x, this.y, 20, 0x2255ff, 0.4).setDepth(7);
      this.scene.tweens.add({
        targets: warn, scaleX: 5, scaleY: 5, alpha: 0, duration: 600,
        onComplete: () => warn.destroy()
      });
      this.scene.time.delayedCall(600, () => {
        if (!this.active || !this.bossProjectiles) return;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          this._fire(this.x, this.y, Math.cos(a)*165, Math.sin(a)*165, 0x2266ff);
        }
      });
    }
  }

  // ── 공포의 슬라임 패턴 ──────────────────────────
  _fearPattern(player, phase) {
    const extra = this.phase2Triggered;

    if (phase === 0) {
      // 링 탄막 - 플레이어 방향에만 빈틈(피할 수 있는 구멍)
      const count    = extra ? 20 : 16;
      const gapAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const gapHalf  = extra ? 0.3 : 0.4; // 빈틈 각도 (라디안)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 - Math.PI; // -π ~ π
        // 플레이어 방향 빈틈에 해당하면 건너뜀
        let diff = a - gapAngle;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < gapHalf) continue;
        this._fire(this.x, this.y, Math.cos(a)*205, Math.sin(a)*205, 0x888888);
      }
    } else if (phase === 1) {
      // 이중 회전 스트림 (두 방향에서 동시에)
      const count  = extra ? 8 : 6;
      const spd    = extra ? 230 : 200;
      for (let i = 0; i < count; i++) {
        const delay = i * 100;
        this.scene.time.delayedCall(delay, () => {
          if (!this.active || !this.bossProjectiles) return;
          const a = this.spiralAngle + (i / count) * Math.PI;
          this._fire(this.x, this.y, Math.cos(a)*spd, Math.sin(a)*spd, 0xaaaaaa);
          this._fire(this.x, this.y, Math.cos(a+Math.PI)*spd, Math.sin(a+Math.PI)*spd, 0xaaaaaa);
        });
      }
      this.spiralAngle += 0.6;
    } else {
      // 랜덤 산탄 대폭발
      const count = extra ? 24 : 18;
      // 경고 플래시
      this.setTint(0xffffff);
      this.scene.time.delayedCall(300, () => { if (this.active) this.clearTint(); });
      this.scene.time.delayedCall(350, () => {
        if (!this.active || !this.bossProjectiles) return;
        for (let i = 0; i < count; i++) {
          const a   = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const spd = Phaser.Math.Between(150, 270);
          this._fire(this.x, this.y, Math.cos(a)*spd, Math.sin(a)*spd, 0xdddddd);
        }
      });
    }
  }

  // ── 페이즈2 전환 연출 ───────────────────────────
  _triggerPhase2(player) {
    // 분노 연출 (전체 폭발)
    const burst = this.scene.add.circle(this.x, this.y, 10, 0xff8800, 0.6).setDepth(13);
    this.scene.tweens.add({
      targets: burst, scaleX: 14, scaleY: 14, alpha: 0, duration: 500,
      onComplete: () => burst.destroy()
    });
    this.scene.cameras.main.shake(400, 0.012);
    // 속도 증가
    this.spd = Math.floor(this.spd * 1.3);
    // 경고 텍스트
    const cam = this.scene.cameras.main;
    const warn = this.scene.add.text(
      cam.scrollX + CONFIG.WIDTH/2, cam.scrollY + CONFIG.HEIGHT/2 - 40,
      '⚠ 분노!', {
        fontSize: '26px', fill: '#ff4400',
        stroke: '#000000', strokeThickness: 5, fontFamily: 'sans-serif'
      }
    ).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: warn, y: warn.y - 50, alpha: 0, duration: 1500,
      onComplete: () => warn.destroy()
    });
  }

  // ── 탄환 발사 헬퍼 ──────────────────────────────
  _fire(x, y, vx, vy, tint) {
    if (!this.bossProjectiles) return;
    const p = this.bossProjectiles.get(x, y, 'boss_bullet');
    if (!p) return;
    p.setActive(true).setVisible(true).setDepth(12);
    p.setTint(tint || 0xffffff);
    p.damage  = this.bulletDmg;
    p.lifeEnd = Date.now() + 5000;
    if (p.body) {
      p.body.velocity.set(vx, vy);
      const r = 6;
      p.body.setCircle(r, p.width/2 - r, p.height/2 - r);
    }
  }

  // ── 피해 처리 ──────────────────────────────────
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
    if (this.hp <= 0) { this.die(); return true; }
    return false;
  }

  contactDamage(player) {
    const now = Date.now();
    if (now - this.lastContactTime < this.contactCooldown) return;
    this.lastContactTime = now;
    player.takeDamage(this.dmg);
  }

  // ── 보스 사망 (★ destroy 먼저 → emit 나중 → HP바 버그 수정) ──
  die() {
    const scene    = this.scene;
    const bossData = { bossId: this.bossId, x: this.x, y: this.y, xpValue: this.xpValue };
    if (this.nameText) { this.nameText.destroy(); this.nameText = null; }
    this.destroy();                          // 그룹에서 즉시 제거
    scene.events.emit('bossDied', bossData); // 제거 후 이벤트 → countActive() 정확
  }
}
