// =====================================================
// GameScene - 메인 게임플레이
// =====================================================
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.charType = data.charType || 'warrior';
  }

  create() {
    this.physics.world.setBounds(-5000, -5000, 10000, 10000);

    // ── 배경 ──────────────────────────────────────
    this.bg = this.add.tileSprite(0, 0, 10000, 10000, 'bg_tile').setOrigin(0, 0).setDepth(0);
    this.bg.setPosition(-5000, -5000);

    // ── 플레이어 생성 ─────────────────────────────
    this.player = new Player(this, 0, 0, this.charType);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(40, 30);

    // ── 키보드 입력 ───────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // ── 그룹 생성 ─────────────────────────────────
    this.monsters        = this.physics.add.group({ runChildUpdate: false });
    this.bossGroup       = this.physics.add.group({ runChildUpdate: false });
    this.bossProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 400,
      runChildUpdate: false
    });

    // ── 시스템 ────────────────────────────────────
    this.skillManager = new SkillManager(this, this.player);
    this.waveSystem   = new WaveSystem(this);
    this.xpSystem     = new XPSystem(this);

    const startSkill = CONFIG.PLAYER[this.charType].startSkill;
    this.skillManager.addOrUpgrade(startSkill);

    // ── 상태 변수 ─────────────────────────────────
    this.gameElapsed = 0;
    this.gameOver    = false;
    this.killCount   = 0;

    // ── 이벤트 ────────────────────────────────────
    this.events.on('monsterDied', (m) => {
      this.killCount++;
      this.xpSystem.dropOrb(m.x, m.y, m.xpValue);
    });

    // bossDied는 이제 data 객체를 받음 (Boss.die() 수정 후)
    this.events.on('bossDied', (data) => {
      this.killCount++;
      for (let i = 0; i < 5; i++) {
        const ox = data.x + Phaser.Math.Between(-40, 40);
        const oy = data.y + Phaser.Math.Between(-40, 40);
        this.xpSystem.dropOrb(ox, oy, Math.floor(data.xpValue / 5));
      }
      // 보스 사망 시 해당 탄환 전부 제거
      this.bossProjectiles.getChildren().forEach(p => {
        p.setActive(false).setVisible(false);
      });
    });

    this.events.on('levelUp', (lv) => this._handleLevelUp(lv));

    this.events.on('playerDamaged', (hp) => {
      if (hp <= 0 && !this.gameOver) this._endGame(false);
    });

    // ── UI 씬 시작 ────────────────────────────────
    this.scene.launch('UIScene');
  }

  update(time, delta) {
    if (this.gameOver) return;

    const dt = delta / 1000;
    this.gameElapsed += dt;

    if (this.gameElapsed >= CONFIG.GAME_DURATION) {
      this._endGame(true);
      return;
    }

    // ── 플레이어 ─────────────────────────────────
    this.player.update(this.cursors, this.wasd);

    // ── 웨이브 ───────────────────────────────────
    this.waveSystem.update(this.gameElapsed, time);

    // ── 일반 몬스터 ──────────────────────────────
    this.monsters.getChildren().forEach(m => {
      if (!m.active) return;
      m.update(this.player);
      const dist = Phaser.Math.Distance.Between(m.x, m.y, this.player.x, this.player.y);
      if (dist < 22) m.contactDamage(this.player);
    });

    // ── 보스 업데이트 (bossProjectiles 전달) ──────
    this.bossGroup.getChildren().forEach(b => {
      if (!b.active) return;
      b.update(this.player, time, this.bossProjectiles);
      const dist = Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y);
      if (dist < 40) b.contactDamage(this.player);
    });

    // ── 보스 탄환 처리 ────────────────────────────
    const now = Date.now();
    this.bossProjectiles.getChildren().forEach(p => {
      if (!p.active) return;
      // 수명 체크
      if (p.lifeEnd && now > p.lifeEnd) {
        p.setActive(false).setVisible(false);
        return;
      }
      // 플레이어 피격 체크
      const dist = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
      if (dist < 18) {
        p.setActive(false).setVisible(false);
        this.player.takeDamage(p.damage || 8);
      }
    });

    // ── 스킬 ─────────────────────────────────────
    this.skillManager.update(time, delta);

    // ── XP 수집 ──────────────────────────────────
    this.xpSystem.collectOrbs(this.player);

    // ── 원거리 몬스터 제거 ────────────────────────
    if (Math.floor(this.gameElapsed * 2) % 4 === 0) {
      this.waveSystem.cullDistant(this.player.x, this.player.y);
    }

    // 배경 타일 스크롤
    const cam = this.cameras.main;
    this.bg.tilePositionX = cam.scrollX * 0.5;
    this.bg.tilePositionY = cam.scrollY * 0.5;
  }

  _handleLevelUp(level) {
    const choices = this.skillManager.getChoices();
    if (choices.length === 0) return;
    this.scene.pause('GameScene');
    this.scene.launch('LevelUpScene', { choices, level });
  }

  _endGame(isVictory) {
    this.gameOver = true;

    // 조이스틱 리셋
    this.registry.set('joystickDx', 0);
    this.registry.set('joystickDy', 0);

    this.time.delayedCall(isVictory ? 500 : 1200, () => {
      this.scene.stop('UIScene');
      this.scene.stop('LevelUpScene');

      const data = {
        elapsed: Math.floor(this.gameElapsed),
        level:   this.xpSystem.level,
        kills:   this.killCount
      };

      if (isVictory) {
        this.scene.start('GameClearScene', data);
      } else {
        this.cameras.main.shake(400, 0.015);
        this.player.setTint(0xff0000);
        this.time.delayedCall(600, () => this.scene.start('GameOverScene', data));
      }
    });
  }
}
