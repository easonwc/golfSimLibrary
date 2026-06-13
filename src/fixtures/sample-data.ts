import type { CompleteGolfer, CompleteHole, Course } from "../types/index.js";

export const sampleHoleAttributes = {
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
} as const;

export const sampleTourPro: CompleteGolfer = {
  id: "tour-pro",
  name: "Tour Pro",
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

export const sampleHighHandicap: CompleteGolfer = {
  id: "high-handicap",
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

export function createSamplePar4Hole(
  overrides: Partial<CompleteHole> = {},
): CompleteHole {
  return {
    id: "hole-7",
    number: 7,
    par: 4,
    lengthYards: 410,
    green: { ...sampleHoleAttributes.green },
    approach: { ...sampleHoleAttributes.approach },
    shortGame: { ...sampleHoleAttributes.shortGame },
    teeShot: { ...sampleHoleAttributes.teeShot },
    ...overrides,
  };
}

const DEFAULT_COURSE_PARS: Array<3 | 4 | 5> = [
  4, 3, 5, 4, 4, 3, 4, 5, 4,
  4, 4, 3, 5, 4, 4, 3, 5, 4,
];

const DEFAULT_COURSE_LENGTHS = [
  410, 175, 530, 395, 420, 165, 405, 545, 400,
  385, 430, 190, 520, 415, 360, 170, 555, 400,
];

/** Builds a complete 18-hole course for demos and tests. */
export function createSampleCourse(
  pars: Array<3 | 4 | 5> = DEFAULT_COURSE_PARS,
  lengths: number[] = DEFAULT_COURSE_LENGTHS,
): Course {
  if (pars.length !== 18 || lengths.length !== 18) {
    throw new Error("Sample course requires exactly 18 pars and 18 lengths");
  }

  return pars.map((par, index) => {
    const hole: CompleteHole = {
      id: `hole-${index + 1}`,
      number: index + 1,
      par,
      lengthYards: lengths[index]!,
      green: { ...sampleHoleAttributes.green },
      approach: { ...sampleHoleAttributes.approach },
      shortGame: { ...sampleHoleAttributes.shortGame },
    };

    if (par === 4 || par === 5) {
      hole.teeShot = { ...sampleHoleAttributes.teeShot };
    }

    return hole;
  });
}
