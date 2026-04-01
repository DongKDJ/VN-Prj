// =====================================================
// UIScene - HUD (HP, 타이머, XP, 보스 HP)
// =====================================================
class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.gameScene = this.scene.get('GameScene');

    // ── HP 바 ─────────────────────────────────────
    this.add.text(10, 12, 'HP', {
      fontSize: '13px', fontFamily: 'sans-serif', fill: '#aaaaaa'
    });
    this.hpBarBg   = this.add.rectangle(65, 18, 160, 14, 0x440000).setOrigin(0, 0.5);
    this.hpBar     = this.add.rectangle(65, 18, 160, 14, 0xee2222).setOrigin(0, 0.5);
    this.hpText    = this.add.text(235, 12, '', { fontSize: '12px', fill: '#ffaaaa', fontFamily: 'sans-serif' });

    // ── 실드 바 ───────────────────────────────────
    this.shieldBarBg = this.add.rectangle(65, 35, 160, 8, 0x332200).setOrigin(0, 0.5);
    this.shieldBar   = this.add.rectangle(65, 35, 160, 8, 0xffd700).setOrigin(0, 0.5);
    this.shieldBarBg.setAlpha(0);
    this.shieldBar.setAlpha(0);

    // ── 레벨 / XP 바 ──────────────────────────────
    this.levelText = this.add.text(10, H - 30, 'Lv.1', {
      fontSize: '16px', fontFamily: 'sans-serif', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    });
    this.xpBarBg = this.add.rectangle(0, H, W, 10, 0x002200).setOrigin(0, 1);
    this.xpBar   = this.add.rectangle(0, H, 0,  10, 0x22ee22).setOrigin(0, 1);

    // ── 타이머 ────────────────────────────────────
    this.timerText = this.add.text(W/2, 18, '00:00', {
      fontSize: '24px', fontFamily: 'monospace', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0.5);

    // ── 보스 HP 바 ────────────────────────────────
    this.bossBarContainer = this.add.container(W/2, H - 55);
    this.bossBarContainer.setAlpha(0);

    const bbg = this.add.rectangle(0, 0, 400, 18, 0x220000).setStrokeStyle(1, 0x880000);
    this.bossHpBar = this.add.rectangle(-200, 0, 0, 18, 0xff3333).setOrigin(0, 0.5);
    this.bossNameText = this.add.text(0, -16, '', {
      fontSize: '14px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ff8888', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.bossHpText = this.add.text(0, 0, '', {
      fontSize: '12px', fontFamily: 'sans-serif', fill: '#ffcccc', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    this.bossBarContainer.add([bbg, this.bossHpBar, this.bossNameText, this.bossHpText]);

    // ── 옵션 아이콘 ──────────────────────────────
    const opt = this.add.text(W - 14, 14, '⚙', {
      fontSize: '22px', fontFamily: 'sans-serif', fill: '#888888'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    opt.on('pointerup', () => this._openPauseMenu());

    // ── 활성 스킬 아이콘 표시 ─────────────────────
    this.skillIcons = [];
    for (let i = 0; i < 9; i++) {
      const ico = this.add.container(10 + i * 36, 58);
      const bg  = this.add.rectangle(0, 0, 32, 32, 0x112211).setStrokeStyle(1, 0x336633);
      const txt = this.add.text(0, 2, '', {
        fontSize: '18px', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      const lvl = this.add.text(10, 10, '', {
        fontSize: '10px', fill: '#ffff88', fontFamily: 'sans-serif',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5);
      ico.add([bg, txt, lvl]);
      ico.setAlpha(0);
      this.skillIcons.push({ container: ico, txt, lvl });
    }

    // 이벤트 구독
    this.gameScene.events.on('bossSpawned', (boss) => this._showBossBar(boss));
    this.gameScene.events.on('bossDied',    ()     => this._checkHideBossBar());
    this.gameScene.events.on('bossHpChanged', (boss) => this._updateBossBar(boss));
  }

  update() {
    const gs = this.gameScene;
    if (!gs || !gs.player || !gs.player.active) return;

    const player = gs.player;
    const xpSys  = gs.xpSystem;

    // HP 업데이트
    const hpPct = player.hp / player.maxHp;
    this.hpBar.setSize(160 * hpPct, 14);
    this.hpText.setText(`${player.hp}/${player.maxHp}`);

    // 실드 업데이트
    if (player.shieldMax > 0) {
      const sPct = player.shieldHp / player.shieldMax;
      this.shieldBarBg.setAlpha(1);
      this.shieldBar.setAlpha(1);
      this.shieldBar.setSize(160 * sPct, 8);
    } else {
      this.shieldBarBg.setAlpha(0);
      this.shieldBar.setAlpha(0);
    }

    // 타이머
    const elapsed = Math.floor(gs.gameElapsed || 0);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    this.timerText.setText(`${m}:${s}`);

    // 타이머 색상 (마지막 30초는 빨간색)
    const remaining = CONFIG.GAME_DURATION - elapsed;
    this.timerText.setColor(remaining <= 30 ? '#ff4444' : '#ffffff');

    // XP 바
    if (xpSys) {
      this.xpBar.setSize(CONFIG.WIDTH * xpSys.progress, 10);
      this.levelText.setText(`Lv.${xpSys.level}`);
    }

    // 스킬 아이콘 업데이트
    if (gs.skillManager) {
      const ICONS = {
        spinBlade: '⚔️', holyBarrier: '🛡️', shockWave: '💥', thunder: '⚡',
        arrowRain: '🌧️', guardBreak: '💪', warriorSpirit: '🔥', forkedArrow: '🏹', windPulse: '🌀'
      };
      const active = Object.entries(gs.skillManager.activeSkills);
      active.forEach(([id, lv], i) => {
        if (i >= this.skillIcons.length) return;
        const ico = this.skillIcons[i];
        ico.container.setAlpha(1);
        ico.txt.setText(ICONS[id] || '?');
        ico.lvl.setText(`Lv${lv}`);
      });
      for (let i = active.length; i < this.skillIcons.length; i++) {
        this.skillIcons[i].container.setAlpha(0);
      }
    }
  }

  _showBossBar(boss) {
    this.currentBoss = boss;
    this.bossBarContainer.setAlpha(1);
    this._updateBossBar(boss);
  }

  _updateBossBar(boss) {
    if (!boss || !boss.active) return;
    const pct = Math.max(0, boss.hp / boss.maxHp);
    this.bossHpBar.setSize(400 * pct, 18);
    this.bossNameText.setText(boss.bossCfg.name);
    this.bossHpText.setText(`${Math.max(0, boss.hp)} / ${boss.maxHp}`);
  }

  _checkHideBossBar() {
    const gs = this.gameScene;
    if (!gs || gs.bossGroup.countActive(true) === 0) {
      this.bossBarContainer.setAlpha(0);
    }
  }

  _openPauseMenu() {
    const gs = this.gameScene;
    if (gs) gs.scene.pause();

    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(200).setInteractive();
    const p  = this.add.container(W/2, H/2).setDepth(201);

    const bg = this.add.rectangle(0, 0, 280, 220, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const t  = this.add.text(0, -80, '일시정지', {
      fontSize: '24px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66'
    }).setOrigin(0.5);

    const resumeRect = this.add.rectangle(0, -25, 180, 38, 0x224422).setStrokeStyle(1, 0x44cc44).setInteractive({ useHandCursor: true });
    const resumeTxt  = this.add.text(0, -25, '계속하기', {
      fontSize: '18px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);
    resumeRect.on('pointerup', () => {
      ov.destroy(); p.destroy();
      if (gs) gs.scene.resume();
    });

    const exitRect = this.add.rectangle(0, 30, 180, 38, 0x442222).setStrokeStyle(1, 0xcc4444).setInteractive({ useHandCursor: true });
    const exitTxt  = this.add.text(0, 30, '메인으로', {
      fontSize: '18px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ffcccc'
    }).setOrigin(0.5);
    exitRect.on('pointerup', () => {
      ov.destroy(); p.destroy();
      this.scene.stop('UIScene');
      if (gs) { gs.scene.stop(); }
      this.scene.start('LobbyScene');
    });

    const lobbyRect = this.add.rectangle(0, 78, 180, 36, 0x333333).setStrokeStyle(1, 0x888888).setInteractive({ useHandCursor: true });
    const lobbyTxt  = this.add.text(0, 78, '처음부터', {
      fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#aaaaaa'
    }).setOrigin(0.5);
    lobbyRect.on('pointerup', () => {
      ov.destroy(); p.destroy();
      this.scene.stop('UIScene');
      if (gs) { gs.scene.stop(); }
      this.scene.start('MainScene');
    });

    p.add([bg, t, resumeRect, resumeTxt, exitRect, exitTxt, lobbyRect, lobbyTxt]);
  }
}
