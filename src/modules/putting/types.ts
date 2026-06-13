import type { Golfer, Hole } from "../../types/index.js";
import {
  createRandomSource,
  SeededRandom,
  type RandomSource,
} from "../../utils/random.js";

/** Distance of the first putt on the green, in feet. */
export type FirstPuttDistanceFeet = number;

export interface PuttingInput {
  golfer: Golfer;
  hole: Hole;
  /**
   * Distance of the first putt in feet. When omitted, estimated from hole
   * length, par, and green characteristics. Prefer feeding this from the
   * approach module when available.
   */
  firstPuttDistanceFeet?: FirstPuttDistanceFeet;
  /** Number of Monte Carlo trials (default 5_000). */
  trials?: number;
  /** Optional seed for reproducible simulation. */
  seed?: number;
}

export interface PuttingDistribution {
  onePutt: number;
  twoPutt: number;
  threePutt: number;
  fourPlusPutt: number;
}

export interface PuttingStats {
  golferId: string;
  holeId: string;
  expectedPutts: number;
  distribution: PuttingDistribution;
  /** Average first-putt distance used in the simulation (feet). */
  averageFirstPuttDistanceFeet: number;
  /** Estimated make rate on the first putt (0–1). */
  firstPuttMakeRate: number;
  /** Number of simulation trials run. */
  trials: number;
}

export interface PuttingResult {
  input: PuttingInput;
  stats: PuttingStats;
}

export type { RandomSource };
export { createRandomSource, SeededRandom };
