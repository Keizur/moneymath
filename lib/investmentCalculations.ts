export interface Milestone {
  year: number;
  age: number;
  value: number;
  contributed: number;
  phase: "growth" | "withdrawal";
}

export interface ChartPoint {
  age: number;
  value: number;
  phase: "growth" | "withdrawal";
}

export interface InvestmentResult {
  finalValue: number;
  totalContributed: number;
  totalGrowth: number;
  growthPercent: number;
  contributedPercent: number;
  milestones: Milestone[];
  chartPoints: ChartPoint[];
  balanceDepletedAge: number | null; // age when balance hits 0 during withdrawal
}

export function calculateInvestment(
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number, // e.g. 7 for 7%
  currentAge: number,
  retireAge: number,
  withdrawalAge: number | null,
  monthlyWithdrawal: number,
  endAge: number = 90
): InvestmentResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = (endAge - currentAge) * 12;

  let balance = initialAmount;
  let totalContributed = initialAmount;
  const milestones: Milestone[] = [];
  const chartPoints: ChartPoint[] = [{ age: currentAge, value: initialAmount, phase: "growth" }];
  let balanceDepletedAge: number | null = null;

  for (let m = 1; m <= totalMonths; m++) {
    const age = currentAge + m / 12;
    const inWithdrawalPhase = withdrawalAge !== null && age >= withdrawalAge;
    const inGrowthPhase = age <= retireAge;

    if (balance <= 0) {
      balance = 0;
      if (balanceDepletedAge === null) balanceDepletedAge = Math.round(age);
    } else if (inWithdrawalPhase) {
      // Withdrawal phase: still grows but we pull out monthly withdrawal
      balance = balance * (1 + monthlyRate) - monthlyWithdrawal;
      if (balance < 0) {
        balanceDepletedAge = Math.round(age);
        balance = 0;
      }
    } else if (inGrowthPhase) {
      // Accumulation phase
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;
    } else {
      // Between retire age and withdrawal age (or no withdrawal): just grow
      balance = balance * (1 + monthlyRate);
    }

    const phase = inWithdrawalPhase ? "withdrawal" : "growth";

    // Chart point every year
    if (m % 12 === 0) {
      chartPoints.push({ age: Math.round(age), value: Math.max(0, Math.round(balance)), phase });
    }

    // Milestones every 5 years up to endAge
    if (m % 60 === 0 || m === (retireAge - currentAge) * 12) {
      milestones.push({
        year: Math.round(m / 12),
        age: Math.round(age),
        value: Math.max(0, Math.round(balance)),
        contributed: Math.round(totalContributed),
        phase,
      });
    }
  }

  const peakValue = chartPoints.reduce((max, p) => Math.max(max, p.value), 0);
  const finalValue = Math.max(0, Math.round(balance));
  const totalGrowth = Math.max(0, peakValue - Math.round(totalContributed));
  const growthPercent = peakValue > 0 ? totalGrowth / peakValue : 0;
  const contributedPercent = 1 - growthPercent;

  return {
    finalValue,
    totalContributed: Math.round(totalContributed),
    totalGrowth,
    growthPercent,
    contributedPercent,
    milestones,
    chartPoints,
    balanceDepletedAge,
  };
}
