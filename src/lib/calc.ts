export interface SimulationParams {
  purchasePrice: number;      // e.g. 200000
  startRentPerYear: number;   // e.g. 12000

  // Optional tuning parameters
  marketGrowth?: number;         // default: 1.03
  adminSavingsPerYear?: number;  // default: 2000
  inflationRate?: number;        // NEW: default 0.025 (2.5% per year)
  maxDurationYears?: number;     // constraint for valid result (default: 30)
  minEdge?: number;              // default: 0.0001
  maxEdge?: number;              // default: 0.03
  edgeStep?: number;             // default: 0.0001
}

export interface SimulationResult {
  profit: number;
  durationYears: number;
}

export interface OptimalEdgeResult extends SimulationResult {
  edge: number;
  profit: number;
  durationYears: number;
}

/**
 * Simulate the model for a given edge.
 * Now includes inflation discounting (2.5% p.a. unless overridden).
 */
export function simulateEdge(edge: number, params: SimulationParams): SimulationResult | null {
  const {
    purchasePrice,
    startRentPerYear,
    marketGrowth = 1.065,
    adminSavingsPerYear = 2000,
    inflationRate = 0.018, // NEW
  } = params;

  let rentPerYear = startRentPerYear;
  let cashFlow = -purchasePrice;
  let ownershipShare = 1.0;

  const yearlyPercentage = rentPerYear / purchasePrice - edge;
  if (yearlyPercentage <= 0) {
    return null;
  }

  const theoreticalDuration = 1 / yearlyPercentage;
  let simulatedYears = 0;

  for (let year = 0; year < Math.floor(theoreticalDuration); year++) {
    const discountFactor = 1 / Math.pow(1 + inflationRate, year);  // NEW inflation

    // discounted rental income proportional to ownership
    cashFlow += rentPerYear * ownershipShare * discountFactor;

    // discounted admin savings
    cashFlow += adminSavingsPerYear * discountFactor;

    // market growth of rent
    rentPerYear *= marketGrowth;

    // every 3 years, part of the ownership is transferred to students
    if ((year + 1) % 3 === 0) {
      ownershipShare -= yearlyPercentage;
    }

    simulatedYears = year + 1;

    if (ownershipShare <= 0) {
      break;
    }
  }

  // Same logic as in your Python: cashFlow - purchasePrice
  const profit = cashFlow - purchasePrice;

  return {
    profit,
    durationYears: simulatedYears,
  };
}

/**
 * Search for the optimal edge given the input parameters.
 */
export function findOptimalEdge(params: SimulationParams): OptimalEdgeResult | null {
  const {
    maxDurationYears = 25,
    minEdge = 0.0001,
    maxEdge = 0.06,
    edgeStep = 0.0001,
  } = params;

  let bestEdge: number | null = null;
  let bestProfitPerYear: number | null = null;
  let bestResult: SimulationResult | null = null;

  for (let edge = minEdge; edge < maxEdge; edge += edgeStep) {
    const result = simulateEdge(edge, params);
    if (result === null) continue;

    const { profit, durationYears } = result;

    if (profit > 0 && durationYears < maxDurationYears) {
      const profitPerYear = profit / durationYears;

      if (bestProfitPerYear === null || profitPerYear > bestProfitPerYear) {
        bestProfitPerYear = profitPerYear;
        bestEdge = edge;
        bestResult = result;
      }
    }
  }

  if (bestEdge === null || bestResult === null || bestProfitPerYear === null) {
    return null;
  }

  return {
    edge: bestEdge,
    profit: bestResult.profit,
    durationYears: bestResult.durationYears,
  };
}
