import { ValidationError } from "../../errors.js";
import type {
  Golfer,
  GolferShortGameAttributes,
  Hole,
  ShortGameLie,
} from "../../types/index.js";
import { gaussianRandom, type RandomSource } from "../../utils/random.js";
import type { ApproachMissDirection } from "../approach/types.js";
import type {
  ShortGameOutcomeDistribution,
  ShortGameShotOutcome,
  ShortGameStats,
} from "./types.js";

const YARDS_TO_FEET = 3;

const LIE_PENALTY: Record<ShortGameLie, number> = {
  fringe: 1,
  rough: 1.22,
  bunker: 1.42,
  deepRough: 1.55,
};

function requireShortGame(golfer: Golfer): GolferShortGameAttributes {
  if (!golfer.shortGame) {
    throw new ValidationError("golfer.shortGame must be an object");
  }
  return golfer.shortGame;
}

function skillFactor(skill: number): number {
  return 1 - (skill / 100) * 0.58;
}

function blendedShortGameSkill(
  golfer: Golfer,
  missDistanceYards: number,
  lie: ShortGameLie,
): number {
  const shortGame = requireShortGame(golfer);

  if (lie === "bunker") {
    return shortGame.bunkerPlay * 0.65 + shortGame.shortGame * 0.35;
  }

  if (missDistanceYards <= 15) {
    return shortGame.chipping * 0.6 + shortGame.shortGame * 0.4;
  }

  if (missDistanceYards >= 25) {
    return shortGame.pitching * 0.55 + shortGame.shortGame * 0.45;
  }

  return shortGame.shortGame * 0.5 + shortGame.chipping * 0.3 + shortGame.pitching * 0.2;
}

function greenContactRate(
  golfer: Golfer,
  hole: Hole,
  missDistanceYards: number,
  lie: ShortGameLie,
): number {
  const holeShortGame = hole.shortGame;
  if (!holeShortGame) {
    throw new ValidationError("hole.shortGame must be an object");
  }

  const skill = blendedShortGameSkill(golfer, missDistanceYards, lie) / 100;
  let rate = 0.42 + skill * 0.54;

  rate += { fringe: 0.1, rough: 0, bunker: -0.2, deepRough: -0.3 }[lie];
  rate -= Math.max(0, missDistanceYards - 20) * 0.01;
  rate -= holeShortGame.roughDifficulty * 0.07;
  rate -= holeShortGame.collectionDifficulty * 0.05;
  if (lie === "bunker") {
    rate -= holeShortGame.bunkerDifficulty * 0.12;
  }

  return Math.min(0.97, Math.max(0.06, rate));
}

export function calculateShortGameDispersionFeet(
  golfer: Golfer,
  hole: Hole,
  missDistanceYards: number,
  lie: ShortGameLie,
): number {
  const holeShortGame = hole.shortGame;
  if (!holeShortGame) {
    throw new ValidationError("hole.shortGame must be an object");
  }

  const skill = blendedShortGameSkill(golfer, missDistanceYards, lie);
  const distanceScale = Math.sqrt(missDistanceYards / 12);
  const baseRadialFeet = 3.2 * distanceScale;

  const liePenalty = LIE_PENALTY[lie];
  const roughPenalty = 1 + holeShortGame.roughDifficulty * 0.1;
  const collectionPenalty = 1 + holeShortGame.collectionDifficulty * 0.08;
  const pinPenalty = 1 + hole.green.pinDifficulty * 0.1;

  return (
    baseRadialFeet *
    skillFactor(skill) *
    liePenalty *
    roughPenalty *
    collectionPenalty *
    pinPenalty
  );
}

export function calculateGreenContactRate(
  golfer: Golfer,
  hole: Hole,
  missDistanceYards: number,
  lie: ShortGameLie,
): number {
  return greenContactRate(golfer, hole, missDistanceYards, lie);
}

/**
 * Estimates the most likely short game lie from an approach miss. Useful when
 * wiring the approach module into short game.
 */
export function inferLieFromApproachMiss(
  missDirection: ApproachMissDirection,
  missDistanceYards: number,
  hole: Hole,
): ShortGameLie {
  const holeShortGame = hole.shortGame;
  if (!holeShortGame) {
    throw new ValidationError("hole.shortGame must be an object");
  }

  if (
    holeShortGame.bunkerDifficulty >= 0.5 &&
    missDistanceYards <= 22 &&
    (missDirection === "missShort" ||
      missDirection === "missLeft" ||
      missDirection === "missRight")
  ) {
    return "bunker";
  }

  if (missDistanceYards >= 28 || holeShortGame.roughDifficulty >= 0.75) {
    return "deepRough";
  }

  if (
    missDirection === "missLong" ||
    holeShortGame.roughDifficulty >= 0.45
  ) {
    return "rough";
  }

  return "fringe";
}

export function simulateShortGameShot(
  golfer: Golfer,
  hole: Hole,
  missDistanceYards: number,
  lie: ShortGameLie,
  random: RandomSource,
): ShortGameShotOutcome {
  const contactRate = greenContactRate(golfer, hole, missDistanceYards, lie);

  if (random.next() > contactRate) {
    const remainingMissYards =
      missDistanceYards * (0.5 + random.next() * 0.45);
    return {
      onGreen: false,
      proximityFeet: remainingMissYards * YARDS_TO_FEET,
      remainingMissYards,
    };
  }

  const radialSigma = calculateShortGameDispersionFeet(
    golfer,
    hole,
    missDistanceYards,
    lie,
  );

  const depthFeet = gaussianRandom(random, 0, radialSigma);
  const lateralFeet = gaussianRandom(random, 0, radialSigma);
  const proximityFeet = Math.max(
    1,
    Math.sqrt(depthFeet ** 2 + lateralFeet ** 2),
  );

  return { onGreen: true, proximityFeet };
}

export function aggregateShortGameStats(
  golfer: Golfer,
  hole: Hole,
  outcomes: ShortGameShotOutcome[],
  missDistanceYards: number,
  lie: ShortGameLie,
  trials: number,
): ShortGameStats {
  const buckets: ShortGameOutcomeDistribution = {
    onGreen: 0,
    stillOffGreen: 0,
  };

  let proximityTotal = 0;
  let onGreenCount = 0;
  let remainingMissTotal = 0;
  let offGreenCount = 0;

  for (const outcome of outcomes) {
    if (outcome.onGreen) {
      buckets.onGreen += 1;
      proximityTotal += outcome.proximityFeet;
      onGreenCount += 1;
    } else {
      buckets.stillOffGreen += 1;
      remainingMissTotal += outcome.remainingMissYards ?? 0;
      offGreenCount += 1;
    }
  }

  const averageProximityFeet =
    onGreenCount > 0 ? proximityTotal / onGreenCount : 0;

  return {
    golferId: golfer.id,
    holeId: hole.id,
    trials,
    greenHitRate: onGreenCount / trials,
    averageProximityFeet,
    averageFirstPuttDistanceFeet: averageProximityFeet,
    averageRemainingMissYards:
      offGreenCount > 0 ? remainingMissTotal / offGreenCount : 0,
    lie,
    averageMissDistanceYards: missDistanceYards,
    outcomeDistribution: {
      onGreen: buckets.onGreen / trials,
      stillOffGreen: buckets.stillOffGreen / trials,
    },
  };
}
