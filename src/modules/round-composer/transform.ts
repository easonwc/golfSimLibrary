import type { CompleteGolfer, Course } from "../../types/index.js";
import type { RandomSource } from "../../utils/random.js";
import {
  deriveGolferSeed,
  simulateHoleTrial,
} from "../hole-composer/transform.js";
import type { ScoreRelativeToParDistribution } from "../hole-composer/types.js";
import type {
  GolferRoundStats,
  RoundTrialOutcome,
} from "./types.js";

export function coursePar(course: Course): number {
  return course.reduce((total, hole) => total + hole.par, 0);
}

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

export function simulateRoundTrial(
  golfer: CompleteGolfer,
  course: Course,
  random: RandomSource,
): RoundTrialOutcome {
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
    scoreRelativeToPar: totalStrokes - coursePar(course),
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
  const par = coursePar(course);
  const scoreDistribution: ScoreRelativeToParDistribution = {
    eagleOrBetter: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doubleBogey: 0,
    tripleOrWorse: 0,
  };

  const holeStrokeTotals = new Array(course.length).fill(0);
  let strokeTotal = 0;
  let puttTotal = 0;
  let girTotal = 0;
  let fairwayHits = 0;
  let fairwayTrials = 0;
  let drivingDistanceYardsTotal = 0;
  let drivingDistanceTrials = 0;
  let missedApproachGreens = 0;
  let upAndDownCount = 0;
  let scrambleCount = 0;
  const totalHoles = course.length * trials;

  for (const outcome of outcomes) {
    strokeTotal += outcome.totalStrokes;
    puttTotal += outcome.totalPutts;
    girTotal += outcome.greenInRegulationCount;
    fairwayHits += outcome.fairwayHits;
    fairwayTrials += outcome.fairwayTrials;
    drivingDistanceYardsTotal += outcome.drivingDistanceYardsTotal;
    drivingDistanceTrials += outcome.drivingDistanceTrials;
    missedApproachGreens += outcome.missedApproachGreens;
    upAndDownCount += outcome.upAndDownCount;
    scrambleCount += outcome.scrambleCount;

    scoreDistribution[classifyRoundScoreRelativeToPar(outcome.scoreRelativeToPar)] +=
      1;

    for (let i = 0; i < outcome.holeStrokes.length; i += 1) {
      holeStrokeTotals[i] += outcome.holeStrokes[i];
    }
  }

  const expectedScore = strokeTotal / trials;

  return {
    golferId: golfer.id,
    name: golfer.name,
    trials,
    coursePar: par,
    expectedScore,
    expectedScoreRelativeToPar: expectedScore - par,
    averagePuttsPerRound: puttTotal / trials,
    fairwayHitRate:
      fairwayTrials > 0 ? fairwayHits / fairwayTrials : null,
    averageDrivingDistanceYards:
      drivingDistanceTrials > 0
        ? drivingDistanceYardsTotal / drivingDistanceTrials
        : null,
    greenInRegulationRate: girTotal / totalHoles,
    upAndDownRate:
      missedApproachGreens > 0 ? upAndDownCount / missedApproachGreens : 0,
    scrambleRate: scrambleCount / totalHoles,
    holeByHoleExpectedScores: holeStrokeTotals.map((total) => total / trials),
    scoreDistribution: {
      eagleOrBetter: scoreDistribution.eagleOrBetter / trials,
      birdie: scoreDistribution.birdie / trials,
      par: scoreDistribution.par / trials,
      bogey: scoreDistribution.bogey / trials,
      doubleBogey: scoreDistribution.doubleBogey / trials,
      tripleOrWorse: scoreDistribution.tripleOrWorse / trials,
    },
  };
}

export { deriveGolferSeed };
