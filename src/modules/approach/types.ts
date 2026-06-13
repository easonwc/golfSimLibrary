import type { Golfer, Hole } from "../../types/index.js";
import type { RandomSource } from "../../utils/random.js";

/** Yards remaining to the pin for the approach shot. */
export type RemainingDistanceYards = number;

export interface ApproachInput {
  golfer: Golfer;
  hole: Hole;
  /**
   * Yards remaining to the pin. Par 3 defaults to full hole length; par 4/5
   * defaults to an estimated approach distance. Prefer feeding this from the
   * tee shot module when available.
   */
  remainingDistanceYards?: RemainingDistanceYards;
  trials?: number;
  seed?: number;
}

export type ApproachMissDirection =
  | "missShort"
  | "missLong"
  | "missLeft"
  | "missRight";

export interface ApproachOutcomeDistribution {
  onGreen: number;
  missShort: number;
  missLong: number;
  missLeft: number;
  missRight: number;
}

export interface ApproachStats {
  golferId: string;
  holeId: string;
  trials: number;
  /** Share of trials that finished on the putting surface. */
  greenHitRate: number;
  /** Average proximity to the pin in feet when the green was hit. */
  averageProximityFeet: number;
  /**
   * Average first-putt distance in feet when the green was hit. Equivalent to
   * averageProximityFeet; exposed for direct use by the putting module.
   */
  averageFirstPuttDistanceFeet: number;
  /** Average yards from the pin when the approach missed the green. */
  averageMissDistanceYards: number;
  /** Average approach distance used in the simulation (yards). */
  averageApproachDistanceYards: number;
  outcomeDistribution: ApproachOutcomeDistribution;
}

export interface ApproachResult {
  input: ApproachInput;
  stats: ApproachStats;
}

export interface ApproachShotOutcome {
  onGreen: boolean;
  proximityFeet: number;
  missDirection?: ApproachMissDirection;
  missDistanceYards?: number;
  depthErrorYards: number;
  lateralErrorYards: number;
}

export interface DispersionSigmas {
  depthYards: number;
  lateralYards: number;
}

export type { RandomSource };
