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

for (let wave = 1; wave <= 10; wave += 1) {
  const plan = battle.getWavePlan(wave);
  if (!plan.enemies || plan.enemies.length === 0) {
    failures.push(`Wave ${wave} has no enemies.`);
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
}

const cardIds = new Set();
for (const card of data.HEX_CARDS) {
  if (cardIds.has(card.id)) failures.push(`Duplicate card id ${card.id}.`);
  cardIds.add(card.id);
  if (!card.name || !card.rarity || !card.category) failures.push(`Card ${card.id} is missing display data.`);
}

for (const profession of data.PROFESSIONS) {
  const roll = new RollSystem();
  roll.reset(0, profession.id);
  roll.beginDraft(1);
  const choices = roll.getViewModel().choices;
  if (choices.length < 3 || choices.length > 4) {
    failures.push(`${profession.id} generated ${choices.length} draft choices.`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Content validation passed: waves 1-10, enemy archetypes, cards, and draft sizes are sane.');
