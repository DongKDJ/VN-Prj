// =====================================================
// WaveSystem - 몬스터 스폰 및 보스 타이머
// =====================================================
class WaveSystem {
  constructor(scene) {
    this.scene = scene;

    this.spawnTimer     = 0;
    this.bossIndex      = 0;    // 다음 스폰할 보스 인덱스
    this.bossQueue      = [...CONFIG.BOSSES]; // 타임 순 정렬된 보스 목록
    this.bossTriggered  = {};   // 이미 스폰한 보스
    this.activeBosses   = [];   // 현재 활성 보스 목록
  }

  // 현재 시간에 맞는 웨이브 설정 반환
  _getCurrentWave(elapsed) {
    let wave = CONFIG.WAVES[0];
    for (const w of CONFIG.WAVES) {
      if (elapsed >= w.fromTime) wave = w;
      else break;
    }
    return wave;
  }

  update(elapsed, time) {
    const wave = this._getCurrentWave(elapsed);

    // 보스 스폰 체크
    CONFIG.BOSSES.forEach(bossCfg => {
      if (!this.bossTriggered[bossCfg.id] && elapsed >= bossCfg.time) {
        this.bossTriggered[bossCfg.id] = true;
        this._spawnBoss(bossCfg);
      }
    });

    // 일반 몬스터 스폰
    if (time - this.spawnTimer < wave.interval) return;
    this.spawnTimer = time;

    const monsters = this.scene.monsters;
    if (monsters.countActive(true) >= wave.max) return;

    const type = Phaser.Utils.Array.GetRandom(wave.types);
    const pos  = this._offscreenPos();
    const base  = CONFIG.MONSTERS[type];
    const scale = this._getStatScale(elapsed);
    const m = new Monster(this.scene, pos.x, pos.y, type, {
      maxHp: Math.floor(base.maxHp * scale.hp),
      damage: Math.floor(base.damage * scale.damage)
    });
    monsters.add(m, true);
  }

  _spawnBoss(bossCfg) {
    const scene = this.scene;

    // 화면에 "보스 등장!" 알림
    const cam = scene.cameras.main;
    const alertText = scene.add.text(
      cam.scrollX + CONFIG.WIDTH / 2, cam.scrollY + CONFIG.HEIGHT / 2 - 60,
      `⚠ ${bossCfg.name} 등장!`, {
        fontSize: '28px', fill: '#ff4444',
        stroke: '#000000', strokeThickness: 5,
        fontFamily: 'sans-serif'
      }
    ).setOrigin(0.5).setDepth(50);

    scene.tweens.add({
      targets: alertText, y: alertText.y - 40, alpha: 0,
      duration: 2000, onComplete: () => alertText.destroy()
    });

    // 스폰 위치 (화면 우측 바깥)
    const pos  = this._offscreenPos();
    const boss = new Boss(scene, pos.x, pos.y, bossCfg);
    scene.bossGroup.add(boss, true);
    this.activeBosses.push(boss);

    scene.events.emit('bossSpawned', boss);
  }

  _offscreenPos() {
    const cam     = this.scene.cameras.main;
    const margin  = 80;
    const side    = Phaser.Math.Between(0, 3);
    let x, y;

    switch(side) {
      case 0: // 위
        x = cam.scrollX + Phaser.Math.Between(0, CONFIG.WIDTH);
        y = cam.scrollY - margin;
        break;
      case 1: // 아래
        x = cam.scrollX + Phaser.Math.Between(0, CONFIG.WIDTH);
        y = cam.scrollY + CONFIG.HEIGHT + margin;
        break;
      case 2: // 왼쪽
        x = cam.scrollX - margin;
        y = cam.scrollY + Phaser.Math.Between(0, CONFIG.HEIGHT);
        break;
      default: // 오른쪽
        x = cam.scrollX + CONFIG.WIDTH + margin;
        y = cam.scrollY + Phaser.Math.Between(0, CONFIG.HEIGHT);
        break;
    }
    return { x, y };
  }

  // 갈수록 몬스터 체력, 공격력 증가 (1분 단위 계단식 / 9분 기준 HP 2.8배, 공격력 1.8배)
  _getStatScale(elapsed) {
    const minute = Math.min(Math.floor(elapsed / 60), 9);   // 0~9분까지만 계산

    const hpScale     = 1 + minute * (1.8 / 9);   // 매분 0.2배씩 → 9분에 정확히 2.8배
    const damageScale = 1 + minute * (0.8 / 9);   // 매분 약 0.0889배씩 → 9분에 정확히 1.8배

    // 디버깅 로그 (필요 없으면 이 console.log 줄을 지워도 됩니다)
    console.log(`[HP_DEBUG] ${elapsed.toFixed(0)}초 | ${minute}분 | HP×${hpScale.toFixed(2)} | DMG×${damageScale.toFixed(2)}`);

    return {
      hp: hpScale,
      damage: damageScale
    };
  }

  // 너무 멀리 떨어진 몬스터 제거 (메모리 관리)
  cullDistant(px, py) {
    const MAX_DIST = 1200;
    this.scene.monsters.getChildren().forEach(m => {
      if (!m.active) return;
      if (Phaser.Math.Distance.Between(m.x, m.y, px, py) > MAX_DIST) {
        m.deactivate();
      }
    });
  }
}
