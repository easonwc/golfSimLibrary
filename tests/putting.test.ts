import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import type { Golfer, Hole } from "../src/types/index.js";
import {
  estimateFirstPuttDistanceFeet,
  makeRateAtDistance,
  simulatePutting,
  simulatePuttsOnGreen,
} from "../src/modules/putting/index.js";
import { SeededRandom } from "../src/utils/random.js";

const tourPro: Golfer = {
  id: "pro-1",
  name: "Tour Pro",
  putting: { putting: 95, shortPutting: 96, lagPutting: 92 },
};

const highHandicap: Golfer = {
  id: "hh-1",
  name: "High Handicap",
  putting: { putting: 35, shortPutting: 30, lagPutting: 40 },
};

const sampleHole: Hole = {
  id: "hole-7",
  number: 7,
  par: 4,
  lengthYards: 410,
  green: {
    sizeSqFt: 5_200,
    speed: 11,
    slope: 0.3,
    pinDifficulty: 0.4,
  },
};

describe("putting validation", () => {
  it("rejects missing golfer", () => {
    expect(() =>
      simulatePutting({ hole: sampleHole }),
    ).toThrow(ValidationError);
  });

  it("rejects invalid putting skill", () => {
    expect(() =>
      simulatePutting({
        golfer: {
          id: "x",
          putting: { putting: 150, shortPutting: 50, lagPutting: 50 },
        },
        hole: sampleHole,
      }),
    ).toThrow(/putting must be <= 100/);
  });

  it("rejects invalid par", () => {
    expect(() =>
      simulatePutting({
        golfer: tourPro,
        hole: { ...sampleHole, par: 6 },
      }),
    ).toThrow(/hole.par must be 3, 4, or 5/);
  });

  it("rejects out-of-range first putt distance", () => {
    expect(() =>
      simulatePutting({
        golfer: tourPro,
        hole: sampleHole,
        firstPuttDistanceFeet: 200,
      }),
    ).toThrow(/firstPuttDistanceFeet must be <= 120/);
  });
});

describe("makeRateAtDistance", () => {
  it("returns higher make rate for short putts", () => {
    const short = makeRateAtDistance(4, tourPro, sampleHole);
    const long = makeRateAtDistance(30, tourPro, sampleHole);
    expect(short).toBeGreaterThan(long);
  });

  it("returns lower make rate for weaker golfers", () => {
    const pro = makeRateAtDistance(10, tourPro, sampleHole);
    const amateur = makeRateAtDistance(10, highHandicap, sampleHole);
    expect(pro).toBeGreaterThan(amateur);
  });

  it("returns lower make rate on harder greens", () => {
    const easyGreen: Hole = {
      ...sampleHole,
      green: { sizeSqFt: 6_000, speed: 9, slope: 0.1, pinDifficulty: 0.1 },
    };
    const hardGreen: Hole = {
      ...sampleHole,
      green: { sizeSqFt: 3_500, speed: 13, slope: 0.8, pinDifficulty: 0.9 },
    };
    const easy = makeRateAtDistance(12, tourPro, easyGreen);
    const hard = makeRateAtDistance(12, tourPro, hardGreen);
    expect(easy).toBeGreaterThan(hard);
  });
});

describe("estimateFirstPuttDistanceFeet", () => {
  it("estimates longer first putts on longer holes", () => {
    const short = estimateFirstPuttDistanceFeet({ ...sampleHole, lengthYards: 340 });
    const long = estimateFirstPuttDistanceFeet({ ...sampleHole, lengthYards: 480 });
    expect(long).toBeGreaterThan(short);
  });
});

describe("simulatePuttsOnGreen", () => {
  it("holes out in one putt from tap-in range with high probability", () => {
    let onePutts = 0;
    const trials = 500;
    const random = new SeededRandom(42);

    for (let i = 0; i < trials; i += 1) {
      if (simulatePuttsOnGreen(2, tourPro, sampleHole, random) === 1) {
        onePutts += 1;
      }
    }

    expect(onePutts / trials).toBeGreaterThan(0.85);
  });

  it("is reproducible with a fixed seed", () => {
    const a = simulatePuttsOnGreen(15, tourPro, sampleHole, new SeededRandom(99));
    const b = simulatePuttsOnGreen(15, tourPro, sampleHole, new SeededRandom(99));
    expect(a).toBe(b);
  });
});

describe("simulatePutting", () => {
  it("returns stats with expected shape", () => {
    const result = simulatePutting({
      golfer: tourPro,
      hole: sampleHole,
      firstPuttDistanceFeet: 20,
      trials: 1_000,
      seed: 7,
    });

    expect(result.stats.golferId).toBe(tourPro.id);
    expect(result.stats.holeId).toBe(sampleHole.id);
    expect(result.stats.trials).toBe(1_000);
    expect(result.stats.expectedPutts).toBeGreaterThan(1);
    expect(result.stats.expectedPutts).toBeLessThan(3.5);
    expect(result.stats.firstPuttMakeRate).toBeGreaterThan(0);
    expect(result.stats.firstPuttMakeRate).toBeLessThan(1);

    const { distribution } = result.stats;
    const totalProb =
      distribution.onePutt +
      distribution.twoPutt +
      distribution.threePutt +
      distribution.fourPlusPutt;
    expect(totalProb).toBeCloseTo(1, 5);
  });

  it("produces lower expected putts than a high-handicap golfer", () => {
    const base = {
      hole: sampleHole,
      firstPuttDistanceFeet: 25,
      trials: 2_000,
      seed: 123,
    };

    const proResult = simulatePutting({ ...base, golfer: tourPro });
    const hhResult = simulatePutting({ ...base, golfer: highHandicap });

    expect(proResult.stats.expectedPutts).toBeLessThan(
      hhResult.stats.expectedPutts,
    );
  });

  it("uses estimated first putt distance when not provided", () => {
    const result = simulatePutting({
      golfer: tourPro,
      hole: sampleHole,
      trials: 100,
      seed: 1,
    });

    expect(result.stats.averageFirstPuttDistanceFeet).toBe(
      estimateFirstPuttDistanceFeet(sampleHole),
    );
  });
});
