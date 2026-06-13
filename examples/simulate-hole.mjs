import {
  accumulateHoleTrial,
  createHoleStatsAccumulator,
  finalizeHoleStatsAccumulator,
  iterateHoleTrials,
} from "../dist/index.js";
import {
  createSamplePar4Hole,
  sampleHighHandicap,
  sampleTourPro,
} from "../dist/fixtures/index.js";

const hole = createSamplePar4Hole();
const trials = 3_000;

function simulateGolferHole(golfer, seed) {
  const accumulator = createHoleStatsAccumulator();

  for (const outcome of iterateHoleTrials(golfer, hole, { trials, seed })) {
    accumulateHoleTrial(accumulator, outcome);
  }

  return finalizeHoleStatsAccumulator(accumulator, golfer, hole);
}

console.log(`Hole ${hole.id} (par ${hole.par})\n`);

for (const [index, golfer] of [sampleTourPro, sampleHighHandicap].entries()) {
  const stats = simulateGolferHole(golfer, 42 + index);
  console.log(`${stats.name ?? stats.golferId}`);
  console.log(`  Expected score: ${stats.expectedScore.toFixed(2)} (${formatRelative(stats.expectedScoreRelativeToPar)})`);
  console.log(`  GIR:            ${pct(stats.greenInRegulationRate)}`);
  console.log(`  Fairways:       ${stats.fairwayHitRate === null ? "n/a" : pct(stats.fairwayHitRate)}`);
  console.log(`  Avg putts:      ${stats.averagePutts.toFixed(2)}`);
  console.log("");
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatRelative(value) {
  if (value === 0) return "E";
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}
