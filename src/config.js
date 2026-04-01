// =====================================================
// 슬라임 슬레이어 - 전체 게임 설정 및 데이터
// =====================================================

const CONFIG = {
  WIDTH:  480,   // 세로 모바일 해상도
  HEIGHT: 854,
  GAME_DURATION: 540,           // 9분 (초)
  BOSS_TIMES: [180, 360, 540],  // 3분, 6분, 9분

  // ── 플레이어 ──────────────────────────────────────
  PLAYER: {
    warrior: {
      name: '전사',
      maxHp: 150,
      speed: 160,
      defense: 5,
      startSkill: 'spinBlade',
      bodyColor: 0x2255cc,
      armorColor: 0x8899bb
    },
    archer: {
      name: '궁수',
      maxHp: 100,
      speed: 200,
      defense: 2,
      startSkill: 'forkedArrow',
      bodyColor: 0x226622,
      armorColor: 0x884422
    }
  },

  // ── 경험치 테이블 (레벨당 필요 XP) ──────────────────
  XP_TABLE: [0,14,28,47,83,100,140,185,240,300,350,400,460,550,640,720,810,900,990,1100,1240],

  // ── 몬스터 ──────────────────────────────────────
  MONSTERS: {
    slime_normal: { name:'일반 슬라임', maxHp:30,  speed:83,  damage:7,  xp:2,  color:0x33cc33, size:24 },
    slime_tanker: { name:'탱커 슬라임', maxHp:120, speed:50,  damage:15, xp:12, color:0x3344cc, size:32 },
    slime_speed:  { name:'빠른 슬라임', maxHp:20,  speed:140, damage:10,  xp:5,  color:0xcc3333, size:18 }
  },

  // ── 보스 3마리 (3분/6분/9분) ──────────────────────
  BOSSES: [
    { id:'angry_slime', name:'분노의 슬라임', time:180, maxHp:700,  speed:105, damage:23, xp:200, color:0xff2222, size:60, bulletDmg:8  },
    { id:'sad_slime',   name:'우울의 슬라임', time:360, maxHp:1100, speed:60,  damage:19, xp:300, color:0x2266ff, size:72, bulletDmg:10 },
    { id:'fear_slime',  name:'공포의 슬라임', time:540, maxHp:900,  speed:120, damage:35, xp:400, color:0x444444, size:60, bulletDmg:14 }
  ],

  // ── 스킬 ──────────────────────────────────────────
  SKILLS: {
    spinBlade: {
      name: '회전 칼날', type: 'rotating',
      classes: ['warrior'],
      desc: '주위를 회전하는 칼날',
      levels: [
        { blades:1, damage:15, rotSpeed:2.5, radius:65 },
        { blades:2, damage:18, rotSpeed:3.0, radius:70 },
        { blades:3, damage:21, rotSpeed:3.5, radius:75 },
        { blades:4, damage:24, rotSpeed:4.0, radius:80 },
        { blades:5, damage:27, rotSpeed:4.5, radius:85 }
      ]
    },
    holyBarrier: {
      name: '신성 배리어', type: 'shield',
      classes: ['warrior','archer'],
      desc: '피해를 흡수하는 보호막',
      levels: [
        { shieldHp:15,  regenTime:15000 },
        { shieldHp:25,  regenTime:13000 },
        { shieldHp:35,  regenTime:11000 },
        { shieldHp:50,  regenTime:9000  },
        { shieldHp:70,  regenTime:7000  }
      ]
    },
    shockWave: {
      name: '충격파', type: 'pulse',
      classes: ['warrior','archer'],
      desc: '주위에 충격파를 방출',
      levels: [
        { damage:20, range:110, cooldown:3000 },
        { damage:30, range:130, cooldown:2700 },
        { damage:40, range:150, cooldown:2400 },
        { damage:50, range:170, cooldown:2100 },
        { damage:60, range:190, cooldown:1800 }
      ]
    },
    thunder: {
      name: '낙뢰', type: 'random_strike',
      classes: ['warrior','archer'],
      desc: '적에게 번개를 내리침',
      levels: [
        { damage:45,  targets:1, cooldown:4000 },
        { damage:65,  targets:1, cooldown:3500 },
        { damage:85,  targets:2, cooldown:3000 },
        { damage:105, targets:2, cooldown:2500 },
        { damage:130, targets:3, cooldown:2000 }
      ]
    },
    arrowRain: {
      name: '화살비', type: 'random_area',
      classes: ['warrior','archer'],
      desc: '무작위 위치에 화살비',
      levels: [
        { arrows:10,  damage:25,  cooldown:4000, radius:80  },
        { arrows:15,  damage:45, cooldown:3500, radius:90  },
        { arrows:20, damage:68, cooldown:3000, radius:100 },
        { arrows:27, damage:75, cooldown:2500, radius:110 },
        { arrows:37, damage:100, cooldown:1800, radius:120 }
      ]
    },
    guardBreak: {
      name: '충돌', type: 'collision',
      classes: ['warrior'],
      desc: '이동 시 적에게 충격 부여',
      levels: [
        { damage:10, knockback:120 },
        { damage:15, knockback:150 },
        { damage:20, knockback:180 },
        { damage:25, knockback:210 },
        { damage:30, knockback:240 }
      ]
    },
    warriorSpirit: {
      name: '전사의 외침', type: 'pulse',
      classes: ['warrior'],
      desc: '강력한 외침으로 주위 적 피해',
      levels: [
        { damage:35, range:90,  cooldown:5000 },
        { damage:50, range:110, cooldown:4500 },
        { damage:65, range:130, cooldown:4000 },
        { damage:80, range:150, cooldown:3500 },
        { damage:95, range:170, cooldown:3000 }
      ]
    },
    forkedArrow: {
      name: '갈래 화살', type: 'projectile',
      classes: ['archer'],
      desc: '적을 향해 화살을 발사',
      levels: [
        { arrows:1, damage:22, cooldown:1000, speed:420, spread:0    },
        { arrows:2, damage:24, cooldown:900,  speed:440, spread:0.2  },
        { arrows:3, damage:26, cooldown:800,  speed:460, spread:0.2  },
        { arrows:4, damage:28, cooldown:700,  speed:480, spread:0.18 },
        { arrows:5, damage:30, cooldown:600,  speed:500, spread:0.18 }
      ]
    },
    windPulse: {
      name: '바람 방벽', type: 'pulse',
      classes: ['archer'],
      desc: '바람으로 주위 적을 밀쳐냄',
      levels: [
        { damage:15, range:100, cooldown:4000, knockback:180 },
        { damage:22, range:120, cooldown:3500, knockback:210 },
        { damage:30, range:140, cooldown:3000, knockback:240 },
        { damage:38, range:160, cooldown:2500, knockback:270 },
        { damage:45, range:180, cooldown:2000, knockback:300 }
      ]
    }
  },

  // ── 웨이브 (9분 기준으로 조정) ──────────────────────
  WAVES: [
    { fromTime:0,   types:['slime_normal','slime_normal','slime_normal'],                                                    interval:900, max:33  },
    { fromTime:45,  types:['slime_normal','slime_normal','slime_normal','slime_speed'],                                      interval:520, max:55  },
    { fromTime:90,  types:['slime_normal','slime_normal','slime_normal','slime_speed','slime_tanker'],                       interval:460,  max:80  },
    { fromTime:150, types:['slime_normal','slime_normal','slime_normal','slime_speed','slime_tanker'],                       interval:360,  max:100  },
    { fromTime:190, types:['slime_normal','slime_normal','slime_normal','slime_speed','slime_speed','slime_tanker'],         interval:320,  max:120 },
    { fromTime:280, types:['slime_normal','slime_normal','slime_normal','slime_speed','slime_speed','slime_tanker'],         interval:280,  max:145 },
    { fromTime:370, types:['slime_normal','slime_normal','slime_speed','slime_speed','slime_tanker','slime_tanker'],         interval:240,  max:170 },
    { fromTime:460, types:['slime_normal','slime_normal','slime_speed','slime_speed','slime_tanker','slime_tanker'],         interval:180,  max:220 }
  ]
};
