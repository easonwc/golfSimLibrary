import {
  simulateHole,
} from "../dist/index.js";
import {
  createSamplePar4Hole,
  sampleHighHandicap,
  sampleTourPro,
} from "../dist/fixtures/index.js";

const hole = createSamplePar4Hole();

const result = simulateHole({
  hole,
  golfers: [sampleTourPro, sampleHighHandicap],
  trials: 3_000,
  seed: 42,
});

console.log(`Hole ${result.holeId} (par ${result.par})\n`);

for (const stats of result.golferStats) {
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
