import type { CompleteGolfer, Course } from "../../types/index.js";
import type { ScoreRelativeToParDistribution } from "../hole-composer/types.js";

export interface RoundComposerInput {
  /** Exactly 18 complete holes. */
  course: Course;
  /** Between 1 and 4 golfers, each with all required attributes. */
  golfers: CompleteGolfer[];
  trials?: number;
  seed?: number;
}

export interface GolferRoundStats {
  golferId: string;
  name?: string;
  trials: number;
  coursePar: number;
  /** Expected total strokes for the round. */
  expectedScore: number;
  /** Expected score relative to course par. */
  expectedScoreRelativeToPar: number;
  averagePuttsPerRound: number;
  /** Fairway hit rate across all par 4/5 holes in the round. */
  fairwayHitRate: number | null;
  /** Share of holes where the green was hit in regulation. */
  greenInRegulationRate: number;
  /** Share of missed-approach-green situations converted up-and-down. */
  upAndDownRate: number;
  /** Share of holes where the golfer scored par or better despite missing GIR. */
  scrambleRate: number;
  /** Expected strokes on each hole, indexed in course order. */
  holeByHoleExpectedScores: number[];
  scoreDistribution: ScoreRelativeToParDistribution;
}

export interface RoundComposerResult {
  input: RoundComposerInput;
  coursePar: number;
  golferStats: GolferRoundStats[];
}

export interface RoundTrialOutcome {
  totalStrokes: number;
  totalPutts: number;
  scoreRelativeToPar: number;
  greenInRegulationCount: number;
  fairwayHits: number;
  fairwayTrials: number;
  missedApproachGreens: number;
  upAndDownCount: number;
  scrambleCount: number;
  holeStrokes: number[];
}
