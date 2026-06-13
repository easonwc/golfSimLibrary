import {
  assertFiniteNumber,
  ValidationError,
} from "../../errors.js";
import type { CompleteGolfer, Course } from "../../types/index.js";
import {
  MAX_HOLE_COMPOSER_GOLFERS,
  MIN_HOLE_COMPOSER_GOLFERS,
  ROUND_HOLE_COUNT,
} from "../../types/index.js";
import {
  validateCompleteGolfer,
  validateCompleteHole,
  DEFAULT_TRIALS,
  MIN_TRIALS,
  MAX_TRIALS,
} from "../hole-composer/validate.js";
import type { RoundComposerInput } from "./types.js";

function validateCourse(course: unknown): Course {
  if (!Array.isArray(course)) {
    throw new ValidationError("course must be an array");
  }

  if (course.length !== ROUND_HOLE_COUNT) {
    throw new ValidationError(
      `course must contain exactly ${ROUND_HOLE_COUNT} holes`,
    );
  }

  const holes = course.map((hole, index) =>
    validateCompleteHole(hole, `course[${index}]`),
  );

  const ids = new Set<string>();
  for (const hole of holes) {
    if (ids.has(hole.id)) {
      throw new ValidationError(`duplicate hole id "${hole.id}" in course`);
    }
    ids.add(hole.id);
  }

  return holes;
}

function validateGolfers(golfers: unknown, courseHasTeeShots: boolean): CompleteGolfer[] {
  if (!Array.isArray(golfers)) {
    throw new ValidationError("golfers must be an array");
  }

  if (golfers.length < MIN_HOLE_COMPOSER_GOLFERS) {
    throw new ValidationError(
      `golfers must contain at least ${MIN_HOLE_COMPOSER_GOLFERS} golfer`,
    );
  }

  if (golfers.length > MAX_HOLE_COMPOSER_GOLFERS) {
    throw new ValidationError(
      `golfers must contain at most ${MAX_HOLE_COMPOSER_GOLFERS} golfers`,
    );
  }

  const validated = golfers.map((golfer, index) =>
    validateCompleteGolfer(golfer, index, courseHasTeeShots),
  );

  const ids = new Set<string>();
  for (const golfer of validated) {
    if (ids.has(golfer.id)) {
      throw new ValidationError(
        `duplicate golfer id "${golfer.id}" in golfers array`,
      );
    }
    ids.add(golfer.id);
  }

  return validated;
}

export function validateRoundComposerInput(input: unknown): RoundComposerInput {
  if (input === null || typeof input !== "object") {
    throw new ValidationError("input must be an object");
  }

  const raw = input as Record<string, unknown>;
  const course = validateCourse(raw.course);
  const courseHasTeeShots = course.some((hole) => hole.par === 4 || hole.par === 5);
  const golfers = validateGolfers(raw.golfers, courseHasTeeShots);

  let trials = DEFAULT_TRIALS;
  if (raw.trials !== undefined) {
    trials = assertFiniteNumber(raw.trials, "trials", {
      min: MIN_TRIALS,
      max: MAX_TRIALS,
    });
    if (!Number.isInteger(trials)) {
      throw new ValidationError("trials must be an integer");
    }
  }

  let seed: number | undefined;
  if (raw.seed !== undefined) {
    seed = assertFiniteNumber(raw.seed, "seed");
    if (!Number.isInteger(seed)) {
      throw new ValidationError("seed must be an integer");
    }
  }

  return { course, golfers, trials, seed };
}

export { DEFAULT_TRIALS, MIN_TRIALS, MAX_TRIALS };
