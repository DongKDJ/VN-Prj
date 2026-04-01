// =====================================================
// XPSystem - 경험치 및 레벨 관리
// =====================================================
class XPSystem {
  constructor(scene) {
    this.scene  = scene;
    this.xp     = 0;
    this.level  = 1;
    this.orbGroup = scene.physics.add.group({ runChildUpdate: false });
  }

  // XP 추가 및 레벨업 체크
  addXP(amount) {
    this.xp += amount;
    const table = CONFIG.XP_TABLE;
    const maxLv = table.length;

    while (this.level < maxLv && this.xp >= table[this.level]) {
      this.xp -= table[this.level];
      this.level++;
      this.scene.events.emit('levelUp', this.level);
    }
    this.scene.events.emit('xpChanged', this.xp, this._nextLevelXP());
  }

  _nextLevelXP() {
    const table = CONFIG.XP_TABLE;
    return this.level < table.length ? table[this.level] : 9999;
  }

  // XP 오브 드랍
  dropOrb(x, y, value) {
    const orb = new XPOrb(this.scene, x, y, value);
    this.orbGroup.add(orb, true);
  }

  // 플레이어와 오브 충돌 처리
  collectOrbs(player) {
    this.orbGroup.getChildren().forEach(orb => {
      if (!orb.active) return;
      orb.update(player);
      const dist = Phaser.Math.Distance.Between(orb.x, orb.y, player.x, player.y);
      if (dist < 18) {
        this.addXP(orb.xpValue);
        orb.setActive(false).setVisible(false);
      }
    });
  }

  // 현재 레벨 XP 진행도 (0~1)
  get progress() {
    const need = this._nextLevelXP();
    return need > 0 ? this.xp / need : 1;
  }
}
