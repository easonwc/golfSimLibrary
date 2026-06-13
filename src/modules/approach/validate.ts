import {
  assertFiniteNumber,
  assertNonEmptyString,
  ValidationError,
} from "../../errors.js";
import type { Golfer, Hole } from "../../types/index.js";
import type { ApproachInput } from "./types.js";

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

  if (g.approach === null || typeof g.approach !== "object") {
    throw new ValidationError("golfer.approach must be an object");
  }

  const approach = g.approach as Record<string, unknown>;

  return {
    id,
    name: typeof g.name === "string" ? g.name : undefined,
    approach: {
      approach: validateAbility(approach.approach, "golfer.approach.approach"),
      accuracy: validateAbility(approach.accuracy, "golfer.approach.accuracy"),
      distanceControl: validateAbility(
        approach.distanceControl,
        "golfer.approach.distanceControl",
      ),
      dispersion: validateAbility(
        approach.dispersion,
        "golfer.approach.dispersion",
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

  if (par !== 3 && par !== 4 && par !== 5) {
    throw new ValidationError("hole.par must be 3, 4, or 5");
  }

  const lengthYards = assertFiniteNumber(h.lengthYards, "hole.lengthYards", {
    min: 50,
    max: 750,
  });

  if (h.green === null || typeof h.green !== "object") {
    throw new ValidationError("hole.green must be an object");
  }

  const green = h.green as Record<string, unknown>;

  if (h.approach === null || typeof h.approach !== "object") {
    throw new ValidationError("hole.approach must be an object");
  }

  const approach = h.approach as Record<string, unknown>;

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
    approach: {
      landingDifficulty: assertFiniteNumber(
        approach.landingDifficulty,
        "hole.approach.landingDifficulty",
        { min: 0, max: 1 },
      ),
      elevationPenalty: assertFiniteNumber(
        approach.elevationPenalty,
        "hole.approach.elevationPenalty",
        { min: 0, max: 1 },
      ),
    },
  };
}

export function validateApproachInput(input: unknown): ApproachInput {
  if (input === null || typeof input !== "object") {
    throw new ValidationError("input must be an object");
  }

  const raw = input as Record<string, unknown>;
  const golfer = validateGolfer(raw.golfer);
  const hole = validateHole(raw.hole);

  let remainingDistanceYards: number | undefined;
  if (raw.remainingDistanceYards !== undefined) {
    remainingDistanceYards = assertFiniteNumber(
      raw.remainingDistanceYards,
      "remainingDistanceYards",
      { min: 20, max: 300 },
    );
  }

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

  return {
    golfer,
    hole,
    remainingDistanceYards,
    trials,
    seed,
  };
}

export { DEFAULT_TRIALS, MIN_TRIALS, MAX_TRIALS };
