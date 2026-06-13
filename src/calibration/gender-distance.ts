import type { Golfer, GolferGender } from "../types/index.js";

/** Male-baseline yardage where the gender carry gap is largest (driver range). */
export const GENDER_GAP_DRIVER_REFERENCE_YARDS = 280;

/** Male-baseline yardage where the gender carry gap is smallest (wedge range). */
export const GENDER_GAP_WEDGE_REFERENCE_YARDS = 115;

/** Female carry short of male at driver reference distance. */
export const GENDER_GAP_AT_DRIVER_YARDS = 40;

/** Female carry short of male at wedge / pitching-wedge reference distance. */
export const GENDER_GAP_AT_WEDGE_YARDS = 10;

/** Defaults to male when omitted (preserves PGA Tour calibration). */
export function resolveGolferGender(golfer: Golfer): GolferGender {
  return golfer.gender ?? "male";
}

/**
 * Carry gap (female shorter than male) at a given shot-context yardage.
 * Interpolates linearly from {@link GENDER_GAP_AT_WEDGE_YARDS} near the green
 * to {@link GENDER_GAP_AT_DRIVER_YARDS} off the tee.
 */
export function genderDistanceGapYards(
  shotDistanceYards: number,
  gender: GolferGender = "male",
): number {
  if (gender !== "female") {
    return 0;
  }

  const clamped = Math.max(
    GENDER_GAP_WEDGE_REFERENCE_YARDS,
    Math.min(GENDER_GAP_DRIVER_REFERENCE_YARDS, shotDistanceYards),
  );
  const span =
    GENDER_GAP_DRIVER_REFERENCE_YARDS - GENDER_GAP_WEDGE_REFERENCE_YARDS;
  const t =
    span > 0
      ? (clamped - GENDER_GAP_WEDGE_REFERENCE_YARDS) / span
      : 1;

  return (
    GENDER_GAP_AT_WEDGE_YARDS +
    (GENDER_GAP_AT_DRIVER_YARDS - GENDER_GAP_AT_WEDGE_YARDS) * t
  );
}

/**
 * Applies gender carry offset to a male-baseline expected distance.
 * Use `shotContextYards` for gap interpolation (typically the same as the
 * baseline distance being adjusted).
 */
export function applyGenderDistanceOffset(
  distanceYards: number,
  shotContextYards: number,
  gender: GolferGender = "male",
): number {
  return distanceYards - genderDistanceGapYards(shotContextYards, gender);
}
