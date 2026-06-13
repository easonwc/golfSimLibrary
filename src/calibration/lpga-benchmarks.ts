import type { GolferGender } from "../types/index.js";
import { applyGenderDistanceOffset } from "./gender-distance.js";
import {
  CALIBRATION_TOLERANCE,
  PGA_TOUR_ELITE_BENCHMARKS,
} from "./pga-benchmarks.js";

/**
 * LPGA Tour anchor statistics for a golfer rated 99 across relevant attributes.
 * Driving distance uses the male PGA anchor minus the gender carry gap (~40 yds).
 */
export const LPGA_TOUR_ELITE_BENCHMARKS = {
  /** Elite LPGA putters average ~28.5 putts per 18 holes (tour leaders ~28.6). */
  puttsPerRound: 28.5,
  /** Elite LPGA ball-strikers hit ~77% of greens in regulation. */
  greenInRegulationRate: 0.77,
  /** Elite LPGA drivers find ~83% of fairways on par 4/5 holes. */
  fairwayHitRate: 0.83,
  /** Vare Trophy–level scoring on a par-72 tour-style course (~69.5). */
  scoreRelativeToPar72: -2.5,
  /** Elite LPGA driving distance (gender-adjusted from PGA anchor). */
  drivingDistanceYards: applyGenderDistanceOffset(
    PGA_TOUR_ELITE_BENCHMARKS.drivingDistanceYards,
    PGA_TOUR_ELITE_BENCHMARKS.drivingDistanceYards,
    "female",
  ),
  /** Greenside scramble success when missing the green in regulation. */
  scrambleRate: 0.76,
} as const;

/** Acceptable simulation tolerance when validating elite female (99) calibration. */
export const LPGA_CALIBRATION_TOLERANCE = {
  puttsPerRound: 1.5,
  greenInRegulationRate: 0.06,
  fairwayHitRate: 0.06,
  scoreRelativeToPar72: 2.5,
  scrambleRateWhenMissedGir: 0.08,
  drivingDistanceYards: 10,
} as const;

export type EliteTourBenchmarks =
  | typeof PGA_TOUR_ELITE_BENCHMARKS
  | typeof LPGA_TOUR_ELITE_BENCHMARKS;

export type CalibrationTolerance =
  | typeof CALIBRATION_TOLERANCE
  | typeof LPGA_CALIBRATION_TOLERANCE;

/** Returns PGA or LPGA elite anchors for the given gender. */
export function eliteBenchmarksForGender(
  gender: GolferGender = "male",
): EliteTourBenchmarks {
  return gender === "female"
    ? LPGA_TOUR_ELITE_BENCHMARKS
    : PGA_TOUR_ELITE_BENCHMARKS;
}

/** Returns calibration tolerances for the given gender. */
export function calibrationToleranceForGender(
  gender: GolferGender = "male",
): CalibrationTolerance {
  return gender === "female"
    ? LPGA_CALIBRATION_TOLERANCE
    : CALIBRATION_TOLERANCE;
}
