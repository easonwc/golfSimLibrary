import { createRandomSource } from "../../utils/random.js";
import { aggregateTeeShotStats, simulateTeeShotDrive } from "./transform.js";
import type { TeeShotInput, TeeShotResult } from "./types.js";
import { validateTeeShotInput } from "./validate.js";

/**
 * Runs the tee shot simulation for one golfer on one par 4/5 hole.
 *
 * Flow: validate input → Monte Carlo simulation → stats.
 */
export function simulateTeeShot(rawInput: unknown): TeeShotResult {
  const input = validateTeeShotInput(rawInput);
  return simulateTeeShotValidated(input);
}

export function simulateTeeShotValidated(input: TeeShotInput): TeeShotResult {
  const { golfer, hole, trials = 5_000, seed } = input;
  const random = createRandomSource(seed);

  const outcomes = [];
  for (let i = 0; i < trials; i += 1) {
    outcomes.push(simulateTeeShotDrive(golfer, hole, random));
  }

  const stats = aggregateTeeShotStats(golfer, hole, outcomes, trials);

  return { input, stats };
}

export { validateTeeShotInput } from "./validate.js";
export type {
  TeeShotInput,
  TeeShotLie,
  TeeShotOutcome,
  TeeShotOutcomeDistribution,
  TeeShotResult,
  TeeShotStats,
} from "./types.js";
export {
  calculateDrivingDistanceSigma,
  calculateLateralDispersionYards,
  calculateRemainingDistanceYards,
  expectedDrivingDistanceYards,
  fairwayHalfWidthYards,
  recoveryPenaltyYards,
  simulateTeeShotDrive,
} from "./transform.js";
