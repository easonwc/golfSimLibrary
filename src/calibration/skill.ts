/** Skill rating that represents elite PGA Tour performance in each attribute. */
export const ELITE_SKILL_RATING = 99;

/**
 * Normalizes a skill rating to 0–1 where 1.0 is elite PGA Tour level (99).
 */
export function relativeSkill(skill: number): number {
  return Math.max(0, Math.min(ELITE_SKILL_RATING, skill)) / ELITE_SKILL_RATING;
}

/**
 * Scales shot dispersion relative to elite. 99 → 1.0× tour dispersion; lower
 * skills produce proportionally wider misses.
 */
export function dispersionScale(skill: number): number {
  const relative = relativeSkill(skill);
  return 1 + (1 - relative) * 1.65;
}

/**
 * Scales putting make rates relative to the PGA Tour baseline table.
 * The baseline table reflects tour-average make rates; skill 99 maps to elite
 * best-putter conversion (~27 putts/round when paired with tour-level GIR).
 */
export function puttingMakeRateScale(skill: number): number {
  const relative = relativeSkill(skill);
  // Skill 99 = best putter in the world; scales above tour-average baseline table.
  return 0.18 + 0.92 * relative;
}

/**
 * Blends multiple skill inputs (already 0–100) into one relative factor.
 */
export function blendedRelativeSkill(...skills: number[]): number {
  if (skills.length === 0) {
    return 0;
  }
  const sum = skills.reduce((total, skill) => total + relativeSkill(skill), 0);
  return sum / skills.length;
}

/**
 * Maps a relative skill factor (0–1) to a rate between floor and eliteRate.
 */
export function scaleRateToSkill(
  skill: number,
  eliteRate: number,
  floorRate: number,
): number {
  const relative = relativeSkill(skill);
  return floorRate + (eliteRate - floorRate) * relative;
}

/**
 * Maps skill to driving distance between floor and elite yards.
 */
export function scaleYardsToSkill(
  skill: number,
  eliteYards: number,
  floorYards: number,
): number {
  const relative = relativeSkill(skill);
  return floorYards + (eliteYards - floorYards) * relative;
}
