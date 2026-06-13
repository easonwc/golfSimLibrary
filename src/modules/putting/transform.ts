import { ValidationError } from "../../errors.js";
import { dispersionScale, puttingMakeRateScale } from "../../calibration/index.js";
import type { Golfer, GolferPuttingAttributes, Hole } from "../../types/index.js";
import type { PuttingDistribution, PuttingStats, RandomSource } from "./types.js";

function requirePutting(golfer: Golfer): GolferPuttingAttributes {
  if (!golfer.putting) {
    throw new ValidationError("golfer.putting must be an object");
  }
  return golfer.putting;
}

/** PGA Tour baseline first-putt make rate by distance (feet) at skill 99. */
const TOUR_MAKE_RATE_BY_DISTANCE: ReadonlyArray<[number, number]> = [
  [2, 0.99],
  [3, 0.96],
  [4, 0.88],
  [5, 0.77],
  [6, 0.66],
  [8, 0.5],
  [10, 0.4],
  [12, 0.33],
  [15, 0.23],
  [20, 0.15],
  [25, 0.1],
  [30, 0.07],
  [40, 0.04],
  [50, 0.025],
  [60, 0.015],
];

function interpolateTourMakeRate(distanceFeet: number): number {
  const clamped = Math.max(1, Math.min(distanceFeet, 60));
  const table = TOUR_MAKE_RATE_BY_DISTANCE;

  if (clamped <= table[0][0]) {
    return table[0][1];
  }

  for (let i = 1; i < table.length; i++) {
    const [d1, p1] = table[i - 1];
    const [d2, p2] = table[i];
    if (clamped <= d2) {
      const t = (clamped - d1) / (d2 - d1);
      return p1 + t * (p2 - p1);
    }
  }

  return table[table.length - 1][1];
}

function blendedPuttingSkill(
  putting: GolferPuttingAttributes,
  distanceFeet: number,
): number {
  if (distanceFeet <= 6) {
    return putting.putting * 0.35 + putting.shortPutting * 0.65;
  }
  if (distanceFeet >= 20) {
    return putting.putting * 0.35 + putting.lagPutting * 0.65;
  }
  return putting.putting;
}

function greenDifficultyPenalty(hole: Hole): number {
  const { speed, slope, pinDifficulty } = hole.green;
  const speedFactor = Math.max(0, (speed - 10) / 6) * 0.08;
  const slopeFactor = slope * 0.12;
  const pinFactor = pinDifficulty * 0.06;
  return speedFactor + slopeFactor + pinFactor;
}

function effectivePuttDistance(
  distanceFeet: number,
  hole: Hole,
): number {
  const pinStretch = 1 + hole.green.pinDifficulty * 0.15;
  const slopeStretch = 1 + hole.green.slope * 0.1;
  return distanceFeet * pinStretch * slopeStretch;
}

export function makeRateAtDistance(
  distanceFeet: number,
  golfer: Golfer,
  hole: Hole,
): number {
  const effectiveDistance = effectivePuttDistance(distanceFeet, hole);
  const tourRate = interpolateTourMakeRate(effectiveDistance);
  const putting = requirePutting(golfer);
  const skill = blendedPuttingSkill(putting, distanceFeet);

  let rate = tourRate * puttingMakeRateScale(skill);
  rate *= 1 - greenDifficultyPenalty(hole);
  return Math.min(0.995, Math.max(0.005, rate));
}

export function estimateFirstPuttDistanceFeet(hole: Hole): number {
  const parBaselines: Record<3 | 4 | 5, number> = {
    3: 22,
    4: 28,
    5: 32,
  };

  const parBaseline = parBaselines[hole.par];
  const standardLengths: Record<3 | 4 | 5, number> = {
    3: 180,
    4: 420,
    5: 540,
  };

  const lengthRatio = hole.lengthYards / standardLengths[hole.par];
  const lengthAdjustment = (lengthRatio - 1) * 8;

  const smallGreen = hole.green.sizeSqFt < 4_000 ? 3 : 0;
  const pinAdjustment = hole.green.pinDifficulty * 6;

  return Math.min(
    80,
    Math.max(8, parBaseline + lengthAdjustment + smallGreen + pinAdjustment),
  );
}

function leaveDistanceAfterMiss(
  attemptDistanceFeet: number,
  golfer: Golfer,
  hole: Hole,
  random: RandomSource,
): number {
  const lagSkill = requirePutting(golfer).lagPutting;
  const lagScale = dispersionScale(lagSkill);
  const speedFactor = hole.green.speed / 10;

  if (attemptDistanceFeet <= 6) {
    const baseLeave = 1.2 + random.next() * 1.6;
    return baseLeave * (0.75 + lagScale * 0.35);
  }

  const targetLeaveRatio = 0.032 + lagScale * 0.038;
  const noise = 0.7 + random.next() * 0.6;
  const leave = attemptDistanceFeet * targetLeaveRatio * noise * speedFactor;
  return Math.max(1.5, Math.min(leave, attemptDistanceFeet * 0.5));
}

export function simulatePuttsOnGreen(
  firstPuttDistanceFeet: number,
  golfer: Golfer,
  hole: Hole,
  random: RandomSource,
  maxPutts = 6,
): number {
  let putts = 0;
  let distance = firstPuttDistanceFeet;

  while (putts < maxPutts) {
    putts += 1;
    const makeRate = makeRateAtDistance(distance, golfer, hole);

    if (random.next() < makeRate) {
      return putts;
    }

    distance = leaveDistanceAfterMiss(distance, golfer, hole, random);
  }

  return maxPutts;
}

export function aggregatePuttingStats(
  golfer: Golfer,
  hole: Hole,
  puttCounts: number[],
  firstPuttDistanceFeet: number,
  trials: number,
): PuttingStats {
  const buckets = { one: 0, two: 0, three: 0, fourPlus: 0 };

  for (const count of puttCounts) {
    if (count <= 1) buckets.one += 1;
    else if (count === 2) buckets.two += 1;
    else if (count === 3) buckets.three += 1;
    else buckets.fourPlus += 1;
  }

  const totalPutts = puttCounts.reduce((sum, n) => sum + n, 0);
  const distribution: PuttingDistribution = {
    onePutt: buckets.one / trials,
    twoPutt: buckets.two / trials,
    threePutt: buckets.three / trials,
    fourPlusPutt: buckets.fourPlus / trials,
  };

  return {
    golferId: golfer.id,
    holeId: hole.id,
    expectedPutts: totalPutts / trials,
    distribution,
    averageFirstPuttDistanceFeet: firstPuttDistanceFeet,
    firstPuttMakeRate: makeRateAtDistance(firstPuttDistanceFeet, golfer, hole),
    trials,
  };
}
