import type { Golfer, Hole, ShortGameLie } from "../../types/index.js";
import type { RandomSource } from "../../utils/random.js";

/** Yards from the pin at the start of the short game shot. */
export type MissDistanceYards = number;

export interface ShortGameInput {
  golfer: Golfer;
  hole: Hole;
  /** Yards from the pin when off the green. */
  missDistanceYards: MissDistanceYards;
  /** Lie for the short game shot. */
  lie: ShortGameLie;
  trials?: number;
  seed?: number;
}

export interface ShortGameOutcomeDistribution {
  onGreen: number;
  stillOffGreen: number;
}

export interface ShortGameStats {
  golferId: string;
  holeId: string;
  trials: number;
  /** Share of trials that reached the putting surface in one short game shot. */
  greenHitRate: number;
  /** Average proximity to the pin in feet when the green was hit. */
  averageProximityFeet: number;
  /**
   * Average first-putt distance in feet when the green was hit. Exposed for
   * direct use by the putting module.
   */
  averageFirstPuttDistanceFeet: number;
  /** Average yards from the pin when still off the green after the shot. */
  averageRemainingMissYards: number;
  /** Lie used in the simulation. */
  lie: ShortGameLie;
  /** Average starting distance from the pin (yards). */
  averageMissDistanceYards: number;
  outcomeDistribution: ShortGameOutcomeDistribution;
}

export interface ShortGameResult {
  input: ShortGameInput;
  stats: ShortGameStats;
}

export interface ShortGameShotOutcome {
  onGreen: boolean;
  proximityFeet: number;
  remainingMissYards?: number;
}

export type { RandomSource };
