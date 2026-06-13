import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import type { CompleteGolfer, CompleteHole, Course } from "../src/types/index.js";
import { ROUND_HOLE_COUNT } from "../src/types/index.js";
import { coursePar } from "../src/modules/round-composer/index.js";
import {
  simulateRound,
  simulateRoundTrial,
} from "../src/modules/round-composer/index.js";
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

const holeTemplate: Omit<CompleteHole, "id" | "number" | "par" | "lengthYards"> = {
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

function buildTestCourse(): Course {
  const pars: Array<3 | 4 | 5> = [
    4, 3, 5, 4, 4, 3, 4, 5, 4,
    4, 4, 3, 5, 4, 4, 3, 5, 4,
  ];
  const lengths = [
    410, 175, 530, 395, 420, 165, 405, 545, 400,
    385, 430, 190, 520, 415, 360, 170, 555, 400,
  ];

  return pars.map((par, index) => {
    const hole: CompleteHole = {
      id: `hole-${index + 1}`,
      number: index + 1,
      par,
      lengthYards: lengths[index]!,
      ...holeTemplate,
      green: { ...holeTemplate.green },
      approach: { ...holeTemplate.approach },
      shortGame: { ...holeTemplate.shortGame },
    };

    if (par === 4 || par === 5) {
      hole.teeShot = { ...holeTemplate.teeShot! };
    }

    return hole;
  });
}

const testCourse = buildTestCourse();

describe("round composer validation", () => {
  it("rejects courses that are not 18 holes", () => {
    expect(() =>
      simulateRound({
        course: testCourse.slice(0, 9),
        golfers: [tourPro],
      }),
    ).toThrow(/exactly 18 holes/);
  });

  it("rejects empty golfers array", () => {
    expect(() =>
      simulateRound({ course: testCourse, golfers: [] }),
    ).toThrow(/at least 1 golfer/);
  });

  it("rejects more than 4 golfers", () => {
    expect(() =>
      simulateRound({
        course: testCourse,
        golfers: Array.from({ length: 5 }, (_, i) => ({
          ...tourPro,
          id: `g-${i}`,
        })),
      }),
    ).toThrow(/at most 4 golfers/);
  });

  it("rejects duplicate hole ids", () => {
    const badCourse = testCourse.map((hole) => ({ ...hole, id: "same-id" }));
    expect(() =>
      simulateRound({ course: badCourse, golfers: [tourPro] }),
    ).toThrow(/duplicate hole id/);
  });

  it("requires teeShot on golfers when course has par 4/5 holes", () => {
    expect(() =>
      simulateRound({
        course: testCourse,
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
});

describe("coursePar", () => {
  it("sums par across all 18 holes", () => {
    expect(coursePar(testCourse)).toBe(72);
    expect(testCourse).toHaveLength(ROUND_HOLE_COUNT);
  });
});

describe("simulateRoundTrial", () => {
  it("returns a full 18-hole round outcome", () => {
    const outcome = simulateRoundTrial(
      tourPro,
      testCourse,
      new SeededRandom(12),
    );

    expect(outcome.holeStrokes).toHaveLength(18);
    expect(outcome.totalStrokes).toBe(
      outcome.holeStrokes.reduce((sum, strokes) => sum + strokes, 0),
    );
    expect(outcome.totalPutts).toBeGreaterThan(18);
    expect(outcome.scoreRelativeToPar).toBe(
      outcome.totalStrokes - coursePar(testCourse),
    );
    expect(outcome.greenInRegulationCount).toBeGreaterThanOrEqual(0);
    expect(outcome.greenInRegulationCount).toBeLessThanOrEqual(18);
    expect(outcome.drivingDistanceTrials).toBe(14);
    expect(outcome.drivingDistanceYardsTotal).toBeGreaterThan(0);
  });
});

describe("simulateRound", () => {
  it("returns round stats for each golfer with expected shape", () => {
    const result = simulateRound({
      course: testCourse,
      golfers: [tourPro, highHandicap],
      trials: 500,
      seed: 7,
    });

    expect(result.coursePar).toBe(72);
    expect(result.golferStats).toHaveLength(2);

    for (const stats of result.golferStats) {
      expect(stats.trials).toBe(500);
      expect(stats.coursePar).toBe(72);
      expect(stats.holeByHoleExpectedScores).toHaveLength(18);
      expect(stats.expectedScore).toBeGreaterThan(60);
      expect(stats.expectedScore).toBeLessThan(120);
      expect(stats.expectedScoreRelativeToPar).toBe(
        stats.expectedScore - stats.coursePar,
      );
      expect(stats.averagePuttsPerRound).toBeGreaterThan(18);
      expect(stats.averageDrivingDistanceYards).toBeGreaterThan(200);
      expect(stats.averageDrivingDistanceYards).toBeLessThan(350);
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

      const holeSum = stats.holeByHoleExpectedScores.reduce(
        (sum, score) => sum + score,
        0,
      );
      expect(holeSum).toBeCloseTo(stats.expectedScore, 4);
    }
  });

  it("scores better for a tour pro than a high-handicap golfer", () => {
    const result = simulateRound({
      course: testCourse,
      golfers: [tourPro, highHandicap],
      trials: 800,
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
    expect(proStats.averagePuttsPerRound).toBeLessThan(
      hhStats.averagePuttsPerRound,
    );
    expect(proStats.averageDrivingDistanceYards).toBeGreaterThan(
      hhStats.averageDrivingDistanceYards!,
    );
  });

  it("supports 1 through 4 golfers", () => {
    const golfers = [
      tourPro,
      { ...tourPro, id: "pro-2" },
      { ...tourPro, id: "pro-3" },
      { ...tourPro, id: "pro-4" },
    ];

    const result = simulateRound({
      course: testCourse,
      golfers,
      trials: 100,
      seed: 1,
    });

    expect(result.golferStats).toHaveLength(4);
  });

  it("is reproducible with a fixed seed", () => {
    const base = {
      course: testCourse,
      golfers: [tourPro],
      trials: 100,
      seed: 42,
    };

    const a = simulateRound(base);
    const b = simulateRound(base);

    expect(a.golferStats[0]?.expectedScore).toBe(
      b.golferStats[0]?.expectedScore,
    );
  });
});
