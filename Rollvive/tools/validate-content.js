const fs = require('fs');
const path = require('path');
const ts = require('../node_modules/typescript');

const root = path.resolve(__dirname, '..');
const sources = [
  'assets/scripts/data/RollData.ts',
  'assets/scripts/domain/BattleContent.ts',
  'assets/scripts/domain/RuntimeBattleMath.ts',
  'assets/scripts/domain/PerformanceBudget.ts',
  'assets/scripts/domain/RunModel.ts',
  'assets/scripts/manager/RollSystem.ts',
];

const outputDir = path.join(root, '.tmp-content-validate');
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const source of sources) {
  const inputPath = path.join(root, source);
  const outputPath = path.join(outputDir, source.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const output = ts.transpileModule(fs.readFileSync(inputPath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: inputPath,
    reportDiagnostics: true,
  });
  if (output.diagnostics && output.diagnostics.length > 0) {
    for (const diagnostic of output.diagnostics) {
      console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    }
    process.exit(1);
  }
  fs.writeFileSync(outputPath, output.outputText);
}

const battle = require('./../.tmp-content-validate/assets/scripts/domain/BattleContent.js');
const math = require('./../.tmp-content-validate/assets/scripts/domain/RuntimeBattleMath.js');
const data = require('./../.tmp-content-validate/assets/scripts/data/RollData.js');
const { RollSystem } = require('./../.tmp-content-validate/assets/scripts/manager/RollSystem.js');

const failures = [];
const enemyTypes = new Set(Object.keys(battle.ENEMY_ARCHETYPES));

if (!data.PROFESSIONS || data.PROFESSIONS.length !== 16) {
  failures.push(`Expected 16 MBTI professions, got ${data.PROFESSIONS?.length ?? 0}.`);
}

const codes = new Set();
for (const profession of data.PROFESSIONS) {
  if (!profession.code || profession.code.length !== 4) {
    failures.push(`Profession ${profession.id} missing 4-letter code.`);
  }
  if (codes.has(profession.code)) failures.push(`Duplicate MBTI code ${profession.code}.`);
  codes.add(profession.code);
  if (!profession.traits || profession.traits.length !== 4) {
    failures.push(`${profession.id} must have 4 traits.`);
  }
  if (!profession.ultimateId) failures.push(`${profession.id} missing ultimate.`);
  if (!profession.weaponStyle) failures.push(`${profession.id} missing weaponStyle.`);
}

const requiredTraits = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
for (const trait of requiredTraits) {
  if (!data.DIMENSION_PASSIVES?.[trait]) {
    failures.push(`Missing dimension passive for ${trait}.`);
  }
}

// Handwritten floors 1-4 cover waves 1-20; also smoke-test a scaled wave.
for (let wave = 1; wave <= 20; wave += 1) {
  const plan = battle.getWavePlan(wave);
  if (!plan.enemies || plan.enemies.length === 0) {
    failures.push(`Wave ${wave} has no enemies.`);
  }
  if (!plan.floor) failures.push(`Wave ${wave} missing floor.`);
  const expectedFloor = Math.min(4, 1 + Math.floor((wave - 1) / 5));
  if (plan.floor !== expectedFloor) {
    failures.push(`Wave ${wave} expected floor ${expectedFloor}, got ${plan.floor}.`);
  }
  const expectBoss = wave % 5 === 0;
  if (!!plan.isBoss !== expectBoss) {
    failures.push(`Wave ${wave} isBoss=${plan.isBoss}, expected ${expectBoss}.`);
  }
  for (const entry of plan.enemies) {
    if (!enemyTypes.has(entry.type)) {
      failures.push(`Wave ${wave} references unknown enemy type ${entry.type}.`);
    }
    if (!Number.isFinite(entry.count) || entry.count < 0) {
      failures.push(`Wave ${wave} has invalid count for ${entry.type}.`);
    }
  }
  const enemies = math.createRuntimeWaveEnemies(wave, 36);
  if (enemies.length <= 0 || enemies.length > 36) {
    failures.push(`Wave ${wave} generated ${enemies.length} enemies.`);
  }
  if (expectBoss) {
    const bosses = enemies.filter((e) => e.rank === 'boss');
    if (bosses.length < 1) failures.push(`Wave ${wave} boss plan produced no boss entity.`);
  }
}

// Soft-scale wave beyond handwritten set should still resolve.
{
  const plan = battle.getWavePlan(25);
  if (!plan.isBoss || plan.floor < 1) failures.push('Wave 25 soft-scale boss plan invalid.');
}

const cardIds = new Set();
const rarityCount = { white: 0, blue: 0, purple: 0, orange: 0 };
for (const card of data.HEX_CARDS) {
  if (cardIds.has(card.id)) failures.push(`Duplicate card id ${card.id}.`);
  cardIds.add(card.id);
  if (!card.name || !card.rarity || !card.category) failures.push(`Card ${card.id} is missing display data.`);
  if (rarityCount[card.rarity] !== undefined) rarityCount[card.rarity] += 1;
  else failures.push(`Card ${card.id} has unknown rarity ${card.rarity}.`);
}

if (data.HEX_CARDS.length < 40) {
  failures.push(`Expected at least 40 skills in pool, got ${data.HEX_CARDS.length}.`);
}

// 16 exclusive signature cards (one per MBTI).
const exclusiveCards = data.HEX_CARDS.filter((card) => card.exclusiveTo);
const exclusiveOwners = new Set(exclusiveCards.map((card) => card.exclusiveTo));
if (exclusiveCards.length < 16) {
  failures.push(`Expected 16 exclusive cards, got ${exclusiveCards.length}.`);
}
for (const profession of data.PROFESSIONS) {
  if (!exclusiveOwners.has(profession.id)) {
    failures.push(`Missing exclusive card for ${profession.id}.`);
  }
}
for (const card of exclusiveCards) {
  if (!data.PROFESSIONS.some((p) => p.id === card.exclusiveTo)) {
    failures.push(`Exclusive card ${card.id} points to unknown profession ${card.exclusiveTo}.`);
  }
}

// Draft size checks for a sample of personalities (I/P/J variants)
const sampleIds = ['intj', 'esfp', 'enfp', 'istj'];
for (const id of sampleIds) {
  const profession = data.PROFESSIONS.find((item) => item.id === id);
  if (!profession) {
    failures.push(`Missing sample profession ${id}.`);
    continue;
  }
  const roll = new RollSystem();
  roll.reset(0, profession.id);
  roll.beginDraft(1);
  const choices = roll.getViewModel().choices;
  const minChoices = profession.traits.includes('P') ? 4 : 3;
  if (choices.length < minChoices || choices.length > 4) {
    failures.push(`${profession.id} generated ${choices.length} draft choices (expected ${minChoices}-4).`);
  }

  // Run model init
  const run = require('./../.tmp-content-validate/assets/scripts/domain/RunModel.js').createInitialRun({
    professionId: profession.id,
  });
  if (!run.player || run.player.maxHp <= 0 || run.player.damage <= 0) {
    failures.push(`${profession.id} initial run has invalid player stats.`);
  }
  if (profession.traits.includes('S') && run.player.critChance < 0.2) {
    failures.push(`${profession.id} S-type should start with crit chance.`);
  }
  if (profession.traits.includes('N') && run.player.dodge < 0.1) {
    failures.push(`${profession.id} N-type should start with dodge.`);
  }
}

// Exclusive draft bias: matching profession should see its card far more often.
{
  const exclusiveId = 'excl_intj_chrono_scope';
  const trials = 240;
  let intjHits = 0;
  let esfpHits = 0;
  for (let i = 0; i < trials; i += 1) {
    const intjRoll = new RollSystem();
    intjRoll.reset(0, 'intj');
    intjRoll.beginDraft(1);
    if (intjRoll.getViewModel().choices.some((c) => c.data.id === exclusiveId)) intjHits += 1;

    const esfpRoll = new RollSystem();
    esfpRoll.reset(0, 'esfp');
    esfpRoll.beginDraft(1);
    if (esfpRoll.getViewModel().choices.some((c) => c.data.id === exclusiveId)) esfpHits += 1;
  }
  if (intjHits <= esfpHits) {
    failures.push(
      `Exclusive bias failed: INTJ saw ${exclusiveId} ${intjHits}/${trials}, ESFP ${esfpHits}/${trials}.`,
    );
  }
  if (intjHits < 8) {
    failures.push(`Exclusive bias too weak: INTJ only saw ${exclusiveId} ${intjHits}/${trials}.`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Content validation passed: 16 MBTI, ${data.HEX_CARDS.length} skills ` +
  `(W${rarityCount.white}/B${rarityCount.blue}/P${rarityCount.purple}/O${rarityCount.orange}), ` +
  `${exclusiveCards.length} exclusives, waves 1-20, dimension passives, draft sizes OK.`,
);
