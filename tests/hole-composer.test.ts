import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import type { CompleteGolfer, CompleteHole } from "../src/types/index.js";
import {
  simulateHole,
  simulateHoleTrial,
} from "../src/modules/hole-composer/index.js";
import { SeededRandom } from "../src/utils/random.js";

const baseGolferAttributes = {
  putting: { putting: 88, shortPutting: 90, lagPutting: 86 },
  approach: {
    approach: 90,
    accuracy: 88,
    distanceControl: 91,
    dispersion: 89,
  },
  shortGame: {
    shortGame: 89,
    chipping: 90,
    bunkerPlay: 86,
    pitching: 88,
  },
  teeShot: {
    driving: 88,
    distance: 90,
    accuracy: 85,
    dispersion: 84,
  },
};

const tourPro: CompleteGolfer = {
  id: "pro-1",
  name: "Tour Pro",
  ...baseGolferAttributes,
};

const steadyAmateur: CompleteGolfer = {
  id: "am-1",
  name: "Steady Amateur",
  putting: { putting: 62, shortPutting: 60, lagPutting: 64 },
  approach: {
    approach: 58,
    accuracy: 55,
    distanceControl: 57,
    dispersion: 54,
  },
  shortGame: {
    shortGame: 56,
    chipping: 58,
    bunkerPlay: 50,
    pitching: 55,
  },
  teeShot: {
    driving: 60,
    distance: 58,
    accuracy: 62,
    dispersion: 55,
  },
};

const highHandicap: CompleteGolfer = {
  id: "hh-1",
  name: "High Handicap",
  putting: { putting: 34, shortPutting: 32, lagPutting: 36 },
  approach: {
    approach: 30,
    accuracy: 28,
    distanceControl: 27,
    dispersion: 29,
  },
  shortGame: {
    shortGame: 28,
    chipping: 26,
    bunkerPlay: 22,
    pitching: 30,
  },
  teeShot: {
    driving: 32,
    distance: 34,
    accuracy: 30,
    dispersion: 28,
  },
};

const par4Hole: CompleteHole = {
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
  shortGame: {
    roughDifficulty: 0.55,
    bunkerDifficulty: 0.6,
    collectionDifficulty: 0.35,
  },
  teeShot: {
    fairwayWidth: 0.55,
    roughDifficulty: 0.5,
    hazardDifficulty: 0.4,
  },
};

const par3Hole: CompleteHole = {
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
  shortGame: {
    roughDifficulty: 0.45,
    bunkerDifficulty: 0.55,
    collectionDifficulty: 0.4,
  },
};

const par5Hole: CompleteHole = {
  id: "hole-12",
  number: 12,
  par: 5,
  lengthYards: 545,
  green: {
    sizeSqFt: 6_000,
    speed: 10,
    slope: 0.25,
    pinDifficulty: 0.3,
  },
  approach: {
    landingDifficulty: 0.25,
    elevationPenalty: 0.15,
  },
  shortGame: {
    roughDifficulty: 0.35,
    bunkerDifficulty: 0.3,
    collectionDifficulty: 0.25,
  },
  teeShot: {
    fairwayWidth: 0.7,
    roughDifficulty: 0.35,
    hazardDifficulty: 0.25,
  },
};

describe("hole composer validation", () => {
  it("rejects empty golfers array", () => {
    expect(() =>
      simulateHole({ hole: par4Hole, golfers: [] }),
    ).toThrow(/at least 1 golfer/);
  });

  it("rejects more than 4 golfers", () => {
    expect(() =>
      simulateHole({
        hole: par4Hole,
        golfers: [tourPro, steadyAmateur, highHandicap, tourPro, steadyAmateur].map(
          (g, i) => ({ ...g, id: `g-${i}` }),
        ),
      }),
    ).toThrow(/at most 4 golfers/);
  });

  it("rejects duplicate golfer ids", () => {
    expect(() =>
      simulateHole({
        hole: par4Hole,
        golfers: [tourPro, { ...steadyAmateur, id: tourPro.id }],
      }),
    ).toThrow(/duplicate golfer id/);
  });

  it("rejects golfers missing required attributes", () => {
    expect(() =>
      simulateHole({
        hole: par4Hole,
        golfers: [{ id: "x", putting: tourPro.putting }],
      }),
    ).toThrow(/golfers\[0\].approach must be an object/);
  });

  it("requires teeShot on par 4/5 golfers", () => {
    expect(() =>
      simulateHole({
        hole: par4Hole,
        golfers: [
          {
            id: "no-tee",
            putting: tourPro.putting,
            approach: tourPro.approach,
            shortGame: tourPro.shortGame,
          },
        ],
      }),
    ).toThrow(/golfers\[0\].teeShot must be an object/);
  });

  it("requires hole.shortGame and hole.approach", () => {
    expect(() =>
      simulateHole({
        hole: { ...par4Hole, shortGame: undefined },
        golfers: [tourPro],
      }),
    ).toThrow(/hole.shortGame must be an object/);
  });

  it("requires hole.teeShot on par 4/5", () => {
    expect(() =>
      simulateHole({
        hole: { ...par4Hole, teeShot: undefined },
        golfers: [tourPro],
      }),
    ).toThrow(/hole.teeShot must be an object/);
  });

  it("does not require teeShot on par 3 hole or golfers", () => {
    expect(() =>
      simulateHole({
        hole: par3Hole,
        golfers: [
          {
            id: "par3-player",
            putting: tourPro.putting,
            approach: tourPro.approach,
            shortGame: tourPro.shortGame,
          },
        ],
        trials: 100,
        seed: 1,
      }),
    ).not.toThrow();
  });
});

describe("simulateHoleTrial", () => {
  it("returns a complete trial outcome", () => {
    const outcome = simulateHoleTrial(
      tourPro,
      par4Hole,
      new SeededRandom(7),
    );

    expect(outcome.totalStrokes).toBeGreaterThanOrEqual(2);
    expect(outcome.putts).toBeGreaterThanOrEqual(1);
    expect(outcome.strokesToGreen).toBeGreaterThanOrEqual(2);
    expect(outcome.fairwayHit).toEqual(expect.any(Boolean));
    expect(outcome.drivingDistanceYards).toBeGreaterThan(140);
    expect(outcome.scoreRelativeToPar).toBe(
      outcome.totalStrokes - par4Hole.par,
    );
  });

  it("has null fairway hit on par 3", () => {
    const outcome = simulateHoleTrial(
      tourPro,
      par3Hole,
      new SeededRandom(7),
    );
    expect(outcome.fairwayHit).toBeNull();
    expect(outcome.drivingDistanceYards).toBeNull();
    expect(outcome.strokesToGreen).toBeGreaterThanOrEqual(1);
    expect(outcome.strokesToGreen).toBeLessThanOrEqual(3);
  });
});

describe("simulateHole", () => {
  it("returns stats for each golfer with expected shape", () => {
    const result = simulateHole({
      hole: par4Hole,
      golfers: [tourPro, steadyAmateur],
      trials: 2_000,
      seed: 11,
    });

    expect(result.holeId).toBe(par4Hole.id);
    expect(result.par).toBe(4);
    expect(result.golferStats).toHaveLength(2);
    expect(result.golferStats[0]?.golferId).toBe(tourPro.id);
    expect(result.golferStats[1]?.golferId).toBe(steadyAmateur.id);

    for (const stats of result.golferStats) {
      expect(stats.trials).toBe(2_000);
      expect(stats.expectedScore).toBeGreaterThan(2);
      expect(stats.expectedScore).toBeLessThan(8);
      expect(stats.expectedScoreRelativeToPar).toBe(
        stats.expectedScore - par4Hole.par,
      );
      expect(stats.averagePutts).toBeGreaterThan(1);
      expect(stats.fairwayHitRate).not.toBeNull();
      expect(stats.greenInRegulationRate).toBeGreaterThan(0);
      expect(stats.greenInRegulationRate).toBeLessThan(1);

      const dist = stats.scoreDistribution;
      const total =
        dist.eagleOrBetter +
        dist.birdie +
        dist.par +
        dist.bogey +
        dist.doubleBogey +
        dist.tripleOrWorse;
      expect(total).toBeCloseTo(1, 5);
    }
  });

  it("scores better for a tour pro than a high-handicap golfer", () => {
    const result = simulateHole({
      hole: par4Hole,
      golfers: [tourPro, highHandicap],
      trials: 3_000,
      seed: 99,
    });

    const proStats = result.golferStats.find((s) => s.golferId === tourPro.id)!;
    const hhStats = result.golferStats.find(
      (s) => s.golferId === highHandicap.id,
    )!;

    expect(proStats.expectedScore).toBeLessThan(hhStats.expectedScore);
    expect(proStats.greenInRegulationRate).toBeGreaterThan(
      hhStats.greenInRegulationRate,
    );
    expect(proStats.fairwayHitRate!).toBeGreaterThan(hhStats.fairwayHitRate!);
  });

  it("supports 1, 2, 3, and 4 golfers", () => {
    const foursome = [
      tourPro,
      { ...steadyAmateur, id: "am-2" },
      { ...steadyAmateur, id: "am-3" },
      highHandicap,
    ];

    const result = simulateHole({
      hole: par5Hole,
      golfers: foursome,
      trials: 500,
      seed: 5,
    });

    expect(result.golferStats).toHaveLength(4);
  });

  it("is reproducible with a fixed seed", () => {
    const base = {
      hole: par4Hole,
      golfers: [tourPro],
      trials: 100,
      seed: 42,
    };

    const a = simulateHole(base);
    const b = simulateHole(base);

    expect(a.golferStats[0]?.expectedScore).toBe(
      b.golferStats[0]?.expectedScore,
    );
  });

  it("simulates par 3 without tee shots", () => {
    const result = simulateHole({
      hole: par3Hole,
      golfers: [
        {
          id: "par3-only",
          putting: tourPro.putting,
          approach: tourPro.approach,
          shortGame: tourPro.shortGame,
        },
      ],
      trials: 1_000,
      seed: 3,
    });

    expect(result.golferStats[0]?.fairwayHitRate).toBeNull();
    expect(result.golferStats[0]?.expectedScore).toBeGreaterThan(2);
  });
});
