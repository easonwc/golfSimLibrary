import type { Golfer, GolferGender } from "../types/index.js";
import { resolveGolferGender } from "./gender-distance.js";
import { dispersionScale, puttingMakeRateScale } from "./skill.js";

/**
 * Gender-specific performance calibration multipliers applied at skill 99.
 * Male values are 1.0 (PGA Tour anchors). Female values tune LPGA anchors on
 * the same PGA-length sample course.
 */
export const GENDER_PERFORMANCE_CALIBRATION = {
  male: {
    dispersion: 1,
    teeLateralDispersion: 1,
    onGreenProximity: 1,
    puttingMakeRate: 1,
    shortGameContactRate: 1,
  },
  female: {
    /** Tighter full-shot dispersion to offset longer approach yardages. */
    dispersion: 0.76,
    /** Tighter driver lateral dispersion for LPGA fairway accuracy. */
    teeLateralDispersion: 0.78,
    /** Longer first putts when the approach finds the green. */
    onGreenProximity: 1.38,
    /** Lower holing rates to reach ~28.5 putts/round at elite LPGA GIR. */
    puttingMakeRate: 0.88,
    /** Higher greenside contact for LPGA scramble rates. */
    shortGameContactRate: 1.28,
  },
} as const satisfies Record<
  GolferGender,
  {
    dispersion: number;
    teeLateralDispersion: number;
    onGreenProximity: number;
    puttingMakeRate: number;
    shortGameContactRate: number;
  }
>;

function calibrationForGender(gender: GolferGender) {
  return GENDER_PERFORMANCE_CALIBRATION[gender];
}

/** Dispersion scale adjusted for gender calibration. */
export function genderDispersionScale(
  skill: number,
  gender: GolferGender = "male",
): number {
  return dispersionScale(skill) * calibrationForGender(gender).dispersion;
}

/** Putting make-rate scale adjusted for gender calibration. */
export function genderPuttingMakeRateScale(
  skill: number,
  gender: GolferGender = "male",
): number {
  return puttingMakeRateScale(skill) * calibrationForGender(gender).puttingMakeRate;
}

/** Tee lateral dispersion multiplier for gender calibration. */
export function genderTeeLateralDispersionMultiplier(
  gender: GolferGender = "male",
): number {
  return calibrationForGender(gender).teeLateralDispersion;
}

/** On-green approach proximity multiplier (higher = longer first putts). */
export function genderOnGreenProximityMultiplier(
  gender: GolferGender = "male",
): number {
  return calibrationForGender(gender).onGreenProximity;
}

/** Short-game green contact rate multiplier at elite skill. */
export function genderShortGameContactRateMultiplier(
  gender: GolferGender = "male",
): number {
  return calibrationForGender(gender).shortGameContactRate;
}

/** Resolves gender from a golfer for performance calibration. */
export function performanceGender(golfer: Golfer): GolferGender {
  return resolveGolferGender(golfer);
}
