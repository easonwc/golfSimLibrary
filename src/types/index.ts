/** Numeric ability rating on a 0–100 scale (higher is better). */
export type AbilityRating = number;
export interface GolferPuttingAttributes {
  /** Overall putting skill (0–100). */
  putting: AbilityRating;
  /** Short putt conversion inside ~6 ft (0–100). */
  shortPutting: AbilityRating;
  /** Distance control on lag putts beyond ~15 ft (0–100). */
  lagPutting: AbilityRating;
}

export interface GolferApproachAttributes {
  /** Overall approach skill (0–100). */
  approach: AbilityRating;
  /** Accuracy finding the target line (0–100). */
  accuracy: AbilityRating;
  /** Distance control on full approach shots (0–100). */
  distanceControl: AbilityRating;
  /** Shot dispersion tightness (0–100, higher = tighter). */
  dispersion: AbilityRating;
}

export interface GolferShortGameAttributes {
  /** Overall short game skill (0–100). */
  shortGame: AbilityRating;
  /** Chipping and bump-and-run shots around the green (0–100). */
  chipping: AbilityRating;
  /** Greenside bunker play (0–100). */
  bunkerPlay: AbilityRating;
  /** Pitching from 15–40 yards off the green (0–100). */
  pitching: AbilityRating;
}

export interface GolferTeeShotAttributes {
  /** Overall driving skill (0–100). */
  driving: AbilityRating;
  /** Driving distance capability (0–100). */
  distance: AbilityRating;
  /** Fairway finding accuracy (0–100). */
  accuracy: AbilityRating;
  /** Driver dispersion tightness (0–100, higher = tighter). */
  dispersion: AbilityRating;
}

/** Per-club skill ratings (0–100). Higher is better; 99 = elite tour level. */
export interface GolferClubAttributes {
  /** Driver off the tee on par 4/5 (0–100). */
  driver: AbilityRating;
  /** Fairway woods and hybrids for long shots and par-5 layups (0–100). */
  wood: AbilityRating;
  /** Long irons (~4–5i), full shots from ~180 yards (0–100). */
  longIron: AbilityRating;
  /** Mid irons (~6–8i), ~130–179 yards (0–100). */
  midIron: AbilityRating;
  /** Short irons (~9i–PW), ~100–129 yards (0–100). */
  shortIron: AbilityRating;
  /** Wedges for short approaches and greenside shots (0–100). */
  wedge: AbilityRating;
}

export type ApproachClubType =
  | "wood"
  | "longIron"
  | "midIron"
  | "shortIron"
  | "wedge";

export interface Golfer {
  id: string;
  name?: string;
  putting?: GolferPuttingAttributes;
  approach?: GolferApproachAttributes;
  shortGame?: GolferShortGameAttributes;
  teeShot?: GolferTeeShotAttributes;
  /** Per-club execution skill; required for full-hole simulation. */
  clubs?: GolferClubAttributes;
}

export interface HoleGreenAttributes {
  /** Green size in square feet (typical range ~3,000–6,500). */
  sizeSqFt: number;
  /** Stimpmeter reading / green speed (typical 8–14). */
  speed: number;
  /** Slope difficulty (0 = flat, 1 = severe). */
  slope: number;
  /** Pin placement difficulty (0 = easy center, 1 = tucked/sloped). */
  pinDifficulty: number;
}

export interface HoleApproachAttributes {
  /** Landing-area difficulty (0 = wide open, 1 = narrow/hazard-heavy). */
  landingDifficulty: number;
  /** Elevated or exposed green that penalizes misses (0–1). */
  elevationPenalty: number;
}

export interface HoleShortGameAttributes {
  /** Greenside rough difficulty (0 = light fringe, 1 = thick rough). */
  roughDifficulty: number;
  /** Greenside bunker difficulty (0 = none/easy, 1 = deep guzzlers). */
  bunkerDifficulty: number;
  /** Run-off areas and tight collection zones around the green (0–1). */
  collectionDifficulty: number;
}

export interface HoleTeeShotAttributes {
  /** Fairway width/openness (0 = tight, 1 = wide). */
  fairwayWidth: number;
  /** Rough difficulty off the fairway (0 = light, 1 = penal). */
  roughDifficulty: number;
  /** Hazard pressure from water, bunkers, or OB (0 = none, 1 = severe). */
  hazardDifficulty: number;
}

export interface Hole {
  id: string;
  number?: number;
  par: 3 | 4 | 5;
  /** Total hole length in yards. */
  lengthYards: number;
  green: HoleGreenAttributes;
  approach?: HoleApproachAttributes;
  shortGame?: HoleShortGameAttributes;
  teeShot?: HoleTeeShotAttributes;
}

export type ShortGameLie = "fringe" | "rough" | "bunker" | "deepRough";

export type TeeShotLie = "fairway" | "rough" | "hazard";

/** Golfer with every attribute required to simulate a full hole. */
export interface CompleteGolfer extends Golfer {
  putting: GolferPuttingAttributes;
  approach: GolferApproachAttributes;
  shortGame: GolferShortGameAttributes;
  clubs: GolferClubAttributes;
  teeShot?: GolferTeeShotAttributes;
}

/** Hole with every attribute required to simulate a full hole. */
export interface CompleteHole extends Hole {
  green: HoleGreenAttributes;
  approach: HoleApproachAttributes;
  shortGame: HoleShortGameAttributes;
  teeShot?: HoleTeeShotAttributes;
}

export const MIN_HOLE_COMPOSER_GOLFERS = 1;
export const MAX_HOLE_COMPOSER_GOLFERS = 4;
export const ROUND_HOLE_COUNT = 18;

/** An 18-hole course with all attributes required for simulation. */
export type Course = CompleteHole[];
