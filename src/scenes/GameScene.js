// =====================================================
// GameScene - 메인 게임플레이
// =====================================================
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.charType = data.charType || 'warrior';
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    // ── 세계 크기 설정 ─────────────────────────────
    this.physics.world.setBounds(-5000, -5000, 10000, 10000);

    // ── 배경 ──────────────────────────────────────
    this.bg = this.add.tileSprite(0, 0, 10000, 10000, 'bg_tile').setOrigin(0, 0).setDepth(0);
    this.bg.setPosition(-5000, -5000);

    // ── 플레이어 생성 ─────────────────────────────
    this.player = new Player(this, 0, 0, this.charType);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(60, 40);

    // ── 입력 ──────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // ── 몬스터/보스 그룹 ──────────────────────────
    this.monsters  = this.physics.add.group({ runChildUpdate: false });
    this.bossGroup = this.physics.add.group({ runChildUpdate: false });

    // ── 시스템 ────────────────────────────────────
    this.skillManager = new SkillManager(this, this.player);
    this.waveSystem   = new WaveSystem(this);
    this.xpSystem     = new XPSystem(this);

    // 시작 스킬 부여
    const startSkill = CONFIG.PLAYER[this.charType].startSkill;
    this.skillManager.addOrUpgrade(startSkill);

    // ── 타이머 ────────────────────────────────────
    this.gameElapsed = 0;
    this.gameOver    = false;
    this.killCount   = 0;

    // ── 이벤트 ────────────────────────────────────
    this.events.on('monsterDied', (m) => {
      this.killCount++;
      this.xpSystem.dropOrb(m.x, m.y, m.xpValue);
    });

    this.events.on('bossDied', (b) => {
      this.killCount++;
      // 보스는 XP 많이 드랍
      for (let i = 0; i < 5; i++) {
        const ox = b.x + Phaser.Math.Between(-40, 40);
        const oy = b.y + Phaser.Math.Between(-40, 40);
        this.xpSystem.dropOrb(ox, oy, Math.floor(b.xpValue / 5));
      }
    });

    this.events.on('levelUp', (lv) => {
      this._handleLevelUp(lv);
    });

    // ── UI 씬 시작 ────────────────────────────────
    this.scene.launch('UIScene');

    // ── 플레이어 죽음 체크 ─────────────────────────
    this.events.on('playerDamaged', (hp) => {
      if (hp <= 0 && !this.gameOver) {
        this._endGame(false);
      }
    });

    // 사막 안개 / 비네트
    this._addVignette();
  }

  update(time, delta) {
    if (this.gameOver) return;

    const dt = delta / 1000;
    this.gameElapsed += dt;

    // 클리어 조건
    if (this.gameElapsed >= CONFIG.GAME_DURATION && !this.gameOver) {
      this._endGame(true);
      return;
    }

    // ── 플레이어 업데이트 ────────────────────────
    this.player.update(this.cursors, this.wasd);

    // ── 웨이브 시스템 ────────────────────────────
    this.waveSystem.update(this.gameElapsed, time);

    // ── 몬스터 업데이트 ──────────────────────────
    this.monsters.getChildren().forEach(m => {
      if (!m.active) return;
      m.update(this.player);
      // 플레이어 접촉 피해
      const dist = Phaser.Math.Distance.Between(m.x, m.y, this.player.x, this.player.y);
      if (dist < 22) m.contactDamage(this.player);
    });

    // ── 보스 업데이트 ─────────────────────────────
    this.bossGroup.getChildren().forEach(b => {
      if (!b.active) return;
      b.update(this.player, time);
      const dist = Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y);
      if (dist < 40) b.contactDamage(this.player);
    });

    // ── 스킬 업데이트 ─────────────────────────────
    this.skillManager.update(time, delta);

    // ── XP 오브 수집 ──────────────────────────────
    this.xpSystem.collectOrbs(this.player);

    // ── 먼 몬스터 제거 (성능) ─────────────────────
    if (Math.floor(this.gameElapsed * 2) % 4 === 0) {
      this.waveSystem.cullDistant(this.player.x, this.player.y);
    }

    // 배경 스크롤 동기화
    const cam = this.cameras.main;
    this.bg.tilePositionX = cam.scrollX * 0.5;
    this.bg.tilePositionY = cam.scrollY * 0.5;
  }

  _handleLevelUp(level) {
    const choices = this.skillManager.getChoices();
    if (choices.length === 0) return; // 모든 스킬 최대 레벨

    // 게임 씬 일시 정지
    this.scene.pause('GameScene');
    this.scene.launch('LevelUpScene', { choices, level });
  }

  _endGame(isVictory) {
    this.gameOver = true;

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
        // 사망 연출
        this.cameras.main.shake(400, 0.015);
        this.player.setTint(0xff0000);
        this.time.delayedCall(600, () => {
          this.scene.start('GameOverScene', data);
        });
      }
    });
  }

  _addVignette() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const cam = this.cameras.main;
    // Phaser 카메라 비네트 효과는 없으므로 오버레이 그래픽으로 구현
    // UI scene에서 처리됨 (고정 위치)
  }
}
