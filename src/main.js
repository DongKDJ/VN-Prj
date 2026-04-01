// =====================================================
// main.js - Phaser 게임 초기화
// =====================================================

const game = new Phaser.Game({
  type:         Phaser.AUTO,
  width:        CONFIG.WIDTH,
  height:       CONFIG.HEIGHT,
  backgroundColor: '#1a2a1a',
  pixelArt:     true,
  antialias:    false,
  roundPixels:  true,
  parent:       'game-container',

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },

  scale: {
    mode:            Phaser.Scale.FIT,
    autoCenter:      Phaser.Scale.CENTER_BOTH,
    parent:          'game-container',
    width:           CONFIG.WIDTH,
    height:          CONFIG.HEIGHT
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
