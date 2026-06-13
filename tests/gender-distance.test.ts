import { describe, expect, it } from "vitest";
import {
  applyGenderDistanceOffset,
  ELITE_SKILL_RATING,
  genderDistanceGapYards,
  GENDER_GAP_AT_DRIVER_YARDS,
  GENDER_GAP_AT_WEDGE_YARDS,
  PGA_TOUR_ELITE_BENCHMARKS,
} from "../src/calibration/index.js";
import { createUniformClubAttributes } from "../src/clubs/index.js";
import type { CompleteGolfer } from "../src/types/index.js";
import { expectedDrivingDistanceYards } from "../src/modules/tee-shot/index.js";

function createEliteGolfer(gender?: "male" | "female"): CompleteGolfer {
  const rating = ELITE_SKILL_RATING;
  return {
    id: gender === "female" ? "elite-female" : "elite-male",
    gender,
    putting: {
      putting: rating,
      shortPutting: rating,
      lagPutting: rating,
    },
    approach: {
      approach: rating,
      accuracy: rating,
      distanceControl: rating,
      dispersion: rating,
    },
    shortGame: {
      shortGame: rating,
      chipping: rating,
      bunkerPlay: rating,
      pitching: rating,
    },
    teeShot: {
      driving: rating,
      distance: rating,
      accuracy: rating,
      dispersion: rating,
    },
    clubs: createUniformClubAttributes(rating),
  };
}

describe("genderDistanceGapYards", () => {
  it("returns zero for male golfers", () => {
    expect(genderDistanceGapYards(305, "male")).toBe(0);
  });

  it("returns full driver gap at long distance", () => {
    expect(genderDistanceGapYards(305, "female")).toBe(
      GENDER_GAP_AT_DRIVER_YARDS,
    );
  });

  it("returns wedge gap near the green", () => {
    expect(genderDistanceGapYards(115, "female")).toBe(
      GENDER_GAP_AT_WEDGE_YARDS,
    );
  });

  it("interpolates between wedge and driver references", () => {
    const gap = genderDistanceGapYards(200, "female");
    expect(gap).toBeGreaterThan(GENDER_GAP_AT_WEDGE_YARDS);
    expect(gap).toBeLessThan(GENDER_GAP_AT_DRIVER_YARDS);
  });
});

describe("applyGenderDistanceOffset", () => {
  it("subtracts the gap from male baseline distances", () => {
    expect(applyGenderDistanceOffset(305, 305, "female")).toBe(265);
    expect(applyGenderDistanceOffset(115, 115, "female")).toBe(105);
  });
});

describe("expectedDrivingDistanceYards", () => {
  it("defaults to male baseline when gender is omitted", () => {
    const male = createEliteGolfer();
    expect(expectedDrivingDistanceYards(male)).toBe(
      PGA_TOUR_ELITE_BENCHMARKS.drivingDistanceYards,
    );
  });

  it("reduces elite female driving distance by ~40 yards", () => {
    const female = createEliteGolfer("female");
    expect(expectedDrivingDistanceYards(female)).toBe(265);
  });
});
