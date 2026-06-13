import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import type { Golfer, Hole } from "../src/types/index.js";
import {
  calculateDispersionSigmas,
  effectiveGreenRadiusFeet,
  estimateRemainingDistanceYards,
  simulateApproach,
  simulateApproachShot,
} from "../src/modules/approach/index.js";
import { simulatePutting } from "../src/modules/putting/index.js";
import { SeededRandom } from "../src/utils/random.js";

const tourPro: Golfer = {
  id: "pro-1",
  name: "Tour Pro",
  approach: {
    approach: 94,
    accuracy: 93,
    distanceControl: 95,
    dispersion: 92,
  },
};

const highHandicap: Golfer = {
  id: "hh-1",
  name: "High Handicap",
  approach: {
    approach: 32,
    accuracy: 30,
    distanceControl: 28,
    dispersion: 35,
  },
};

const par4Hole: Hole = {
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
  approach: {
    landingDifficulty: 0.35,
    elevationPenalty: 0.2,
  },
};

const par3Hole: Hole = {
  id: "hole-3",
  number: 3,
  par: 3,
  lengthYards: 185,
  green: {
    sizeSqFt: 4_800,
    speed: 10,
    slope: 0.2,
    pinDifficulty: 0.5,
  },
  approach: {
    landingDifficulty: 0.5,
    elevationPenalty: 0.3,
  },
};

describe("approach validation", () => {
  it("rejects missing golfer", () => {
    expect(() => simulateApproach({ hole: par4Hole })).toThrow(ValidationError);
  });

  it("rejects missing hole.approach", () => {
    expect(() =>
      simulateApproach({
        golfer: tourPro,
        hole: { ...par4Hole, approach: undefined },
      }),
    ).toThrow(/hole.approach must be an object/);
  });

  it("rejects invalid approach skill", () => {
    expect(() =>
      simulateApproach({
        golfer: {
          id: "x",
          approach: {
            approach: 110,
            accuracy: 50,
            distanceControl: 50,
            dispersion: 50,
          },
        },
        hole: par4Hole,
      }),
    ).toThrow(/approach must be <= 100/);
  });

  it("rejects out-of-range remaining distance", () => {
    expect(() =>
      simulateApproach({
        golfer: tourPro,
        hole: par4Hole,
        remainingDistanceYards: 10,
      }),
    ).toThrow(/remainingDistanceYards must be >= 20/);
  });
});

describe("estimateRemainingDistanceYards", () => {
  it("uses full hole length on par 3", () => {
    expect(estimateRemainingDistanceYards(par3Hole)).toBe(185);
  });

  it("estimates longer approaches on longer par 4s", () => {
    const short = estimateRemainingDistanceYards({
      ...par4Hole,
      lengthYards: 340,
    });
    const long = estimateRemainingDistanceYards({
      ...par4Hole,
      lengthYards: 480,
    });
    expect(long).toBeGreaterThan(short);
  });
});

describe("calculateDispersionSigmas", () => {
  it("produces tighter dispersion for skilled golfers", () => {
    const pro = calculateDispersionSigmas(tourPro, par4Hole, 165);
    const amateur = calculateDispersionSigmas(highHandicap, par4Hole, 165);
    expect(pro.depthYards).toBeLessThan(amateur.depthYards);
    expect(pro.lateralYards).toBeLessThan(amateur.lateralYards);
  });

  it("produces wider dispersion on harder landing areas", () => {
    const easy = calculateDispersionSigmas(tourPro, par4Hole, 165);
    const hard = calculateDispersionSigmas(tourPro, {
      ...par4Hole,
      approach: { landingDifficulty: 0.9, elevationPenalty: 0.8 },
    }, 165);
    expect(hard.depthYards).toBeGreaterThan(easy.depthYards);
    expect(hard.lateralYards).toBeGreaterThan(easy.lateralYards);
  });
});

describe("simulateApproachShot", () => {
  it("lands on the green more often for a tour pro than a high-handicap", () => {
    const trials = 1_000;
    let proHits = 0;
    let hhHits = 0;
    const proRandom = new SeededRandom(42);
    const hhRandom = new SeededRandom(42);

    for (let i = 0; i < trials; i += 1) {
      if (simulateApproachShot(tourPro, par4Hole, 165, proRandom).onGreen) {
        proHits += 1;
      }
      if (simulateApproachShot(highHandicap, par4Hole, 165, hhRandom).onGreen) {
        hhHits += 1;
      }
    }

    expect(proHits / trials).toBeGreaterThan(hhHits / trials);
  });

  it("is reproducible with a fixed seed", () => {
    const a = simulateApproachShot(
      tourPro,
      par4Hole,
      165,
      new SeededRandom(77),
    );
    const b = simulateApproachShot(
      tourPro,
      par4Hole,
      165,
      new SeededRandom(77),
    );
    expect(a).toEqual(b);
  });
});

describe("simulateApproach", () => {
  it("returns stats with expected shape", () => {
    const result = simulateApproach({
      golfer: tourPro,
      hole: par4Hole,
      remainingDistanceYards: 165,
      trials: 2_000,
      seed: 11,
    });

    expect(result.stats.golferId).toBe(tourPro.id);
    expect(result.stats.holeId).toBe(par4Hole.id);
    expect(result.stats.trials).toBe(2_000);
    expect(result.stats.greenHitRate).toBeGreaterThan(0);
    expect(result.stats.greenHitRate).toBeLessThan(1);
    expect(result.stats.averageFirstPuttDistanceFeet).toBe(
      result.stats.averageProximityFeet,
    );

    const dist = result.stats.outcomeDistribution;
    const total =
      dist.onGreen +
      dist.missShort +
      dist.missLong +
      dist.missLeft +
      dist.missRight;
    expect(total).toBeCloseTo(1, 5);
  });

  it("hits more greens and leaves closer putts for a tour pro", () => {
    const base = {
      hole: par4Hole,
      remainingDistanceYards: 170,
      trials: 3_000,
      seed: 99,
    };

    const proResult = simulateApproach({ ...base, golfer: tourPro });
    const hhResult = simulateApproach({ ...base, golfer: highHandicap });

    expect(proResult.stats.greenHitRate).toBeGreaterThan(
      hhResult.stats.greenHitRate,
    );
    expect(proResult.stats.averageProximityFeet).toBeLessThan(
      hhResult.stats.averageProximityFeet,
    );
  });

  it("uses estimated approach distance when not provided", () => {
    const result = simulateApproach({
      golfer: tourPro,
      hole: par4Hole,
      trials: 100,
      seed: 5,
    });

    expect(result.stats.averageApproachDistanceYards).toBe(
      estimateRemainingDistanceYards(par4Hole),
    );
  });

  it("shrinks effective green radius on tucked pins", () => {
    const easyPin = effectiveGreenRadiusFeet({
      ...par4Hole,
      green: { ...par4Hole.green, pinDifficulty: 0.1 },
    });
    const hardPin = effectiveGreenRadiusFeet({
      ...par4Hole,
      green: { ...par4Hole.green, pinDifficulty: 0.9 },
    });
    expect(hardPin).toBeLessThan(easyPin);
  });
});

describe("approach → putting integration", () => {
  it("feeds average first-putt distance from approach into putting", () => {
    const approachResult = simulateApproach({
      golfer: tourPro,
      hole: par4Hole,
      remainingDistanceYards: 160,
      trials: 2_000,
      seed: 21,
    });

    const puttingResult = simulatePutting({
      golfer: {
        id: tourPro.id,
        putting: { putting: 90, shortPutting: 90, lagPutting: 88 },
      },
      hole: par4Hole,
      firstPuttDistanceFeet: approachResult.stats.averageFirstPuttDistanceFeet,
      trials: 1_000,
      seed: 21,
    });

    expect(puttingResult.stats.averageFirstPuttDistanceFeet).toBe(
      approachResult.stats.averageFirstPuttDistanceFeet,
    );
    expect(puttingResult.stats.expectedPutts).toBeGreaterThan(1);
  });
});
