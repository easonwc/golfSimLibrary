import { ValidationError } from "../../errors.js";
import type {
  Golfer,
  GolferTeeShotAttributes,
  Hole,
  TeeShotLie,
} from "../../types/index.js";
import { gaussianRandom, type RandomSource } from "../../utils/random.js";
import type {
  TeeShotOutcome,
  TeeShotOutcomeDistribution,
  TeeShotStats,
} from "./types.js";

const MIN_REMAINING_DISTANCE_YARDS = 30;

function requireTeeShot(golfer: Golfer): GolferTeeShotAttributes {
  if (!golfer.teeShot) {
    throw new ValidationError("golfer.teeShot must be an object");
  }
  return golfer.teeShot;
}

function skillFactor(skill: number): number {
  return 1 - (skill / 100) * 0.55;
}

export function expectedDrivingDistanceYards(golfer: Golfer): number {
  const teeShot = requireTeeShot(golfer);
  const blendedDistance =
    teeShot.distance * 0.7 + teeShot.driving * 0.3;
  return 175 + (blendedDistance / 100) * 125;
}

export function calculateDrivingDistanceSigma(golfer: Golfer): number {
  const teeShot = requireTeeShot(golfer);
  const dispersionSkill =
    (skillFactor(teeShot.dispersion) + skillFactor(teeShot.distance)) / 2;
  return 8 + dispersionSkill * 14;
}

export function fairwayHalfWidthYards(hole: Hole): number {
  const holeTeeShot = hole.teeShot;
  if (!holeTeeShot) {
    throw new ValidationError("hole.teeShot must be an object");
  }

  return 12 + holeTeeShot.fairwayWidth * 18;
}

export function calculateLateralDispersionYards(
  golfer: Golfer,
  hole: Hole,
): number {
  const teeShot = requireTeeShot(golfer);
  const holeTeeShot = hole.teeShot;
  if (!holeTeeShot) {
    throw new ValidationError("hole.teeShot must be an object");
  }

  const accuracySkill =
    (skillFactor(teeShot.accuracy) + skillFactor(teeShot.dispersion)) / 2;
  const narrowPenalty = 1.35 - holeTeeShot.fairwayWidth * 0.35;

  return (10 + accuracySkill * 16) * narrowPenalty;
}

function classifyLie(
  lateralMissYards: number,
  hole: Hole,
  random: RandomSource,
): TeeShotLie {
  const holeTeeShot = hole.teeShot!;
  const halfWidth = fairwayHalfWidthYards(hole);

  if (Math.abs(lateralMissYards) <= halfWidth) {
    return "fairway";
  }

  const roughBuffer = 8 + holeTeeShot.roughDifficulty * 10;
  const missSeverity =
    (Math.abs(lateralMissYards) - halfWidth) / Math.max(roughBuffer, 1);

  const hazardThreshold = 0.85 + (1 - holeTeeShot.hazardDifficulty) * 0.8;
  if (
    missSeverity > hazardThreshold &&
    holeTeeShot.hazardDifficulty >= 0.25 &&
    random.next() < holeTeeShot.hazardDifficulty * 0.75 + 0.15
  ) {
    return "hazard";
  }

  return "rough";
}

export function recoveryPenaltyYards(lie: TeeShotLie, hole: Hole): number {
  const holeTeeShot = hole.teeShot;
  if (!holeTeeShot) {
    throw new ValidationError("hole.teeShot must be an object");
  }

  if (lie === "fairway") {
    return 0;
  }

  if (lie === "rough") {
    return 6 + holeTeeShot.roughDifficulty * 14;
  }

  return 18 + holeTeeShot.hazardDifficulty * 28;
}

export function calculateRemainingDistanceYards(
  hole: Hole,
  drivingDistanceYards: number,
  recoveryPenaltyYards: number,
): number {
  const raw =
    hole.lengthYards - drivingDistanceYards + recoveryPenaltyYards;
  return Math.min(
    280,
    Math.max(MIN_REMAINING_DISTANCE_YARDS, raw),
  );
}

export function simulateTeeShotDrive(
  golfer: Golfer,
  hole: Hole,
  random: RandomSource,
): TeeShotOutcome {
  const expectedDistance = expectedDrivingDistanceYards(golfer);
  const distanceSigma = calculateDrivingDistanceSigma(golfer);
  const drivingDistanceYards = Math.max(
    140,
    gaussianRandom(random, expectedDistance, distanceSigma),
  );

  const lateralSigma = calculateLateralDispersionYards(golfer, hole);
  const lateralMissYards = gaussianRandom(random, 0, lateralSigma);
  const lie = classifyLie(lateralMissYards, hole, random);
  const penalty = recoveryPenaltyYards(lie, hole);
  const remainingDistanceYards = calculateRemainingDistanceYards(
    hole,
    drivingDistanceYards,
    penalty,
  );

  return {
    lie,
    drivingDistanceYards,
    remainingDistanceYards,
    recoveryPenaltyYards: penalty,
    lateralMissYards,
  };
}

export function aggregateTeeShotStats(
  golfer: Golfer,
  hole: Hole,
  outcomes: TeeShotOutcome[],
  trials: number,
): TeeShotStats {
  const buckets: TeeShotOutcomeDistribution = {
    fairway: 0,
    rough: 0,
    hazard: 0,
  };

  let drivingTotal = 0;
  let remainingTotal = 0;
  let penaltyTotal = 0;

  for (const outcome of outcomes) {
    buckets[outcome.lie] += 1;
    drivingTotal += outcome.drivingDistanceYards;
    remainingTotal += outcome.remainingDistanceYards;
    penaltyTotal += outcome.recoveryPenaltyYards;
  }

  return {
    golferId: golfer.id,
    holeId: hole.id,
    trials,
    fairwayHitRate: buckets.fairway / trials,
    averageDrivingDistanceYards: drivingTotal / trials,
    averageRemainingDistanceYards: remainingTotal / trials,
    averageRecoveryPenaltyYards: penaltyTotal / trials,
    outcomeDistribution: {
      fairway: buckets.fairway / trials,
      rough: buckets.rough / trials,
      hazard: buckets.hazard / trials,
    },
  };
}
