import {
  coursePar,
  simulateRound,
} from "../dist/index.js";
import {
  createSampleCourse,
  sampleHighHandicap,
  sampleTourPro,
} from "../dist/fixtures/index.js";

const course = createSampleCourse();
const par = coursePar(course);

const result = simulateRound({
  course,
  golfers: [sampleTourPro, sampleHighHandicap],
  trials: 1_000,
  seed: 42,
});

console.log(`Sample course (par ${par})\n`);

for (const stats of result.golferStats) {
  console.log(`${stats.name ?? stats.golferId}`);
  console.log(`  Expected score: ${stats.expectedScore.toFixed(2)} (${formatRelative(stats.expectedScoreRelativeToPar)})`);
  console.log(`  GIR:            ${pct(stats.greenInRegulationRate)}`);
  console.log(`  Fairways:       ${stats.fairwayHitRate === null ? "n/a" : pct(stats.fairwayHitRate)}`);
  console.log(`  Putts/round:    ${stats.averagePuttsPerRound.toFixed(1)}`);
  console.log(
    `  Driving avg:    ${stats.averageDrivingDistanceYards === null ? "n/a" : stats.averageDrivingDistanceYards.toFixed(1) + " yds"}`,
  );
  console.log(`  Scrambling:     ${pct(stats.scrambleRate)}`);
  console.log(
    `  Score mix:      ${pct(stats.scoreDistribution.birdie)} birdie / ${pct(stats.scoreDistribution.par)} par / ${pct(stats.scoreDistribution.bogey)} bogey`,
  );
  console.log(
    `  Front 9:        ${sum(stats.holeByHoleExpectedScores.slice(0, 9)).toFixed(2)}`,
  );
  console.log(
    `  Back 9:         ${sum(stats.holeByHoleExpectedScores.slice(9)).toFixed(2)}`,
  );
  console.log("");
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatRelative(value) {
  if (Math.abs(value) < 0.05) return "E";
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}
