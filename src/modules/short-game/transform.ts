import { ValidationError } from "../../errors.js";
import { resolveClubAttributes } from "../../clubs/index.js";
import {
  dispersionScale,
  scaleRateToSkill,
} from "../../calibration/index.js";
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
  rough: 1.18,
  bunker: 1.35,
  deepRough: 1.48,
};

/** Elite tour green contact rates by lie at skill 99. */
const ELITE_CONTACT_RATE: Record<ShortGameLie, number> = {
  fringe: 0.93,
  rough: 0.84,
  bunker: 0.74,
  deepRough: 0.68,
};

/** Elite tour short game proximity dispersion at ~12 yards (feet). */
const ELITE_SHORT_GAME_RADIAL_SIGMA_FEET = 3.6;

/** Elite chip proximity to the hole once the green is reached (~5 ft average). */
const ELITE_CHIP_ON_GREEN_PROXIMITY_SIGMA_FEET = 3.0;

function chipOnGreenProximityFeet(golfer: Golfer, random: RandomSource): number {
  const skill = blendedShortGameSkill(golfer, 12, "fringe");
  const sigma =
    ELITE_CHIP_ON_GREEN_PROXIMITY_SIGMA_FEET * dispersionScale(skill);
  const depthFeet = gaussianRandom(random, 0, sigma);
  const lateralFeet = gaussianRandom(random, 0, sigma);
  return Math.max(1, Math.sqrt(depthFeet ** 2 + lateralFeet ** 2));
}

function requireShortGame(golfer: Golfer): GolferShortGameAttributes {
  if (!golfer.shortGame) {
    throw new ValidationError("golfer.shortGame must be an object");
  }
  return golfer.shortGame;
}

function blendedShortGameSkill(
  golfer: Golfer,
  missDistanceYards: number,
  lie: ShortGameLie,
): number {
  const shortGame = requireShortGame(golfer);
  const wedge = resolveClubAttributes(golfer).wedge;

  if (lie === "bunker") {
    return (
      shortGame.bunkerPlay * 0.5 + shortGame.shortGame * 0.25 + wedge * 0.25
    );
  }

  if (missDistanceYards <= 15) {
    return shortGame.chipping * 0.45 + shortGame.shortGame * 0.25 + wedge * 0.3;
  }

  if (missDistanceYards >= 25) {
    return (
      shortGame.pitching * 0.4 + shortGame.shortGame * 0.25 + wedge * 0.35
    );
  }

  return (
    shortGame.shortGame * 0.3 +
    shortGame.chipping * 0.25 +
    shortGame.pitching * 0.15 +
    wedge * 0.3
  );
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

  const skill = blendedShortGameSkill(golfer, missDistanceYards, lie);
  const eliteRate = ELITE_CONTACT_RATE[lie];
  let rate = scaleRateToSkill(skill, eliteRate, eliteRate * 0.55);

  rate -= Math.max(0, missDistanceYards - 20) * 0.008;
  rate -= holeShortGame.roughDifficulty * 0.05;
  rate -= holeShortGame.collectionDifficulty * 0.04;
  if (lie === "bunker") {
    rate -= holeShortGame.bunkerDifficulty * 0.08;
  }

  return Math.min(0.95, Math.max(0.08, rate));
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

  const liePenalty = LIE_PENALTY[lie];
  const roughPenalty = 1 + holeShortGame.roughDifficulty * 0.08;
  const collectionPenalty = 1 + holeShortGame.collectionDifficulty * 0.06;
  const pinPenalty = 1 + hole.green.pinDifficulty * 0.08;

  return (
    ELITE_SHORT_GAME_RADIAL_SIGMA_FEET *
    distanceScale *
    dispersionScale(skill) *
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

  return { onGreen: true, proximityFeet: chipOnGreenProximityFeet(golfer, random) };
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
