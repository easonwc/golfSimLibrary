import { describe, expect, it } from "vitest";
import {
  approachClubSkill,
  clubWeightsForApproachDistance,
  deriveClubAttributes,
} from "../src/clubs/index.js";
import type { CompleteGolfer } from "../src/types/index.js";
import {
  calculateDispersionSigmas,
  simulateApproach,
} from "../src/modules/approach/index.js";
import { createSamplePar4Hole } from "../src/fixtures/index.js";

describe("club skills", () => {
  it("assigns approach weights that sum to 1", () => {
    for (const distance of [80, 120, 160, 200, 240]) {
      const weights = clubWeightsForApproachDistance(distance);
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });

  it("favors wedges on short approaches and woods on long ones", () => {
    const short = clubWeightsForApproachDistance(90);
    const long = clubWeightsForApproachDistance(230);

    expect(short.wedge).toBeGreaterThan(short.longIron);
    expect(long.wood + long.longIron).toBeGreaterThan(long.wedge);
  });

  it("derives club attributes from legacy category ratings", () => {
    const derived = deriveClubAttributes({
      id: "legacy",
      teeShot: { driving: 80, distance: 90, accuracy: 70, dispersion: 75 },
      approach: {
        approach: 85,
        accuracy: 82,
        distanceControl: 88,
        dispersion: 80,
      },
      shortGame: {
        shortGame: 78,
        chipping: 80,
        bunkerPlay: 70,
        pitching: 76,
      },
    });

    expect(derived.driver).toBeGreaterThan(70);
    expect(derived.wedge).toBeGreaterThan(70);
    expect(derived.longIron).toBeGreaterThan(60);
  });
});

describe("club skill impact on approaches", () => {
  const hole = createSamplePar4Hole();

  const baseGolfer = (clubs: CompleteGolfer["clubs"]): CompleteGolfer => ({
    id: "club-test",
    putting: { putting: 80, shortPutting: 80, lagPutting: 80 },
    approach: {
      approach: 80,
      accuracy: 80,
      distanceControl: 80,
      dispersion: 80,
    },
    shortGame: {
      shortGame: 80,
      chipping: 80,
      bunkerPlay: 80,
      pitching: 80,
    },
    teeShot: { driving: 80, distance: 80, accuracy: 80, dispersion: 80 },
    clubs,
  });

  it("rewards strong long-iron play on long approaches", () => {
    const ironSpecialist = baseGolfer({
      driver: 70,
      wood: 70,
      longIron: 95,
      midIron: 92,
      shortIron: 88,
      wedge: 75,
    });
    const wedgeSpecialist = baseGolfer({
      driver: 70,
      wood: 70,
      longIron: 70,
      midIron: 72,
      shortIron: 75,
      wedge: 95,
    });

    expect(approachClubSkill(ironSpecialist, 190)).toBeGreaterThan(
      approachClubSkill(wedgeSpecialist, 190),
    );
    expect(approachClubSkill(wedgeSpecialist, 100)).toBeGreaterThan(
      approachClubSkill(ironSpecialist, 100),
    );
  });

  it("tightens approach dispersion for stronger club skill at long range", () => {
    const ironSpecialist = baseGolfer({
      driver: 50,
      wood: 50,
      longIron: 99,
      midIron: 99,
      shortIron: 95,
      wedge: 50,
    });
    const wedgeSpecialist = baseGolfer({
      driver: 50,
      wood: 50,
      longIron: 50,
      midIron: 50,
      shortIron: 55,
      wedge: 99,
    });

    const ironSigmas = calculateDispersionSigmas(ironSpecialist, hole, 185);
    const wedgeSigmas = calculateDispersionSigmas(wedgeSpecialist, hole, 185);

    expect(ironSigmas.depthYards).toBeLessThan(wedgeSigmas.depthYards);
    expect(ironSigmas.lateralYards).toBeLessThan(wedgeSigmas.lateralYards);
  });

  it("produces different GIR rates for different club profiles", () => {
    const ironSpecialist = baseGolfer({
      driver: 50,
      wood: 50,
      longIron: 99,
      midIron: 99,
      shortIron: 95,
      wedge: 50,
    });
    const wedgeSpecialist = baseGolfer({
      driver: 50,
      wood: 50,
      longIron: 50,
      midIron: 50,
      shortIron: 55,
      wedge: 99,
    });

    const ironResult = simulateApproach({
      golfer: ironSpecialist,
      hole,
      remainingDistanceYards: 185,
      trials: 4_000,
      seed: 21,
    });
    const wedgeResult = simulateApproach({
      golfer: wedgeSpecialist,
      hole,
      remainingDistanceYards: 185,
      trials: 4_000,
      seed: 99,
    });

    expect(ironResult.stats.greenHitRate).not.toBe(wedgeResult.stats.greenHitRate);
  });
});
