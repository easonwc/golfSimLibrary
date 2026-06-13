import { createRandomSource } from "../../utils/random.js";
import {
  aggregateShortGameStats,
  simulateShortGameShot,
} from "./transform.js";
import type { ShortGameInput, ShortGameResult } from "./types.js";
import { validateShortGameInput } from "./validate.js";

/**
 * Runs the short game simulation for one golfer on one hole.
 *
 * Flow: validate input → Monte Carlo simulation → stats.
 */
export function simulateShortGame(rawInput: unknown): ShortGameResult {
  const input = validateShortGameInput(rawInput);
  return simulateShortGameValidated(input);
}

export function simulateShortGameValidated(
  input: ShortGameInput,
): ShortGameResult {
  const { golfer, hole, missDistanceYards, lie, trials = 5_000, seed } = input;
  const random = createRandomSource(seed);

  const outcomes = [];
  for (let i = 0; i < trials; i += 1) {
    outcomes.push(
      simulateShortGameShot(golfer, hole, missDistanceYards, lie, random),
    );
  }

  const stats = aggregateShortGameStats(
    golfer,
    hole,
    outcomes,
    missDistanceYards,
    lie,
    trials,
  );

  return { input, stats };
}

export { validateShortGameInput } from "./validate.js";
export type {
  ShortGameInput,
  ShortGameOutcomeDistribution,
  ShortGameResult,
  ShortGameShotOutcome,
  ShortGameStats,
} from "./types.js";
export {
  calculateGreenContactRate,
  calculateShortGameDispersionFeet,
  inferLieFromApproachMiss,
  simulateShortGameShot,
} from "./transform.js";
