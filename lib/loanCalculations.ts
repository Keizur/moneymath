export interface AmortizationYear {
  year: number;
  remainingBalance: number;
  interestPaid: number;
  principalPaid: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  principal: number;
  interestPercent: number;
  principalPercent: number;
  amortization: AmortizationYear[];
}

export function calculateLoan(
  principal: number,
  annualRate: number,
  termMonths: number
): LoanResult {
  if (principal <= 0) {
    return { monthlyPayment: 0, totalPaid: 0, totalInterest: 0, principal: 0, interestPercent: 0, principalPercent: 1, amortization: [] };
  }

  const monthlyRate = annualRate / 100 / 12;
  let monthlyPayment: number;

  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalPaid = monthlyPayment * termMonths;
  const totalInterest = totalPaid - principal;
  const interestPercent = totalInterest / totalPaid;
  const principalPercent = 1 - interestPercent;

  // Yearly amortization
  const amortization: AmortizationYear[] = [];
  let balance = principal;
  let yearInterest = 0;
  let yearPrincipal = 0;

  for (let m = 1; m <= termMonths; m++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
    balance = Math.max(0, balance - principalPayment);
    yearInterest += interestPayment;
    yearPrincipal += principalPayment;

    if (m % 12 === 0 || m === termMonths) {
      amortization.push({
        year: Math.ceil(m / 12),
        remainingBalance: Math.round(balance),
        interestPaid: Math.round(yearInterest),
        principalPaid: Math.round(yearPrincipal),
      });
      yearInterest = 0;
      yearPrincipal = 0;
    }
  }

  return {
    monthlyPayment,
    totalPaid,
    totalInterest,
    principal,
    interestPercent,
    principalPercent,
    amortization,
  };
}
