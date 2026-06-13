export type {
  CompleteGolfer,
  CompleteHole,
  Course,
  Golfer,
  GolferApproachAttributes,
  GolferPuttingAttributes,
  GolferShortGameAttributes,
  GolferTeeShotAttributes,
  Hole,
  HoleApproachAttributes,
  HoleGreenAttributes,
  HoleShortGameAttributes,
  HoleTeeShotAttributes,
  ShortGameLie,
  TeeShotLie,
} from "./types/index.js";
export {
  MAX_HOLE_COMPOSER_GOLFERS,
  MIN_HOLE_COMPOSER_GOLFERS,
  ROUND_HOLE_COUNT,
} from "./types/index.js";
export { GolfSimError, ValidationError } from "./errors.js";
export {
  estimateFirstPuttDistanceFeet,
  makeRateAtDistance,
  simulatePutting,
  simulatePuttingValidated,
  simulatePuttsOnGreen,
  validatePuttingInput,
} from "./modules/putting/index.js";
export type {
  PuttingDistribution,
  PuttingInput,
  PuttingResult,
  PuttingStats,
} from "./modules/putting/index.js";
export {
  calculateDispersionSigmas,
  effectiveGreenRadiusFeet,
  estimateRemainingDistanceYards,
  greenRadiusFeet,
  simulateApproach,
  simulateApproachShot,
  simulateApproachValidated,
  validateApproachInput,
} from "./modules/approach/index.js";
export type {
  ApproachInput,
  ApproachMissDirection,
  ApproachOutcomeDistribution,
  ApproachResult,
  ApproachShotOutcome,
  ApproachStats,
} from "./modules/approach/index.js";
export {
  calculateGreenContactRate,
  calculateShortGameDispersionFeet,
  inferLieFromApproachMiss,
  simulateShortGame,
  simulateShortGameShot,
  simulateShortGameValidated,
  validateShortGameInput,
} from "./modules/short-game/index.js";
export type {
  ShortGameInput,
  ShortGameOutcomeDistribution,
  ShortGameResult,
  ShortGameShotOutcome,
  ShortGameStats,
} from "./modules/short-game/index.js";
export {
  calculateDrivingDistanceSigma,
  calculateLateralDispersionYards,
  calculateRemainingDistanceYards,
  expectedDrivingDistanceYards,
  fairwayHalfWidthYards,
  recoveryPenaltyYards,
  simulateTeeShot,
  simulateTeeShotDrive,
  simulateTeeShotValidated,
  validateTeeShotInput,
} from "./modules/tee-shot/index.js";
export type {
  TeeShotInput,
  TeeShotOutcome,
  TeeShotOutcomeDistribution,
  TeeShotResult,
  TeeShotStats,
} from "./modules/tee-shot/index.js";
export {
  aggregateGolferHoleStats,
  deriveGolferSeed,
  simulateHole,
  simulateHoleTrial,
  simulateHoleValidated,
  validateCompleteGolfer,
  validateCompleteHole,
  validateHoleComposerInput,
} from "./modules/hole-composer/index.js";
export type {
  GolferHoleStats,
  HoleComposerInput,
  HoleComposerResult,
  HoleTrialOutcome,
  ScoreRelativeToParDistribution,
} from "./modules/hole-composer/index.js";
export {
  aggregateGolferRoundStats,
  coursePar,
  simulateRound,
  simulateRoundTrial,
  simulateRoundValidated,
  validateRoundComposerInput,
} from "./modules/round-composer/index.js";
export type {
  GolferRoundStats,
  RoundComposerInput,
  RoundComposerResult,
  RoundTrialOutcome,
} from "./modules/round-composer/index.js";
