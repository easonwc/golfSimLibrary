import type { CompleteGolfer, Course } from "../../types/index.js";
import { createRandomSource } from "../../utils/random.js";
import {
  accumulateRoundTrial,
  createRoundStatsAccumulator,
  finalizeRoundStatsAccumulator,
} from "./accumulator.js";
import {
  aggregateGolferRoundStats,
  coursePar,
  deriveGolferSeed,
  simulateRoundTrial,
} from "./transform.js";
import type { RoundComposerInput, RoundComposerResult, TrialIterationOptions } from "./types.js";
import { validateRoundComposerInput } from "./validate.js";

/**
 * Yields one {@link RoundTrialOutcome} per trial. The library does not store
 * outcomes — the caller decides whether to keep, aggregate, or discard each result.
 */
export function* iterateRoundTrials(
  golfer: CompleteGolfer,
  course: Course,
  options: TrialIterationOptions = {},
): Generator<import("./types.js").RoundTrialOutcome> {
  const { trials = 5_000, seed } = options;
  const random = createRandomSource(seed);

  for (let i = 0; i < trials; i += 1) {
    yield simulateRoundTrial(golfer, course, random);
  }
}

/**
 * @deprecated Prefer {@link iterateRoundTrials} or {@link simulateRoundTrial} and
 * caller-owned aggregation via {@link accumulateRoundTrial} /
 * {@link aggregateGolferRoundStats}.
 *
 * Runs many trials and returns aggregated stats. The library no longer retains
 * individual trial outcomes internally.
 */
export function simulateRound(rawInput: unknown): RoundComposerResult {
  const input = validateRoundComposerInput(rawInput);
  return simulateRoundValidated(input);
}

/** @deprecated See {@link simulateRound}. */
export function simulateRoundValidated(
  input: RoundComposerInput,
): RoundComposerResult {
  const { course, golfers, trials = 5_000, seed } = input;
  const par = coursePar(course);

  const golferStats = golfers.map((golfer, index) => {
    const random = createRandomSource(deriveGolferSeed(seed, index));
    const accumulator = createRoundStatsAccumulator(course.length);

    for (let i = 0; i < trials; i += 1) {
      accumulateRoundTrial(
        accumulator,
        simulateRoundTrial(golfer, course, random),
      );
    }

    return finalizeRoundStatsAccumulator(accumulator, golfer, course);
  });

  return {
    input,
    coursePar: par,
    golferStats,
  };
}

export { validateRoundComposerInput } from "./validate.js";
export type {
  GolferRoundStats,
  RoundComposerInput,
  RoundComposerResult,
  RoundTrialOutcome,
  TrialIterationOptions,
} from "./types.js";
export {
  accumulateRoundTrial,
  aggregateGolferRoundStats,
  coursePar,
  createRoundStatsAccumulator,
  deriveGolferSeed,
  finalizeRoundStatsAccumulator,
  simulateRoundTrial,
} from "./transform.js";
export type { RoundStatsAccumulator } from "./accumulator.js";
