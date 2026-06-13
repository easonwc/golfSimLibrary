import {
  aggregateApproachStats,
  estimateRemainingDistanceYards,
  simulateApproachShot,
} from "./transform.js";
import type { ApproachInput, ApproachResult } from "./types.js";
import { createRandomSource } from "../../utils/random.js";
import { validateApproachInput } from "./validate.js";

/**
 * Runs the approach simulation for one golfer on one hole.
 *
 * Flow: validate input → resolve approach distance → Monte Carlo simulation → stats.
 */
export function simulateApproach(rawInput: unknown): ApproachResult {
  const input = validateApproachInput(rawInput);
  return simulateApproachValidated(input);
}

export function simulateApproachValidated(input: ApproachInput): ApproachResult {
  const { golfer, hole, trials = 5_000, seed } = input;
  const random = createRandomSource(seed);

  const approachDistanceYards =
    input.remainingDistanceYards ?? estimateRemainingDistanceYards(hole);

  const outcomes = [];
  for (let i = 0; i < trials; i += 1) {
    outcomes.push(
      simulateApproachShot(golfer, hole, approachDistanceYards, random),
    );
  }

  const stats = aggregateApproachStats(
    golfer,
    hole,
    outcomes,
    approachDistanceYards,
    trials,
  );

  return { input, stats };
}

export { validateApproachInput } from "./validate.js";
export type {
  ApproachInput,
  ApproachMissDirection,
  ApproachOutcomeDistribution,
  ApproachResult,
  ApproachShotOutcome,
  ApproachStats,
  DispersionSigmas,
} from "./types.js";
export {
  calculateDispersionSigmas,
  effectiveGreenRadiusFeet,
  estimateRemainingDistanceYards,
  greenRadiusFeet,
  simulateApproachShot,
} from "./transform.js";
