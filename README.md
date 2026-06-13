# golf-sim-library

Monte Carlo golf simulation for Node.js and TypeScript. Model golfers with numerical skill attributes, describe holes and courses with numerical difficulty attributes, and simulate outcomes from individual shots through full 18-hole rounds.

Designed as a reusable library for apps that need expected scores, GIR rates, fairway percentages, putting stats, and score distributions.

## Requirements

- Node.js 18+
- ESM (`import` syntax)

## Install

```bash
npm install golf-sim-library
```

For local development:

```bash
git clone https://github.com/easonwc/golfSimLibrary.git
cd golfSimLibrary
npm install
npm run build
npm test
```

## Quick start

### Simulate one hole for a foursome

```typescript
import { simulateHole } from "golf-sim-library";

const result = simulateHole({
  hole: {
    id: "hole-7",
    par: 4,
    lengthYards: 410,
    green: { sizeSqFt: 5200, speed: 11, slope: 0.3, pinDifficulty: 0.4 },
    approach: { landingDifficulty: 0.35, elevationPenalty: 0.2 },
    shortGame: { roughDifficulty: 0.55, bunkerDifficulty: 0.6, collectionDifficulty: 0.35 },
    teeShot: { fairwayWidth: 0.55, roughDifficulty: 0.5, hazardDifficulty: 0.4 },
  },
  golfers: [
    {
      id: "player-1",
      putting: { putting: 72, shortPutting: 70, lagPutting: 74 },
      approach: { approach: 78, accuracy: 76, distanceControl: 80, dispersion: 74 },
      shortGame: { shortGame: 75, chipping: 78, bunkerPlay: 70, pitching: 74 },
      clubs: { driver: 76, wood: 74, longIron: 78, midIron: 79, shortIron: 80, wedge: 82 },
    },
  ],
  trials: 5000,
  seed: 42,
});

console.log(result.golferStats[0].expectedScore);
```

### Simulate a full round

```typescript
import { simulateRound } from "golf-sim-library";

const result = simulateRound({
  course: [ /* 18 complete holes */ ],
  golfers: [ /* 1–4 complete golfers */ ],
  trials: 5000,
  seed: 42,
});

for (const stats of result.golferStats) {
  console.log(stats.name, stats.expectedScore, stats.holeByHoleExpectedScores);
}
```

### Sample data for demos

```typescript
import { simulateRound } from "golf-sim-library";
import {
  createSampleCourse,
  sampleTourPro,
  sampleHighHandicap,
} from "golf-sim-library/fixtures";

simulateRound({
  course: createSampleCourse(),
  golfers: [sampleTourPro, sampleHighHandicap],
  trials: 2000,
  seed: 1,
});
```

Run the included examples:

```bash
npm run example:hole
npm run example:round
```

## Architecture

Every module follows **inputs → validation → transformation → outputs**.

```
Shot modules
├── Putting      first-putt distance → putt count distribution
├── Short game   miss distance + lie → green contact + proximity
├── Approach     distance to pin → GIR / miss direction
└── Tee shot     par 4/5 only → fairway + remaining distance

Composers
├── Hole composer   one hole, 1–4 golfers
└── Round composer  18 holes, 1–4 golfers
```

### Per-hole pipeline

```
Par 3:  Approach ──miss──► Short game ──► Putting
           │ on green ─────────────────────► Putting

Par 4/5:  Tee shot → Approach ──miss──► Short game ──► Putting
                      │ on green ─────────────────────► Putting

Par 5:    Tee shot → [Layup if >210 yds] → Approach → ...
```

## Core types

All ability ratings use a **0–100 scale** (higher is better). Hole difficulty attributes use **0–1** unless noted.

### Golfer attributes

| Group | Fields |
|-------|--------|
| `putting` | `putting`, `shortPutting`, `lagPutting` |
| `approach` | `approach`, `accuracy`, `distanceControl`, `dispersion` |
| `shortGame` | `shortGame`, `chipping`, `bunkerPlay`, `pitching` |
| `teeShot` | `driving`, `distance`, `accuracy`, `dispersion` |
| `clubs` | `driver`, `wood`, `longIron`, `midIron`, `shortIron`, `wedge` |

Category attributes (`approach`, `teeShot`, etc.) describe overall technique; **club ratings** control execution by club type and approach yardage. At 185 yards the sim blends mid/long iron skills; inside 115 yards it leans on wedges.

### Hole attributes

| Group | Fields |
|-------|--------|
| `green` | `sizeSqFt`, `speed`, `slope`, `pinDifficulty` |
| `approach` | `landingDifficulty`, `elevationPenalty` |
| `shortGame` | `roughDifficulty`, `bunkerDifficulty`, `collectionDifficulty` |
| `teeShot` | `fairwayWidth`, `roughDifficulty`, `hazardDifficulty` |

## Public API

### Composers (recommended entry points)

| Function | Description |
|----------|-------------|
| `simulateRound(input)` | Full 18-hole round for 1–4 golfers |
| `simulateHole(input)` | Single hole for 1–4 golfers |

### Shot modules

| Function | Description |
|----------|-------------|
| `simulatePutting(input)` | Putting stats from first-putt distance |
| `simulateShortGame(input)` | Scrambling / proximity after missing green |
| `simulateApproach(input)` | Approach shot GIR and proximity |
| `simulateTeeShot(input)` | Drive distance, fairway, remaining yards (par 4/5) |

Each module also exports `*Validated` variants (skip re-validation), single-shot simulators, and `validate*Input` helpers.

### Constants

| Name | Value |
|------|-------|
| `ROUND_HOLE_COUNT` | 18 |
| `MIN_HOLE_COMPOSER_GOLFERS` | 1 |
| `MAX_HOLE_COMPOSER_GOLFERS` | 4 |

## Skill calibration

All golfer attributes use a **0–100 scale** where **99 represents elite PGA Tour performance** in that category. Lower ratings scale proportionally from that anchor.

At skill 99 across all attributes, a full round on the sample tour-style course targets:

| Stat | Target |
|------|--------|
| Putts per round | ~27 |
| Greens in regulation | ~70% |
| Fairways hit (par 4/5) | ~65% |
| Score vs par 72 | ~−3 |
| Scrambling (when GIR missed) | ~62% |

Calibration helpers and benchmarks live in `golf-sim-library` exports (`ELITE_SKILL_RATING`, `PGA_TOUR_ELITE_BENCHMARKS`, `dispersionScale`, etc.). Run `node scripts/calibrate-baseline.mjs` to spot-check elite vs mid-skill output.

## Input requirements

### Hole composer / round composer

- **Golfers:** 1–4, unique `id`, all skill groups populated (`putting`, `approach`, `shortGame`, `clubs`; plus `teeShot` when needed)
- **`teeShot`:** required on golfers when the course/hole includes par 4 or par 5 holes
- **Round composer:** exactly 18 holes, unique hole `id`s, all hole attribute groups populated

### Trials and seeds

- `trials` defaults to `5000` (min 100, max 100_000)
- `seed` optional; provide an integer for reproducible results
- Each golfer receives a derived seed offset in multi-golfer simulations

## Error handling

Invalid inputs throw `ValidationError` (extends `GolfSimError`) with descriptive messages:

```typescript
import { simulateHole, ValidationError } from "golf-sim-library";

try {
  simulateHole({ hole: myHole, golfers: [] });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message); // "golfers must contain at least 1 golfer"
  }
}
```

## Output highlights

### `GolferHoleStats`

`expectedScore`, `greenInRegulationRate`, `fairwayHitRate`, `averagePutts`, `upAndDownRate`, `scrambleRate`, `scoreDistribution`

### `GolferRoundStats`

All hole-level metrics aggregated across 18 holes, plus `holeByHoleExpectedScores` (length 18), `averagePuttsPerRound`, `averageDrivingDistanceYards` (par 4/5 tee shots only), and round-level `scoreDistribution`.

## Package exports

| Import path | Contents |
|-------------|----------|
| `golf-sim-library` | Full public API |
| `golf-sim-library/fixtures` | Sample golfers, holes, and course builder |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run test suite |
| `npm run example:hole` | Build and run hole simulation demo |
| `npm run example:round` | Build and run round simulation demo |

## Project structure

```
src/
├── index.ts              Public API barrel
├── types/                Shared golfer and hole types
├── errors.ts             ValidationError, GolfSimError
├── utils/random.ts       Seeded RNG + gaussian sampling
├── fixtures/             Sample data for demos and tests
└── modules/
    ├── putting/
    ├── approach/
    ├── short-game/
    ├── tee-shot/
    ├── hole-composer/
    └── round-composer/
examples/                 Runnable demos (import from dist/)
tests/                    Vitest test suites
```

## License

MIT
