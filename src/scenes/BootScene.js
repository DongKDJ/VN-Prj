// =====================================================
// BootScene - 텍스처 생성 및 에셋 로드
// =====================================================
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // 로딩 텍스트
    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, '로딩 중...', {
      fontSize: '24px', fill: '#ffffff', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
  }

  create() {
    this._makeBackground();
    this._makePlayers();
    this._makeMonsters();
    this._makeBosses();
    this._makeSkillAssets();
    this._makeUI();
    this._makeXPOrbs();

    this.scene.start('LobbyScene');
  }

  // ── 배경 타일 ───────────────────────────────────
  _makeBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x2d4a1e, 1); g.fillRect(0, 0, 64, 64);
    // 잔디 패턴
    g.fillStyle(0x3a5c26, 1);
    [[8,8],[32,16],[50,40],[16,50],[40,56]].forEach(([x,y])=>{
      g.fillRect(x, y, 4, 4);
    });
    g.fillStyle(0x254018, 1);
    [[20,20],[44,8],[10,44],[56,28]].forEach(([x,y])=>{
      g.fillRect(x, y, 3, 3);
    });
    g.generateTexture('bg_tile', 64, 64);
    g.destroy();
  }

  // ── 플레이어 스프라이트 ─────────────────────────
  _makePlayers() {
    // 전사 (32x32)
    this._makePlayerSprite('warrior', CONFIG.PLAYER.warrior.bodyColor, CONFIG.PLAYER.warrior.armorColor, true);
    // 궁수 (32x32)
    this._makePlayerSprite('archer',  CONFIG.PLAYER.archer.bodyColor,  CONFIG.PLAYER.archer.armorColor,  false);
  }

  _makePlayerSprite(key, bodyColor, accentColor, isWarrior) {
    const g = this.add.graphics();
    const s = 32;

    // 그림자 / 다리
    g.fillStyle(accentColor, 1);
    g.fillRect(8,  24, 6, 7);  // 왼다리
    g.fillRect(18, 24, 6, 7);  // 오른다리

    // 몸통
    g.fillStyle(bodyColor, 1);
    g.fillRect(7, 14, 18, 12);

    // 머리
    g.fillStyle(0xffcc88, 1);
    g.fillCircle(16, 10, 8);

    // 눈
    g.fillStyle(0x222222, 1);
    g.fillRect(12, 8, 2, 2);
    g.fillRect(18, 8, 2, 2);

    if (isWarrior) {
      // 방패 (왼쪽)
      g.fillStyle(accentColor, 1);
      g.fillRect(0, 13, 6, 10);
      g.fillStyle(0xcccccc, 1);
      g.fillRect(1, 14, 4, 8);
      // 검 (오른쪽)
      g.fillStyle(0xdddddd, 1);
      g.fillRect(26, 6, 3, 18);
      g.fillStyle(0xaaaa44, 1);
      g.fillRect(24, 14, 7, 2);
    } else {
      // 활 (오른쪽)
      g.lineStyle(2, accentColor, 1);
      g.strokeCircle(28, 15, 8);
      g.fillStyle(accentColor, 1);
      g.fillRect(27, 7, 2, 16);
      // 화살통 (왼쪽)
      g.fillStyle(accentColor, 1);
      g.fillRect(2, 12, 4, 12);
    }

    // 투구/머리 장식
    g.fillStyle(accentColor, 1);
    if (isWarrior) {
      g.fillRect(8, 2, 16, 5); // 투구
      g.fillRect(14, 0, 4, 3); // 투구 볏
    } else {
      g.fillRect(9, 3, 14, 4); // 두건
    }

    g.generateTexture(key, s, s);
    g.destroy();
  }

  // ── 몬스터 스프라이트 ───────────────────────────
  _makeMonsters() {
    Object.entries(CONFIG.MONSTERS).forEach(([key, cfg]) => {
      this._makeSlime(key, cfg.color, cfg.size, false);
    });
  }

  _makeSlime(key, color, size, isBoss, expression) {
    const g = this.add.graphics();
    const s = size;
    const cx = s / 2, cy = s / 2 + s * 0.05;

    // 몸통
    const dark = Phaser.Display.Color.IntegerToColor(color);
    dark.darken(20);
    const darkInt = Phaser.Display.Color.GetColor(dark.r, dark.g, dark.b);

    g.fillStyle(darkInt, 1);
    g.fillEllipse(cx, cy + s * 0.08, s * 0.9, s * 0.65);

    g.fillStyle(color, 1);
    g.fillEllipse(cx, cy - s * 0.05, s * 0.85, s * 0.75);

    // 하이라이트
    g.fillStyle(0xffffff, 0.25);
    g.fillEllipse(cx - s * 0.15, cy - s * 0.2, s * 0.35, s * 0.25);

    // 눈
    const eyeOffX = s * 0.18, eyeR = s * 0.1;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - eyeOffX, cy - s * 0.05, eyeR);
    g.fillCircle(cx + eyeOffX, cy - s * 0.05, eyeR);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - eyeOffX + eyeR * 0.3, cy - s * 0.05, eyeR * 0.55);
    g.fillCircle(cx + eyeOffX + eyeR * 0.3, cy - s * 0.05, eyeR * 0.55);

    if (isBoss) {
      // 보스 전용 표정/특징
      g.fillStyle(0xff3333, 1);
      if (expression === 'angry') {
        // 화난 눈썹
        g.fillRect(cx - eyeOffX * 1.5, cy - s * 0.18, s * 0.2, s * 0.06);
        g.fillRect(cx + eyeOffX * 0.6, cy - s * 0.2, s * 0.2, s * 0.06);
      }
    }

    g.generateTexture(key, s, s);
    g.destroy();
  }

  // ── 보스 스프라이트 ─────────────────────────────
  _makeBosses() {
    CONFIG.BOSSES.forEach(b => {
      this._makeBossSlime(b.id, b.color, b.size);
    });
  }

  _makeBossSlime(id, color, size) {
    const g  = this.add.graphics();
    const s  = size;
    const cx = s / 2, cy = s / 2 + s * 0.05;

    // 어두운 테두리
    const dark = Phaser.Display.Color.IntegerToColor(color);
    dark.darken(30);
    const darkInt = Phaser.Display.Color.GetColor(dark.r, dark.g, dark.b);

    g.fillStyle(darkInt, 1);
    g.fillEllipse(cx, cy + s * 0.1, s * 0.92, s * 0.7);
    g.fillStyle(color, 1);
    g.fillEllipse(cx, cy, s * 0.88, s * 0.8);

    // 하이라이트
    g.fillStyle(0xffffff, 0.2);
    g.fillEllipse(cx - s * 0.15, cy - s * 0.2, s * 0.35, s * 0.25);

    // 보스별 특수 표현
    const eyeR   = s * 0.1;
    const eyeOffX = s * 0.2;

    switch(id) {
      case 'angry_slime':
        // 화난 눈썹
        g.fillStyle(0xcc0000, 1);
        g.fillRect(cx - eyeOffX * 1.6, cy - s * 0.15, s * 0.22, s * 0.07);
        g.fillRect(cx + eyeOffX * 0.6, cy - s * 0.17, s * 0.22, s * 0.07);
        // 입 (날카로운)
        g.fillStyle(0x880000, 1);
        g.fillRect(cx - s * 0.15, cy + s * 0.1, s * 0.3, s * 0.08);
        break;
      case 'sad_slime':
        // 눈물
        g.fillStyle(0x88aaff, 1);
        g.fillEllipse(cx - eyeOffX, cy + s * 0.12, eyeR * 0.8, eyeR * 1.5);
        g.fillEllipse(cx + eyeOffX, cy + s * 0.15, eyeR * 0.8, eyeR * 1.8);
        // 내려간 눈썹
        g.fillStyle(0x224499, 1);
        g.fillRect(cx - eyeOffX * 1.4, cy - s * 0.12, s * 0.2, s * 0.06);
        g.fillRect(cx + eyeOffX * 0.6, cy - s * 0.12, s * 0.2, s * 0.06);
        break;
      case 'fear_slime':
        // 겁먹은 눈 (큰 흰 눈)
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx - eyeOffX, cy - s * 0.05, eyeR * 1.5);
        g.fillCircle(cx + eyeOffX, cy - s * 0.05, eyeR * 1.5);
        g.fillStyle(0x111111, 1);
        g.fillCircle(cx - eyeOffX, cy - s * 0.05, eyeR * 0.7);
        g.fillCircle(cx + eyeOffX, cy - s * 0.05, eyeR * 0.7);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx - eyeOffX - eyeR * 0.4, cy - s * 0.1, eyeR * 0.3);
        g.fillCircle(cx + eyeOffX - eyeR * 0.4, cy - s * 0.1, eyeR * 0.3);
        break;
      case 'adhesion_slime':
        // 집착 - 끈적한 촉수 표현
        g.lineStyle(4, darkInt, 0.8);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          g.lineBetween(cx, cy, cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55);
        }
        g.fillStyle(0xdd99ff, 1);
        g.fillCircle(cx - eyeOffX * 0.8, cy - s * 0.05, eyeR * 1.2);
        g.fillCircle(cx + eyeOffX * 0.8, cy - s * 0.05, eyeR * 1.2);
        g.fillStyle(0x440066, 1);
        g.fillCircle(cx - eyeOffX * 0.8, cy - s * 0.05, eyeR * 0.6);
        g.fillCircle(cx + eyeOffX * 0.8, cy - s * 0.05, eyeR * 0.6);
        break;
    }

    // 공통 눈 (override 안 된 경우)
    if (id === 'angry_slime' || id === 'sad_slime') {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx - eyeOffX, cy - s * 0.05, eyeR);
      g.fillCircle(cx + eyeOffX, cy - s * 0.05, eyeR);
      g.fillStyle(0x111111, 1);
      g.fillCircle(cx - eyeOffX + eyeR * 0.3, cy - s * 0.05, eyeR * 0.55);
      g.fillCircle(cx + eyeOffX + eyeR * 0.3, cy - s * 0.05, eyeR * 0.55);
    }

    g.generateTexture(id, s, s);
    g.destroy();
  }

  // ── 스킬 에셋 ───────────────────────────────────
  _makeSkillAssets() {
    // 칼날
    const b = this.add.graphics();
    b.fillStyle(0xcccccc, 1); b.fillRect(0, 0, 8, 20);
    b.fillStyle(0x888888, 1); b.fillRect(1, 1, 6, 18);
    b.fillStyle(0xffffff, 0.5); b.fillRect(2, 2, 2, 16);
    b.generateTexture('blade', 8, 20);
    b.destroy();

    // 화살
    const a = this.add.graphics();
    a.fillStyle(0xaa6622, 1); a.fillRect(3, 0, 2, 20);
    a.fillStyle(0xcccccc, 1); a.fillTriangle(0, 6, 8, 6, 4, 0);
    a.generateTexture('arrow', 8, 20);
    a.destroy();
  }

  // ── UI 요소 ─────────────────────────────────────
  _makeUI() {
    // 스킬 카드 배경
    const c = this.add.graphics();
    c.fillStyle(0x1a2a1a, 1);
    c.fillRoundedRect(0, 0, 200, 120, 8);
    c.lineStyle(2, 0x44aa44, 1);
    c.strokeRoundedRect(0, 0, 200, 120, 8);
    c.generateTexture('skill_card', 200, 120);
    c.destroy();

    // 스킬 카드 hover
    const h = this.add.graphics();
    h.fillStyle(0x2a4a2a, 1);
    h.fillRoundedRect(0, 0, 200, 120, 8);
    h.lineStyle(2, 0x88ff88, 1);
    h.strokeRoundedRect(0, 0, 200, 120, 8);
    h.generateTexture('skill_card_hover', 200, 120);
    h.destroy();
  }

  // ── XP 오브 ─────────────────────────────────────
  _makeXPOrbs() {
    [['orb_small', 0x44ee44, 6], ['orb_mid', 0xeeee22, 9], ['orb_large', 0x22aaff, 12]].forEach(([key, color, r]) => {
      const g = this.add.graphics();
      g.fillStyle(color, 1); g.fillCircle(r, r, r);
      g.fillStyle(0xffffff, 0.4); g.fillCircle(r - 2, r - 2, r / 3);
      g.generateTexture(key, r * 2, r * 2);
      g.destroy();
    });
  }
}
