import type { ApproachClubType,
  Golfer,
  GolferClubAttributes,
} from "../types/index.js";

const APPROACH_CLUB_ORDER: ApproachClubType[] = [
  "wood",
  "longIron",
  "midIron",
  "shortIron",
  "wedge",
];

/** Distance breakpoints (yards) where approach club weight shifts. */
const APPROACH_CLUB_BREAKPOINTS: ReadonlyArray<{
  distanceYards: number;
  club: ApproachClubType;
}> = [
  { distanceYards: 115, club: "wedge" },
  { distanceYards: 150, club: "shortIron" },
  { distanceYards: 185, club: "midIron" },
  { distanceYards: 220, club: "longIron" },
  { distanceYards: Number.POSITIVE_INFINITY, club: "wood" },
];

function clampRating(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Builds club ratings from legacy category attributes when `clubs` is omitted
 * (standalone module use). Full-hole simulation requires explicit `clubs`.
 */
export function deriveClubAttributes(golfer: Golfer): GolferClubAttributes {
  if (golfer.clubs) {
    return golfer.clubs;
  }

  const tee = golfer.teeShot;
  const approach = golfer.approach;
  const shortGame = golfer.shortGame;

  const driverBase = tee
    ? clampRating(tee.driving * 0.55 + tee.distance * 0.45)
    : 50;
  const woodBase = tee
    ? clampRating(
        tee.driving * 0.4 + tee.accuracy * 0.35 + tee.dispersion * 0.25,
      )
    : 50;
  const ironBase = approach
    ? clampRating(
        approach.approach * 0.35 +
          approach.accuracy * 0.25 +
          approach.distanceControl * 0.25 +
          approach.dispersion * 0.15,
      )
    : 50;
  const wedgeBase = shortGame
    ? clampRating(
        shortGame.chipping * 0.45 +
          shortGame.pitching * 0.35 +
          shortGame.shortGame * 0.2,
      )
    : ironBase;

  return {
    driver: driverBase,
    wood: clampRating(woodBase * 0.92 + driverBase * 0.08),
    longIron: clampRating(ironBase * 0.96),
    midIron: clampRating(ironBase * 1.02),
    shortIron: clampRating(ironBase * 1.04),
    wedge: wedgeBase,
  };
}

export function resolveClubAttributes(golfer: Golfer): GolferClubAttributes {
  return deriveClubAttributes(golfer);
}

function interpolateClubWeights(
  distanceYards: number,
): Record<ApproachClubType, number> {
  const clamped = Math.max(40, distanceYards);
  const weights = Object.fromEntries(
    APPROACH_CLUB_ORDER.map((club) => [club, 0]),
  ) as Record<ApproachClubType, number>;

  if (clamped <= APPROACH_CLUB_BREAKPOINTS[0].distanceYards) {
    weights.wedge = 1;
    return weights;
  }

  for (let i = 1; i < APPROACH_CLUB_BREAKPOINTS.length; i += 1) {
    const lower = APPROACH_CLUB_BREAKPOINTS[i - 1];
    const upper = APPROACH_CLUB_BREAKPOINTS[i];
    if (clamped <= upper.distanceYards) {
      const span = upper.distanceYards - lower.distanceYards;
      const t = span > 0 ? (clamped - lower.distanceYards) / span : 1;
      weights[lower.club] = 1 - t;
      weights[upper.club] = t;
      return weights;
    }
  }

  weights.wood = 1;
  return weights;
}

/** Weight of each approach club type at a given yardage (sums to 1). */
export function clubWeightsForApproachDistance(
  distanceYards: number,
): Record<ApproachClubType, number> {
  return interpolateClubWeights(distanceYards);
}

/** Blended club skill (0–100) for a full approach shot at the given yardage. */
export function approachClubSkill(
  golfer: Golfer,
  distanceYards: number,
): number {
  const clubs = resolveClubAttributes(golfer);
  const weights = clubWeightsForApproachDistance(distanceYards);

  return APPROACH_CLUB_ORDER.reduce(
    (total, club) => total + weights[club] * clubs[club],
    0,
  );
}

/** Creates uniform club ratings (e.g. all 99 for calibration). */
export function createUniformClubAttributes(
  rating: number,
): GolferClubAttributes {
  const clamped = clampRating(rating);
  return {
    driver: clamped,
    wood: clamped,
    longIron: clamped,
    midIron: clamped,
    shortIron: clamped,
    wedge: clamped,
  };
}
