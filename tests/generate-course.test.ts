import { describe, expect, it } from "vitest";
import { validateRoundComposerInput } from "../src/modules/round-composer/validate.js";
import { simulateRound } from "../src/modules/round-composer/index.js";
import { ROUND_HOLE_COUNT } from "../src/types/index.js";
import { sampleTourPro } from "../src/fixtures/index.js";
import {
  averageCourseHardness,
  countPars,
  generateRandomCourse,
} from "../src/utils/generate-course.js";

describe("generateRandomCourse", () => {
  it("builds 18 holes with the requested par-3 and par-5 counts", () => {
    const course = generateRandomCourse({ parThrees: 4, parFives: 4, seed: 1 });

    expect(course).toHaveLength(ROUND_HOLE_COUNT);
    expect(countPars(course)).toEqual({
      parThrees: 4,
      parFours: 10,
      parFives: 4,
    });
  });

  it("randomizes hole attributes within valid ranges", () => {
    const course = generateRandomCourse({ parThrees: 3, parFives: 3, seed: 2 });
    const par4 = course.find((hole) => hole.par === 4)!;
    const par3 = course.find((hole) => hole.par === 3)!;

    expect(par4.lengthYards).toBeGreaterThanOrEqual(320);
    expect(par4.teeShot).toBeDefined();
    expect(par3.lengthYards).toBeGreaterThanOrEqual(120);
    expect(par3.teeShot).toBeUndefined();

    for (const hole of course) {
      expect(hole.green.sizeSqFt).toBeGreaterThanOrEqual(3_200);
      expect(hole.green.sizeSqFt).toBeLessThanOrEqual(6_200);
      expect(hole.green.speed).toBeGreaterThanOrEqual(8);
      expect(hole.green.speed).toBeLessThanOrEqual(14);
      expect(hole.green.slope).toBeGreaterThanOrEqual(0);
      expect(hole.green.slope).toBeLessThanOrEqual(1);
      expect(hole.approach.landingDifficulty).toBeLessThanOrEqual(1);
      expect(hole.shortGame.bunkerDifficulty).toBeLessThanOrEqual(1);
    }
  });

  it("is reproducible with a seed", () => {
    const a = generateRandomCourse({ parThrees: 4, parFives: 4, seed: 99 });
    const b = generateRandomCourse({ parThrees: 4, parFives: 4, seed: 99 });
    expect(a).toEqual(b);
  });

  it("passes round composer validation and simulates", () => {
    const course = generateRandomCourse({ parThrees: 4, parFives: 4, seed: 5 });

    expect(() =>
      validateRoundComposerInput({
        course,
        golfers: [sampleTourPro],
        trials: 100,
      }),
    ).not.toThrow();

    const result = simulateRound({
      course,
      golfers: [sampleTourPro],
      trials: 200,
      seed: 1,
    });

    expect(result.coursePar).toBe(72);
    expect(result.golferStats).toHaveLength(1);
  });

  it("rejects par counts that exceed 18 holes", () => {
    expect(() =>
      generateRandomCourse({ parThrees: 10, parFives: 10 }),
    ).toThrow(RangeError);
  });

  it("defaults difficulty to medium", () => {
    const implicit = generateRandomCourse({ parThrees: 4, parFives: 4, seed: 99 });
    const explicit = generateRandomCourse({
      parThrees: 4,
      parFives: 4,
      difficulty: "medium",
      seed: 99,
    });
    expect(implicit).toEqual(explicit);
  });

  it("skews generated courses easier or harder by difficulty", () => {
    const base = { parThrees: 4, parFives: 4, seed: 77 };
    const easy = generateRandomCourse({ ...base, difficulty: "easy" });
    const medium = generateRandomCourse({ ...base, difficulty: "medium" });
    const hard = generateRandomCourse({ ...base, difficulty: "hard" });

    expect(averageCourseHardness(easy)).toBeLessThan(averageCourseHardness(medium));
    expect(averageCourseHardness(medium)).toBeLessThan(averageCourseHardness(hard));
  });

  it("rejects invalid difficulty values", () => {
    expect(() =>
      generateRandomCourse({
        parThrees: 4,
        parFives: 4,
        // @ts-expect-error invalid difficulty for runtime guard test
        difficulty: "extreme",
      }),
    ).toThrow(RangeError);
  });
});
