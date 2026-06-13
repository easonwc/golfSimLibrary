export type {
  CompleteGolfer,
  CompleteHole,
  Course,
  Golfer,
  GolferGender,
  GolferApproachAttributes,
  GolferClubAttributes,
  GolferPuttingAttributes,
  GolferShortGameAttributes,
  GolferTeeShotAttributes,
  Hole,
  HoleApproachAttributes,
  HoleGreenAttributes,
  HoleShortGameAttributes,
  HoleTeeShotAttributes,
  ApproachClubType,
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
  generateRandomGolferAttributes,
  generateRandomGolfers,
} from "./utils/generate-golfer.js";
export type {
  GenerateRandomGolferOptions,
  GolferSkillAttributes,
} from "./utils/generate-golfer.js";
export {
  countPars,
  averageCourseHardness,
  generateRandomCourse,
} from "./utils/generate-course.js";
export type {
  CourseDifficulty,
  GenerateRandomCourseOptions,
} from "./utils/generate-course.js";
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
export {
  approachClubSkill,
  clubWeightsForApproachDistance,
  createUniformClubAttributes,
  deriveClubAttributes,
  resolveClubAttributes,
} from "./clubs/index.js";
export {
  applyGenderDistanceOffset,
  calibrationToleranceForGender,
  CALIBRATION_TOLERANCE,
  blendedRelativeSkill,
  dispersionScale,
  ELITE_SKILL_RATING,
  eliteBenchmarksForGender,
  genderDispersionScale,
  genderDistanceGapYards,
  genderOnGreenProximityMultiplier,
  genderPuttingMakeRateScale,
  genderShortGameContactRateMultiplier,
  genderTeeLateralDispersionMultiplier,
  GENDER_GAP_AT_DRIVER_YARDS,
  GENDER_GAP_AT_WEDGE_YARDS,
  GENDER_GAP_DRIVER_REFERENCE_YARDS,
  GENDER_GAP_WEDGE_REFERENCE_YARDS,
  GENDER_PERFORMANCE_CALIBRATION,
  LPGA_CALIBRATION_TOLERANCE,
  LPGA_TOUR_ELITE_BENCHMARKS,
  PGA_TOUR_ELITE_BENCHMARKS,
  performanceGender,
  puttingMakeRateScale,
  relativeSkill,
  resolveGolferGender,
  scaleRateToSkill,
  scaleYardsToSkill,
} from "./calibration/index.js";
export type { CalibrationTolerance, EliteTourBenchmarks } from "./calibration/index.js";
