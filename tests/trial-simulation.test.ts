import { describe, expect, it } from "vitest";
import {
  accumulateRoundTrial,
  aggregateGolferRoundStats,
  createRoundStatsAccumulator,
  finalizeRoundStatsAccumulator,
  iterateRoundTrials,
  simulateRoundTrial,
} from "../src/modules/round-composer/index.js";
import { createSampleCourse } from "../src/fixtures/index.js";
import { createUniformClubAttributes } from "../src/clubs/index.js";

const eliteGolfer = {
  id: "elite",
  gender: "male" as const,
  putting: { putting: 99, shortPutting: 99, lagPutting: 99 },
  approach: { approach: 99, accuracy: 99, distanceControl: 99, dispersion: 99 },
  shortGame: { shortGame: 99, chipping: 99, bunkerPlay: 99, pitching: 99 },
  teeShot: { driving: 99, distance: 99, accuracy: 99, dispersion: 99 },
  clubs: createUniformClubAttributes(99),
};

describe("iterateRoundTrials", () => {
  it("does not retain outcomes after iteration", () => {
    const course = createSampleCourse();
    let count = 0;

    for (const _outcome of iterateRoundTrials(eliteGolfer, course, {
      trials: 100,
      seed: 7,
    })) {
      count += 1;
    }

    expect(count).toBe(100);
  });
});

describe("round stats accumulators", () => {
  it("matches aggregateGolferRoundStats for the same trials", () => {
    const course = createSampleCourse();
    const trials = 200;
    const kept = [...iterateRoundTrials(eliteGolfer, course, { trials, seed: 3 })];

    const fromArray = aggregateGolferRoundStats(
      eliteGolfer,
      course,
      kept,
      trials,
    );

    const accumulator = createRoundStatsAccumulator(course.length);
    for (const outcome of kept) {
      accumulateRoundTrial(accumulator, outcome);
    }
    const fromAccumulator = finalizeRoundStatsAccumulator(
      accumulator,
      eliteGolfer,
      course,
    );

    expect(fromAccumulator.expectedScore).toBe(fromArray.expectedScore);
    expect(fromAccumulator.averagePuttsPerRound).toBe(
      fromArray.averagePuttsPerRound,
    );
    expect(fromAccumulator.greenInRegulationRate).toBe(
      fromArray.greenInRegulationRate,
    );
  });

  it("supports incremental aggregation without storing all trials", () => {
    const course = createSampleCourse();
    const accumulator = createRoundStatsAccumulator(course.length);

    for (const outcome of iterateRoundTrials(eliteGolfer, course, {
      trials: 150,
      seed: 11,
    })) {
      accumulateRoundTrial(accumulator, outcome);
    }

    const stats = finalizeRoundStatsAccumulator(accumulator, eliteGolfer, course);
    expect(stats.trials).toBe(150);
    expect(stats.expectedScore).toBeGreaterThan(60);
  });

  it("simulateRoundTrial produces one complete round outcome", () => {
    const course = createSampleCourse();
    const outcome = simulateRoundTrial(
      eliteGolfer,
      course,
      { next: () => 0.5 },
    );
    expect(outcome.holeStrokes).toHaveLength(18);
    expect(outcome.totalStrokes).toBeGreaterThan(0);
  });
});
