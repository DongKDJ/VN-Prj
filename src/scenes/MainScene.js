// =====================================================
// MainScene - 캐릭터 선택 (세로 레이아웃)
// =====================================================
class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.selectedChar = 'warrior';

    this.add.tileSprite(0, 0, W, H, 'bg_tile').setOrigin(0, 0).setAlpha(0.5);
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6);

    this.add.text(W/2, H * 0.07, '캐릭터 선택', {
      fontSize: '30px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#88ff66', stroke: '#003300', strokeThickness: 5
    }).setOrigin(0.5);

    // ── 캐릭터 카드 (나란히, 세로 모드 맞춤) ─────
    this.cards = {};
    this._makeCharCard('warrior', W * 0.26, H * 0.42);
    this._makeCharCard('archer',  W * 0.74, H * 0.42);
    this._selectChar('warrior');

    // ── 버튼 ──────────────────────────────────────
    this._makeButton(W/2, H * 0.74, '시작하기', 0x224422, 0x44cc44, () => {
      this.scene.start('GameScene', { charType: this.selectedChar });
    }, '22px');

    this._makeButton(W/2, H * 0.83, '← 뒤로', 0x222244, 0x4444cc, () => {
      this.scene.start('LobbyScene');
    }, '16px');

    this._makeButton(W - 70, H - 24, '제작자', 0x333333, 0x888888, () => {
      this._showCredits();
    }, '14px');

    const optIcon = this.add.text(26, 26, '⚙', {
      fontSize: '28px', fontFamily: 'sans-serif', fill: '#888888'
    }).setInteractive({ useHandCursor: true });
    optIcon.on('pointerup', () => this._openOptions());
  }

  _makeCharCard(charType, x, y) {
    const cfg = CONFIG.PLAYER[charType];
    const container = this.add.container(x, y);

    const bg     = this.add.rectangle(0, 0, 195, 250, 0x1a2a1a).setStrokeStyle(3, 0x336633);
    const sprite = this.add.image(0, -62, charType).setScale(3.2);
    const name   = this.add.text(0, 22, cfg.name, {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ccffcc', stroke: '#001100', strokeThickness: 3
    }).setOrigin(0.5);

    const stats = [`HP: ${cfg.maxHp}`, `속도: ${cfg.speed}`, `방어: ${cfg.defense}`];
    const statText = this.add.text(0, 56, stats.join('\n'), {
      fontSize: '13px', fontFamily: 'sans-serif', fill: '#aaccaa',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    const startSkillName = CONFIG.SKILLS[cfg.startSkill]?.name || '';
    const skillText = this.add.text(0, 98, `시작: ${startSkillName}`, {
      fontSize: '12px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88cc88'
    }).setOrigin(0.5);

    container.add([bg, sprite, name, statText, skillText]);
    container.setSize(195, 250);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerup',   () => this._selectChar(charType));
    container.on('pointerover', () => { if (this.selectedChar !== charType) bg.setFillStyle(0x223322); });
    container.on('pointerout',  () => { if (this.selectedChar !== charType) bg.setFillStyle(0x1a2a1a); });

    this.cards[charType] = { container, bg };
  }

  _selectChar(charType) {
    this.selectedChar = charType;
    Object.entries(this.cards).forEach(([type, { bg }]) => {
      if (type === charType) { bg.setFillStyle(0x2a4a2a); bg.setStrokeStyle(3, 0x88ff44); }
      else                   { bg.setFillStyle(0x1a2a1a); bg.setStrokeStyle(3, 0x336633); }
    });
  }

  _makeButton(x, y, label, fillColor, strokeColor, callback, size = '20px') {
    const btn = this.add.container(x, y);
    const w   = Math.max(160, label.length * (parseInt(size) * 0.62) + 40);
    const bg  = this.add.rectangle(0, 0, w, 44, fillColor).setStrokeStyle(2, strokeColor);
    const txt = this.add.text(0, 0, label, {
      fontSize: size, fontFamily: '"Malgun Gothic", sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);
    btn.add([bg, txt]); btn.setSize(w, 44); btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => bg.setAlpha(0.8));
    btn.on('pointerout',   () => bg.setAlpha(1));
    btn.on('pointerdown',  () => btn.setScale(0.95));
    btn.on('pointerup',    () => { btn.setScale(1); callback(); });
  }

  _showCredits() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(200).setInteractive();
    const p  = this.add.container(W/2, H/2).setDepth(201);
    const bg = this.add.rectangle(0, 0, 380, 240, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const t  = this.add.text(0, -95, '제작자 정보', {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66'
    }).setOrigin(0.5);
    const body = this.add.text(0, 5, '🎮 슬라임 슬레이어\n\n개발: 개발자님\n기획: 기획자님\n\n© 2026 All Rights Reserved', {
      fontSize: '15px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#aaccaa', align: 'center', lineSpacing: 6
    }).setOrigin(0.5);
    const close    = this.add.rectangle(0, 90, 100, 36, 0x442222).setStrokeStyle(1, 0xcc4444).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 90, '닫기', { fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ffcccc' }).setOrigin(0.5);
    close.on('pointerup', () => { ov.destroy(); p.destroy(); });
    p.add([bg, t, body, close, closeTxt]);
  }

  _openOptions() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7).setDepth(200).setInteractive();
    const p  = this.add.container(W/2, H/2).setDepth(201);
    const bg = this.add.rectangle(0, 0, 300, 160, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const t  = this.add.text(0, -58, '환경설정', { fontSize: '20px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66' }).setOrigin(0.5);
    let muted = false;
    const mRect = this.add.rectangle(0, 0, 200, 36, 0x224422).setStrokeStyle(1, 0x44cc44).setInteractive({ useHandCursor: true });
    const mTxt  = this.add.text(0, 0, '🔊 음악: 켜짐', { fontSize: '16px', fontFamily: 'sans-serif', fill: '#ccffcc' }).setOrigin(0.5);
    mRect.on('pointerup', () => { muted = !muted; mTxt.setText(muted ? '🔇 음악: 꺼짐' : '🔊 음악: 켜짐'); });
    const close    = this.add.rectangle(0, 55, 100, 34, 0x442222).setStrokeStyle(1, 0xcc4444).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 55, '닫기', { fontSize: '15px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ffcccc' }).setOrigin(0.5);
    close.on('pointerup', () => { ov.destroy(); p.destroy(); });
    p.add([bg, t, mRect, mTxt, close, closeTxt]);
  }
}
