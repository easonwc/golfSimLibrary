import type { Golfer, Hole, TeeShotLie } from "../../types/index.js";
import type { RandomSource } from "../../utils/random.js";

export interface TeeShotInput {
  golfer: Golfer;
  hole: Hole;
  trials?: number;
  seed?: number;
}

export interface TeeShotOutcomeDistribution {
  fairway: number;
  rough: number;
  hazard: number;
}

export interface TeeShotStats {
  golferId: string;
  holeId: string;
  trials: number;
  /** Share of drives that found the fairway. */
  fairwayHitRate: number;
  /** Average driving distance in yards. */
  averageDrivingDistanceYards: number;
  /**
   * Average yards remaining to the pin after the tee shot. Primary output for
   * the approach module.
   */
  averageRemainingDistanceYards: number;
  /** Average extra yards added to the approach due to lie penalties. */
  averageRecoveryPenaltyYards: number;
  outcomeDistribution: TeeShotOutcomeDistribution;
}

export interface TeeShotResult {
  input: TeeShotInput;
  stats: TeeShotStats;
}

export interface TeeShotOutcome {
  lie: TeeShotLie;
  drivingDistanceYards: number;
  remainingDistanceYards: number;
  recoveryPenaltyYards: number;
  lateralMissYards: number;
}

export type { TeeShotLie, RandomSource };
