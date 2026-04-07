export type FilingStatus = "single" | "married" | "hoh" | "mfs";
export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

export const PERIODS: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

export const PERIOD_LABELS: Record<PayFrequency, string> = {
  weekly: "week",
  biweekly: "2 weeks",
  semimonthly: "semi-month",
  monthly: "month",
};

const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 15000,
  married: 30000,
  hoh: 22500,
  mfs: 15000,
};

// 2025 federal tax brackets: upper limit of each bracket
const BRACKETS: Record<FilingStatus, { rate: number; limit: number }[]> = {
  single: [
    { rate: 0.10, limit: 11925 },
    { rate: 0.12, limit: 48475 },
    { rate: 0.22, limit: 103350 },
    { rate: 0.24, limit: 197300 },
    { rate: 0.32, limit: 250525 },
    { rate: 0.35, limit: 626350 },
    { rate: 0.37, limit: Infinity },
  ],
  married: [
    { rate: 0.10, limit: 23850 },
    { rate: 0.12, limit: 96950 },
    { rate: 0.22, limit: 206700 },
    { rate: 0.24, limit: 394600 },
    { rate: 0.32, limit: 501050 },
    { rate: 0.35, limit: 751600 },
    { rate: 0.37, limit: Infinity },
  ],
  hoh: [
    { rate: 0.10, limit: 17000 },
    { rate: 0.12, limit: 64850 },
    { rate: 0.22, limit: 103350 },
    { rate: 0.24, limit: 197300 },
    { rate: 0.32, limit: 250500 },
    { rate: 0.35, limit: 626350 },
    { rate: 0.37, limit: Infinity },
  ],
  mfs: [
    { rate: 0.10, limit: 11925 },
    { rate: 0.12, limit: 48475 },
    { rate: 0.22, limit: 103350 },
    { rate: 0.24, limit: 197300 },
    { rate: 0.32, limit: 250525 },
    { rate: 0.35, limit: 626350 },
    { rate: 0.37, limit: Infinity },
  ],
};

function calcFederalTax(taxableIncome: number, status: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of BRACKETS[status]) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, b.limit) - prev) * b.rate;
    prev = b.limit;
  }
  return tax;
}

function getMarginalRate(taxableIncome: number, status: FilingStatus): number {
  if (taxableIncome <= 0) return 0.10;
  let prev = 0;
  for (const b of BRACKETS[status]) {
    if (taxableIncome <= b.limit) return b.rate;
    prev = b.limit;
  }
  return 0.37;
}

export interface PaycheckResult {
  grossPerPeriod: number;
  federalTaxPerPeriod: number;
  ssPerPeriod: number;
  medicarePerPeriod: number;
  stateTaxPerPeriod: number;
  preTaxPerPeriod: number;
  netPerPeriod: number;

  annualGross: number;
  annualFederalTax: number;
  annualSS: number;
  annualMedicare: number;
  annualStateTax: number;
  annualPreTax: number;
  annualNet: number;

  effectiveFederalRate: number;
  effectiveTotalRate: number;
  marginalFederalRate: number;
}

const SS_WAGE_BASE = 176100; // 2025
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADD_MEDICARE_RATE = 0.009;

export function calculatePaycheck(
  annualGross: number,
  status: FilingStatus,
  stateRate: number,
  frequency: PayFrequency,
  annual401k: number = 0,
  annualHealthInsurance: number = 0,
  annualHSA: number = 0,
): PaycheckResult {
  const periods = PERIODS[frequency];

  // Pre-tax deductions reduce federal + state taxable income (not FICA)
  const annualPreTax = Math.min(annual401k + annualHealthInsurance + annualHSA, annualGross);

  // Federal
  const stdDed = STANDARD_DEDUCTIONS[status];
  const federalTaxable = Math.max(0, annualGross - annualPreTax - stdDed);
  const annualFederalTax = calcFederalTax(federalTaxable, status);
  const marginalFederalRate = getMarginalRate(federalTaxable, status);

  // FICA — based on full gross (401k doesn't reduce FICA)
  const ssWages = Math.min(annualGross, SS_WAGE_BASE);
  const annualSS = ssWages * SS_RATE;
  const addlMedicareThreshold = status === "married" ? 250000 : 200000;
  const annualMedicare =
    annualGross * MEDICARE_RATE +
    Math.max(0, annualGross - addlMedicareThreshold) * ADD_MEDICARE_RATE;

  // State — applied to gross minus pre-tax deductions (simplified)
  const stateTaxable = Math.max(0, annualGross - annualPreTax);
  const annualStateTax = stateTaxable * stateRate;

  const annualNet =
    annualGross - annualFederalTax - annualSS - annualMedicare - annualStateTax - annualPreTax;

  const totalTax = annualFederalTax + annualSS + annualMedicare + annualStateTax;
  const effectiveTotalRate = annualGross > 0 ? totalTax / annualGross : 0;
  const effectiveFederalRate = annualGross > 0 ? annualFederalTax / annualGross : 0;

  return {
    grossPerPeriod: annualGross / periods,
    federalTaxPerPeriod: annualFederalTax / periods,
    ssPerPeriod: annualSS / periods,
    medicarePerPeriod: annualMedicare / periods,
    stateTaxPerPeriod: annualStateTax / periods,
    preTaxPerPeriod: annualPreTax / periods,
    netPerPeriod: annualNet / periods,
    annualGross,
    annualFederalTax,
    annualSS,
    annualMedicare,
    annualStateTax,
    annualPreTax,
    annualNet,
    effectiveFederalRate,
    effectiveTotalRate,
    marginalFederalRate,
  };
}
