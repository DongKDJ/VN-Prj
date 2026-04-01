// =====================================================
// GameClearScene - 게임 클리어 화면
// =====================================================
class GameClearScene extends Phaser.Scene {
  constructor() { super('GameClearScene'); }

  init(data) {
    this.level = data.level || 1;
    this.kills = data.kills || 0;
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    this.add.rectangle(W/2, H/2, W, H, 0x001100, 0.92);

    // 별 파티클 효과
    for (let i = 0; i < 30; i++) {
      const star = this.add.text(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(20, H - 20),
        '★', { fontSize: `${Phaser.Math.Between(10, 28)}px`, fill: '#ffff66' }
      ).setAlpha(0);
      this.tweens.add({
        targets: star, alpha: Phaser.Math.FloatBetween(0.4, 1),
        duration: Phaser.Math.Between(500, 1500),
        delay: Phaser.Math.Between(0, 1000),
        yoyo: true, repeat: -1
      });
    }

    // CLEAR!
    const clearTxt = this.add.text(W/2, H * 0.25, '왕국을 되찾았다!', {
      fontSize: '46px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ffff44', stroke: '#004400', strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: clearTxt, alpha: 1, duration: 1000, ease: 'Power2' });

    const sub = this.add.text(W/2, H * 0.38, '15분 생존 성공!', {
      fontSize: '24px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#88ff88', stroke: '#002200', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 1000, delay: 400 });

    // 결과
    const stats = [
      `최종 레벨: Lv.${this.level}`,
      `총 처치 수: ${this.kills}`
    ].join('\n');

    this.add.text(W/2, H * 0.56, stats, {
      fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ccffcc', align: 'center', lineSpacing: 12
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(600, () => {
      this.add.text(W/2, H * 0.56, stats, {
        fontSize: '22px', fontFamily: '"Malgun Gothic", sans-serif',
        fill: '#ccffcc', align: 'center', lineSpacing: 12
      }).setOrigin(0.5);
    });

    // 버튼
    this.time.delayedCall(1000, () => {
      this._makeButton(W/2, H * 0.74, '다시하기', () => this.scene.start('MainScene'));
      this._makeButton(W/2, H * 0.86, '타이틀로', () => this.scene.start('LobbyScene'));
    });
  }

  _makeButton(x, y, label, callback) {
    const btn = this.add.container(x, y);
    const bg  = this.add.rectangle(0, 0, 200, 44, 0x224422).setStrokeStyle(2, 0x44cc44);
    const txt = this.add.text(0, 0, label, {
      fontSize: '20px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#ccffcc'
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(200, 44);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => bg.setFillStyle(0x336633));
    btn.on('pointerout',   () => bg.setFillStyle(0x224422));
    btn.on('pointerdown',  () => btn.setScale(0.95));
    btn.on('pointerup',    () => { btn.setScale(1); callback(); });
  }
}
