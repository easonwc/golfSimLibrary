import type { CompleteGolfer, CompleteHole } from "../../types/index.js";

export interface HoleComposerInput {
  hole: CompleteHole;
  /** Between 1 and 4 golfers, each with all required attributes. */
  golfers: CompleteGolfer[];
  trials?: number;
  seed?: number;
}

export interface ScoreRelativeToParDistribution {
  eagleOrBetter: number;
  birdie: number;
  par: number;
  bogey: number;
  doubleBogey: number;
  tripleOrWorse: number;
}

export interface GolferHoleStats {
  golferId: string;
  name?: string;
  trials: number;
  /** Expected total strokes on this hole. */
  expectedScore: number;
  /** Expected score relative to par (expectedScore − hole.par). */
  expectedScoreRelativeToPar: number;
  averagePutts: number;
  /** Fairway hit rate on par 4/5; null on par 3. */
  fairwayHitRate: number | null;
  /** Share of trials reaching the green in regulation strokes. */
  greenInRegulationRate: number;
  /** Share of trials with a successful up-and-down after missing the green. */
  upAndDownRate: number;
  /** Share of trials where the golfer scored par or better despite missing GIR. */
  scrambleRate: number;
  scoreDistribution: ScoreRelativeToParDistribution;
}

export interface HoleComposerResult {
  input: HoleComposerInput;
  holeId: string;
  par: 3 | 4 | 5;
  golferStats: GolferHoleStats[];
}

export interface HoleTrialOutcome {
  totalStrokes: number;
  putts: number;
  strokesToGreen: number;
  fairwayHit: boolean | null;
  greenInRegulation: boolean;
  missedApproachGreen: boolean;
  upAndDown: boolean;
  scramble: boolean;
  scoreRelativeToPar: number;
}
