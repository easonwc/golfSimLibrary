import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import type { Golfer, Hole } from "../src/types/index.js";
import { simulateApproach } from "../src/modules/approach/index.js";
import {
  calculateLateralDispersionYards,
  expectedDrivingDistanceYards,
  fairwayHalfWidthYards,
  recoveryPenaltyYards,
  simulateTeeShot,
  simulateTeeShotDrive,
} from "../src/modules/tee-shot/index.js";
import { SeededRandom } from "../src/utils/random.js";

const bomber: Golfer = {
  id: "bomber-1",
  name: "Long Driver",
  teeShot: {
    driving: 90,
    distance: 96,
    accuracy: 72,
    dispersion: 70,
  },
};

const accurateDriver: Golfer = {
  id: "accurate-1",
  name: "Fairway Finder",
  teeShot: {
    driving: 88,
    distance: 82,
    accuracy: 94,
    dispersion: 92,
  },
};

const highHandicap: Golfer = {
  id: "hh-1",
  name: "High Handicap",
  teeShot: {
    driving: 35,
    distance: 38,
    accuracy: 32,
    dispersion: 30,
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
  teeShot: {
    fairwayWidth: 0.55,
    roughDifficulty: 0.5,
    hazardDifficulty: 0.4,
  },
};

const par5Hole: Hole = {
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
  teeShot: {
    fairwayWidth: 0.7,
    roughDifficulty: 0.35,
    hazardDifficulty: 0.25,
  },
};

describe("tee shot validation", () => {
  it("rejects missing golfer", () => {
    expect(() => simulateTeeShot({ hole: par4Hole })).toThrow(ValidationError);
  });

  it("rejects par 3 holes", () => {
    expect(() =>
      simulateTeeShot({
        golfer: bomber,
        hole: {
          ...par4Hole,
          par: 3,
          lengthYards: 185,
        },
      }),
    ).toThrow(/hole.par must be 4 or 5 for tee shots/);
  });

  it("rejects missing hole.teeShot", () => {
    expect(() =>
      simulateTeeShot({
        golfer: bomber,
        hole: { ...par4Hole, teeShot: undefined },
      }),
    ).toThrow(/hole.teeShot must be an object/);
  });

  it("rejects invalid driving skill", () => {
    expect(() =>
      simulateTeeShot({
        golfer: {
          id: "x",
          teeShot: {
            driving: 120,
            distance: 50,
            accuracy: 50,
            dispersion: 50,
          },
        },
        hole: par4Hole,
      }),
    ).toThrow(/driving must be <= 100/);
  });
});

describe("expectedDrivingDistanceYards", () => {
  it("returns longer drives for golfers with more distance", () => {
    expect(expectedDrivingDistanceYards(bomber)).toBeGreaterThan(
      expectedDrivingDistanceYards(accurateDriver),
    );
  });
});

describe("calculateLateralDispersionYards", () => {
  it("produces tighter dispersion for accurate golfers", () => {
    const accurate = calculateLateralDispersionYards(accurateDriver, par4Hole);
    const wild = calculateLateralDispersionYards(bomber, par4Hole);
    expect(accurate).toBeLessThan(wild);
  });

  it("produces wider dispersion on narrow fairways", () => {
    const wide = calculateLateralDispersionYards(bomber, par4Hole);
    const narrow = calculateLateralDispersionYards(bomber, {
      ...par4Hole,
      teeShot: { ...par4Hole.teeShot!, fairwayWidth: 0.1 },
    });
    expect(narrow).toBeGreaterThan(wide);
  });
});

describe("recoveryPenaltyYards", () => {
  it("adds no penalty from the fairway", () => {
    expect(recoveryPenaltyYards("fairway", par4Hole)).toBe(0);
  });

  it("adds larger penalties from hazards than rough", () => {
    expect(recoveryPenaltyYards("hazard", par4Hole)).toBeGreaterThan(
      recoveryPenaltyYards("rough", par4Hole),
    );
  });
});

describe("simulateTeeShot", () => {
  it("returns stats with expected shape", () => {
    const result = simulateTeeShot({
      golfer: bomber,
      hole: par4Hole,
      trials: 2_000,
      seed: 3,
    });

    expect(result.stats.golferId).toBe(bomber.id);
    expect(result.stats.holeId).toBe(par4Hole.id);
    expect(result.stats.trials).toBe(2_000);
    expect(result.stats.averageDrivingDistanceYards).toBeGreaterThan(200);
    expect(result.stats.averageRemainingDistanceYards).toBeGreaterThan(30);
    expect(result.stats.averageRemainingDistanceYards).toBeLessThan(250);
    expect(result.stats.fairwayHitRate).toBeGreaterThan(0);
    expect(result.stats.fairwayHitRate).toBeLessThan(1);

    const dist = result.stats.outcomeDistribution;
    expect(dist.fairway + dist.rough + dist.hazard).toBeCloseTo(1, 5);
  });

  it("hits more fairways for an accurate driver than a wild high-handicap", () => {
    const base = { hole: par4Hole, trials: 3_000, seed: 17 };

    const accurateResult = simulateTeeShot({
      ...base,
      golfer: accurateDriver,
    });
    const hhResult = simulateTeeShot({ ...base, golfer: highHandicap });

    expect(accurateResult.stats.fairwayHitRate).toBeGreaterThan(
      hhResult.stats.fairwayHitRate,
    );
  });

  it("leaves less distance remaining for longer drivers on par 5s", () => {
    const base = { hole: par5Hole, trials: 2_000, seed: 55 };

    const bomberResult = simulateTeeShot({ ...base, golfer: bomber });
    const hhResult = simulateTeeShot({ ...base, golfer: highHandicap });

    expect(bomberResult.stats.averageRemainingDistanceYards).toBeLessThan(
      hhResult.stats.averageRemainingDistanceYards,
    );
  });

  it("is reproducible with a fixed seed", () => {
    const a = simulateTeeShot({
      golfer: bomber,
      hole: par4Hole,
      trials: 100,
      seed: 88,
    });
    const b = simulateTeeShot({
      golfer: bomber,
      hole: par4Hole,
      trials: 100,
      seed: 88,
    });
    expect(a.stats.averageRemainingDistanceYards).toBe(
      b.stats.averageRemainingDistanceYards,
    );
  });

  it("produces wider fairways when fairwayWidth is higher", () => {
    expect(
      fairwayHalfWidthYards({
        ...par4Hole,
        teeShot: { ...par4Hole.teeShot!, fairwayWidth: 0.9 },
      }),
    ).toBeGreaterThan(fairwayHalfWidthYards(par4Hole));
  });
});

describe("tee shot → approach integration", () => {
  it("feeds average remaining distance from tee shot into approach", () => {
    const teeResult = simulateTeeShot({
      golfer: bomber,
      hole: par4Hole,
      trials: 2_000,
      seed: 42,
    });

    const approachResult = simulateApproach({
      golfer: {
        id: "pro-approach",
        approach: {
          approach: 90,
          accuracy: 88,
          distanceControl: 91,
          dispersion: 89,
        },
      },
      hole: {
        ...par4Hole,
        approach: {
          landingDifficulty: 0.3,
          elevationPenalty: 0.15,
        },
      },
      remainingDistanceYards: teeResult.stats.averageRemainingDistanceYards,
      trials: 2_000,
      seed: 42,
    });

    expect(approachResult.stats.averageApproachDistanceYards).toBe(
      teeResult.stats.averageRemainingDistanceYards,
    );
    expect(approachResult.stats.greenHitRate).toBeGreaterThan(0);
  });

  it("leaves a longer approach after missing the fairway into trouble", () => {
    let fairwayRemaining = 0;
    let hazardRemaining = 0;
    const random = new SeededRandom(100);

    for (let i = 0; i < 500; i += 1) {
      const outcome = simulateTeeShotDrive(highHandicap, par4Hole, random);
      if (outcome.lie === "fairway" && fairwayRemaining === 0) {
        fairwayRemaining = outcome.remainingDistanceYards;
      }
      if (outcome.lie === "hazard" && hazardRemaining === 0) {
        hazardRemaining = outcome.remainingDistanceYards;
      }
      if (fairwayRemaining > 0 && hazardRemaining > 0) {
        break;
      }
    }

    expect(fairwayRemaining).toBeGreaterThan(0);
    expect(hazardRemaining).toBeGreaterThan(fairwayRemaining);
  });
});
