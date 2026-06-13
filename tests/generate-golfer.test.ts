import { describe, expect, it } from "vitest";
import {
  generateRandomGolferAttributes,
  generateRandomGolfers,
} from "../src/utils/generate-golfer.js";
import { simulateRound } from "../src/modules/round-composer/index.js";
import { createSampleCourse } from "../src/fixtures/index.js";

function expectRatingsInRange(
  attrs: ReturnType<typeof generateRandomGolferAttributes>,
): void {
  const groups = [
    Object.values(attrs.putting),
    Object.values(attrs.approach),
    Object.values(attrs.shortGame),
    Object.values(attrs.clubs),
    Object.values(attrs.teeShot),
  ];

  for (const ratings of groups) {
    for (const rating of ratings) {
      expect(rating).toBeGreaterThanOrEqual(0);
      expect(rating).toBeLessThanOrEqual(99);
      expect(Number.isInteger(rating)).toBe(true);
    }
  }
}

describe("generateRandomGolferAttributes", () => {
  it("returns all skill groups with integer ratings from 0 to 99", () => {
    expectRatingsInRange(generateRandomGolferAttributes());
  });

  it("is reproducible with a seed", () => {
    const a = generateRandomGolferAttributes({ seed: 123 });
    const b = generateRandomGolferAttributes({ seed: 123 });
    expect(a).toEqual(b);
  });

  it("spreads into a caller-defined profile object", () => {
    const player = {
      id: "human-1",
      name: "Alex",
      gender: "F",
      birthday: "1992-04-18",
      ...generateRandomGolferAttributes({ seed: 7 }),
    };

    expect(player.name).toBe("Alex");
    expect(player.gender).toBe("F");
    expect(player.putting.putting).toBeGreaterThanOrEqual(0);
    expect(player.clubs.driver).toBeLessThanOrEqual(99);
    expect(player.teeShot.driving).toBeGreaterThanOrEqual(0);
  });

  it("produces simulatable golfers when merged with id", () => {
    const course = createSampleCourse();
    const profile = generateRandomGolferAttributes({ seed: 99 });

    const result = simulateRound({
      course,
      golfers: [{ id: "random-1", ...profile }],
      trials: 200,
      seed: 1,
    });

    expect(result.golferStats).toHaveLength(1);
    expect(result.golferStats[0]?.expectedScore).toBeGreaterThan(60);
  });
});

describe("generateRandomGolfers", () => {
  it("returns the requested number of attribute sets", () => {
    const golfers = generateRandomGolfers(4, { seed: 55 });
    expect(golfers).toHaveLength(4);
    for (const attrs of golfers) {
      expectRatingsInRange(attrs);
    }
  });

  it("derives distinct seeds for each golfer in a batch", () => {
    const golfers = generateRandomGolfers(3, { seed: 10 });
    expect(golfers[0]).not.toEqual(golfers[1]);
    expect(golfers[1]).not.toEqual(golfers[2]);
  });

  it("rejects non-positive counts", () => {
    expect(() => generateRandomGolfers(0)).toThrow(RangeError);
  });
});
