// =====================================================
// main.js - Phaser 게임 초기화 (세로 모바일 대응)
// =====================================================

const game = new Phaser.Game({
  type:            Phaser.AUTO,
  backgroundColor: '#1a2a1a',
  pixelArt:        true,
  antialias:       false,
  roundPixels:     true,
  parent:          'game-container',

  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },

  // 세로 화면 꽉 채우기: 480×854 (9:16) 기준, FIT으로 스케일
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent:     'game-container',
    width:      CONFIG.WIDTH,
    height:     CONFIG.HEIGHT
  },

  scene: [
    BootScene,
    LobbyScene,
    MainScene,
    GameScene,
    UIScene,
    LevelUpScene,
    GameOverScene,
    GameClearScene
  ]
});
