import { ValidationError } from "../../errors.js";
import { approachClubSkill } from "../../clubs/index.js";
import {
  blendedRelativeSkill,
  genderDispersionScale,
  genderOnGreenProximityMultiplier,
  performanceGender,
} from "../../calibration/index.js";
import type { Golfer, GolferApproachAttributes, Hole } from "../../types/index.js";
import { gaussianRandom, type RandomSource } from "../../utils/random.js";
import type {
  ApproachMissDirection,
  ApproachOutcomeDistribution,
  ApproachShotOutcome,
  ApproachStats,
  DispersionSigmas,
} from "./types.js";

const YARDS_TO_FEET = 3;

/** Elite tour approach dispersion at ~150 yards (yards) for green-hit detection. */
const ELITE_APPROACH_DEPTH_SIGMA_YARDS = 7.4;
const ELITE_APPROACH_LATERAL_SIGMA_YARDS = 8.6;

/** Elite proximity to pin when the green is hit (~14 ft average). */
const ELITE_ON_GREEN_PROXIMITY_SIGMA_FEET = 8.8;

function requireApproach(golfer: Golfer): GolferApproachAttributes {
  if (!golfer.approach) {
    throw new ValidationError("golfer.approach must be an object");
  }
  return golfer.approach;
}

const STANDARD_APPROACH_DISTANCES: Record<3 | 4 | 5, number> = {
  3: 0,
  4: 165,
  5: 185,
};
const STANDARD_HOLE_LENGTHS: Record<3 | 4 | 5, number> = {
  3: 180,
  4: 420,
  5: 540,
};

export function greenRadiusFeet(hole: Hole): number {
  return Math.sqrt(hole.green.sizeSqFt / Math.PI);
}

export function effectiveGreenRadiusFeet(hole: Hole): number {
  const baseRadius = greenRadiusFeet(hole);
  const pinShrink = 1 - hole.green.pinDifficulty * 0.35;
  const slopeShrink = 1 - hole.green.slope * 0.08;
  return baseRadius * pinShrink * slopeShrink;
}

export function estimateRemainingDistanceYards(hole: Hole): number {
  if (hole.par === 3) {
    return hole.lengthYards;
  }

  const baseline = STANDARD_APPROACH_DISTANCES[hole.par];
  const lengthRatio = hole.lengthYards / STANDARD_HOLE_LENGTHS[hole.par];
  return Math.min(250, Math.max(40, baseline * lengthRatio));
}

export function calculateDispersionSigmas(
  golfer: Golfer,
  hole: Hole,
  approachDistanceYards: number,
): DispersionSigmas {
  const approach = requireApproach(golfer);
  const holeApproach = hole.approach;
  if (!holeApproach) {
    throw new ValidationError("hole.approach must be an object");
  }

  const distanceScale = Math.sqrt(approachDistanceYards / 150);
  const clubSkill = approachClubSkill(golfer, approachDistanceYards);
  const depthSkill = blendedRelativeSkill(
    clubSkill,
    approach.distanceControl,
    approach.approach,
  );
  const lateralSkill = blendedRelativeSkill(
    clubSkill,
    approach.accuracy,
    approach.dispersion,
    approach.approach,
  );

  const landingPenalty =
    1 + holeApproach.landingDifficulty * 0.18 + holeApproach.elevationPenalty * 0.1;

  const gender = performanceGender(golfer);

  return {
    depthYards:
      ELITE_APPROACH_DEPTH_SIGMA_YARDS *
      distanceScale *
      genderDispersionScale(depthSkill * 99, gender) *
      landingPenalty,
    lateralYards:
      ELITE_APPROACH_LATERAL_SIGMA_YARDS *
      distanceScale *
      genderDispersionScale(lateralSkill * 99, gender) *
      landingPenalty,
  };
}

function classifyMiss(
  depthErrorYards: number,
  lateralErrorYards: number,
): ApproachMissDirection {
  const depthFeet = Math.abs(depthErrorYards * YARDS_TO_FEET);
  const lateralFeet = Math.abs(lateralErrorYards * YARDS_TO_FEET);

  if (depthFeet >= lateralFeet) {
    return depthErrorYards < 0 ? "missShort" : "missLong";
  }

  return lateralErrorYards < 0 ? "missLeft" : "missRight";
}

function onGreenProximityFeet(
  golfer: Golfer,
  approachDistanceYards: number,
  random: RandomSource,
): number {
  const approach = requireApproach(golfer);
  const clubSkill = approachClubSkill(golfer, approachDistanceYards);
  const skill = blendedRelativeSkill(
    clubSkill,
    approach.approach,
    approach.accuracy,
    approach.dispersion,
    approach.distanceControl,
  );
  const gender = performanceGender(golfer);
  const sigma =
    ELITE_ON_GREEN_PROXIMITY_SIGMA_FEET *
    genderDispersionScale(skill * 99, gender) *
    genderOnGreenProximityMultiplier(gender);
  const depthFeet = gaussianRandom(random, 0, sigma);
  const lateralFeet = gaussianRandom(random, 0, sigma);
  return Math.max(1, Math.sqrt(depthFeet ** 2 + lateralFeet ** 2));
}

export function simulateApproachShot(
  golfer: Golfer,
  hole: Hole,
  approachDistanceYards: number,
  random: RandomSource,
): ApproachShotOutcome {
  const sigmas = calculateDispersionSigmas(golfer, hole, approachDistanceYards);
  const depthErrorYards = gaussianRandom(random, 0, sigmas.depthYards);
  const lateralErrorYards = gaussianRandom(random, 0, sigmas.lateralYards);

  const proximityFeet = Math.sqrt(
    (depthErrorYards * YARDS_TO_FEET) ** 2 +
      (lateralErrorYards * YARDS_TO_FEET) ** 2,
  );

  const onGreen = proximityFeet <= effectiveGreenRadiusFeet(hole);

  if (onGreen) {
    return {
      onGreen: true,
      proximityFeet: onGreenProximityFeet(
        golfer,
        approachDistanceYards,
        random,
      ),
      depthErrorYards,
      lateralErrorYards,
    };
  }

  return {
    onGreen: false,
    proximityFeet,
    missDirection: classifyMiss(depthErrorYards, lateralErrorYards),
    missDistanceYards: proximityFeet / YARDS_TO_FEET,
    depthErrorYards,
    lateralErrorYards,
  };
}

export function aggregateApproachStats(
  golfer: Golfer,
  hole: Hole,
  outcomes: ApproachShotOutcome[],
  approachDistanceYards: number,
  trials: number,
): ApproachStats {
  const buckets: ApproachOutcomeDistribution = {
    onGreen: 0,
    missShort: 0,
    missLong: 0,
    missLeft: 0,
    missRight: 0,
  };

  let proximityTotal = 0;
  let onGreenCount = 0;
  let missDistanceTotal = 0;
  let missCount = 0;

  for (const outcome of outcomes) {
    if (outcome.onGreen) {
      buckets.onGreen += 1;
      proximityTotal += outcome.proximityFeet;
      onGreenCount += 1;
    } else if (outcome.missDirection) {
      buckets[outcome.missDirection] += 1;
      missDistanceTotal += outcome.missDistanceYards ?? 0;
      missCount += 1;
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
    averageMissDistanceYards: missCount > 0 ? missDistanceTotal / missCount : 0,
    averageApproachDistanceYards: approachDistanceYards,
    outcomeDistribution: {
      onGreen: buckets.onGreen / trials,
      missShort: buckets.missShort / trials,
      missLong: buckets.missLong / trials,
      missLeft: buckets.missLeft / trials,
      missRight: buckets.missRight / trials,
    },
  };
}
