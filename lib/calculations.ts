import { FEDERAL_TAX_RATE, LUMP_SUM_FACTOR } from "./taxRates";

export interface PayoutResult {
  jackpot: number;
  cashValue: number;
  federalTax: number;
  stateTax: number;
  takeHome: number;
  effectiveTaxRate: number;
  // Annuity specific
  annualPayment?: number;
  monthlyPayment?: number;
}

export function calculateLumpSum(jackpot: number, stateRate: number, explicitCashValue?: number): PayoutResult {
  const cashValue = explicitCashValue ?? jackpot * LUMP_SUM_FACTOR;
  const federalTax = cashValue * FEDERAL_TAX_RATE;
  const stateTax = cashValue * stateRate;
  const takeHome = cashValue - federalTax - stateTax;
  const effectiveTaxRate = (federalTax + stateTax) / cashValue;

  return { jackpot, cashValue, federalTax, stateTax, takeHome, effectiveTaxRate };
}

export function calculateAnnuity(jackpot: number, stateRate: number): PayoutResult {
  // Annuity = full jackpot paid over 30 years, each payment taxed
  const totalTaxRate = FEDERAL_TAX_RATE + stateRate;
  const federalTax = jackpot * FEDERAL_TAX_RATE;
  const stateTax = jackpot * stateRate;
  const takeHome = jackpot * (1 - totalTaxRate);
  const annualPayment = takeHome / 30;
  const monthlyPayment = annualPayment / 12;
  const effectiveTaxRate = totalTaxRate;

  return {
    jackpot,
    cashValue: jackpot,
    federalTax,
    stateTax,
    takeHome,
    effectiveTaxRate,
    annualPayment,
    monthlyPayment,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMillions(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return formatCurrency(amount);
}
