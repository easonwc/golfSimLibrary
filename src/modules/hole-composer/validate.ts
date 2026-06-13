import {
  assertFiniteNumber,
  assertNonEmptyString,
  ValidationError,
} from "../../errors.js";
import type {
  CompleteGolfer,
  CompleteHole,
  GolferApproachAttributes,
  GolferClubAttributes,
  GolferPuttingAttributes,
  GolferShortGameAttributes,
  GolferTeeShotAttributes,
  HoleApproachAttributes,
  HoleGreenAttributes,
  HoleShortGameAttributes,
  HoleTeeShotAttributes,
} from "../../types/index.js";
import {
  MAX_HOLE_COMPOSER_GOLFERS,
  MIN_HOLE_COMPOSER_GOLFERS,
} from "../../types/index.js";
import type { HoleComposerInput } from "./types.js";

const DEFAULT_TRIALS = 5_000;
const MIN_TRIALS = 100;
const MAX_TRIALS = 100_000;

function validateAbility(value: unknown, field: string): number {
  return assertFiniteNumber(value, field, { min: 0, max: 100 });
}

function validatePuttingAttributes(
  putting: unknown,
  prefix: string,
): GolferPuttingAttributes {
  if (putting === null || typeof putting !== "object") {
    throw new ValidationError(`${prefix} must be an object`);
  }

  const p = putting as Record<string, unknown>;
  return {
    putting: validateAbility(p.putting, `${prefix}.putting`),
    shortPutting: validateAbility(p.shortPutting, `${prefix}.shortPutting`),
    lagPutting: validateAbility(p.lagPutting, `${prefix}.lagPutting`),
  };
}

function validateApproachAttributes(
  approach: unknown,
  prefix: string,
): GolferApproachAttributes {
  if (approach === null || typeof approach !== "object") {
    throw new ValidationError(`${prefix} must be an object`);
  }

  const a = approach as Record<string, unknown>;
  return {
    approach: validateAbility(a.approach, `${prefix}.approach`),
    accuracy: validateAbility(a.accuracy, `${prefix}.accuracy`),
    distanceControl: validateAbility(
      a.distanceControl,
      `${prefix}.distanceControl`,
    ),
    dispersion: validateAbility(a.dispersion, `${prefix}.dispersion`),
  };
}

function validateShortGameAttributes(
  shortGame: unknown,
  prefix: string,
): GolferShortGameAttributes {
  if (shortGame === null || typeof shortGame !== "object") {
    throw new ValidationError(`${prefix} must be an object`);
  }

  const s = shortGame as Record<string, unknown>;
  return {
    shortGame: validateAbility(s.shortGame, `${prefix}.shortGame`),
    chipping: validateAbility(s.chipping, `${prefix}.chipping`),
    bunkerPlay: validateAbility(s.bunkerPlay, `${prefix}.bunkerPlay`),
    pitching: validateAbility(s.pitching, `${prefix}.pitching`),
  };
}

function validateClubAttributes(
  clubs: unknown,
  prefix: string,
): GolferClubAttributes {
  if (clubs === null || typeof clubs !== "object") {
    throw new ValidationError(`${prefix} must be an object`);
  }

  const c = clubs as Record<string, unknown>;
  return {
    driver: validateAbility(c.driver, `${prefix}.driver`),
    wood: validateAbility(c.wood, `${prefix}.wood`),
    longIron: validateAbility(c.longIron, `${prefix}.longIron`),
    midIron: validateAbility(c.midIron, `${prefix}.midIron`),
    shortIron: validateAbility(c.shortIron, `${prefix}.shortIron`),
    wedge: validateAbility(c.wedge, `${prefix}.wedge`),
  };
}

function validateTeeShotAttributes(
  teeShot: unknown,
  prefix: string,
): GolferTeeShotAttributes {
  if (teeShot === null || typeof teeShot !== "object") {
    throw new ValidationError(`${prefix} must be an object`);
  }

  const t = teeShot as Record<string, unknown>;
  return {
    driving: validateAbility(t.driving, `${prefix}.driving`),
    distance: validateAbility(t.distance, `${prefix}.distance`),
    accuracy: validateAbility(t.accuracy, `${prefix}.accuracy`),
    dispersion: validateAbility(t.dispersion, `${prefix}.dispersion`),
  };
}

function validateGreenAttributes(green: unknown): HoleGreenAttributes {
  if (green === null || typeof green !== "object") {
    throw new ValidationError("hole.green must be an object");
  }

  const g = green as Record<string, unknown>;
  return {
    sizeSqFt: assertFiniteNumber(g.sizeSqFt, "hole.green.sizeSqFt", {
      min: 1_000,
      max: 12_000,
    }),
    speed: assertFiniteNumber(g.speed, "hole.green.speed", {
      min: 6,
      max: 16,
    }),
    slope: assertFiniteNumber(g.slope, "hole.green.slope", {
      min: 0,
      max: 1,
    }),
    pinDifficulty: assertFiniteNumber(
      g.pinDifficulty,
      "hole.green.pinDifficulty",
      { min: 0, max: 1 },
    ),
  };
}

function validateHoleApproachAttributes(
  approach: unknown,
): HoleApproachAttributes {
  if (approach === null || typeof approach !== "object") {
    throw new ValidationError("hole.approach must be an object");
  }

  const a = approach as Record<string, unknown>;
  return {
    landingDifficulty: assertFiniteNumber(
      a.landingDifficulty,
      "hole.approach.landingDifficulty",
      { min: 0, max: 1 },
    ),
    elevationPenalty: assertFiniteNumber(
      a.elevationPenalty,
      "hole.approach.elevationPenalty",
      { min: 0, max: 1 },
    ),
  };
}

function validateHoleShortGameAttributes(
  shortGame: unknown,
): HoleShortGameAttributes {
  if (shortGame === null || typeof shortGame !== "object") {
    throw new ValidationError("hole.shortGame must be an object");
  }

  const s = shortGame as Record<string, unknown>;
  return {
    roughDifficulty: assertFiniteNumber(
      s.roughDifficulty,
      "hole.shortGame.roughDifficulty",
      { min: 0, max: 1 },
    ),
    bunkerDifficulty: assertFiniteNumber(
      s.bunkerDifficulty,
      "hole.shortGame.bunkerDifficulty",
      { min: 0, max: 1 },
    ),
    collectionDifficulty: assertFiniteNumber(
      s.collectionDifficulty,
      "hole.shortGame.collectionDifficulty",
      { min: 0, max: 1 },
    ),
  };
}

function validateHoleTeeShotAttributes(
  teeShot: unknown,
): HoleTeeShotAttributes {
  if (teeShot === null || typeof teeShot !== "object") {
    throw new ValidationError("hole.teeShot must be an object");
  }

  const t = teeShot as Record<string, unknown>;
  return {
    fairwayWidth: assertFiniteNumber(
      t.fairwayWidth,
      "hole.teeShot.fairwayWidth",
      { min: 0, max: 1 },
    ),
    roughDifficulty: assertFiniteNumber(
      t.roughDifficulty,
      "hole.teeShot.roughDifficulty",
      { min: 0, max: 1 },
    ),
    hazardDifficulty: assertFiniteNumber(
      t.hazardDifficulty,
      "hole.teeShot.hazardDifficulty",
      { min: 0, max: 1 },
    ),
  };
}

export function validateCompleteGolfer(
  golfer: unknown,
  index: number,
  requiresTeeShot: boolean,
): CompleteGolfer {
  if (golfer === null || typeof golfer !== "object") {
    throw new ValidationError(`golfers[${index}] must be an object`);
  }

  const g = golfer as Record<string, unknown>;
  const prefix = `golfers[${index}]`;
  const id = assertNonEmptyString(g.id, `${prefix}.id`);

  const complete: CompleteGolfer = {
    id,
    name: typeof g.name === "string" ? g.name : undefined,
    putting: validatePuttingAttributes(g.putting, `${prefix}.putting`),
    approach: validateApproachAttributes(g.approach, `${prefix}.approach`),
    shortGame: validateShortGameAttributes(
      g.shortGame,
      `${prefix}.shortGame`,
    ),
    clubs: validateClubAttributes(g.clubs, `${prefix}.clubs`),
  };

  if (requiresTeeShot) {
    complete.teeShot = validateTeeShotAttributes(
      g.teeShot,
      `${prefix}.teeShot`,
    );
  }

  return complete;
}

export function validateCompleteHole(hole: unknown, fieldPrefix = "hole"): CompleteHole {
  if (hole === null || typeof hole !== "object") {
    throw new ValidationError(`${fieldPrefix} must be an object`);
  }

  const h = hole as Record<string, unknown>;
  const id = assertNonEmptyString(h.id, `${fieldPrefix}.id`);
  const par = h.par;

  if (par !== 3 && par !== 4 && par !== 5) {
    throw new ValidationError(`${fieldPrefix}.par must be 3, 4, or 5`);
  }

  const minLength = par === 3 ? 50 : 250;
  const lengthYards = assertFiniteNumber(h.lengthYards, `${fieldPrefix}.lengthYards`, {
    min: minLength,
    max: 750,
  });

  const complete: CompleteHole = {
    id,
    number:
      typeof h.number === "number" && Number.isInteger(h.number)
        ? h.number
        : undefined,
    par,
    lengthYards,
    green: validateGreenAttributes(h.green),
    approach: validateHoleApproachAttributes(h.approach),
    shortGame: validateHoleShortGameAttributes(h.shortGame),
  };

  if (par === 4 || par === 5) {
    complete.teeShot = validateHoleTeeShotAttributes(h.teeShot);
  }

  return complete;
}

export function validateHoleComposerInput(input: unknown): HoleComposerInput {
  if (input === null || typeof input !== "object") {
    throw new ValidationError("input must be an object");
  }

  const raw = input as Record<string, unknown>;
  const hole = validateCompleteHole(raw.hole);
  const requiresTeeShot = hole.par === 4 || hole.par === 5;

  if (!Array.isArray(raw.golfers)) {
    throw new ValidationError("golfers must be an array");
  }

  if (raw.golfers.length < MIN_HOLE_COMPOSER_GOLFERS) {
    throw new ValidationError(
      `golfers must contain at least ${MIN_HOLE_COMPOSER_GOLFERS} golfer`,
    );
  }

  if (raw.golfers.length > MAX_HOLE_COMPOSER_GOLFERS) {
    throw new ValidationError(
      `golfers must contain at most ${MAX_HOLE_COMPOSER_GOLFERS} golfers`,
    );
  }

  const golfers = raw.golfers.map((golfer, index) =>
    validateCompleteGolfer(golfer, index, requiresTeeShot),
  );

  const ids = new Set<string>();
  for (const golfer of golfers) {
    if (ids.has(golfer.id)) {
      throw new ValidationError(
        `duplicate golfer id "${golfer.id}" in golfers array`,
      );
    }
    ids.add(golfer.id);
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

  return { hole, golfers, trials, seed };
}

export { DEFAULT_TRIALS, MIN_TRIALS, MAX_TRIALS };
