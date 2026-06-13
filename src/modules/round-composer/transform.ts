import type { CompleteGolfer, Course } from "../../types/index.js";
import type { RandomSource } from "../../utils/random.js";
import {
  deriveGolferSeed,
  simulateHoleTrial,
} from "../hole-composer/transform.js";
import {
  accumulateRoundTrial,
  createRoundStatsAccumulator,
  finalizeRoundStatsAccumulator,
} from "./accumulator.js";
import type { GolferRoundStats, RoundTrialOutcome } from "./types.js";

export function coursePar(course: Course): number {
  return course.reduce((total, hole) => total + hole.par, 0);
}

export function simulateRoundTrial(
  golfer: CompleteGolfer,
  course: Course,
  random: RandomSource,
): RoundTrialOutcome {
  const parTotal = coursePar(course);
  let totalStrokes = 0;
  let totalPutts = 0;
  let greenInRegulationCount = 0;
  let fairwayHits = 0;
  let fairwayTrials = 0;
  let drivingDistanceYardsTotal = 0;
  let drivingDistanceTrials = 0;
  let missedApproachGreens = 0;
  let upAndDownCount = 0;
  let scrambleCount = 0;
  const holeStrokes: number[] = [];

  for (const hole of course) {
    const outcome = simulateHoleTrial(golfer, hole, random);
    holeStrokes.push(outcome.totalStrokes);
    totalStrokes += outcome.totalStrokes;
    totalPutts += outcome.putts;

    if (outcome.greenInRegulation) {
      greenInRegulationCount += 1;
    }

    if (outcome.fairwayHit !== null) {
      fairwayTrials += 1;
      if (outcome.fairwayHit) {
        fairwayHits += 1;
      }
    }

    if (outcome.drivingDistanceYards !== null) {
      drivingDistanceTrials += 1;
      drivingDistanceYardsTotal += outcome.drivingDistanceYards;
    }

    if (outcome.missedApproachGreen) {
      missedApproachGreens += 1;
      if (outcome.upAndDown) {
        upAndDownCount += 1;
      }
    }

    if (outcome.scramble) {
      scrambleCount += 1;
    }
  }

  return {
    totalStrokes,
    totalPutts,
    scoreRelativeToPar: totalStrokes - parTotal,
    greenInRegulationCount,
    fairwayHits,
    fairwayTrials,
    drivingDistanceYardsTotal,
    drivingDistanceTrials,
    missedApproachGreens,
    upAndDownCount,
    scrambleCount,
    holeStrokes,
  };
}

export function aggregateGolferRoundStats(
  golfer: CompleteGolfer,
  course: Course,
  outcomes: RoundTrialOutcome[],
  trials: number,
): GolferRoundStats {
  const accumulator = createRoundStatsAccumulator(course.length);
  for (const outcome of outcomes) {
    accumulateRoundTrial(accumulator, outcome);
  }
  if (accumulator.trials !== trials) {
    throw new RangeError(
      `outcomes length (${accumulator.trials}) does not match trials (${trials})`,
    );
  }
  return finalizeRoundStatsAccumulator(accumulator, golfer, course);
}

export { deriveGolferSeed };

export {
  accumulateRoundTrial,
  createRoundStatsAccumulator,
  finalizeRoundStatsAccumulator,
} from "./accumulator.js";

export type { RoundStatsAccumulator } from "./accumulator.js";
