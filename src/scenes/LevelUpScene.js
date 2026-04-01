// =====================================================
// LevelUpScene - 레벨업 스킬 선택 (세로 레이아웃, 카드 3장 세로 배열)
// =====================================================
class LevelUpScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelUpScene', active: false }); }

  init(data) {
    this.choices  = data.choices;
    this.newLevel = data.level;
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const gameScene = this.scene.get('GameScene');

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.82);

    const lvText = this.add.text(W/2, H * 0.1, `LEVEL UP!  Lv.${this.newLevel}`, {
      fontSize: '30px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ffff44', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5);
    this.tweens.add({ targets: lvText, scaleX: 1.08, scaleY: 1.08, duration: 350, yoyo: true, repeat: 1 });

    this.add.text(W/2, H * 0.18, '스킬을 선택하세요', {
      fontSize: '16px', fontFamily: '"Malgun Gothic", sans-serif', fill: '#aaccaa'
    }).setOrigin(0.5);

    // 카드 세로 배열 (최대 3개)
    const count  = Math.min(this.choices.length, 3);
    const cardH  = 100;
    const gap    = 16;
    const totalH = count * cardH + (count - 1) * gap;
    const startY = H * 0.5 - totalH / 2 + cardH / 2;

    this.choices.slice(0, count).forEach((skillId, i) => {
      const y = startY + i * (cardH + gap);
      this._makeSkillCard(W/2, y, skillId, gameScene, cardH);
    });
  }

  _makeSkillCard(x, y, skillId, gameScene, cardH) {
    const sk    = CONFIG.SKILLS[skillId];
    const curLv = gameScene?.skillManager?.activeSkills[skillId] || 0;
    const nextLv = curLv + 1;
    const cardW  = CONFIG.WIDTH - 24;

    const ICONS = {
      spinBlade:'⚔️', holyBarrier:'🛡️', shockWave:'💥', thunder:'⚡',
      arrowRain:'🌧️', guardBreak:'💪', warriorSpirit:'🔥', forkedArrow:'🏹', windPulse:'🌀'
    };

    const card = this.add.container(x, y);

    // 배경
    const bg = this.add.graphics();
    bg.fillStyle(0x1a2a1a, 1); bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
    bg.lineStyle(2, 0x44aa44, 1); bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);

    // 좌측 아이콘
    const icon = this.add.text(-cardW/2 + 36, 0, ICONS[skillId] || '✨', {
      fontSize: '34px', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 스킬 이름
    const name = this.add.text(-cardW/2 + 80, -22, sk.name, {
      fontSize: '17px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#ccffcc', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5);

    // 레벨 표시 + 별
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < nextLv ? '★' : '☆';
    const levelStr = curLv === 0 ? '신규 획득!' : `Lv.${curLv} → Lv.${nextLv}`;
    const levelTxt = this.add.text(-cardW/2 + 80, 2, `${levelStr}  ${stars}`, {
      fontSize: '13px', fontFamily: 'sans-serif',
      fill: curLv === 0 ? '#ffff88' : '#88ddff'
    }).setOrigin(0, 0.5);

    // 스킬 설명
    const desc = this._getSkillDesc(skillId, nextLv);
    const descTxt = this.add.text(-cardW/2 + 80, 24, desc, {
      fontSize: '11px', fontFamily: '"Malgun Gothic", sans-serif',
      fill: '#888888', wordWrap: { width: cardW - 110 }
    }).setOrigin(0, 0.5);

    card.add([bg, icon, name, levelTxt, descTxt]);
    card.setSize(cardW, cardH);
    card.setInteractive({ useHandCursor: true });

    const highlight = () => {
      bg.clear();
      bg.fillStyle(0x2a4a2a, 1); bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
      bg.lineStyle(2, 0x88ff88, 1); bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
      card.setScale(1.03);
    };
    const unhighlight = () => {
      bg.clear();
      bg.fillStyle(0x1a2a1a, 1); bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
      bg.lineStyle(2, 0x44aa44, 1); bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
      card.setScale(1);
    };

    card.on('pointerover', highlight);
    card.on('pointerout',  unhighlight);
    card.on('pointerdown', () => card.setScale(0.97));
    card.on('pointerup',   () => { card.setScale(1); this._choose(skillId, gameScene); });
  }

  _getSkillDesc(skillId, level) {
    const cfg = CONFIG.SKILLS[skillId]?.levels[level - 1];
    if (!cfg) return CONFIG.SKILLS[skillId]?.desc || '';
    const parts = [];
    if (cfg.damage)    parts.push(`피해 ${cfg.damage}`);
    if (cfg.range)     parts.push(`범위 ${cfg.range}`);
    if (cfg.cooldown)  parts.push(`쿨다운 ${(cfg.cooldown/1000).toFixed(1)}s`);
    if (cfg.arrows)    parts.push(`화살 ${cfg.arrows}발`);
    if (cfg.blades)    parts.push(`칼날 ${cfg.blades}개`);
    if (cfg.shieldHp)  parts.push(`실드 ${cfg.shieldHp}HP`);
    if (cfg.targets)   parts.push(`대상 ${cfg.targets}마리`);
    if (cfg.knockback) parts.push(`넉백 ${cfg.knockback}`);
    return parts.join(' · ') || CONFIG.SKILLS[skillId]?.desc || '';
  }

  _choose(skillId, gameScene) {
    if (gameScene?.skillManager) gameScene.skillManager.addOrUpgrade(skillId);
    this.scene.stop('LevelUpScene');
    this.scene.resume('GameScene');
  }
}
