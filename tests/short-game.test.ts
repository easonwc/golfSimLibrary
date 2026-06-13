import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import type { Golfer, Hole } from "../src/types/index.js";
import {
  simulateApproach,
  simulateApproachShot,
} from "../src/modules/approach/index.js";
import { simulatePutting } from "../src/modules/putting/index.js";
import {
  calculateShortGameDispersionFeet,
  inferLieFromApproachMiss,
  simulateShortGame,
  simulateShortGameShot,
} from "../src/modules/short-game/index.js";
import { SeededRandom } from "../src/utils/random.js";

const tourPro: Golfer = {
  id: "pro-1",
  name: "Tour Pro",
  shortGame: {
    shortGame: 93,
    chipping: 94,
    bunkerPlay: 90,
    pitching: 91,
  },
};

const highHandicap: Golfer = {
  id: "hh-1",
  name: "High Handicap",
  shortGame: {
    shortGame: 34,
    chipping: 30,
    bunkerPlay: 25,
    pitching: 38,
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
  shortGame: {
    roughDifficulty: 0.55,
    bunkerDifficulty: 0.6,
    collectionDifficulty: 0.35,
  },
};

describe("short game validation", () => {
  it("rejects missing golfer", () => {
    expect(() =>
      simulateShortGame({
        hole: par4Hole,
        missDistanceYards: 12,
        lie: "rough",
      }),
    ).toThrow(ValidationError);
  });

  it("rejects missing hole.shortGame", () => {
    expect(() =>
      simulateShortGame({
        golfer: tourPro,
        hole: { ...par4Hole, shortGame: undefined },
        missDistanceYards: 12,
        lie: "rough",
      }),
    ).toThrow(/hole.shortGame must be an object/);
  });

  it("rejects invalid lie", () => {
    expect(() =>
      simulateShortGame({
        golfer: tourPro,
        hole: par4Hole,
        missDistanceYards: 12,
        lie: "water",
      }),
    ).toThrow(/lie must be one of/);
  });

  it("rejects out-of-range miss distance", () => {
    expect(() =>
      simulateShortGame({
        golfer: tourPro,
        hole: par4Hole,
        missDistanceYards: 2,
        lie: "fringe",
      }),
    ).toThrow(/missDistanceYards must be >= 3/);
  });
});

describe("calculateShortGameDispersionFeet", () => {
  it("produces tighter dispersion for skilled golfers", () => {
    const pro = calculateShortGameDispersionFeet(
      tourPro,
      par4Hole,
      12,
      "fringe",
    );
    const amateur = calculateShortGameDispersionFeet(
      highHandicap,
      par4Hole,
      12,
      "fringe",
    );
    expect(pro).toBeLessThan(amateur);
  });

  it("produces wider dispersion from harder lies", () => {
    const fringe = calculateShortGameDispersionFeet(
      tourPro,
      par4Hole,
      12,
      "fringe",
    );
    const bunker = calculateShortGameDispersionFeet(
      tourPro,
      par4Hole,
      12,
      "bunker",
    );
    const deepRough = calculateShortGameDispersionFeet(
      tourPro,
      par4Hole,
      12,
      "deepRough",
    );
    expect(fringe).toBeLessThan(bunker);
    expect(bunker).toBeLessThan(deepRough);
  });
});

describe("inferLieFromApproachMiss", () => {
  it("infers bunker for short misses near bunkered greens", () => {
    expect(
      inferLieFromApproachMiss("missShort", 15, par4Hole),
    ).toBe("bunker");
  });

  it("infers deep rough for long misses on thick rough", () => {
    expect(
      inferLieFromApproachMiss("missLong", 30, {
        ...par4Hole,
        shortGame: {
          roughDifficulty: 0.85,
          bunkerDifficulty: 0.1,
          collectionDifficulty: 0.5,
        },
      }),
    ).toBe("deepRough");
  });

  it("infers fringe for short-side misses on forgiving lies", () => {
    expect(
      inferLieFromApproachMiss("missShort", 12, {
        ...par4Hole,
        shortGame: {
          roughDifficulty: 0.2,
          bunkerDifficulty: 0.1,
          collectionDifficulty: 0.1,
        },
      }),
    ).toBe("fringe");
  });
});

describe("simulateShortGameShot", () => {
  it("gets on the green more often for a tour pro than a high-handicap", () => {
    const trials = 2_000;
    let proHits = 0;
    let hhHits = 0;
    const proRandom = new SeededRandom(42);
    const hhRandom = new SeededRandom(42);

    for (let i = 0; i < trials; i += 1) {
      if (
        simulateShortGameShot(tourPro, par4Hole, 14, "bunker", proRandom).onGreen
      ) {
        proHits += 1;
      }
      if (
        simulateShortGameShot(
          highHandicap,
          par4Hole,
          14,
          "bunker",
          hhRandom,
        ).onGreen
      ) {
        hhHits += 1;
      }
    }

    expect(proHits / trials).toBeGreaterThan(hhHits / trials);
  });

  it("is reproducible with a fixed seed", () => {
    const a = simulateShortGameShot(
      tourPro,
      par4Hole,
      10,
      "fringe",
      new SeededRandom(55),
    );
    const b = simulateShortGameShot(
      tourPro,
      par4Hole,
      10,
      "fringe",
      new SeededRandom(55),
    );
    expect(a).toEqual(b);
  });
});

describe("simulateShortGame", () => {
  it("returns stats with expected shape", () => {
    const result = simulateShortGame({
      golfer: tourPro,
      hole: par4Hole,
      missDistanceYards: 14,
      lie: "bunker",
      trials: 2_000,
      seed: 8,
    });

    expect(result.stats.golferId).toBe(tourPro.id);
    expect(result.stats.holeId).toBe(par4Hole.id);
    expect(result.stats.lie).toBe("bunker");
    expect(result.stats.trials).toBe(2_000);
    expect(result.stats.greenHitRate).toBeGreaterThan(0);
    expect(result.stats.greenHitRate).toBeLessThan(1);
    expect(result.stats.averageFirstPuttDistanceFeet).toBe(
      result.stats.averageProximityFeet,
    );

    const dist = result.stats.outcomeDistribution;
    expect(dist.onGreen + dist.stillOffGreen).toBeCloseTo(1, 5);
  });

  it("converts more scrambles and leaves shorter putts for a tour pro", () => {
    const base = {
      hole: par4Hole,
      missDistanceYards: 18,
      lie: "bunker" as const,
      trials: 3_000,
      seed: 44,
    };

    const proResult = simulateShortGame({ ...base, golfer: tourPro });
    const hhResult = simulateShortGame({ ...base, golfer: highHandicap });

    expect(proResult.stats.greenHitRate).toBeGreaterThan(
      hhResult.stats.greenHitRate,
    );
    expect(proResult.stats.averageProximityFeet).toBeLessThan(
      hhResult.stats.averageProximityFeet,
    );
  });
});

describe("approach → short game → putting integration", () => {
  it("wires a missed approach through short game into putting", () => {
    const approachRandom = new SeededRandom(100);
    let missDistanceYards = 0;
    let missDirection: "missShort" | "missLong" | "missLeft" | "missRight" =
      "missShort";

    for (let i = 0; i < 50; i += 1) {
      const shot = simulateApproachShot(
        {
          id: "hh-approach",
          approach: {
            approach: 30,
            accuracy: 28,
            distanceControl: 25,
            dispersion: 32,
          },
        },
        {
          ...par4Hole,
          approach: par4Hole.approach!,
        },
        165,
        approachRandom,
      );
      if (!shot.onGreen && shot.missDirection && shot.missDistanceYards) {
        missDistanceYards = shot.missDistanceYards;
        missDirection = shot.missDirection;
        break;
      }
    }

    expect(missDistanceYards).toBeGreaterThan(0);

    const lie = inferLieFromApproachMiss(
      missDirection,
      missDistanceYards,
      par4Hole,
    );

    const shortGameResult = simulateShortGame({
      golfer: tourPro,
      hole: par4Hole,
      missDistanceYards,
      lie,
      trials: 2_000,
      seed: 100,
    });

    expect(shortGameResult.stats.greenHitRate).toBeGreaterThan(0);

    const puttingResult = simulatePutting({
      golfer: {
        id: tourPro.id,
        putting: { putting: 90, shortPutting: 92, lagPutting: 88 },
      },
      hole: par4Hole,
      firstPuttDistanceFeet:
        shortGameResult.stats.averageFirstPuttDistanceFeet,
      trials: 1_000,
      seed: 100,
    });

    expect(puttingResult.stats.expectedPutts).toBeGreaterThan(1);
  });

  it("uses approach miss stats to parameterize short game", () => {
    const approachResult = simulateApproach({
      golfer: {
        id: "hh-approach",
        approach: {
          approach: 30,
          accuracy: 28,
          distanceControl: 25,
          dispersion: 32,
        },
      },
      hole: par4Hole,
      remainingDistanceYards: 165,
      trials: 3_000,
      seed: 200,
    });

    expect(approachResult.stats.averageMissDistanceYards).toBeGreaterThan(0);

    const shortGameResult = simulateShortGame({
      golfer: tourPro,
      hole: par4Hole,
      missDistanceYards: approachResult.stats.averageMissDistanceYards,
      lie: "rough",
      trials: 2_000,
      seed: 200,
    });

    expect(shortGameResult.stats.averageMissDistanceYards).toBe(
      approachResult.stats.averageMissDistanceYards,
    );
  });
});
