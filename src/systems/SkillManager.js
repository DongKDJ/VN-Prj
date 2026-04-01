// =====================================================
// SkillManager - 스킬 관리 시스템
// =====================================================
class SkillManager {
  constructor(scene, player) {
    this.scene   = scene;
    this.player  = player;

    // { skillId: level (1~5) }
    this.activeSkills = {};

    // 회전 칼날 스프라이트 배열
    this.blades = [];
    this.bladeAngle = 0;

    // 각 스킬의 쿨다운 타이머
    this.cooldowns = {};

    // 투사체 그룹 (갈래 화살, 화살비)
    this.projectiles = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 200,
      runChildUpdate: false
    });

    // 실드 쿨다운
    this.shieldRegenTimer = 0;
    this.shieldBroken     = false;

    scene.events.on('shieldBroke', () => {
      this.shieldBroken    = true;
      this.shieldRegenTimer = scene.time.now;
    });
  }

  // 스킬 추가 or 레벨업
  addOrUpgrade(skillId) {
    const current = this.activeSkills[skillId] || 0;
    if (current >= 5) return;
    this.activeSkills[skillId] = current + 1;

    // 회전 칼날이면 블레이드 수 갱신
    if (skillId === 'spinBlade') this._rebuildBlades();
    // 실드면 즉시 적용
    if (skillId === 'holyBarrier') this._applyShield();
  }

  _applyShield() {
    const lv  = this.activeSkills['holyBarrier'];
    const cfg = CONFIG.SKILLS.holyBarrier.levels[lv - 1];
    this.player.shieldMax = cfg.shieldHp;
    this.player.shieldHp  = cfg.shieldHp;
    this.shieldBroken     = false;
  }

  _rebuildBlades() {
    this.blades.forEach(b => b.destroy());
    this.blades = [];
    const lv  = this.activeSkills['spinBlade'];
    const cfg = CONFIG.SKILLS.spinBlade.levels[lv - 1];
    for (let i = 0; i < cfg.blades; i++) {
      const b = this.scene.add.image(this.player.x, this.player.y, 'blade').setDepth(11);
      b.hitCooldowns = {};
      this.blades.push(b);
    }
  }

  // 스킬 선택지 반환 (레벨업 UI용)
  getChoices() {
    const charType   = this.player.charType;
    const allSkills  = Object.keys(CONFIG.SKILLS);
    const available  = allSkills.filter(id => {
      const sk = CONFIG.SKILLS[id];
      return sk.classes.includes(charType) && (this.activeSkills[id] || 0) < 5;
    });

    // 가중치: 아직 없는 스킬 우선
    const notOwned = available.filter(id => !this.activeSkills[id]);
    const owned    = available.filter(id =>  this.activeSkills[id]);

    let pool = [];
    if (notOwned.length >= 3) {
      pool = Phaser.Utils.Array.Shuffle(notOwned).slice(0, 3);
    } else {
      pool = [...notOwned, ...Phaser.Utils.Array.Shuffle(owned)].slice(0, 3);
    }
    return pool;
  }

  update(time, delta) {
    if (!this.player || !this.player.active) return;

    const px = this.player.x, py = this.player.y;

    // ── 회전 칼날 ──────────────────────────────────
    if (this.activeSkills['spinBlade'] && this.blades.length > 0) {
      const lv  = this.activeSkills['spinBlade'];
      const cfg = CONFIG.SKILLS.spinBlade.levels[lv - 1];
      this.bladeAngle += cfg.rotSpeed * (delta / 1000);

      this.blades.forEach((b, i) => {
        const a   = this.bladeAngle + (i / this.blades.length) * Math.PI * 2;
        b.x       = px + Math.cos(a) * cfg.radius;
        b.y       = py + Math.sin(a) * cfg.radius;
        b.rotation = a + Math.PI / 2;

        // 충돌 처리
        const now = Date.now();
        [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()].forEach(m => {
          if (!m.active) return;
          const dist = Phaser.Math.Distance.Between(b.x, b.y, m.x, m.y);
          if (dist < 18) {
            const key = `blade_${i}`;
            m.takeDamage(cfg.damage, key);
          }
        });
      });
    }

    // ── 신성 배리어 재생 ─────────────────────────────
    if (this.activeSkills['holyBarrier'] && this.shieldBroken) {
      const lv  = this.activeSkills['holyBarrier'];
      const cfg = CONFIG.SKILLS.holyBarrier.levels[lv - 1];
      if (time - this.shieldRegenTimer >= cfg.regenTime) {
        this.shieldBroken     = false;
        this.player.shieldHp  = this.player.shieldMax;
      }
    }

    // ── 충격파 / 전사의 외침 / 바람 방벽 (pulse 타입) ──
    ['shockWave','warriorSpirit','windPulse'].forEach(id => {
      if (!this.activeSkills[id]) return;
      if ((this.cooldowns[id] || 0) > time) return;
      const lv  = this.activeSkills[id];
      const cfg = CONFIG.SKILLS[id].levels[lv - 1];
      this.cooldowns[id] = time + cfg.cooldown;
      this._doPulse(id, cfg, px, py);
    });

    // ── 낙뢰 ─────────────────────────────────────
    if (this.activeSkills['thunder']) {
      if ((this.cooldowns['thunder'] || 0) <= time) {
        const lv  = this.activeSkills['thunder'];
        const cfg = CONFIG.SKILLS.thunder.levels[lv - 1];
        this.cooldowns['thunder'] = time + cfg.cooldown;
        this._doThunder(cfg);
      }
    }

    // ── 화살비 ───────────────────────────────────
    if (this.activeSkills['arrowRain']) {
      if ((this.cooldowns['arrowRain'] || 0) <= time) {
        const lv  = this.activeSkills['arrowRain'];
        const cfg = CONFIG.SKILLS.arrowRain.levels[lv - 1];
        this.cooldowns['arrowRain'] = time + cfg.cooldown;
        this._doArrowRain(cfg);
      }
    }

    // ── 갈래 화살 ─────────────────────────────────
    if (this.activeSkills['forkedArrow']) {
      if ((this.cooldowns['forkedArrow'] || 0) <= time) {
        const lv  = this.activeSkills['forkedArrow'];
        const cfg = CONFIG.SKILLS.forkedArrow.levels[lv - 1];
        this.cooldowns['forkedArrow'] = time + cfg.cooldown;
        this._doForkedArrow(cfg, px, py);
      }
    }

    // ── 충돌 (Guard Break) ─────────────────────────
    if (this.activeSkills['guardBreak']) {
      const vel = this.player.body.velocity;
      if (Math.abs(vel.x) > 50 || Math.abs(vel.y) > 50) {
        const lv  = this.activeSkills['guardBreak'];
        const cfg = CONFIG.SKILLS.guardBreak.levels[lv - 1];
        [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()].forEach(m => {
          if (!m.active) return;
          const dist = Phaser.Math.Distance.Between(px, py, m.x, m.y);
          if (dist < 30) {
            m.takeDamage(cfg.damage, 'guardBreak');
            // 넉백
            const angle = Phaser.Math.Angle.Between(px, py, m.x, m.y);
            m.body.velocity.x += Math.cos(angle) * cfg.knockback;
            m.body.velocity.y += Math.sin(angle) * cfg.knockback;
          }
        });
      }
    }

    // 투사체 업데이트
    this.projectiles.getChildren().forEach(p => {
      if (!p.active) return;
      if (p.lifeTimer && Date.now() > p.lifeTimer) { p.setActive(false).setVisible(false); return; }

      // 몬스터 충돌 체크
      [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()].forEach(m => {
        if (!m.active || !p.active) return;
        const dist = Phaser.Math.Distance.Between(p.x, p.y, m.x, m.y);
        if (dist < 16) {
          m.takeDamage(p.damage, null);
          p.setActive(false).setVisible(false);
        }
      });
    });
  }

  _doPulse(id, cfg, px, py) {
    // 시각 효과 (확장 원)
    const color  = id === 'windPulse' ? 0x88ddff : id === 'warriorSpirit' ? 0xffaa22 : 0xffffff;
    const ring   = this.scene.add.circle(px, py, 10, color, 0.4).setDepth(12);
    this.scene.tweens.add({
      targets: ring, scaleX: cfg.range / 10, scaleY: cfg.range / 10, alpha: 0,
      duration: 350, onComplete: () => ring.destroy()
    });

    // 데미지 적용
    const knockback = cfg.knockback || 0;
    [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()].forEach(m => {
      if (!m.active) return;
      const dist = Phaser.Math.Distance.Between(px, py, m.x, m.y);
      if (dist <= cfg.range) {
        m.takeDamage(cfg.damage, null);
        if (knockback > 0 && m.body) {
          const angle = Phaser.Math.Angle.Between(px, py, m.x, m.y);
          m.body.velocity.x += Math.cos(angle) * knockback;
          m.body.velocity.y += Math.sin(angle) * knockback;
        }
      }
    });
  }

  _doThunder(cfg) {
    const all = [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()]
      .filter(m => m.active);
    if (all.length === 0) return;

    Phaser.Utils.Array.Shuffle(all).slice(0, cfg.targets).forEach(m => {
      m.takeDamage(cfg.damage, null);
      // 번개 효과
      const bolt = this.scene.add.graphics().setDepth(15);
      bolt.lineStyle(3, 0xffff44, 1);
      bolt.lineBetween(m.x, m.y - 200, m.x + Phaser.Math.Between(-20, 20), m.y);
      bolt.lineStyle(2, 0xffffff, 0.8);
      bolt.lineBetween(m.x, m.y - 200, m.x, m.y);

      const flash = this.scene.add.circle(m.x, m.y, 25, 0xffff88, 0.7).setDepth(15);
      this.scene.time.delayedCall(120, () => { bolt.destroy(); flash.destroy(); });
    });
  }

  _doArrowRain(cfg) {
    const all = [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()]
      .filter(m => m.active);
    if (all.length === 0) return;

    const target = all[Phaser.Math.Between(0, all.length - 1)];
    const cx = target.x, cy = target.y;

    // 경고 원
    const warn = this.scene.add.circle(cx, cy, cfg.radius, 0xff4444, 0.25).setDepth(6);
    this.scene.time.delayedCall(500, () => {
      warn.destroy();
      for (let i = 0; i < cfg.arrows; i++) {
        const ax = cx + Phaser.Math.Between(-cfg.radius, cfg.radius);
        const ay = cy + Phaser.Math.Between(-cfg.radius, cfg.radius);

        // 맞는 적 데미지
        [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()].forEach(m => {
          if (!m.active) return;
          if (Phaser.Math.Distance.Between(ax, ay, m.x, m.y) < 20) {
            m.takeDamage(cfg.damage, null);
          }
        });

        // 화살 시각 효과
        const arrow = this.scene.add.image(ax, ay - 60, 'arrow').setDepth(13).setRotation(Math.PI / 2);
        this.scene.tweens.add({
          targets: arrow, y: ay, duration: 200,
          onComplete: () => {
            arrow.destroy();
            // 땅 표시
            const mark = this.scene.add.image(ax, ay, 'arrow').setDepth(4).setAlpha(0.4).setRotation(Math.PI / 2);
            this.scene.time.delayedCall(600, () => mark.destroy());
          }
        });
      }
    });
  }

  _doForkedArrow(cfg, px, py) {
    // 가장 가까운 적 찾기
    let nearest = null, nearestDist = Infinity;
    [...this.scene.monsters.getChildren(), ...this.scene.bossGroup.getChildren()].forEach(m => {
      if (!m.active) return;
      const d = Phaser.Math.Distance.Between(px, py, m.x, m.y);
      if (d < nearestDist) { nearestDist = d; nearest = m; }
    });

    const angle = nearest
      ? Phaser.Math.Angle.Between(px, py, nearest.x, nearest.y)
      : -Math.PI / 2;

    const half = Math.floor(cfg.arrows / 2);
    for (let i = -half; i <= half; i++) {
      if (cfg.arrows % 2 === 0 && i === 0) continue;
      const a = angle + i * cfg.spread;
      const p = this.projectiles.get(px, py, 'arrow');
      if (!p) continue;
      p.setActive(true).setVisible(true).setDepth(13);
      p.damage    = cfg.damage;
      p.lifeTimer = Date.now() + 1500;
      p.setRotation(a + Math.PI / 2);
      p.body.velocity.x = Math.cos(a) * cfg.speed;
      p.body.velocity.y = Math.sin(a) * cfg.speed;
    }
  }

  destroy() {
    this.blades.forEach(b => b.destroy());
    this.projectiles.clear(true, true);
  }
}
