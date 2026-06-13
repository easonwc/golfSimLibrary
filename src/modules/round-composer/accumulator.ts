import type { CompleteGolfer, Course } from "../../types/index.js";
import type { ScoreRelativeToParDistribution } from "../hole-composer/types.js";
import type { GolferRoundStats, RoundTrialOutcome } from "./types.js";

function classifyRoundScoreRelativeToPar(
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

/** Mutable running totals for round-level stats (caller-owned). */
export interface RoundStatsAccumulator {
  holeStrokeTotals: number[];
  scoreDistribution: ScoreRelativeToParDistribution;
  strokeTotal: number;
  puttTotal: number;
  girTotal: number;
  fairwayHits: number;
  fairwayTrials: number;
  drivingDistanceYardsTotal: number;
  drivingDistanceTrials: number;
  missedApproachGreens: number;
  upAndDownCount: number;
  scrambleCount: number;
  trials: number;
}

export function createRoundStatsAccumulator(holeCount: number): RoundStatsAccumulator {
  return {
    holeStrokeTotals: new Array(holeCount).fill(0),
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
    girTotal: 0,
    fairwayHits: 0,
    fairwayTrials: 0,
    drivingDistanceYardsTotal: 0,
    drivingDistanceTrials: 0,
    missedApproachGreens: 0,
    upAndDownCount: 0,
    scrambleCount: 0,
    trials: 0,
  };
}

/** Fold one round trial into caller-owned accumulator state. */
export function accumulateRoundTrial(
  accumulator: RoundStatsAccumulator,
  outcome: RoundTrialOutcome,
): void {
  accumulator.trials += 1;
  accumulator.strokeTotal += outcome.totalStrokes;
  accumulator.puttTotal += outcome.totalPutts;
  accumulator.girTotal += outcome.greenInRegulationCount;
  accumulator.fairwayHits += outcome.fairwayHits;
  accumulator.fairwayTrials += outcome.fairwayTrials;
  accumulator.drivingDistanceYardsTotal += outcome.drivingDistanceYardsTotal;
  accumulator.drivingDistanceTrials += outcome.drivingDistanceTrials;
  accumulator.missedApproachGreens += outcome.missedApproachGreens;
  accumulator.upAndDownCount += outcome.upAndDownCount;
  accumulator.scrambleCount += outcome.scrambleCount;

  accumulator.scoreDistribution[
    classifyRoundScoreRelativeToPar(outcome.scoreRelativeToPar)
  ] += 1;

  for (let i = 0; i < outcome.holeStrokes.length; i += 1) {
    accumulator.holeStrokeTotals[i] += outcome.holeStrokes[i];
  }
}

/** Convert accumulator totals into {@link GolferRoundStats}. */
export function finalizeRoundStatsAccumulator(
  accumulator: RoundStatsAccumulator,
  golfer: CompleteGolfer,
  course: Course,
): GolferRoundStats {
  const trials = accumulator.trials;
  if (trials === 0) {
    throw new RangeError("RoundStatsAccumulator has no recorded trials");
  }

  const par = course.reduce((total, hole) => total + hole.par, 0);
  const totalHoles = course.length * trials;
  const expectedScore = accumulator.strokeTotal / trials;

  return {
    golferId: golfer.id,
    name: golfer.name,
    trials,
    coursePar: par,
    expectedScore,
    expectedScoreRelativeToPar: expectedScore - par,
    averagePuttsPerRound: accumulator.puttTotal / trials,
    fairwayHitRate:
      accumulator.fairwayTrials > 0
        ? accumulator.fairwayHits / accumulator.fairwayTrials
        : null,
    averageDrivingDistanceYards:
      accumulator.drivingDistanceTrials > 0
        ? accumulator.drivingDistanceYardsTotal /
          accumulator.drivingDistanceTrials
        : null,
    greenInRegulationRate: accumulator.girTotal / totalHoles,
    upAndDownRate:
      accumulator.missedApproachGreens > 0
        ? accumulator.upAndDownCount / accumulator.missedApproachGreens
        : 0,
    scrambleRate: accumulator.scrambleCount / totalHoles,
    holeByHoleExpectedScores: accumulator.holeStrokeTotals.map(
      (total) => total / trials,
    ),
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
