import { createRandomSource } from "../../utils/random.js";
import {
  aggregateGolferHoleStats,
  deriveGolferSeed,
  simulateHoleTrial,
} from "./transform.js";
import type { HoleComposerInput, HoleComposerResult } from "./types.js";
import { validateHoleComposerInput } from "./validate.js";

/**
 * Simulates a full hole for 1–4 golfers by composing tee shot, approach,
 * short game, and putting modules.
 *
 * Flow: validate input → per-golfer Monte Carlo trials → hole stats.
 */
export function simulateHole(rawInput: unknown): HoleComposerResult {
  const input = validateHoleComposerInput(rawInput);
  return simulateHoleValidated(input);
}

export function simulateHoleValidated(
  input: HoleComposerInput,
): HoleComposerResult {
  const { hole, golfers, trials = 5_000, seed } = input;

  const golferStats = golfers.map((golfer, index) => {
    const random = createRandomSource(deriveGolferSeed(seed, index));
    const outcomes = [];

    for (let i = 0; i < trials; i += 1) {
      outcomes.push(simulateHoleTrial(golfer, hole, random));
    }

    return aggregateGolferHoleStats(golfer, hole, outcomes, trials);
  });

  return {
    input,
    holeId: hole.id,
    par: hole.par,
    golferStats,
  };
}

export { validateHoleComposerInput } from "./validate.js";
export type {
  GolferHoleStats,
  HoleComposerInput,
  HoleComposerResult,
  HoleTrialOutcome,
  ScoreRelativeToParDistribution,
} from "./types.js";
export {
  aggregateGolferHoleStats,
  deriveGolferSeed,
  simulateHoleTrial,
} from "./transform.js";
export {
  validateCompleteGolfer,
  validateCompleteHole,
} from "./validate.js";
