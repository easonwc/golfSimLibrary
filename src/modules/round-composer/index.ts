import { createRandomSource } from "../../utils/random.js";
import {
  aggregateGolferRoundStats,
  coursePar,
  deriveGolferSeed,
  simulateRoundTrial,
} from "./transform.js";
import type { RoundComposerInput, RoundComposerResult } from "./types.js";
import { validateRoundComposerInput } from "./validate.js";

/**
 * Simulates full 18-hole rounds for 1–4 golfers by composing the hole
 * composer across every hole in the course.
 *
 * Flow: validate input → per-golfer round trials → round stats.
 */
export function simulateRound(rawInput: unknown): RoundComposerResult {
  const input = validateRoundComposerInput(rawInput);
  return simulateRoundValidated(input);
}

export function simulateRoundValidated(
  input: RoundComposerInput,
): RoundComposerResult {
  const { course, golfers, trials = 5_000, seed } = input;
  const par = coursePar(course);

  const golferStats = golfers.map((golfer, index) => {
    const random = createRandomSource(deriveGolferSeed(seed, index));
    const outcomes = [];

    for (let i = 0; i < trials; i += 1) {
      outcomes.push(simulateRoundTrial(golfer, course, random));
    }

    return aggregateGolferRoundStats(golfer, course, outcomes, trials);
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
} from "./types.js";
export {
  aggregateGolferRoundStats,
  coursePar,
  deriveGolferSeed,
  simulateRoundTrial,
} from "./transform.js";
