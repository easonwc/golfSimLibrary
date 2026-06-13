import {
  simulateRound,
  createUniformClubAttributes,
  LPGA_TOUR_ELITE_BENCHMARKS,
  PGA_TOUR_ELITE_BENCHMARKS,
} from "../dist/index.js";
import { createSampleCourse } from "../dist/fixtures/index.js";

const elite99Male = {
  id: "elite-99-male",
  gender: "male",
  name: "Elite 99 PGA",
  putting: { putting: 99, shortPutting: 99, lagPutting: 99 },
  approach: { approach: 99, accuracy: 99, distanceControl: 99, dispersion: 99 },
  shortGame: { shortGame: 99, chipping: 99, bunkerPlay: 99, pitching: 99 },
  teeShot: { driving: 99, distance: 99, accuracy: 99, dispersion: 99 },
  clubs: createUniformClubAttributes(99),
};

const elite99Female = {
  id: "elite-99-female",
  gender: "female",
  name: "Elite 99 LPGA",
  putting: { putting: 99, shortPutting: 99, lagPutting: 99 },
  approach: { approach: 99, accuracy: 99, distanceControl: 99, dispersion: 99 },
  shortGame: { shortGame: 99, chipping: 99, bunkerPlay: 99, pitching: 99 },
  teeShot: { driving: 99, distance: 99, accuracy: 99, dispersion: 99 },
  clubs: createUniformClubAttributes(99),
};

const mid50 = {
  id: "mid-50",
  name: "Mid 50",
  putting: { putting: 50, shortPutting: 50, lagPutting: 50 },
  approach: { approach: 50, accuracy: 50, distanceControl: 50, dispersion: 50 },
  shortGame: { shortGame: 50, chipping: 50, bunkerPlay: 50, pitching: 50 },
  teeShot: { driving: 50, distance: 50, accuracy: 50, dispersion: 50 },
  clubs: createUniformClubAttributes(50),
};

const course = createSampleCourse();

console.log("PGA anchors:", PGA_TOUR_ELITE_BENCHMARKS);
console.log("LPGA anchors:", LPGA_TOUR_ELITE_BENCHMARKS);
console.log("");

for (const golfer of [elite99Male, elite99Female, mid50]) {
  const r = simulateRound({ course, golfers: [golfer], trials: 3000, seed: 42 });
  const s = r.golferStats[0];
  console.log(golfer.name);
  console.log("  Score:", s.expectedScore.toFixed(2), `(${s.expectedScoreRelativeToPar >= 0 ? "+" : ""}${s.expectedScoreRelativeToPar.toFixed(2)})`);
  console.log("  Putts:", s.averagePuttsPerRound.toFixed(2));
  console.log("  GIR:", (s.greenInRegulationRate * 100).toFixed(1) + "%");
  console.log("  FW:", s.fairwayHitRate === null ? "n/a" : (s.fairwayHitRate * 100).toFixed(1) + "%");
  console.log(
    "  Drive:",
    s.averageDrivingDistanceYards === null
      ? "n/a"
      : s.averageDrivingDistanceYards.toFixed(1) + " yds",
  );
  console.log("  Scramble:", (s.scrambleRate * 100).toFixed(1) + "% of holes");
  console.log(
    "  Scramble (missed GIR):",
    ((s.scrambleRate / (1 - s.greenInRegulationRate)) * 100).toFixed(1) + "%",
  );
  console.log("  Up & down:", (s.upAndDownRate * 100).toFixed(1) + "%");
  console.log("");
}
