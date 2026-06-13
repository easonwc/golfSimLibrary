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

export interface GenerateRandomCourseOptions {
  /** Number of par-3 holes on the course. */
  parThrees: number;
  /** Number of par-5 holes on the course. */
  parFives: number;
  /** Optional seed for reproducible course generation. */
  seed?: number;
  /** Prefix for generated hole ids (default `"hole"`). */
  idPrefix?: string;
}

const PAR_THREE_LENGTH: [number, number] = [120, 240];
const PAR_FOUR_LENGTH: [number, number] = [320, 470];
const PAR_FIVE_LENGTH: [number, number] = [500, 620];

function randomInt(random: RandomSource, min: number, max: number): number {
  return Math.floor(random.next() * (max - min + 1)) + min;
}

function randomUnit(random: RandomSource): number {
  return Math.round(random.next() * 100) / 100;
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

function randomLengthYards(random: RandomSource, par: 3 | 4 | 5): number {
  if (par === 3) {
    return randomInt(random, ...PAR_THREE_LENGTH);
  }
  if (par === 5) {
    return randomInt(random, ...PAR_FIVE_LENGTH);
  }
  return randomInt(random, ...PAR_FOUR_LENGTH);
}

function randomGreenAttributes(random: RandomSource): HoleGreenAttributes {
  return {
    sizeSqFt: randomInt(random, 3_200, 6_200),
    speed: randomInt(random, 8, 14),
    slope: randomUnit(random),
    pinDifficulty: randomUnit(random),
  };
}

function randomApproachAttributes(random: RandomSource): HoleApproachAttributes {
  return {
    landingDifficulty: randomUnit(random),
    elevationPenalty: randomUnit(random),
  };
}

function randomShortGameAttributes(
  random: RandomSource,
): HoleShortGameAttributes {
  return {
    roughDifficulty: randomUnit(random),
    bunkerDifficulty: randomUnit(random),
    collectionDifficulty: randomUnit(random),
  };
}

function randomTeeShotAttributes(random: RandomSource): HoleTeeShotAttributes {
  return {
    fairwayWidth: randomUnit(random),
    roughDifficulty: randomUnit(random),
    hazardDifficulty: randomUnit(random),
  };
}

function randomCompleteHole(
  random: RandomSource,
  id: string,
  number: number,
  par: 3 | 4 | 5,
): CompleteHole {
  const hole: CompleteHole = {
    id,
    number,
    par,
    lengthYards: randomLengthYards(random, par),
    green: randomGreenAttributes(random),
    approach: randomApproachAttributes(random),
    shortGame: randomShortGameAttributes(random),
  };

  if (par === 4 || par === 5) {
    hole.teeShot = randomTeeShotAttributes(random);
  }

  return hole;
}

/**
 * Generates a random 18-hole course with the requested par-3 and par-5 counts.
 * Remaining holes are par 4. All hole difficulty attributes are randomized
 * within simulation-valid ranges.
 *
 * ```typescript
 * const course = generateRandomCourse({ parThrees: 4, parFives: 4, seed: 42 });
 * simulateRound({ course, golfers: [tourPro], trials: 1000 });
 * ```
 */
export function generateRandomCourse(
  options: GenerateRandomCourseOptions,
): Course {
  const { parThrees, parFives, seed, idPrefix = "hole" } = options;

  if (!Number.isInteger(parThrees) || parThrees < 0) {
    throw new RangeError("parThrees must be a non-negative integer");
  }
  if (!Number.isInteger(parFives) || parFives < 0) {
    throw new RangeError("parFives must be a non-negative integer");
  }

  const random = createRandomSource(seed);
  const pars = buildParLayout(parThrees, parFives);
  shuffleInPlace(pars, random);

  return pars.map((par, index) =>
    randomCompleteHole(
      random,
      `${idPrefix}-${index + 1}`,
      index + 1,
      par,
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
