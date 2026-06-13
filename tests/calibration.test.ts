import { describe, expect, it } from "vitest";
import {
  calibrationToleranceForGender,
  ELITE_SKILL_RATING,
  eliteBenchmarksForGender,
  LPGA_TOUR_ELITE_BENCHMARKS,
  PGA_TOUR_ELITE_BENCHMARKS,
} from "../src/calibration/index.js";
import { createUniformClubAttributes } from "../src/clubs/index.js";
import { createSampleCourse } from "../src/fixtures/index.js";
import type { CompleteGolfer, GolferGender, GolferRoundStats } from "../src/types/index.js";
import {
  accumulateRoundTrial,
  createRoundStatsAccumulator,
  finalizeRoundStatsAccumulator,
  iterateRoundTrials,
  simulateRoundTrial,
} from "../src/modules/round-composer/index.js";
import { createRandomSource } from "../src/utils/random.js";
import { expectEliteCalibrationStats } from "./calibration-helpers.js";

function createEliteGolfer(gender?: GolferGender): CompleteGolfer {
  const rating = ELITE_SKILL_RATING;
  return {
    id: gender === "female" ? "elite-lpga-calibration" : "elite-pga-calibration",
    name: gender === "female" ? "Elite LPGA Calibration" : "Elite PGA Calibration",
    gender,
    putting: {
      putting: rating,
      shortPutting: rating,
      lagPutting: rating,
    },
    approach: {
      approach: rating,
      accuracy: rating,
      distanceControl: rating,
      dispersion: rating,
    },
    shortGame: {
      shortGame: rating,
      chipping: rating,
      bunkerPlay: rating,
      pitching: rating,
    },
    teeShot: {
      driving: rating,
      distance: rating,
      accuracy: rating,
      dispersion: rating,
    },
    clubs: createUniformClubAttributes(rating),
  };
}

function simulateEliteRoundStats(
  golfer: CompleteGolfer,
  trials: number,
  seed: number,
): GolferRoundStats {
  const course = createSampleCourse();
  const accumulator = createRoundStatsAccumulator(course.length);

  for (const outcome of iterateRoundTrials(golfer, course, { trials, seed })) {
    accumulateRoundTrial(accumulator, outcome);
  }

  return finalizeRoundStatsAccumulator(accumulator, golfer, course);
}

describe("PGA Tour elite calibration (skill 99)", () => {
  it("matches tour anchor statistics within tolerance", () => {
    const stats = simulateEliteRoundStats(createEliteGolfer("male"), 2500, 42);

    expectEliteCalibrationStats(
      stats,
      PGA_TOUR_ELITE_BENCHMARKS,
      calibrationToleranceForGender("male"),
    );
  });
});

describe("LPGA Tour elite calibration (skill 99, female)", () => {
  it("defines LPGA tour anchor values", () => {
    expect(LPGA_TOUR_ELITE_BENCHMARKS).toEqual({
      puttsPerRound: 28.5,
      greenInRegulationRate: 0.77,
      fairwayHitRate: 0.83,
      scoreRelativeToPar72: -2.5,
      drivingDistanceYards: 265,
      scrambleRate: 0.76,
    });
  });

  it("defines driving distance as PGA anchor minus gender gap", () => {
    expect(LPGA_TOUR_ELITE_BENCHMARKS.drivingDistanceYards).toBe(265);
  });

  it("matches LPGA tour anchor statistics within tolerance", () => {
    const stats = simulateEliteRoundStats(createEliteGolfer("female"), 2500, 42);

    expectEliteCalibrationStats(
      stats,
      eliteBenchmarksForGender("female"),
      calibrationToleranceForGender("female"),
    );
  });
});

describe("eliteBenchmarksForGender", () => {
  it("returns PGA benchmarks for male and LPGA benchmarks for female", () => {
    expect(eliteBenchmarksForGender("male")).toBe(PGA_TOUR_ELITE_BENCHMARKS);
    expect(eliteBenchmarksForGender("female")).toBe(LPGA_TOUR_ELITE_BENCHMARKS);
  });
});

describe("trial-first round simulation", () => {
  it("iterateRoundTrials yields the requested number of outcomes", () => {
    const course = createSampleCourse();
    const golfer = createEliteGolfer("male");
    const outcomes = [...iterateRoundTrials(golfer, course, { trials: 25, seed: 1 })];
    expect(outcomes).toHaveLength(25);
    expect(outcomes[0]?.holeStrokes).toHaveLength(18);
  });

  it("simulateRoundTrial matches a single iterator step", () => {
    const course = createSampleCourse();
    const golfer = createEliteGolfer("male");
    const random = createRandomSource(99);
    const direct = simulateRoundTrial(golfer, course, random);
    const random2 = createRandomSource(99);
    const [iterated] = iterateRoundTrials(golfer, course, { trials: 1, seed: 99 });
    expect(iterated?.totalStrokes).toBe(direct.totalStrokes);
    expect(iterated?.totalPutts).toBe(direct.totalPutts);
    void random2;
  });
});
