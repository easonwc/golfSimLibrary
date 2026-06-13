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
import type { CompleteGolfer, GolferGender } from "../src/types/index.js";
import { simulateRound } from "../src/modules/round-composer/index.js";
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

describe("PGA Tour elite calibration (skill 99)", () => {
  it("matches tour anchor statistics within tolerance", () => {
    const course = createSampleCourse();
    const golfer = createEliteGolfer("male");
    const result = simulateRound({
      course,
      golfers: [golfer],
      trials: 2500,
      seed: 42,
    });

    expectEliteCalibrationStats(
      result.golferStats[0]!,
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

  it("matches LPGA driving distance anchor within tolerance", () => {
    const course = createSampleCourse();
    const golfer = createEliteGolfer("female");
    const result = simulateRound({
      course,
      golfers: [golfer],
      trials: 2500,
      seed: 42,
    });

    const stats = result.golferStats[0]!;
    const benchmarks = LPGA_TOUR_ELITE_BENCHMARKS;
    const tolerance = calibrationToleranceForGender("female");

    expect(stats.averageDrivingDistanceYards).not.toBeNull();
    expect(stats.averageDrivingDistanceYards!).toBeGreaterThanOrEqual(
      benchmarks.drivingDistanceYards - tolerance.drivingDistanceYards,
    );
    expect(stats.averageDrivingDistanceYards!).toBeLessThanOrEqual(
      benchmarks.drivingDistanceYards + tolerance.drivingDistanceYards,
    );
  });

  it("matches all LPGA tour anchor statistics within tolerance", () => {
    const course = createSampleCourse();
    const golfer = createEliteGolfer("female");
    const result = simulateRound({
      course,
      golfers: [golfer],
      trials: 2500,
      seed: 42,
    });

    expectEliteCalibrationStats(
      result.golferStats[0]!,
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
