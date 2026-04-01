// =====================================================
// UIScene - HUD + 가상 조이스틱 (세로 모바일 레이아웃)
// =====================================================
class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.gameScene = this.scene.get('GameScene');

    // 상단 HUD 배경 띠
    this.add.rectangle(W/2, 38, W, 76, 0x000000, 0.55).setDepth(20);

    // ── 타이머 ────────────────────────────────────
    this.timerText = this.add.text(W/2, 18, '00:00', {
      fontSize: '26px', fontFamily: 'monospace', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0.5).setDepth(21);

    // ── HP 바 (전체 너비) ─────────────────────────
    this.add.text(8, 38, 'HP', {
      fontSize: '13px', fontFamily: 'sans-serif', fill: '#aaaaaa'
    }).setDepth(21);
    this.hpBarBg = this.add.rectangle(8, 52, W - 16, 14, 0x440000).setOrigin(0, 0.5).setDepth(21);
    this.hpBar   = this.add.rectangle(8, 52, W - 16, 14, 0xee2222).setOrigin(0, 0.5).setDepth(22);
    this.hpText  = this.add.text(W - 8, 45, '', {
      fontSize: '11px', fill: '#ffaaaa', fontFamily: 'sans-serif'
    }).setOrigin(1, 0).setDepth(22);

    // ── 실드 바 ───────────────────────────────────
    this.shieldBarBg = this.add.rectangle(8, 69, W - 16, 6, 0x332200).setOrigin(0, 0.5).setDepth(21);
    this.shieldBar   = this.add.rectangle(8, 69, W - 16, 6, 0xffd700).setOrigin(0, 0.5).setDepth(22);
    this.shieldBarBg.setAlpha(0); this.shieldBar.setAlpha(0);

    // ── 옵션(일시정지) 버튼 ─────────────────────
    const opt = this.add.text(W - 12, 8, '⚙', {
      fontSize: '24px', fontFamily: 'sans-serif', fill: '#888888'
    }).setOrigin(1, 0).setDepth(23).setInteractive({ useHandCursor: true });
    opt.on('pointerup', () => this._openPauseMenu());

    // ── 보스 HP 바 ────────────────────────────────
    const bossBarW = W - 20;
    this.bossBarContainer = this.add.container(W/2, 96).setDepth(21).setAlpha(0);
    const bbg = this.add.rectangle(0, 0, bossBarW, 16, 0x220000).setStrokeStyle(1, 0x880000);
    this.bossHpBar    = this.add.rectangle(-bossBarW/2, 0, 0, 16, 0xff3333).setOrigin(0, 0.5);
    this.bossNameText = this.add.text(0, -14, '', {
      fontSize: '13px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ff8888', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.bossHpText = this.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: 'sans-serif', fill: '#ffcccc',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.bossBarContainer.add([bbg, this.bossHpBar, this.bossNameText, this.bossHpText]);
    this._bossBarWidth = bossBarW;

    // ── XP 바 (화면 최하단) ───────────────────────
    this.xpBarBg = this.add.rectangle(0, H, W, 10, 0x002200).setOrigin(0, 1).setDepth(21);
    this.xpBar   = this.add.rectangle(0, H, 0,  10, 0x22ee22).setOrigin(0, 1).setDepth(22);

    // ── 레벨 텍스트 ──────────────────────────────
    this.levelText = this.add.text(8, H - 14, 'Lv.1', {
      fontSize: '14px', fontFamily: 'sans-serif', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setDepth(22);

    // ── 스킬 아이콘 (하단 우측, 가로 배열) ────────
    this.skillIcons = [];
    for (let i = 0; i < 9; i++) {
      const ico = this.add.container(W - 10 - (8 - i) * 34, H - 52).setDepth(22);
      const bg  = this.add.rectangle(0, 0, 30, 30, 0x112211).setStrokeStyle(1, 0x336633);
      const txt = this.add.text(0, 1, '', { fontSize: '16px', fontFamily: 'sans-serif' }).setOrigin(0.5);
      const lvl = this.add.text(9, 9, '',  {
        fontSize: '9px', fill: '#ffff88', fontFamily: 'sans-serif',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5);
      ico.add([bg, txt, lvl]); ico.setAlpha(0);
      this.skillIcons.push({ container: ico, txt, lvl });
    }

    // ── 가상 조이스틱 ─────────────────────────────
    this._initJoystick();

    // ── 이벤트 구독 ──────────────────────────────
    this.gameScene.events.on('bossSpawned',    (b)  => this._showBossBar(b));
    this.gameScene.events.on('bossDied',       ()   => this._checkHideBossBar());
    this.gameScene.events.on('bossHpChanged',  (b)  => this._updateBossBar(b));
  }

  // ════════════════════════════════════════════════
  // 가상 조이스틱 초기화
  // ════════════════════════════════════════════════
  _initJoystick() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const MAX_RADIUS = 55;
    const HOME_X = 85, HOME_Y = H - 130;

    // 조이스틱 홈 표시기 (반투명)
    this.joyBaseGfx = this.add.graphics().setDepth(30);
    this.joyThumbGfx = this.add.graphics().setDepth(31);
    this._drawJoystickHome(HOME_X, HOME_Y, MAX_RADIUS);

    let joyActive  = false;
    let joyPtrId   = null;
    let joyBaseX   = HOME_X;
    let joyBaseY   = HOME_Y;

    const resetJoystick = () => {
      joyActive = false;
      joyPtrId  = null;
      this.registry.set('joystickDx', 0);
      this.registry.set('joystickDy', 0);
      this._drawJoystickHome(HOME_X, HOME_Y, MAX_RADIUS);
    };

    this.input.on('pointerdown', (ptr) => {
      // 이미 다른 손가락이 조이스틱 조작 중이면 무시
      if (joyActive && ptr.id !== joyPtrId) return;
      // LevelUpScene 활성 중이면 조이스틱 비활성화
      if (this.scene.manager.isActive('LevelUpScene')) return;
      // 화면 하단 60%, 좌측 60% 영역에서만 조이스틱 활성화
      if (ptr.y > H * 0.4 && ptr.x < W * 0.6) {
        joyActive = true;
        joyPtrId  = ptr.id;
        joyBaseX  = ptr.x;
        joyBaseY  = ptr.y;
        this._drawJoystick(joyBaseX, joyBaseY, joyBaseX, joyBaseY, MAX_RADIUS);
      }
    });

    this.input.on('pointermove', (ptr) => {
      if (!joyActive || ptr.id !== joyPtrId) return;
      if (this.scene.manager.isActive('LevelUpScene')) { resetJoystick(); return; }

      const dx   = ptr.x - joyBaseX;
      const dy   = ptr.y - joyBaseY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const clamp = Math.min(dist, MAX_RADIUS);
      const angle = Math.atan2(dy, dx);

      const thumbX = joyBaseX + Math.cos(angle) * clamp;
      const thumbY = joyBaseY + Math.sin(angle) * clamp;
      this._drawJoystick(joyBaseX, joyBaseY, thumbX, thumbY, MAX_RADIUS);

      const norm = clamp / MAX_RADIUS;
      this.registry.set('joystickDx', Math.cos(angle) * norm);
      this.registry.set('joystickDy', Math.sin(angle) * norm);
    });

    this.input.on('pointerup', (ptr) => {
      if (ptr.id !== joyPtrId) return;
      resetJoystick();
    });

    this.input.on('pointerupoutside', (ptr) => {
      if (ptr.id !== joyPtrId) return;
      resetJoystick();
    });
  }

  _drawJoystickHome(cx, cy, r) {
    this.joyBaseGfx.clear();
    this.joyThumbGfx.clear();
    // 홈 위치 외곽 링 (연한 표시)
    this.joyBaseGfx.lineStyle(2, 0xffffff, 0.15);
    this.joyBaseGfx.strokeCircle(cx, cy, r);
    this.joyThumbGfx.fillStyle(0xffffff, 0.12);
    this.joyThumbGfx.fillCircle(cx, cy, 22);
  }

  _drawJoystick(baseX, baseY, thumbX, thumbY, r) {
    this.joyBaseGfx.clear();
    this.joyBaseGfx.fillStyle(0xffffff, 0.1);
    this.joyBaseGfx.fillCircle(baseX, baseY, r);
    this.joyBaseGfx.lineStyle(2, 0xffffff, 0.35);
    this.joyBaseGfx.strokeCircle(baseX, baseY, r);

    this.joyThumbGfx.clear();
    this.joyThumbGfx.fillStyle(0xffffff, 0.45);
    this.joyThumbGfx.fillCircle(thumbX, thumbY, 24);
    this.joyThumbGfx.lineStyle(2, 0xffffff, 0.7);
    this.joyThumbGfx.strokeCircle(thumbX, thumbY, 24);
  }

  // ════════════════════════════════════════════════
  // 매 프레임 HUD 갱신
  // ════════════════════════════════════════════════
  update() {
    const gs = this.gameScene;
    if (!gs || !gs.player || !gs.player.active) return;

    const player = gs.player;
    const xpSys  = gs.xpSystem;
    const barW   = CONFIG.WIDTH - 16;

    // HP
    const hpPct = Math.max(0, player.hp / player.maxHp);
    this.hpBar.setSize(barW * hpPct, 14);
    this.hpText.setText(`${Math.max(0,player.hp)}/${player.maxHp}`);

    // 실드
    if (player.shieldMax > 0) {
      const sPct = Math.max(0, player.shieldHp / player.shieldMax);
      this.shieldBarBg.setAlpha(1); this.shieldBar.setAlpha(1);
      this.shieldBar.setSize(barW * sPct, 6);
    } else {
      this.shieldBarBg.setAlpha(0); this.shieldBar.setAlpha(0);
    }

    // 타이머
    const elapsed   = Math.floor(gs.gameElapsed || 0);
    const remaining = CONFIG.GAME_DURATION - elapsed;
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    this.timerText.setText(`${m}:${s}`);
    this.timerText.setColor(remaining <= 30 ? '#ff4444' : '#ffffff');

    // XP
    if (xpSys) {
      this.xpBar.setSize(CONFIG.WIDTH * xpSys.progress, 10);
      this.levelText.setText(`Lv.${xpSys.level}`);
    }

    // 스킬 아이콘
    if (gs.skillManager) {
      const ICONS = {
        spinBlade:'⚔️', holyBarrier:'🛡️', shockWave:'💥', thunder:'⚡',
        arrowRain:'🌧️', guardBreak:'💪', warriorSpirit:'🔥', forkedArrow:'🏹', windPulse:'🌀'
      };
      const active = Object.entries(gs.skillManager.activeSkills);
      active.forEach(([id, lv], i) => {
        if (i >= this.skillIcons.length) return;
        const ico = this.skillIcons[i];
        ico.container.setAlpha(1);
        ico.txt.setText(ICONS[id] || '?');
        ico.lvl.setText(`${lv}`);
      });
      for (let i = active.length; i < this.skillIcons.length; i++) {
        this.skillIcons[i].container.setAlpha(0);
      }
    }

    // 보스 HP 바 실시간 갱신 (currentBoss가 살아있는 경우)
    if (this.currentBoss && this.currentBoss.active) {
      this._updateBossBar(this.currentBoss);
    }
  }

  // ── 보스 HP 바 표시 ─────────────────────────────
  _showBossBar(boss) {
    this.currentBoss = boss;
    this.bossBarContainer.setAlpha(1);
    this._updateBossBar(boss);
  }

  _updateBossBar(boss) {
    if (!boss || !boss.active) return;
    const pct = Math.max(0, boss.hp / boss.maxHp);
    this.bossHpBar.setSize(this._bossBarWidth * pct, 16);
    this.bossNameText.setText(boss.bossCfg.name);
    this.bossHpText.setText(`${Math.max(0, boss.hp)} / ${boss.maxHp}`);
  }

  // ★ Boss.die() 수정 덕분에 destroy 후 emit → countActive 정확히 동작
  _checkHideBossBar() {
    const gs = this.gameScene;
    if (!gs) return;
    const living = gs.bossGroup.getChildren().filter(b => b.active);
    if (living.length === 0) {
      this.bossBarContainer.setAlpha(0);
      this.currentBoss = null;
    } else {
      // 아직 살아있는 보스가 있으면 그 보스를 표시
      this._showBossBar(living[0]);
    }
  }

  // ── 일시정지 메뉴 ────────────────────────────────
  _openPauseMenu() {
    const gs = this.gameScene;
    if (gs) gs.scene.pause();

    // 조이스틱 리셋
    this.registry.set('joystickDx', 0);
    this.registry.set('joystickDy', 0);
    if (this.joyBaseGfx)  this.joyBaseGfx.clear();
    if (this.joyThumbGfx) this.joyThumbGfx.clear();

    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(200).setInteractive();
    const p  = this.add.container(W/2, H/2).setDepth(201);

    const bg = this.add.rectangle(0, 0, 300, 230, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const t  = this.add.text(0, -88, '일시정지', {
      fontSize: '24px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66'
    }).setOrigin(0.5);

    const makeBtn = (label, y, fillColor, strokeColor, cb) => {
      const r   = this.add.rectangle(0, y, 220, 44, fillColor).setStrokeStyle(1, strokeColor).setInteractive({ useHandCursor: true });
      const txt = this.add.text(0, y, label, {
        fontSize: '18px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ccffcc'
      }).setOrigin(0.5);
      r.on('pointerup', cb);
      return [r, txt];
    };

    const [r1, t1] = makeBtn('계속하기', -32, 0x224422, 0x44cc44, () => {
      ov.destroy(); p.destroy();
      if (gs) gs.scene.resume();
    });
    const [r2, t2] = makeBtn('메인으로', 22, 0x442222, 0xcc4444, () => {
      ov.destroy(); p.destroy();
      this.scene.stop('UIScene');
      if (gs) gs.scene.stop();
      this.scene.start('LobbyScene');
    });
    const [r3, t3] = makeBtn('처음부터', 76, 0x333333, 0x888888, () => {
      ov.destroy(); p.destroy();
      this.scene.stop('UIScene');
      if (gs) gs.scene.stop();
      this.scene.start('MainScene');
    });

    p.add([bg, t, r1, t1, r2, t2, r3, t3]);
  }
}
