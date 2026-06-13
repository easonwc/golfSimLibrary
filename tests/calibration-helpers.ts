import type {
  CalibrationTolerance,
  EliteTourBenchmarks,
} from "../src/calibration/index.js";
import type { GolferRoundStats } from "../src/modules/round-composer/index.js";
import { expect } from "vitest";

/** Asserts round stats fall within elite tour calibration bounds. */
export function expectEliteCalibrationStats(
  stats: GolferRoundStats,
  benchmarks: EliteTourBenchmarks,
  tolerance: CalibrationTolerance,
): void {
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
}
