export class GolfSimError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "GolfSimError";
  }
}

export class ValidationError extends GolfSimError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export function assertFiniteNumber(
  value: unknown,
  field: string,
  { min, max }: { min?: number; max?: number } = {},
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`);
  }
  if (min !== undefined && value < min) {
    throw new ValidationError(`${field} must be >= ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${field} must be <= ${max}`);
  }
  return value;
}

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`);
  }
  return value;
}
