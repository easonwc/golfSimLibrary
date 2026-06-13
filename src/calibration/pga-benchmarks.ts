/**
 * PGA Tour anchor statistics for a golfer rated 99 across relevant attributes.
 * Used to calibrate simulation modules and regression tests.
 */
export const PGA_TOUR_ELITE_BENCHMARKS = {
  /** Best putters average ~27 putts per 18 holes on tour-length courses. */
  puttsPerRound: 27,
  /** Elite ball-strikers hit ~70% of greens in regulation. */
  greenInRegulationRate: 0.7,
  /** Elite drivers find ~65% of fairways on par 4/5 holes. */
  fairwayHitRate: 0.65,
  /** Elite players average about -3 on a par-72 tour-style course. */
  scoreRelativeToPar72: -3,
  /** Elite tour driving distance (carry + roll, yards). */
  drivingDistanceYards: 305,
  /** Greenside scramble success when missing the green in regulation. */
  scrambleRate: 0.62,
} as const;

/** Acceptable simulation tolerance when validating elite (99) calibration. */
export const CALIBRATION_TOLERANCE = {
  puttsPerRound: 1.5,
  greenInRegulationRate: 0.06,
  fairwayHitRate: 0.06,
  scoreRelativeToPar72: 2.5,
  /** Par-or-better save rate when the green is missed in regulation. */
  scrambleRateWhenMissedGir: 0.08,
  /** Average yards per drive on par 4/5 holes. */
  drivingDistanceYards: 10,
} as const;
