import { ROUND_HOLE_COUNT } from "../types/index.js";
import type {
  CompleteHole,
  Course,
  HoleApproachAttributes,
  HoleGreenAttributes,
  HoleShortGameAttributes,
  HoleTeeShotAttributes,
} from "../types/index.js";
import { createRandomSource, type RandomSource } from "./random.js";

export type CourseDifficulty = "easy" | "medium" | "hard";

export interface GenerateRandomCourseOptions {
  /** Number of par-3 holes on the course. */
  parThrees: number;
  /** Number of par-5 holes on the course. */
  parFives: number;
  /** Course difficulty skew (default `"medium"`). */
  difficulty?: CourseDifficulty;
  /** Optional seed for reproducible course generation. */
  seed?: number;
  /** Prefix for generated hole ids (default `"hole"`). */
  idPrefix?: string;
}

interface DifficultyProfile {
  parThreeLength: [number, number];
  parFourLength: [number, number];
  parFiveLength: [number, number];
  greenSize: [number, number];
  greenSpeed: [number, number];
}

const DIFFICULTY_PROFILES: Record<CourseDifficulty, DifficultyProfile> = {
  easy: {
    parThreeLength: [120, 200],
    parFourLength: [320, 420],
    parFiveLength: [500, 560],
    greenSize: [4_800, 6_200],
    greenSpeed: [8, 11],
  },
  medium: {
    parThreeLength: [120, 240],
    parFourLength: [320, 470],
    parFiveLength: [500, 620],
    greenSize: [3_200, 6_200],
    greenSpeed: [8, 14],
  },
  hard: {
    parThreeLength: [170, 240],
    parFourLength: [380, 470],
    parFiveLength: [560, 620],
    greenSize: [3_200, 4_600],
    greenSpeed: [11, 14],
  },
};

function randomInt(random: RandomSource, min: number, max: number): number {
  return Math.floor(random.next() * (max - min + 1)) + min;
}

/**
 * Skews a 0–1 sample by difficulty. When `higherIsHarder` is true, easy courses
 * bias low and hard courses bias high (e.g. bunkers, slope). When false, the
 * direction is reversed (e.g. fairway width — wider is easier).
 */
function skewedUnit(
  random: RandomSource,
  difficulty: CourseDifficulty,
  higherIsHarder: boolean,
): number {
  const unit = random.next();

  if (difficulty === "medium") {
    return Math.round(unit * 100) / 100;
  }

  let value: number;
  if (difficulty === "easy") {
    value = higherIsHarder ? unit * unit : 1 - (1 - unit) * (1 - unit);
  } else {
    value = higherIsHarder
      ? 1 - (1 - unit) * (1 - unit)
      : unit * unit;
  }

  return Math.round(value * 100) / 100;
}

function shuffleInPlace<T>(items: T[], random: RandomSource): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
}

function buildParLayout(
  parThrees: number,
  parFives: number,
): Array<3 | 4 | 5> {
  const parFours = ROUND_HOLE_COUNT - parThrees - parFives;
  if (parFours < 0) {
    throw new RangeError(
      `parThrees (${parThrees}) + parFives (${parFives}) exceeds ${ROUND_HOLE_COUNT} holes`,
    );
  }

  const pars: Array<3 | 4 | 5> = [];
  for (let i = 0; i < parThrees; i += 1) {
    pars.push(3);
  }
  for (let i = 0; i < parFives; i += 1) {
    pars.push(5);
  }
  for (let i = 0; i < parFours; i += 1) {
    pars.push(4);
  }

  return pars;
}

function randomLengthYards(
  random: RandomSource,
  par: 3 | 4 | 5,
  profile: DifficultyProfile,
): number {
  if (par === 3) {
    return randomInt(random, ...profile.parThreeLength);
  }
  if (par === 5) {
    return randomInt(random, ...profile.parFiveLength);
  }
  return randomInt(random, ...profile.parFourLength);
}

function randomGreenAttributes(
  random: RandomSource,
  difficulty: CourseDifficulty,
  profile: DifficultyProfile,
): HoleGreenAttributes {
  return {
    sizeSqFt: randomInt(random, ...profile.greenSize),
    speed: randomInt(random, ...profile.greenSpeed),
    slope: skewedUnit(random, difficulty, true),
    pinDifficulty: skewedUnit(random, difficulty, true),
  };
}

function randomApproachAttributes(
  random: RandomSource,
  difficulty: CourseDifficulty,
): HoleApproachAttributes {
  return {
    landingDifficulty: skewedUnit(random, difficulty, true),
    elevationPenalty: skewedUnit(random, difficulty, true),
  };
}

function randomShortGameAttributes(
  random: RandomSource,
  difficulty: CourseDifficulty,
): HoleShortGameAttributes {
  return {
    roughDifficulty: skewedUnit(random, difficulty, true),
    bunkerDifficulty: skewedUnit(random, difficulty, true),
    collectionDifficulty: skewedUnit(random, difficulty, true),
  };
}

function randomTeeShotAttributes(
  random: RandomSource,
  difficulty: CourseDifficulty,
): HoleTeeShotAttributes {
  return {
    fairwayWidth: skewedUnit(random, difficulty, false),
    roughDifficulty: skewedUnit(random, difficulty, true),
    hazardDifficulty: skewedUnit(random, difficulty, true),
  };
}

function randomCompleteHole(
  random: RandomSource,
  id: string,
  number: number,
  par: 3 | 4 | 5,
  difficulty: CourseDifficulty,
  profile: DifficultyProfile,
): CompleteHole {
  const hole: CompleteHole = {
    id,
    number,
    par,
    lengthYards: randomLengthYards(random, par, profile),
    green: randomGreenAttributes(random, difficulty, profile),
    approach: randomApproachAttributes(random, difficulty),
    shortGame: randomShortGameAttributes(random, difficulty),
  };

  if (par === 4 || par === 5) {
    hole.teeShot = randomTeeShotAttributes(random, difficulty);
  }

  return hole;
}

function averageHoleHardness(hole: CompleteHole): number {
  const hardnessValues = [
    hole.green.slope,
    hole.green.pinDifficulty,
    hole.approach.landingDifficulty,
    hole.approach.elevationPenalty,
    hole.shortGame.roughDifficulty,
    hole.shortGame.bunkerDifficulty,
    hole.shortGame.collectionDifficulty,
  ];

  if (hole.teeShot) {
    hardnessValues.push(hole.teeShot.roughDifficulty, hole.teeShot.hazardDifficulty);
    hardnessValues.push(1 - hole.teeShot.fairwayWidth);
  }

  return (
    hardnessValues.reduce((sum, value) => sum + value, 0) / hardnessValues.length
  );
}

/**
 * Generates a random 18-hole course with the requested par-3 and par-5 counts.
 * Remaining holes are par 4. Hole attributes are randomized within valid ranges
 * and skewed by `difficulty` (default `"medium"`).
 *
 * ```typescript
 * const course = generateRandomCourse({
 *   parThrees: 4,
 *   parFives: 4,
 *   difficulty: "hard",
 *   seed: 42,
 * });
 * ```
 */
export function generateRandomCourse(
  options: GenerateRandomCourseOptions,
): Course {
  const {
    parThrees,
    parFives,
    seed,
    idPrefix = "hole",
    difficulty = "medium",
  } = options;

  if (!Number.isInteger(parThrees) || parThrees < 0) {
    throw new RangeError("parThrees must be a non-negative integer");
  }
  if (!Number.isInteger(parFives) || parFives < 0) {
    throw new RangeError("parFives must be a non-negative integer");
  }
  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") {
    throw new RangeError('difficulty must be "easy", "medium", or "hard"');
  }

  const random = createRandomSource(seed);
  const profile = DIFFICULTY_PROFILES[difficulty];
  const pars = buildParLayout(parThrees, parFives);
  shuffleInPlace(pars, random);

  return pars.map((par, index) =>
    randomCompleteHole(
      random,
      `${idPrefix}-${index + 1}`,
      index + 1,
      par,
      difficulty,
      profile,
    ),
  );
}

export function countPars(course: Course): {
  parThrees: number;
  parFours: number;
  parFives: number;
} {
  return course.reduce(
    (counts, hole) => {
      if (hole.par === 3) {
        counts.parThrees += 1;
      } else if (hole.par === 5) {
        counts.parFives += 1;
      } else {
        counts.parFours += 1;
      }
      return counts;
    },
    { parThrees: 0, parFours: 0, parFives: 0 },
  );
}

/** Average composite hole hardness for comparing generated courses. */
export function averageCourseHardness(course: Course): number {
  const total = course.reduce(
    (sum, hole) => sum + averageHoleHardness(hole),
    0,
  );
  return total / course.length;
}
