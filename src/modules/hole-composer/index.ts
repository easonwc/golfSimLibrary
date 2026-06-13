import type { CompleteGolfer, CompleteHole } from "../../types/index.js";
import { createRandomSource } from "../../utils/random.js";
import {
  accumulateHoleTrial,
  createHoleStatsAccumulator,
  finalizeHoleStatsAccumulator,
} from "./accumulator.js";
import {
  aggregateGolferHoleStats,
  deriveGolferSeed,
  simulateHoleTrial,
} from "./transform.js";
import type { HoleComposerInput, HoleComposerResult, TrialIterationOptions } from "./types.js";
import { validateHoleComposerInput } from "./validate.js";

/**
 * Yields one {@link HoleTrialOutcome} per trial. The library does not store
 * outcomes — the caller decides whether to keep, aggregate, or discard each result.
 */
export function* iterateHoleTrials(
  golfer: CompleteGolfer,
  hole: CompleteHole,
  options: TrialIterationOptions = {},
): Generator<import("./types.js").HoleTrialOutcome> {
  const { trials = 5_000, seed } = options;
  const random = createRandomSource(seed);

  for (let i = 0; i < trials; i += 1) {
    yield simulateHoleTrial(golfer, hole, random);
  }
}

/**
 * @deprecated Prefer {@link iterateHoleTrials} or {@link simulateHoleTrial} and
 * caller-owned aggregation via {@link accumulateHoleTrial} /
 * {@link aggregateGolferHoleStats}.
 *
 * Runs many trials and returns aggregated stats. The library no longer retains
 * individual trial outcomes internally.
 */
export function simulateHole(rawInput: unknown): HoleComposerResult {
  const input = validateHoleComposerInput(rawInput);
  return simulateHoleValidated(input);
}

/** @deprecated See {@link simulateHole}. */
export function simulateHoleValidated(
  input: HoleComposerInput,
): HoleComposerResult {
  const { hole, golfers, trials = 5_000, seed } = input;

  const golferStats = golfers.map((golfer, index) => {
    const random = createRandomSource(deriveGolferSeed(seed, index));
    const accumulator = createHoleStatsAccumulator();

    for (let i = 0; i < trials; i += 1) {
      accumulateHoleTrial(accumulator, simulateHoleTrial(golfer, hole, random));
    }

    return finalizeHoleStatsAccumulator(accumulator, golfer, hole);
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
  TrialIterationOptions,
} from "./types.js";
export {
  accumulateHoleTrial,
  aggregateGolferHoleStats,
  createHoleStatsAccumulator,
  deriveGolferSeed,
  finalizeHoleStatsAccumulator,
  simulateHoleTrial,
} from "./transform.js";
export type { HoleStatsAccumulator } from "./accumulator.js";
export {
  validateCompleteGolfer,
  validateCompleteHole,
} from "./validate.js";
