import { describe, expect, it } from "vitest";
import { parseGolferProfileFields } from "../src/validation/golfer-profile.js";
import { ValidationError } from "../src/errors.js";
import { simulateRound } from "../src/modules/round-composer/index.js";
import { createUniformClubAttributes } from "../src/clubs/index.js";
import { createSampleCourse } from "../src/fixtures/index.js";

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
    const result = simulateRound({
      course,
      golfers: [
        {
          id: "female-elite",
          gender: "female",
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
        },
      ],
      trials: 1500,
      seed: 42,
    });

    const drive = result.golferStats[0]!.averageDrivingDistanceYards!;
    expect(drive).toBeGreaterThanOrEqual(255);
    expect(drive).toBeLessThanOrEqual(275);
  });
});
