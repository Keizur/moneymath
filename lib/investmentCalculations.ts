export interface Milestone {
  year: number;
  age: number;
  value: number;
  contributed: number;
}

export interface InvestmentResult {
  finalValue: number;
  totalContributed: number;
  totalGrowth: number;
  growthPercent: number;
  contributedPercent: number;
  milestones: Milestone[];
}

export function calculateInvestment(
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number, // e.g. 7 for 7%
  currentAge: number,
  retireAge: number
): InvestmentResult {
  const years = Math.max(retireAge - currentAge, 1);
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  let balance = initialAmount;
  let totalContributed = initialAmount;
  const milestones: Milestone[] = [];

  for (let m = 1; m <= months; m++) {
    if (monthlyRate > 0) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    } else {
      balance = balance + monthlyContribution;
    }
    totalContributed += monthlyContribution;

    const yearNum = m / 12;
    const age = currentAge + yearNum;

    // Milestone every 5 years + final
    if (m % 60 === 0 || m === months) {
      milestones.push({
        year: Math.round(yearNum),
        age: Math.round(age),
        value: Math.round(balance),
        contributed: Math.round(totalContributed),
      });
    }
  }

  const finalValue = Math.round(balance);
  const totalGrowth = finalValue - Math.round(totalContributed);
  const growthPercent = totalGrowth / finalValue;
  const contributedPercent = 1 - growthPercent;

  return {
    finalValue,
    totalContributed: Math.round(totalContributed),
    totalGrowth,
    growthPercent,
    contributedPercent,
    milestones,
  };
}
