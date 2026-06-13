export interface RandomSource {
  next(): number;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    // Mulberry32
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function createRandomSource(seed?: number): RandomSource {
  if (seed !== undefined) {
    return new SeededRandom(seed);
  }
  return { next: () => Math.random() };
}

/** Standard normal sample using Box-Muller. */
export function gaussianRandom(
  random: RandomSource,
  mean = 0,
  stdDev = 1,
): number {
  let u = 0;
  let v = 0;
  while (u === 0) {
    u = random.next();
  }
  while (v === 0) {
    v = random.next();
  }
  const magnitude = Math.sqrt(-2 * Math.log(u));
  return mean + stdDev * magnitude * Math.cos(2 * Math.PI * v);
}
