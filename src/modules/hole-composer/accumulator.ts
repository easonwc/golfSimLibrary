import type { CompleteGolfer, CompleteHole } from "../../types/index.js";
import type {
  GolferHoleStats,
  HoleTrialOutcome,
  ScoreRelativeToParDistribution,
} from "./types.js";

function classifyScoreRelativeToPar(
  relative: number,
): keyof ScoreRelativeToParDistribution {
  if (relative <= -2) {
    return "eagleOrBetter";
  }
  if (relative === -1) {
    return "birdie";
  }
  if (relative === 0) {
    return "par";
  }
  if (relative === 1) {
    return "bogey";
  }
  if (relative === 2) {
    return "doubleBogey";
  }
  return "tripleOrWorse";
}

/** Mutable running totals for hole-level stats (caller-owned). */
export interface HoleStatsAccumulator {
  scoreDistribution: ScoreRelativeToParDistribution;
  strokeTotal: number;
  puttTotal: number;
  fairwayHits: number;
  fairwayTrials: number;
  girCount: number;
  upAndDownCount: number;
  scrambleCount: number;
  missedGreenCount: number;
  trials: number;
}

export function createHoleStatsAccumulator(): HoleStatsAccumulator {
  return {
    scoreDistribution: {
      eagleOrBetter: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      doubleBogey: 0,
      tripleOrWorse: 0,
    },
    strokeTotal: 0,
    puttTotal: 0,
    fairwayHits: 0,
    fairwayTrials: 0,
    girCount: 0,
    upAndDownCount: 0,
    scrambleCount: 0,
    missedGreenCount: 0,
    trials: 0,
  };
}

/** Fold one hole trial into caller-owned accumulator state. */
export function accumulateHoleTrial(
  accumulator: HoleStatsAccumulator,
  outcome: HoleTrialOutcome,
): void {
  accumulator.trials += 1;
  accumulator.strokeTotal += outcome.totalStrokes;
  accumulator.puttTotal += outcome.putts;
  accumulator.scoreDistribution[
    classifyScoreRelativeToPar(outcome.scoreRelativeToPar)
  ] += 1;

  if (outcome.fairwayHit !== null) {
    accumulator.fairwayTrials += 1;
    if (outcome.fairwayHit) {
      accumulator.fairwayHits += 1;
    }
  }

  if (outcome.greenInRegulation) {
    accumulator.girCount += 1;
  }

  if (outcome.missedApproachGreen) {
    accumulator.missedGreenCount += 1;
    if (outcome.upAndDown) {
      accumulator.upAndDownCount += 1;
    }
  }

  if (outcome.scramble) {
    accumulator.scrambleCount += 1;
  }
}

/** Convert accumulator totals into {@link GolferHoleStats}. */
export function finalizeHoleStatsAccumulator(
  accumulator: HoleStatsAccumulator,
  golfer: CompleteGolfer,
  hole: CompleteHole,
): GolferHoleStats {
  const trials = accumulator.trials;
  if (trials === 0) {
    throw new RangeError("HoleStatsAccumulator has no recorded trials");
  }

  const expectedScore = accumulator.strokeTotal / trials;

  return {
    golferId: golfer.id,
    name: golfer.name,
    trials,
    expectedScore,
    expectedScoreRelativeToPar: expectedScore - hole.par,
    averagePutts: accumulator.puttTotal / trials,
    fairwayHitRate:
      accumulator.fairwayTrials > 0
        ? accumulator.fairwayHits / accumulator.fairwayTrials
        : null,
    greenInRegulationRate: accumulator.girCount / trials,
    upAndDownRate:
      accumulator.missedGreenCount > 0
        ? accumulator.upAndDownCount / accumulator.missedGreenCount
        : 0,
    scrambleRate: accumulator.scrambleCount / trials,
    scoreDistribution: {
      eagleOrBetter: accumulator.scoreDistribution.eagleOrBetter / trials,
      birdie: accumulator.scoreDistribution.birdie / trials,
      par: accumulator.scoreDistribution.par / trials,
      bogey: accumulator.scoreDistribution.bogey / trials,
      doubleBogey: accumulator.scoreDistribution.doubleBogey / trials,
      tripleOrWorse: accumulator.scoreDistribution.tripleOrWorse / trials,
    },
  };
}
