import { describe, expect, it } from "vitest";
import { parseGolferProfileFields } from "../src/validation/golfer-profile.js";
import { ValidationError } from "../src/errors.js";
import {
  accumulateRoundTrial,
  createRoundStatsAccumulator,
  finalizeRoundStatsAccumulator,
  simulateRoundTrial,
} from "../src/modules/round-composer/index.js";
import { createUniformClubAttributes } from "../src/clubs/index.js";
import { createSampleCourse } from "../src/fixtures/index.js";
import { createRandomSource } from "../src/utils/random.js";

describe("parseGolferProfileFields", () => {
  it("accepts male and female gender values", () => {
    expect(parseGolferProfileFields({ gender: "female" }, "golfer").gender).toBe(
      "female",
    );
    expect(parseGolferProfileFields({ gender: "male" }, "golfer").gender).toBe(
      "male",
    );
  });

  it("rejects invalid gender values", () => {
    expect(() =>
      parseGolferProfileFields({ gender: "other" }, "golfer"),
    ).toThrow(ValidationError);
  });
});

describe("round composer gender preservation", () => {
  it("preserves gender through validation for distance simulation", () => {
    const course = createSampleCourse();
    const golfer = {
      id: "female-elite",
      gender: "female" as const,
      putting: { putting: 99, shortPutting: 99, lagPutting: 99 },
      approach: {
        approach: 99,
        accuracy: 99,
        distanceControl: 99,
        dispersion: 99,
      },
      shortGame: {
        shortGame: 99,
        chipping: 99,
        bunkerPlay: 99,
        pitching: 99,
      },
      teeShot: {
        driving: 99,
        distance: 99,
        accuracy: 99,
        dispersion: 99,
      },
      clubs: createUniformClubAttributes(99),
    };
    const random = createRandomSource(42);
    const accumulator = createRoundStatsAccumulator(course.length);

    for (let i = 0; i < 1500; i += 1) {
      accumulateRoundTrial(
        accumulator,
        simulateRoundTrial(golfer, course, random),
      );
    }

    const stats = finalizeRoundStatsAccumulator(accumulator, golfer, course);
    const drive = stats.averageDrivingDistanceYards!;
    expect(drive).toBeGreaterThanOrEqual(255);
    expect(drive).toBeLessThanOrEqual(275);
  });
});
