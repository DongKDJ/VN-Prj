// =====================================================
// GameOverScene - 게임 오버 화면
// =====================================================
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.elapsed = data.elapsed || 0;
    this.level   = data.level   || 1;
    this.kills   = data.kills   || 0;
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.9);

    // GAME OVER
    const go = this.add.text(W/2, H * 0.28, 'GAME OVER', {
      fontSize: '52px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#cc2222', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: go, alpha: 1, duration: 800, ease: 'Power2' });

    // 결과
    const m = Math.floor(this.elapsed / 60).toString().padStart(2, '0');
    const s = (this.elapsed % 60).toString().padStart(2, '0');
    const stats = [
      `생존 시간: ${m}:${s}`,
      `최종 레벨: Lv.${this.level}`,
      `처치 수: ${this.kills}`
    ].join('\n');

    this.add.text(W/2, H * 0.5, stats, {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#cccccc', align: 'center', lineSpacing: 10
    }).setOrigin(0.5);

    // 버튼
    this._makeButton(W/2, H * 0.72, '다시하기', () => {
      this.scene.start('MainScene');
    });
    this._makeButton(W/2, H * 0.84, '타이틀로', () => {
      this.scene.start('LobbyScene');
    });
  }

  _makeButton(x, y, label, callback) {
    const btn = this.add.container(x, y);
    const bg  = this.add.rectangle(0, 0, 200, 44, 0x333333).setStrokeStyle(2, 0x888888);
    const txt = this.add.text(0, 0, label, {
      fontSize: '20px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#eeeeee'
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(200, 44);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => bg.setFillStyle(0x555555));
    btn.on('pointerout',   () => bg.setFillStyle(0x333333));
    btn.on('pointerdown',  () => btn.setScale(0.95));
    btn.on('pointerup',    () => { btn.setScale(1); callback(); });
  }
}
