// =====================================================
// LevelUpScene - 레벨업 스킬 선택 화면
// =====================================================
class LevelUpScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelUpScene', active: false }); }

  init(data) {
    this.choices  = data.choices;   // [skillId, skillId, skillId]
    this.newLevel = data.level;
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const gameScene = this.scene.get('GameScene');
    const uiScene   = this.scene.get('UIScene');

    // 반투명 오버레이
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75);

    // 레벨업 텍스트
    const lvText = this.add.text(W/2, H * 0.14, `LEVEL UP!  Lv.${this.newLevel}`, {
      fontSize: '32px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ffff44', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5);
    this.tweens.add({
      targets: lvText, scaleX: 1.1, scaleY: 1.1, duration: 400,
      yoyo: true, repeat: 1
    });

    this.add.text(W/2, H * 0.23, '스킬을 선택하세요', {
      fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#aaccaa'
    }).setOrigin(0.5);

    // 스킬 카드 3개 (없는 경우 2개까지)
    const count = Math.min(this.choices.length, 3);
    const totalW = count * 220 + (count - 1) * 20;
    const startX = W/2 - totalW/2;

    this.choices.slice(0, count).forEach((skillId, i) => {
      const x = startX + i * 240 + 110;
      const y = H * 0.54;
      this._makeSkillCard(x, y, skillId, gameScene, uiScene);
    });
  }

  _makeSkillCard(x, y, skillId, gameScene, uiScene) {
    const sk     = CONFIG.SKILLS[skillId];
    const curLv  = gameScene?.skillManager?.activeSkills[skillId] || 0;
    const nextLv = curLv + 1;

    const ICONS = {
      spinBlade: '⚔️', holyBarrier: '🛡️', shockWave: '💥', thunder: '⚡',
      arrowRain: '🌧️', guardBreak: '💪', warriorSpirit: '🔥', forkedArrow: '🏹', windPulse: '🌀'
    };

    const card = this.add.container(x, y);

    // 배경
    const bg = this.add.image(0, 0, 'skill_card');

    // 아이콘
    const icon = this.add.text(0, -42, ICONS[skillId] || '✨', {
      fontSize: '32px', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 스킬 이름
    const name = this.add.text(0, -8, sk.name, {
      fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ccffcc', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    // 레벨 표시
    const levelStr = curLv === 0
      ? '신규 획득!'
      : `Lv.${curLv} → Lv.${nextLv}`;
    const levelTxt = this.add.text(0, 13, levelStr, {
      fontSize: '13px', fontFamily: 'sans-serif',
      fill: curLv === 0 ? '#ffff88' : '#88ddff'
    }).setOrigin(0.5);

    // 설명
    const desc = this._getSkillDesc(skillId, nextLv);
    const descTxt = this.add.text(0, 38, desc, {
      fontSize: '11px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#aaaaaa', align: 'center', wordWrap: { width: 185 }
    }).setOrigin(0.5);

    // 레벨 별 표시
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < nextLv ? '★' : '☆';
    const starTxt = this.add.text(0, -26, stars, {
      fontSize: '14px', fontFamily: 'sans-serif', fill: '#ffcc22'
    }).setOrigin(0.5);

    card.add([bg, icon, name, levelTxt, starTxt, descTxt]);
    card.setSize(200, 120);
    card.setInteractive({ useHandCursor: true });

    card.on('pointerover', () => {
      bg.setTexture('skill_card_hover');
      card.setScale(1.05);
    });
    card.on('pointerout', () => {
      bg.setTexture('skill_card');
      card.setScale(1);
    });
    card.on('pointerup', () => {
      this._choose(skillId, gameScene, uiScene);
    });
  }

  _getSkillDesc(skillId, level) {
    const cfg = CONFIG.SKILLS[skillId]?.levels[level - 1];
    if (!cfg) return CONFIG.SKILLS[skillId]?.desc || '';

    const parts = [];
    if (cfg.damage)     parts.push(`피해: ${cfg.damage}`);
    if (cfg.range)      parts.push(`범위: ${cfg.range}`);
    if (cfg.cooldown)   parts.push(`쿨다운: ${(cfg.cooldown/1000).toFixed(1)}s`);
    if (cfg.arrows)     parts.push(`화살: ${cfg.arrows}발`);
    if (cfg.blades)     parts.push(`칼날: ${cfg.blades}개`);
    if (cfg.shieldHp)   parts.push(`실드: ${cfg.shieldHp}HP`);
    if (cfg.targets)    parts.push(`대상: ${cfg.targets}마리`);
    if (cfg.knockback)  parts.push(`넉백: ${cfg.knockback}`);

    return parts.join(' / ') || CONFIG.SKILLS[skillId]?.desc || '';
  }

  _choose(skillId, gameScene, uiScene) {
    if (gameScene?.skillManager) {
      gameScene.skillManager.addOrUpgrade(skillId);
    }

    // 장면 닫고 게임 재개
    this.scene.stop('LevelUpScene');
    this.scene.resume('GameScene');
  }
}
