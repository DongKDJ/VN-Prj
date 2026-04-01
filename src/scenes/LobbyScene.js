// =====================================================
// LobbyScene - 타이틀 화면
// =====================================================
class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    // 배경
    this.add.tileSprite(0, 0, W, H, 'bg_tile').setOrigin(0, 0).setAlpha(0.5);

    // 어두운 오버레이
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.55);

    // 장식 슬라임들 (배경)
    this._addDecoSlimes();

    // ── 타이틀 ────────────────────────────────────
    this.add.text(W/2, H * 0.22, '슬라임 슬레이어', {
      fontSize: '44px',
      fontFamily: '"Malgun Gothic", "맑은 고딕", sans-serif',
      fill: '#88ff66',
      stroke: '#003300',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#001100', blur: 8, fill: true }
    }).setOrigin(0.5);

    this.add.text(W/2, H * 0.35, 'Slime Slayer', {
      fontSize: '18px', fontFamily: 'sans-serif',
      fill: '#aaccaa', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    // ── 버튼 ──────────────────────────────────────
    this._makeButton(W/2, H * 0.53, '새로하기', () => {
      this.scene.start('MainScene');
    });

    this._makeButton(W/2, H * 0.67, '환경설정', () => {
      this._openOptions();
    });

    // 버전 / 카피라이트
    this.add.text(W - 10, H - 10, 'v1.0', {
      fontSize: '11px', fill: '#666666', fontFamily: 'sans-serif'
    }).setOrigin(1, 1);

    // 타이틀 애니메이션 (위아래 보빙)
    const title = this.children.list.find(c => c.text === '슬라임 슬레이어');
    this.tweens.add({
      targets: title, y: title.y - 8, duration: 1800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _makeButton(x, y, label, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 48, 0x224422, 1)
      .setStrokeStyle(2, 0x44cc44);

    const text = this.add.text(0, 0, label, {
      fontSize: '20px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ccffcc'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(200, 48);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => { bg.setFillStyle(0x336633); text.setColor('#ffffff'); });
    btn.on('pointerout',   () => { bg.setFillStyle(0x224422); text.setColor('#ccffcc'); });
    btn.on('pointerdown',  () => { btn.setScale(0.95); });
    btn.on('pointerup',    () => { btn.setScale(1); callback(); });

    return btn;
  }

  _addDecoSlimes() {
    // 480×854 세로 해상도에 맞게 배치
    const positions = [
      [60,  120, 'slime_normal', 1.4],
      [420, 140, 'slime_tanker', 1.7],
      [80,  680, 'slime_speed',  1.2],
      [400, 700, 'slime_normal', 1.3],
      [240, 760, 'slime_tanker', 1.0]
    ];
    positions.forEach(([x, y, key, scale]) => {
      const s = this.add.image(x, y, key).setScale(scale).setAlpha(0.4).setDepth(1);
      this.tweens.add({
        targets: s, y: y - 10, duration: 1500 + Phaser.Math.Between(0, 500),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });
  }

  _openOptions() {
    // 간단한 옵션 팝업 (음소거 등)
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7).setDepth(100).setInteractive();
    const panel   = this.add.container(W/2, H/2).setDepth(101);

    const bg   = this.add.rectangle(0, 0, 360, 200, 0x1a2a1a).setStrokeStyle(2, 0x44cc44);
    const title = this.add.text(0, -70, '환경설정', {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#88ff66'
    }).setOrigin(0.5);

    const muteLabel = this.add.text(-50, -20, '음악', {
      fontSize: '18px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);

    let muted = false;
    const muteBtn = this.add.rectangle(50, -20, 80, 32, 0x224422).setStrokeStyle(1, 0x44cc44);
    const muteTxt = this.add.text(50, -20, '켜짐', {
      fontSize: '16px', fontFamily: 'sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);
    muteBtn.setInteractive({ useHandCursor: true });
    muteBtn.on('pointerup', () => {
      muted = !muted;
      muteTxt.setText(muted ? '꺼짐' : '켜짐');
      this.sound.mute = muted;
    });

    const closeBtn = this.add.rectangle(0, 60, 120, 36, 0x442222).setStrokeStyle(1, 0xcc4444);
    const closeTxt = this.add.text(0, 60, '닫기', {
      fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ffcccc'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => { overlay.destroy(); panel.destroy(); });

    panel.add([bg, title, muteLabel, muteBtn, muteTxt, closeBtn, closeTxt]);
  }
}
