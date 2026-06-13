import type {
  AbilityRating,
  GolferApproachAttributes,
  GolferClubAttributes,
  GolferGender,
  GolferPuttingAttributes,
  GolferShortGameAttributes,
  GolferTeeShotAttributes,
} from "../types/index.js";
import { createRandomSource, type RandomSource } from "./random.js";

/** Simulation skill groups with required gender; add `id` and optional `name`. */
export interface GolferSkillAttributes {
  gender: GolferGender;
  putting: GolferPuttingAttributes;
  approach: GolferApproachAttributes;
  shortGame: GolferShortGameAttributes;
  clubs: GolferClubAttributes;
  teeShot: GolferTeeShotAttributes;
}

export interface GenerateRandomGolferOptions {
  /** Required — drives distance and LPGA/PGA calibration behavior. */
  gender: GolferGender;
  /** Optional seed for reproducible attribute generation. */
  seed?: number;
}

function randomRating(random: RandomSource): AbilityRating {
  return Math.floor(random.next() * 100);
}

function randomPuttingAttributes(random: RandomSource): GolferPuttingAttributes {
  return {
    putting: randomRating(random),
    shortPutting: randomRating(random),
    lagPutting: randomRating(random),
  };
}

function randomApproachAttributes(random: RandomSource): GolferApproachAttributes {
  return {
    approach: randomRating(random),
    accuracy: randomRating(random),
    distanceControl: randomRating(random),
    dispersion: randomRating(random),
  };
}

function randomShortGameAttributes(
  random: RandomSource,
): GolferShortGameAttributes {
  return {
    shortGame: randomRating(random),
    chipping: randomRating(random),
    bunkerPlay: randomRating(random),
    pitching: randomRating(random),
  };
}

function randomClubAttributes(random: RandomSource): GolferClubAttributes {
  return {
    driver: randomRating(random),
    wood: randomRating(random),
    longIron: randomRating(random),
    midIron: randomRating(random),
    shortIron: randomRating(random),
    wedge: randomRating(random),
  };
}

function randomTeeShotAttributes(random: RandomSource): GolferTeeShotAttributes {
  return {
    driving: randomRating(random),
    distance: randomRating(random),
    accuracy: randomRating(random),
    dispersion: randomRating(random),
  };
}

/**
 * Generates one set of golfer skill attributes (0–99 per field).
 * Spread into your own object alongside identity fields:
 *
 * ```typescript
 * const player = {
 *   id: "p-1",
 *   name: "Alex",
 *   ...generateRandomGolferAttributes({ gender: "female", seed: 42 }),
 * };
 * ```
 */
export function generateRandomGolferAttributes(
  options: GenerateRandomGolferOptions,
): GolferSkillAttributes {
  const random = createRandomSource(options.seed);

  return {
    gender: options.gender,
    putting: randomPuttingAttributes(random),
    approach: randomApproachAttributes(random),
    shortGame: randomShortGameAttributes(random),
    clubs: randomClubAttributes(random),
    teeShot: randomTeeShotAttributes(random),
  };
}

/**
 * Generates multiple independent skill attribute objects (0–99 per field).
 * Each golfer uses a derived seed when `seed` is provided.
 */
export function generateRandomGolfers(
  count: number,
  options: GenerateRandomGolferOptions,
): GolferSkillAttributes[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("count must be a positive integer");
  }

  const golfers: GolferSkillAttributes[] = [];
  for (let index = 0; index < count; index += 1) {
    const seed =
      options.seed === undefined ? undefined : options.seed + index * 10_007;
    golfers.push(generateRandomGolferAttributes({ ...options, seed }));
  }

  return golfers;
}
