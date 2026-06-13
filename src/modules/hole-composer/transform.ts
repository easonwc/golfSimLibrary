import type { CompleteGolfer, CompleteHole } from "../../types/index.js";
import { dispersionScale } from "../../calibration/index.js";
import { resolveClubAttributes } from "../../clubs/index.js";
import { gaussianRandom, type RandomSource } from "../../utils/random.js";
import { simulateApproachShot } from "../approach/transform.js";
import { simulatePuttsOnGreen } from "../putting/transform.js";
import {
  inferLieFromApproachMiss,
  simulateShortGameShot,
} from "../short-game/transform.js";
import { simulateTeeShotDrive } from "../tee-shot/transform.js";
import type {
  GolferHoleStats,
  HoleTrialOutcome,
  ScoreRelativeToParDistribution,
} from "./types.js";

const PAR5_LAYUP_THRESHOLD_YARDS = 210;
const PAR5_LAYUP_DISTANCE_YARDS = 175;
const YARDS_TO_FEET = 3;

function regulationStrokesToGreen(par: 3 | 4 | 5): number {
  return par - 2;
}

function applyPar5LayupIfNeeded(
  hole: CompleteHole,
  golfer: CompleteGolfer,
  remainingDistanceYards: number,
  random: RandomSource,
): { remainingDistanceYards: number; strokesAdded: number } {
  if (hole.par !== 5 || remainingDistanceYards <= PAR5_LAYUP_THRESHOLD_YARDS) {
    return { remainingDistanceYards, strokesAdded: 0 };
  }

  const woodSkill = resolveClubAttributes(golfer).wood;
  const layupSigma = 12 * dispersionScale(woodSkill);
  const layupAdvance =
    PAR5_LAYUP_DISTANCE_YARDS + gaussianRandom(random, 0, layupSigma);

  return {
    remainingDistanceYards: Math.max(
      70,
      remainingDistanceYards - layupAdvance,
    ),
    strokesAdded: 1,
  };
}

interface PrePuttingState {
  firstPuttDistanceFeet: number;
  strokesBeforePutting: number;
  missedApproachGreen: boolean;
  greenInRegulation: boolean;
  fairwayHit: boolean | null;
  drivingDistanceYards: number | null;
  shortGameStrokes: number;
}

function resolvePrePuttingState(
  golfer: CompleteGolfer,
  hole: CompleteHole,
  random: RandomSource,
): PrePuttingState {
  let strokes = 0;
  let fairwayHit: boolean | null = null;
  let drivingDistanceYards: number | null = null;
  let remainingDistanceYards = hole.lengthYards;

  if (hole.par === 4 || hole.par === 5) {
    strokes += 1;
    const teeOutcome = simulateTeeShotDrive(golfer, hole, random);
    fairwayHit = teeOutcome.lie === "fairway";
    drivingDistanceYards = teeOutcome.drivingDistanceYards;
    remainingDistanceYards = teeOutcome.remainingDistanceYards;

    const layup = applyPar5LayupIfNeeded(
      hole,
      golfer,
      remainingDistanceYards,
      random,
    );
    strokes += layup.strokesAdded;
    remainingDistanceYards = layup.remainingDistanceYards;
  }

  strokes += 1;
  const approachOutcome = simulateApproachShot(
    golfer,
    hole,
    remainingDistanceYards,
    random,
  );

  const regulationLimit = regulationStrokesToGreen(hole.par);

  if (approachOutcome.onGreen) {
    return {
      firstPuttDistanceFeet: approachOutcome.proximityFeet,
      strokesBeforePutting: strokes,
      missedApproachGreen: false,
      greenInRegulation: strokes <= regulationLimit,
      fairwayHit,
      drivingDistanceYards,
      shortGameStrokes: 0,
    };
  }

  let shortGameStrokes = 0;
  let missDistanceYards =
    approachOutcome.missDistanceYards ??
    approachOutcome.proximityFeet / YARDS_TO_FEET;
  let lie = inferLieFromApproachMiss(
    approachOutcome.missDirection!,
    missDistanceYards,
    hole,
  );

  strokes += 1;
  shortGameStrokes += 1;
  let shortGameOutcome = simulateShortGameShot(
    golfer,
    hole,
    missDistanceYards,
    lie,
    random,
  );

  if (!shortGameOutcome.onGreen) {
    strokes += 1;
    shortGameStrokes += 1;
    missDistanceYards =
      shortGameOutcome.remainingMissYards ?? missDistanceYards * 0.65;
    lie = lie === "bunker" ? "bunker" : "rough";
    shortGameOutcome = simulateShortGameShot(
      golfer,
      hole,
      missDistanceYards,
      lie,
      random,
    );
  }

  const firstPuttDistanceFeet = shortGameOutcome.onGreen
    ? shortGameOutcome.proximityFeet
    : Math.min(45, (shortGameOutcome.remainingMissYards ?? 12) * YARDS_TO_FEET);

  return {
    firstPuttDistanceFeet,
    strokesBeforePutting: strokes,
    missedApproachGreen: true,
    greenInRegulation: false,
    fairwayHit,
    drivingDistanceYards,
    shortGameStrokes,
  };
}

export function simulateHoleTrial(
  golfer: CompleteGolfer,
  hole: CompleteHole,
  random: RandomSource,
): HoleTrialOutcome {
  const prePutting = resolvePrePuttingState(golfer, hole, random);

  const putts = simulatePuttsOnGreen(
    prePutting.firstPuttDistanceFeet,
    golfer,
    hole,
    random,
  );

  const totalStrokes = prePutting.strokesBeforePutting + putts;
  const scoreRelativeToPar = totalStrokes - hole.par;

  const upAndDown =
    prePutting.missedApproachGreen &&
    prePutting.shortGameStrokes === 1 &&
    putts === 1;

  const scramble =
    !prePutting.greenInRegulation && scoreRelativeToPar <= 0;

  return {
    totalStrokes,
    putts,
    strokesToGreen: prePutting.strokesBeforePutting,
    drivingDistanceYards: prePutting.drivingDistanceYards,
    fairwayHit: prePutting.fairwayHit,
    greenInRegulation: prePutting.greenInRegulation,
    missedApproachGreen: prePutting.missedApproachGreen,
    upAndDown,
    scramble,
    scoreRelativeToPar,
  };
}

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

export function aggregateGolferHoleStats(
  golfer: CompleteGolfer,
  hole: CompleteHole,
  outcomes: HoleTrialOutcome[],
  trials: number,
): GolferHoleStats {
  const scoreDistribution: ScoreRelativeToParDistribution = {
    eagleOrBetter: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doubleBogey: 0,
    tripleOrWorse: 0,
  };

  let strokeTotal = 0;
  let puttTotal = 0;
  let fairwayHits = 0;
  let fairwayTrials = 0;
  let girCount = 0;
  let upAndDownCount = 0;
  let scrambleCount = 0;
  let missedGreenCount = 0;

  for (const outcome of outcomes) {
    strokeTotal += outcome.totalStrokes;
    puttTotal += outcome.putts;
    scoreDistribution[classifyScoreRelativeToPar(outcome.scoreRelativeToPar)] +=
      1;

    if (outcome.fairwayHit !== null) {
      fairwayTrials += 1;
      if (outcome.fairwayHit) {
        fairwayHits += 1;
      }
    }

    if (outcome.greenInRegulation) {
      girCount += 1;
    }

    if (outcome.missedApproachGreen) {
      missedGreenCount += 1;
      if (outcome.upAndDown) {
        upAndDownCount += 1;
      }
    }

    if (outcome.scramble) {
      scrambleCount += 1;
    }
  }

  const expectedScore = strokeTotal / trials;

  return {
    golferId: golfer.id,
    name: golfer.name,
    trials,
    expectedScore,
    expectedScoreRelativeToPar: expectedScore - hole.par,
    averagePutts: puttTotal / trials,
    fairwayHitRate:
      fairwayTrials > 0 ? fairwayHits / fairwayTrials : null,
    greenInRegulationRate: girCount / trials,
    upAndDownRate:
      missedGreenCount > 0 ? upAndDownCount / missedGreenCount : 0,
    scrambleRate: scrambleCount / trials,
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

export function deriveGolferSeed(baseSeed: number | undefined, index: number): number | undefined {
  if (baseSeed === undefined) {
    return undefined;
  }
  return baseSeed + index * 10_001;
}
