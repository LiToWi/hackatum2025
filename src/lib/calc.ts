export interface SimulationParams {
  purchasePrice: number;      // e.g. 200000
  // Primary rent input is monthly now. For backward compatibility you may
  // also provide `startRentPerYear` (it will be divided by 12).
  startRentPerMonth?: number; // e.g. 1000
  startRentPerYear?: number;  // optional, legacy

  // How long (in months) the student expects to live in the apartment.
  // This parameter is REQUIRED for month-based simulations. Legacy callers
  // can provide `rentingPeriodYears` instead and it will be converted.
  rentingPeriodMonths?: number;
  rentingPeriodYears?: number; // optional legacy
  // Student-specific inputs
  numberOfRoommates?: number; // total roommates including the student (>=1)
  studentRentPerMonth?: number; // optional: if provided overrides split-based rent
  // How many years to project future cashflows after move-out
  projectionYears?: number;
  // Target owner annual yield (fraction, e.g. 0.07 for 7%). Used by optimizer.
  targetOwnerAnnualYield?: number;
  // Optional tuning parameters
  marketGrowth?: number;         // default: 1.03 (annual multiplier)
  adminSavingsPerMonth?: number; // default: 2000/12
  adminSavingsPerYear?: number;  // optional legacy
  inflationRate?: number;        // annual inflation rate (default: 0.025)
  maxDurationYears?: number;     // constraint for valid result (default: 30)
  minEdge?: number;              // default: 0.0001
  maxEdge?: number;              // default: 0.03
  edgeStep?: number;             // default: 0.0001
  // How often (in months) ownership is partially transferred. For
  // example, 36 = every 3 years. Default: 36 months.
  transferIntervalMonths?: number;
}

export interface SimulationResult {
  profit: number;
  // Simulation duration in months
  durationMonths: number;
  // Percentage of ownership the student owns after they move out (0-100)
  studentOwnershipPercentage: number;
  // Monetary value of the student's equity at move-out (EUR)
  studentEquityValue?: number;
  // Present-value (at t=0) of rent paid by the student during tenancy
  totalRentPaidPV?: number;
  // Projected annual cashflow for the student starting at move-out (first year)
  projectedAnnualCashflowAtMoveOut?: number;
  // Present value (at move-out) of projected future cashflows over projectionYears
  projectedFutureNPV?: number;
  // Profit for the Studentenwerk (owner) at move-out (EUR)
  studentenwerkProfit?: number;
  // Profit per year for Studentenwerk
  studentenwerkProfitPerYear?: number;
  // Owner annual yield relative to purchase price (fraction)
  studentenwerkYield?: number;
}

export interface OptimalEdgeResult extends SimulationResult {
  edge: number;
  profit: number;
}

/**
 * Simulate the model for a given edge.
 * Now includes inflation discounting (2.5% p.a. unless overridden).
 */
export function simulateEdge(edge: number, params: SimulationParams): SimulationResult | null {
  const {
    purchasePrice,
    startRentPerMonth,
    startRentPerYear,
    // per user request these are fixed defaults; caller may still override
    marketGrowth = 1.065,
    adminSavingsPerMonth,
    adminSavingsPerYear,
    inflationRate = 0.018, // annual (fixed)
  transferIntervalMonths = 36,
    rentingPeriodMonths,
    rentingPeriodYears,
    numberOfRoommates,
    studentRentPerMonth,
    projectionYears = 5,
  } = params;
  // Resolve monthly rent and admin savings (support legacy yearly inputs)
  const rentPerMonth =
    startRentPerMonth ?? (startRentPerYear ? startRentPerYear / 12 : 0)
  const adminPerMonth =
    adminSavingsPerMonth ?? (adminSavingsPerYear ? adminSavingsPerYear / 12 : 2000 / 12)

  // Determine simulation duration in months. The user must provide an
  // expected renting period (in months or years).
  let durationMonths: number | null = null
  if (typeof rentingPeriodMonths === 'number') {
    durationMonths = Math.max(0, Math.floor(rentingPeriodMonths))
  } else if (typeof rentingPeriodYears === 'number') {
    durationMonths = Math.max(0, Math.floor(rentingPeriodYears * 12))
  } else {
    throw new Error('rentingPeriodMonths (number of months) must be provided in SimulationParams')
  }

  const durationYears = durationMonths / 12

  // Student-specific rent: either provided directly or split evenly by roommates
  const roommates = Math.max(1, Math.floor(numberOfRoommates ?? 1))
  const studentMonthlyRent =
    typeof studentRentPerMonth === 'number' && studentRentPerMonth > 0
      ? studentRentPerMonth
      : rentPerMonth / roommates

  const annualStudentRent = studentMonthlyRent * 12

  // ownership accrual rate (annual): portion of building acquired per year
  // based on student's rent contribution minus the Studentenwerk edge.
  const yearlyPercentageStudent = annualStudentRent / purchasePrice - edge
  // If the edge makes accrual non-positive, no ownership accrues.
  const totalOwnershipFraction = Math.max(0, yearlyPercentageStudent * durationYears)
  const studentOwnershipPercentage = Math.min(1, totalOwnershipFraction) * 100

  // Market value at move-out (simple multiplier growth)
  const marketValueAtMoveOut = purchasePrice * Math.pow(marketGrowth, durationYears)
  const studentEquityValue = marketValueAtMoveOut * Math.min(1, totalOwnershipFraction)

  // Compute present value (at t=0) of all rent payments the student makes
  let totalRentPaidPV = 0
  for (let m = 0; m < durationMonths; m++) {
    const discountFactor = 1 / Math.pow(1 + inflationRate, m / 12)
    totalRentPaidPV += studentMonthlyRent * discountFactor
  }

  // PV of total rents collected by Studentenwerk (entire unit rent)
  let totalRentsCollectedPV = 0
  for (let m = 0; m < durationMonths; m++) {
    const discountFactor = 1 / Math.pow(1 + inflationRate, m / 12)
    totalRentsCollectedPV += rentPerMonth * discountFactor
  }

  // Define projected future cashflows after move-out. By default project
  // `projectionYears` years and compute student share of gross rent each year
  // (no additional operator fee applied). Discount to move-out time.
  const annualRentAtMoveOut = (rentPerMonth * 12) * Math.pow(marketGrowth, durationYears)
  const studentAnnualIncomeAtMoveOut = annualRentAtMoveOut * Math.min(1, totalOwnershipFraction)

  let projectedFutureNPV = 0
  for (let y = 1; y <= projectionYears; y++) {
    const futureAnnualRent = studentAnnualIncomeAtMoveOut * Math.pow(marketGrowth, y - 1)
    // discount to move-out using inflation
    const discounted = futureAnnualRent / Math.pow(1 + inflationRate, y)
    projectedFutureNPV += discounted
  }

  // Define profit for the student as equity value minus PV of rents paid.
  const profit = studentEquityValue - totalRentPaidPV

  // Studentenwerk profit: retained market value share + PV of rents collected - purchase price
  const studentenwerkRetainedValue = marketValueAtMoveOut * (1 - Math.min(1, totalOwnershipFraction))
  const studentenwerkProfit = studentenwerkRetainedValue + totalRentsCollectedPV - purchasePrice
  const studentenwerkProfitPerYear = studentenwerkProfit / Math.max(0.0001, durationYears)
  const studentenwerkYield = studentenwerkProfitPerYear / Math.max(1, purchasePrice)

  return {
    profit,
    durationMonths: durationMonths,
    studentOwnershipPercentage,
    studentEquityValue,
    totalRentPaidPV,
    projectedAnnualCashflowAtMoveOut: studentAnnualIncomeAtMoveOut,
    projectedFutureNPV,
    studentenwerkProfit,
    studentenwerkProfitPerYear,
    studentenwerkYield,
  }
}

/**
 * Search for the optimal edge given the input parameters.
 */
export function findOptimalEdge(params: SimulationParams): OptimalEdgeResult | null {
  const {
    maxDurationYears = 25,
    minEdge = 0.01,
    maxEdge = 0.06,
    edgeStep = 0.0001,
  } = params;

  let bestEdge: number | null = null;
  let bestProfitPerYear: number | null = null;
  let bestResult: SimulationResult | null = null;

  // Prefer edges that achieve at least the target owner annual yield while
  // maximizing student ownership. If none meet the target, fall back to
  // maximizing owner profit-per-year.
  const targetYield = params.targetOwnerAnnualYield ?? 0.07
  const candidatesMeetingTarget: Array<{ edge: number; result: SimulationResult } > = []

  for (let edge = minEdge; edge < maxEdge; edge += edgeStep) {
    const result = simulateEdge(edge, params)
    if (result === null) continue
    const { studentenwerkProfit, durationMonths, studentenwerkYield } = result
    if (typeof studentenwerkProfit !== 'number' || typeof studentenwerkYield !== 'number') continue
    const durationYearsResult = durationMonths / 12

    // Skip overly long durations
    if (durationYearsResult >= maxDurationYears) continue

    const profitPerYear = studentenwerkProfit / Math.max(0.0001, durationYearsResult)

    // Collect candidates meeting or exceeding the target yield
    if (studentenwerkYield >= targetYield) {
      candidatesMeetingTarget.push({ edge, result })
      continue
    }

    // Otherwise consider for fallback maximizing owner profit-per-year
    if (bestProfitPerYear === null || profitPerYear > bestProfitPerYear) {
      bestProfitPerYear = profitPerYear
      bestEdge = edge
      bestResult = result
    }
  }

  // If we have candidates that meet the target yield, pick the one that
  // gives the student the largest ownership percentage (tie-breaker: student profit).
  if (candidatesMeetingTarget.length > 0) {
    let chosen: { edge: number; result: SimulationResult } | null = null
    for (const c of candidatesMeetingTarget) {
      if (!chosen) { chosen = c; continue }
      const currShare = c.result.studentOwnershipPercentage
      const chosenShare = chosen.result.studentOwnershipPercentage
      if (currShare > chosenShare) {
        chosen = c
      } else if (currShare === chosenShare) {
        // tie-breaker: larger student profit
        if ((c.result.profit ?? -Infinity) > (chosen.result.profit ?? -Infinity)) chosen = c
      }
    }
    bestEdge = chosen!.edge
    bestResult = chosen!.result
    bestProfitPerYear = (bestResult.studentenwerkProfitPerYear ?? null)
  }

  if (bestEdge === null || bestResult === null || bestProfitPerYear === null) {
    return null;
  }

  return {
    edge: bestEdge,
    // `profit` here represents the Studentenwerk's profit for the chosen edge
    profit: bestResult.studentenwerkProfit ?? bestResult.profit,
    durationMonths: bestResult.durationMonths,
    studentOwnershipPercentage: bestResult.studentOwnershipPercentage,
  }
}
