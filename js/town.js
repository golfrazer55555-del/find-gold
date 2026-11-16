'use strict';
// ===== 마을 시설 =====
(function () {
const A = G.ART;
const HOURS = {
  saloon: [10, 26], store: [8, 18], assay: [8, 18], bank: [8, 18], doctor: [8, 18], news: [8, 18],
  stable: [7, 19], hotel: [0, 24], sheriff: [0, 24]
};
G.isOpen = function (id) {
  const [a, b] = HOURS[id]; const h = G.hour();
  return (h >= a && h < Math.min(24, b)) || (b > 24 && h < b - 24);
};
const fmtH = id => { const [a, b] = HOURS[id]; if (a === 0 && b === 24) return '24시간'; return `${String(a).padStart(2, '0')}시~${String(b % 24).padStart(2, '0')}시`; };
const S_ = () => G.S;

function buy(menu, cost, fn) {
  const S = S_();
  if (S.cash < cost) { menu.flash('돈이 모자란다.', 'r'); G.audio.sfx('no'); return; }
  S.cash -= cost; G.audio.sfx('coin'); fn();
}
const portrait = id => A.keeper[id].down[0];

// ---- 소문 ----
G.rumor = function (src) {
  const S = S_(), w = G.world;
  const camp = w.camp; const tc = { x: 22, y: 45 };
  const list = [];
  list.push(`늙은 탐광자 하나가 강 건너 ${G.dirName(camp.x - tc.x, camp.y - tc.y)}쪽 산기슭에 천막을 치고 산다더군. 먹을 것과 물이 늘 모자라다지.`);
  list.push('살롱 도박꾼들 말이야, 패가 나쁘면 바로 죽고, 좋으면 판을 키워. 원 페어 정도면 따라오기만 하지.');
  list.push('하스켈 영감이 죽기 전에 지도를 여섯 조각으로 찢었다는 얘기 들었나? 뼈다귀 모양 가죽에 그렸다던데.');
  list.push('버려진 광산 깊숙한 곳은 랜턴 없이 들어가면 안 돼. 거기서 하스켈의 물건이 나왔다는 사람도 있어.');
  if (G.day() >= 3 && !S.gangDone) list.push('검은 모자 갱단이 사막을 휩쓸고 다녀. 두목이 하스켈 지도 조각을 갖고 있다고 떠벌렸다더군.');
  list.push(`강물에서 금빛이 반짝이는 곳이 있어. 거기서 팬질을 하면 제법 나오지.`);
  list.push('방울뱀은 바위 근처에 많아. 물리면 해독제를 쓰거나 바로 의사한테 가야 해. 하루를 못 버틴다고.');
  list.push('한낮에 사막을 걸으면 물이 순식간에 줄어. 수통 없이 나갔다가 돌아오지 못한 녀석이 한둘이 아니야.');
  list.push('원주민들은 예의를 갖추면 친절해. 사막에 대해선 그들이 제일 잘 알지.');
  list.push('은행에 넣어둔 돈은 강도도 못 건드리지. 금을 팔면 바로 맡기는 게 좋아.');
  const i = (S.rumorSeed + (src || 0) + Math.floor(Math.random() * list.length)) % list.length;
  return list[i];
};

// ---- 공용 메뉴 생성 ----
function shopMenu(id, title, text, items) {
  return new G.Menu({ title, art: A.getInterior(id), text, items, info: () => `영업 ${fmtH(id)}` });
}

const B = G.BUILD = {};
B.store = () => shopMenu('store', '잡화점', '"어서 오시오. 사막에 나가려면 준비를 단단히 해야지."', function () {
  const S = S_(), inv = S.inv; const m = this;
  const one = (key, name, cost, why) => ({
    label: name, right: inv[key] ? '보유' : '$' + cost, disabled: !!inv[key], why,
    act: () => buy(m, cost, () => { inv[key] = 1; m.flash(`${name}을(를) 샀다.`); })
  });
  return [
    one('pan', '사금 채취 팬', 35),
    one('pick', '곡괭이', 60),
    { label: `수통 (물 +30) ${inv.canteen}/3`, right: inv.canteen >= 3 ? '최대' : '$25', disabled: inv.canteen >= 3,
      act: () => buy(m, 25, () => { inv.canteen++; m.flash('수통을 샀다. 우물이나 강에서 물을 채우자.'); }) },
    one('hook', '낚싯바늘', 15),
    one('lantern', '랜턴', 30),
    one('revolver', '리볼버', 200),
    { label: '총알 10발', right: '$5', disabled: !inv.revolver, why: '총이 없으면 쓸모가 없다.',
      act: () => buy(m, 5, () => { S.bullets += 10; m.flash(`총알 ${S.bullets}발.`); }) },
    { label: `식량 10개 (${Math.floor(S.food)}/${G.foodCap()})`, right: '$8', disabled: S.food + 10 > G.foodCap(), why: '더 들고 다닐 수 없다.',
      act: () => buy(m, 8, () => { S.food += 10; m.flash('육포와 콩 통조림을 샀다.'); }) },
    { label: `해독제 ${inv.antivenom}/3`, right: inv.antivenom >= 3 ? '최대' : '$40', disabled: inv.antivenom >= 3,
      act: () => buy(m, 40, () => { inv.antivenom++; m.flash('해독제를 샀다. 가방에서 쓸 수 있다.'); }) },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.saloon = () => shopMenu('saloon', '살롱', '담배 연기 자욱한 살롱. 피아노 소리와 카드 섞는 소리가 들린다.', function () {
  const S = S_(); const m = this;
  return [
    { label: '포커 — 판돈 $5', right: '최소 $125', disabled: S.cash < 125, why: '그 돈으로는 앉을 수 없소. ($125 필요)', act: () => G.ui.push(new G.PokerScene(5)) },
    { label: '포커 — 판돈 $25', right: '최소 $625', disabled: S.cash < 625, why: '큰 판은 $625부터요.', act: () => G.ui.push(new G.PokerScene(25)) },
    { label: '위스키 한 잔 (소문 듣기)', right: '$1', act: () => buy(m, 1, () => { G.advance(10, { town: true }); G.say(['바텐더가 잔을 닦으며 말한다.\n"' + G.rumor(1) + '"'], null, { portrait: portrait('saloon') }); }) },
    { label: '식사 (식량 +6, 체력 +5)', right: '$4', disabled: S.food + 6 > G.foodCap(), why: '배가 너무 부르다.',
      act: () => buy(m, 4, () => { S.food += 6; S.health = Math.min(100, S.health + 5); G.advance(30, { town: true }); m.flash('콩 스튜와 빵을 먹었다.'); }) },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.assay = () => shopMenu('assay', '시금소', () => `"금이라면 다 사드리지." 오늘 시세: 1온스당 $${G.S.goldPrice.toFixed(2)}`, function () {
  const S = S_(); const m = this; const val = S.ore * S.goldPrice;
  const items = [
    { label: `금 원석 팔기 (${S.ore.toFixed(1)}oz)`, right: '$' + G.money(val), disabled: S.ore <= 0, why: '팔 금이 없다.',
      act: () => { S.cash += Math.floor(val); S.stats.earned += Math.floor(val); m.flash(`금 ${S.ore.toFixed(1)}oz를 $${G.money(val)}에 팔았다!`); S.ore = 0; G.audio.sfx('coin'); } }
  ];
  if (S.legend.found && !S.legend.registered) items.push({ label: '하스켈 광산 소유권 등록', right: '$100',
    act: () => buy(m, 100, () => { S.legend.registered = true; G.audio.sfx('win'); G.say(['시금관이 두꺼운 장부에 당신의 이름을 적는다.\n"축하하오. 이제 그 광산은 법적으로 당신 것이오!"', `목표: 은행에 $${G.money(G.GOAL)}를 모으면 큰 부자로 은퇴할 수 있다.`], () => G.wealthCheck(), { portrait: portrait('assay') }); }) });
  else if (S.legend.registered) items.push({ label: '광산 소유권: 등록 완료', disabled: true, right: '✔' });
  items.push({ label: '나가기', act: () => G.ui.pop() });
  return items;
});

B.bank = () => shopMenu('bank', '은행', () => `잔고 $${G.money(G.S.bank)} · 소지금 $${G.money(G.S.cash)}  (목표: 잔고 $${G.money(G.GOAL)} + 광산 등록)`, function () {
  const S = S_(); const m = this;
  const dep = n => () => { n = Math.min(n, S.cash); if (n <= 0) return m.flash('맡길 돈이 없다.', 'r'); S.cash -= n; S.bank += n; G.audio.sfx('coin'); m.flash(`$${G.money(n)}를 맡겼다.`); G.wealthCheck(); };
  const wd = n => () => { n = Math.min(n, S.bank); if (n <= 0) return m.flash('잔고가 없다.', 'r'); S.bank -= n; S.cash += n; G.audio.sfx('coin'); m.flash(`$${G.money(n)}를 찾았다.`); };
  return [
    { label: '예금: 전부', act: dep(S.cash) }, { label: '예금: $100', act: dep(100) }, { label: '예금: $10', act: dep(10) },
    { label: '인출: $10', act: wd(10) }, { label: '인출: $100', act: wd(100) }, { label: '인출: 전부', act: wd(S.bank) },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.doctor = () => shopMenu('doctor', '병원', () => `"어디 봅시다…" 체력 ${Math.floor(G.S.health)}/100${G.S.poisoned ? ' · 독에 중독됨!' : ''}`, function () {
  const S = S_(); const m = this; const need = Math.ceil(100 - S.health);
  return [
    { label: '해독 치료 (1시간)', right: '$50', disabled: !S.poisoned, why: '독에 걸리지 않았소.',
      act: () => buy(m, 50, () => { S.poisoned = false; G.advance(60, { town: true }); m.flash('해독제를 맞았다. 몸이 가벼워진다.'); }) },
    { label: '상처 치료 (1시간)', right: '$' + need, disabled: need <= 0, why: '멀쩡하오.',
      act: () => { const n = Math.min(need, S.cash); if (n <= 0) return m.flash('돈이 모자란다.', 'r'); S.cash -= n; G.advance(60, { town: true }); S.health = Math.min(100, S.health + n); G.audio.sfx('coin'); m.flash(`치료를 받았다. 체력 ${Math.floor(S.health)}.`); } },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.hotel = () => shopMenu('hotel', '호텔', '"방 있소. 아침 6시에 깨워 드리지." (묵으면 게임이 저장된다)', function () {
  const S = S_(); const m = this;
  return [
    { label: '하룻밤 묵기 (체력 회복 + 저장)', right: '$8', act: () => buy(m, 8, () => {
      const mod = S.t % 1440; const until = mod < 360 ? 360 - mod : 1440 - mod + 360;
      G.advance(until, { sleep: true, town: true });
      if (G.pendingDeath) return;
      S.health = Math.min(100, S.health + 35); G.save();
      G.ui.pop(); G.say([`푹 잤다. ${G.day()}일째 아침이 밝았다.`, '(게임이 저장되었다)']);
    }) },
    { label: '게임 저장만 하기', right: '무료', act: () => { G.save(); m.flash('저장했다.'); } },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.stable = () => shopMenu('stable', '마굿간', '말이 있으면 두 배 빨리 달리고 짐(식량 100, 금 150oz)도 많이 싣는다. 대신 물을 더 마신다.', function () {
  const S = S_(); const m = this;
  return [
    { label: '말 사기', right: S.inv.horse ? '보유' : '$800', disabled: !!S.inv.horse, act: () => buy(m, 800, () => { S.inv.horse = 1; m.flash('튼튼한 갈색 말을 샀다!'); }) },
    { label: '말 팔기', right: '$400', disabled: !S.inv.horse, act: () => { S.inv.horse = 0; S.cash += 400; S.food = Math.min(S.food, G.foodCap()); S.ore = Math.min(S.ore, G.oreCap()); G.audio.sfx('coin'); m.flash('말을 팔았다.'); } },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.news = () => shopMenu('news', '신문사', '"세이지 크릭 가제트! 따끈따끈한 소식이오!"', function () {
  const S = S_(); const m = this;
  return [
    { label: '오늘 신문 사기', right: '$1', act: () => buy(m, 1, () => {
      const pages = [
        `【세이지 크릭 가제트 · ${G.day()}일자】\n금 시세: 1온스당 $${S.goldPrice.toFixed(2)}\n내일 날씨: 최고 ${S.nextHigh}°F${S.nextHigh >= 108 ? ' — 살인적인 더위 예상!' : ''}`,
        '【소문란】\n' + G.rumor(7)
      ];
      if (G.day() >= 3 && !S.gangDone) pages.push('【현상수배】 검은 모자 갱단, 사막에서 여행자 습격. 한 명당 현상금 $50. 보안관 사무소로.');
      G.say(pages);
    }) },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

B.sheriff = () => shopMenu('sheriff', '보안관 사무소', '"말썽 피우지 마시오. 마을 안에서 총을 쏘면 바로 감옥이오."', function () {
  const S = S_(); const m = this; const owed = (S.kills - S.bountyPaid) * 50;
  return [
    { label: `현상금 받기 (강도 ${S.kills - S.bountyPaid}명)`, right: '$' + owed, disabled: owed <= 0, why: '받을 현상금이 없소.',
      act: () => { S.cash += owed; S.bountyPaid = S.kills; G.audio.sfx('coin'); m.flash(`현상금 $${owed}를 받았다.`); } },
    { label: '수배 전단 보기', act: () => G.say([S.gangDone ? '검은 모자 갱단은 소탕되었다. 하지만 떠돌이 강도는 여전히 많다.' :
      '【수배】 검은 모자 갱단 — 다섯 명이 몰려다니며 여행자를 습격한다. 두목은 노란 띠 모자를 쓴다. 한 명당 $50.\n(3일째부터 사막에 나타난다)'], null, { portrait: portrait('sheriff') }) },
    { label: '나가기', act: () => G.ui.pop() }
  ];
});

G.enterBuilding = function (b) {
  if (b.id === 'well') { G.useWater('well'); return; }
  if (!G.isOpen(b.id)) { G.audio.sfx('no'); G.say(`${b.name}의 문이 잠겨 있다. (영업시간 ${fmtH(b.id)})`); return; }
  G.audio.sfx('door');
  G.save();
  G.ui.push(B[b.id]());
};

// 체포
G.arrest = function () {
  const S = S_();
  G.audio.sfx('no');
  const jail = () => {
    G.advance(24 * 60, { jail: true });
    if (G.pendingDeath) return;
    S.poisoned = S.poisoned; S.x = (19 * 16) + 8; S.y = (49 * 16) + 12; S.face = 'down';
    G.say(['감옥에서 꼬박 하루를 보냈다. 딱딱한 빵과 물로 버텼다.', '"다시는 마을에서 총질하지 마시오."']);
  };
  G.ask('"총 내려놔!" 보안관이 달려왔다.\n마을 안에서 총을 쏜 죄로 체포되었다. 벌금 $50, 아니면 감옥에서 하루.', [
    { label: '벌금 $50를 낸다', disabled: S.cash < 50, act: () => { S.cash -= 50; G.toast('벌금을 냈다.', 'o'); } },
    { label: '감옥에서 하루를 보낸다', act: jail }
  ], { portrait: portrait('sheriff') });
};
})();
