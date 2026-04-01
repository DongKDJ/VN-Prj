// =====================================================
// MainScene - 캐릭터 선택 및 게임 시작
// =====================================================
class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.selectedChar = 'warrior'; // 기본값

    // 배경
    this.add.tileSprite(0, 0, W, H, 'bg_tile').setOrigin(0, 0).setAlpha(0.5);
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6);

    // 제목
    this.add.text(W/2, 50, '캐릭터 선택', {
      fontSize: '32px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#88ff66', stroke: '#003300', strokeThickness: 5
    }).setOrigin(0.5);

    // ── 캐릭터 카드 ────────────────────────────────
    this.cards = {};
    this._makeCharCard('warrior', W * 0.3, H * 0.45);
    this._makeCharCard('archer',  W * 0.7, H * 0.45);

    this._selectChar('warrior');

    // ── 버튼 영역 ─────────────────────────────────
    this._makeButton(W/2, H * 0.82, '시작하기', 0x224422, 0x44cc44, () => {
      this.scene.start('GameScene', { charType: this.selectedChar });
    });

    this._makeButton(W/2, H * 0.91, '← 뒤로', 0x222244, 0x4444cc, () => {
      this.scene.start('LobbyScene');
    }, '14px');

    // 제작자 버튼
    this._makeButton(W - 80, H - 30, '제작자', 0x333333, 0x888888, () => {
      this._showCredits();
    }, '14px');

    // 환경설정
    const optIcon = this.add.text(30, 30, '⚙', {
      fontSize: '26px', fontFamily: 'sans-serif', fill: '#888888'
    }).setInteractive({ useHandCursor: true });
    optIcon.on('pointerup', () => this._openOptions());
  }

  _makeCharCard(charType, x, y) {
    const cfg = CONFIG.PLAYER[charType];
    const container = this.add.container(x, y);

    // 카드 배경
    const bg = this.add.rectangle(0, 0, 220, 260, 0x1a2a1a, 1)
      .setStrokeStyle(3, 0x336633);

    // 캐릭터 이미지
    const sprite = this.add.image(0, -55, charType).setScale(3);

    // 이름
    const name = this.add.text(0, 30, cfg.name, {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ccffcc', stroke: '#001100', strokeThickness: 3
    }).setOrigin(0.5);

    // 스탯
    const stats = [
      `HP: ${cfg.maxHp}`,
      `속도: ${cfg.speed}`,
      `방어: ${cfg.defense}`
    ];
    const statText = this.add.text(0, 68, stats.join('  '), {
      fontSize: '13px', fontFamily: 'sans-serif', fill: '#aaccaa', align: 'center'
    }).setOrigin(0.5);

    // 시작 스킬
    const startSkillName = CONFIG.SKILLS[cfg.startSkill]?.name || '';
    const skillText = this.add.text(0, 95, `시작 스킬: ${startSkillName}`, {
      fontSize: '12px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88cc88', align: 'center'
    }).setOrigin(0.5);

    container.add([bg, sprite, name, statText, skillText]);
    container.setSize(220, 260);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerup', () => this._selectChar(charType));
    container.on('pointerover', () => { if (this.selectedChar !== charType) bg.setFillStyle(0x223322); });
    container.on('pointerout',  () => { if (this.selectedChar !== charType) bg.setFillStyle(0x1a2a1a); });

    this.cards[charType] = { container, bg };
  }

  _selectChar(charType) {
    this.selectedChar = charType;
    Object.entries(this.cards).forEach(([type, { bg }]) => {
      if (type === charType) {
        bg.setFillStyle(0x2a4a2a);
        bg.setStrokeStyle(3, 0x88ff44);
      } else {
        bg.setFillStyle(0x1a2a1a);
        bg.setStrokeStyle(3, 0x336633);
      }
    });
  }

  _makeButton(x, y, label, fillColor, strokeColor, callback, size = '20px') {
    const btn = this.add.container(x, y);
    const w   = label.length * (parseInt(size) * 0.6) + 40;
    const bg  = this.add.rectangle(0, 0, w, 38, fillColor).setStrokeStyle(2, strokeColor);
    const txt = this.add.text(0, 0, label, {
      fontSize: size, fontFamily: '"Malgun Gothic", sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(w, 38);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => bg.setAlpha(0.8));
    btn.on('pointerout',   () => bg.setAlpha(1));
    btn.on('pointerdown',  () => btn.setScale(0.95));
    btn.on('pointerup',    () => { btn.setScale(1); callback(); });
  }

  _showCredits() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(200).setInteractive();
    const p  = this.add.container(W/2, H/2).setDepth(201);

    const bg = this.add.rectangle(0, 0, 400, 260, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const t  = this.add.text(0, -100, '제작자 정보', {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66'
    }).setOrigin(0.5);

    const info = [
      '🎮 슬라임 슬레이어',
      '',
      '개발: 개발자님',
      '기획: 기획자님',
      '',
      '© 2026 All Rights Reserved'
    ].join('\n');

    const body = this.add.text(0, 10, info, {
      fontSize: '15px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#aaccaa', align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    const close = this.add.rectangle(0, 100, 100, 34, 0x442222).setStrokeStyle(1, 0xcc4444).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 100, '닫기', {
      fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ffcccc'
    }).setOrigin(0.5);
    close.on('pointerup', () => { ov.destroy(); p.destroy(); });

    p.add([bg, t, body, close, closeTxt]);
  }

  _openOptions() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7).setDepth(200).setInteractive();
    const p  = this.add.container(W/2, H/2).setDepth(201);

    const bg   = this.add.rectangle(0, 0, 300, 160, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const t    = this.add.text(0, -58, '환경설정', {
      fontSize: '20px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66'
    }).setOrigin(0.5);

    let muted = false;
    const muteRect = this.add.rectangle(0, 0, 180, 34, 0x224422).setStrokeStyle(1, 0x44cc44).setInteractive({ useHandCursor: true });
    const muteTxt  = this.add.text(0, 0, '🔊 음악: 켜짐', {
      fontSize: '16px', fontFamily: 'sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);
    muteRect.on('pointerup', () => {
      muted = !muted;
      muteTxt.setText(muted ? '🔇 음악: 꺼짐' : '🔊 음악: 켜짐');
    });

    const close = this.add.rectangle(0, 55, 100, 32, 0x442222).setStrokeStyle(1, 0xcc4444).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 55, '닫기', {
      fontSize: '15px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ffcccc'
    }).setOrigin(0.5);
    close.on('pointerup', () => { ov.destroy(); p.destroy(); });

    p.add([bg, t, muteRect, muteTxt, close, closeTxt]);
  }
}
