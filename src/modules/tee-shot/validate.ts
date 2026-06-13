import {
  assertFiniteNumber,
  assertNonEmptyString,
  ValidationError,
} from "../../errors.js";
import { parseGolferProfileFields } from "../../validation/golfer-profile.js";
import type { Golfer, Hole } from "../../types/index.js";
import type { TeeShotInput } from "./types.js";

const DEFAULT_TRIALS = 5_000;
const MIN_TRIALS = 100;
const MAX_TRIALS = 100_000;

function validateAbility(value: unknown, field: string): number {
  return assertFiniteNumber(value, field, { min: 0, max: 100 });
}

function validateGolfer(golfer: unknown): Golfer {
  if (golfer === null || typeof golfer !== "object") {
    throw new ValidationError("golfer must be an object");
  }

  const g = golfer as Record<string, unknown>;
  const id = assertNonEmptyString(g.id, "golfer.id");

  if (g.teeShot === null || typeof g.teeShot !== "object") {
    throw new ValidationError("golfer.teeShot must be an object");
  }

  const teeShot = g.teeShot as Record<string, unknown>;

  return {
    id,
    ...parseGolferProfileFields(g, "golfer"),
    teeShot: {
      driving: validateAbility(teeShot.driving, "golfer.teeShot.driving"),
      distance: validateAbility(teeShot.distance, "golfer.teeShot.distance"),
      accuracy: validateAbility(teeShot.accuracy, "golfer.teeShot.accuracy"),
      dispersion: validateAbility(
        teeShot.dispersion,
        "golfer.teeShot.dispersion",
      ),
    },
  };
}

function validateHole(hole: unknown): Hole {
  if (hole === null || typeof hole !== "object") {
    throw new ValidationError("hole must be an object");
  }

  const h = hole as Record<string, unknown>;
  const id = assertNonEmptyString(h.id, "hole.id");
  const par = h.par;

  if (par !== 4 && par !== 5) {
    throw new ValidationError("hole.par must be 4 or 5 for tee shots");
  }

  const lengthYards = assertFiniteNumber(h.lengthYards, "hole.lengthYards", {
    min: 250,
    max: 750,
  });

  if (h.green === null || typeof h.green !== "object") {
    throw new ValidationError("hole.green must be an object");
  }

  const green = h.green as Record<string, unknown>;

  if (h.teeShot === null || typeof h.teeShot !== "object") {
    throw new ValidationError("hole.teeShot must be an object");
  }

  const teeShot = h.teeShot as Record<string, unknown>;

  return {
    id,
    number:
      typeof h.number === "number" && Number.isInteger(h.number)
        ? h.number
        : undefined,
    par,
    lengthYards,
    green: {
      sizeSqFt: assertFiniteNumber(green.sizeSqFt, "hole.green.sizeSqFt", {
        min: 1_000,
        max: 12_000,
      }),
      speed: assertFiniteNumber(green.speed, "hole.green.speed", {
        min: 6,
        max: 16,
      }),
      slope: assertFiniteNumber(green.slope, "hole.green.slope", {
        min: 0,
        max: 1,
      }),
      pinDifficulty: assertFiniteNumber(
        green.pinDifficulty,
        "hole.green.pinDifficulty",
        { min: 0, max: 1 },
      ),
    },
    teeShot: {
      fairwayWidth: assertFiniteNumber(
        teeShot.fairwayWidth,
        "hole.teeShot.fairwayWidth",
        { min: 0, max: 1 },
      ),
      roughDifficulty: assertFiniteNumber(
        teeShot.roughDifficulty,
        "hole.teeShot.roughDifficulty",
        { min: 0, max: 1 },
      ),
      hazardDifficulty: assertFiniteNumber(
        teeShot.hazardDifficulty,
        "hole.teeShot.hazardDifficulty",
        { min: 0, max: 1 },
      ),
    },
  };
}

export function validateTeeShotInput(input: unknown): TeeShotInput {
  if (input === null || typeof input !== "object") {
    throw new ValidationError("input must be an object");
  }

  const raw = input as Record<string, unknown>;
  const golfer = validateGolfer(raw.golfer);
  const hole = validateHole(raw.hole);

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

  return { golfer, hole, trials, seed };
}

export { DEFAULT_TRIALS, MIN_TRIALS, MAX_TRIALS };
