import { describe, expect, it } from "vitest";
import {
  CALIBRATION_TOLERANCE,
  ELITE_SKILL_RATING,
  PGA_TOUR_ELITE_BENCHMARKS,
} from "../src/calibration/index.js";
import { createUniformClubAttributes } from "../src/clubs/index.js";
import { createSampleCourse } from "../src/fixtures/index.js";
import type { CompleteGolfer } from "../src/types/index.js";
import { simulateRound } from "../src/modules/round-composer/index.js";

function createEliteGolfer(): CompleteGolfer {
  const rating = ELITE_SKILL_RATING;
  return {
    id: "elite-calibration",
    name: "Elite Calibration",
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
    const golfer = createEliteGolfer();
    const result = simulateRound({
      course,
      golfers: [golfer],
      trials: 2500,
      seed: 42,
    });

    const stats = result.golferStats[0]!;
    const benchmarks = PGA_TOUR_ELITE_BENCHMARKS;
    const tolerance = CALIBRATION_TOLERANCE;
    const scrambleWhenMissedGir =
      stats.scrambleRate / (1 - stats.greenInRegulationRate);

    expect(stats.averagePuttsPerRound).toBeGreaterThanOrEqual(
      benchmarks.puttsPerRound - tolerance.puttsPerRound,
    );
    expect(stats.averagePuttsPerRound).toBeLessThanOrEqual(
      benchmarks.puttsPerRound + tolerance.puttsPerRound,
    );

    expect(stats.greenInRegulationRate).toBeGreaterThanOrEqual(
      benchmarks.greenInRegulationRate - tolerance.greenInRegulationRate,
    );
    expect(stats.greenInRegulationRate).toBeLessThanOrEqual(
      benchmarks.greenInRegulationRate + tolerance.greenInRegulationRate,
    );

    expect(stats.fairwayHitRate).toBeGreaterThanOrEqual(
      benchmarks.fairwayHitRate - tolerance.fairwayHitRate,
    );
    expect(stats.fairwayHitRate).toBeLessThanOrEqual(
      benchmarks.fairwayHitRate + tolerance.fairwayHitRate,
    );

    expect(stats.expectedScoreRelativeToPar).toBeGreaterThanOrEqual(
      benchmarks.scoreRelativeToPar72 - tolerance.scoreRelativeToPar72,
    );
    expect(stats.expectedScoreRelativeToPar).toBeLessThanOrEqual(
      benchmarks.scoreRelativeToPar72 + tolerance.scoreRelativeToPar72,
    );

    expect(scrambleWhenMissedGir).toBeGreaterThanOrEqual(
      benchmarks.scrambleRate - tolerance.scrambleRateWhenMissedGir,
    );
    expect(scrambleWhenMissedGir).toBeLessThanOrEqual(
      benchmarks.scrambleRate + tolerance.scrambleRateWhenMissedGir,
    );

    expect(stats.averageDrivingDistanceYards).not.toBeNull();
    expect(stats.averageDrivingDistanceYards!).toBeGreaterThanOrEqual(
      benchmarks.drivingDistanceYards - tolerance.drivingDistanceYards,
    );
    expect(stats.averageDrivingDistanceYards!).toBeLessThanOrEqual(
      benchmarks.drivingDistanceYards + tolerance.drivingDistanceYards,
    );
  });
});
