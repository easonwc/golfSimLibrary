import {
  aggregatePuttingStats,
  estimateFirstPuttDistanceFeet,
  simulatePuttsOnGreen,
} from "./transform.js";
import type { PuttingInput, PuttingResult } from "./types.js";
import { createRandomSource } from "./types.js";
import { validatePuttingInput } from "./validate.js";

/**
 * Runs the putting simulation for one golfer on one hole.
 *
 * Flow: validate input → resolve first-putt distance → Monte Carlo simulation → stats.
 */
export function simulatePutting(rawInput: unknown): PuttingResult {
  const input = validatePuttingInput(rawInput);
  return simulatePuttingValidated(input);
}

export function simulatePuttingValidated(input: PuttingInput): PuttingResult {
  const { golfer, hole, trials = 5_000, seed } = input;
  const random = createRandomSource(seed);

  const firstPuttDistanceFeet =
    input.firstPuttDistanceFeet ?? estimateFirstPuttDistanceFeet(hole);

  const puttCounts: number[] = [];
  for (let i = 0; i < trials; i += 1) {
    puttCounts.push(
      simulatePuttsOnGreen(firstPuttDistanceFeet, golfer, hole, random),
    );
  }

  const stats = aggregatePuttingStats(
    golfer,
    hole,
    puttCounts,
    firstPuttDistanceFeet,
    trials,
  );

  return { input, stats };
}

export { validatePuttingInput } from "./validate.js";
export type {
  PuttingDistribution,
  PuttingInput,
  PuttingResult,
  PuttingStats,
} from "./types.js";
export {
  estimateFirstPuttDistanceFeet,
  makeRateAtDistance,
  simulatePuttsOnGreen,
} from "./transform.js";
