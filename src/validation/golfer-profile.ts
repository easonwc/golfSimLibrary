import { ValidationError } from "../errors.js";
import type { GolferGender } from "../types/index.js";

/** Parses optional golfer identity fields shared across module validators. */
export function parseGolferProfileFields(
  g: Record<string, unknown>,
  prefix: string,
): { name?: string; gender?: GolferGender } {
  const name = typeof g.name === "string" ? g.name : undefined;

  if (g.gender === undefined) {
    return { name };
  }

  if (g.gender !== "male" && g.gender !== "female") {
    throw new ValidationError(`${prefix}.gender must be "male" or "female"`);
  }

  return { name, gender: g.gender };
}
