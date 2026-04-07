"use client";

import { useState, useMemo } from "react";
import { calculateLoan } from "@/lib/loanCalculations";
import { formatCurrency } from "@/lib/calculations";

function parseDollar(raw: string) {
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}
function fmtDollar(n: number) {
  return n ? n.toLocaleString("en-US") : "";
}

function InputDollar({ value, onChange, focusColor = "blue" }: { value: string; onChange: (v: string) => void; focusColor?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(fmtDollar(parseDollar(e.target.value)))}
        className={`w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-${focusColor}-500 focus:border-transparent bg-white`}
      />
    </div>
  );
}

export default function MortgageCalculator() {
  // Loan inputs
  const [priceRaw, setPriceRaw] = useState("400,000");
  const [downRaw, setDownRaw] = useState("80,000");
  const [downMode, setDownMode] = useState<"$" | "%">("$");
  const [downPct, setDownPct] = useState("20");
  const [term, setTerm] = useState<15 | 30>(30);
  const [rate, setRate] = useState("6.9");

  // Monthly cost assumptions
  const [taxAnnualRaw, setTaxAnnualRaw] = useState("");   // annual $
  const [insuranceMonthlyRaw, setInsuranceMonthlyRaw] = useState("150"); // monthly $
  const [pmiMonthlyRaw, setPmiMonthlyRaw] = useState(""); // monthly $, auto-calc default

  // UI
  const [showAmort, setShowAmort] = useState(false);

  // Derived loan values
  const homePrice = parseDollar(priceRaw);
  const annualRate = parseFloat(rate) || 0;
  const downPayment = downMode === "$" ? parseDollar(downRaw) : homePrice * (parseFloat(downPct) || 0) / 100;
  const principal = Math.max(0, homePrice - downPayment);
  const downPctNum = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
  const downPctDisplay = downPctNum.toFixed(1);
  const needsPMI = downPctNum < 20 && homePrice > 0;

  // Monthly cost derived values
  const monthlyTax = parseDollar(taxAnnualRaw) / 12;
  const monthlyInsurance = parseDollar(insuranceMonthlyRaw);
  // PMI: use user override if entered, else auto-calculate at 0.85%/yr
  const autoPMI = needsPMI ? Math.round(principal * 0.0085 / 12) : 0;
  const monthlyPMI = needsPMI ? (pmiMonthlyRaw ? parseDollar(pmiMonthlyRaw) : autoPMI) : 0;

  const result = useMemo(() => calculateLoan(principal, annualRate, term * 12), [principal, annualRate, term]);
  const alt = useMemo(() => calculateLoan(principal, annualRate, (term === 30 ? 15 : 30) * 12), [principal, annualRate, term]);

  const totalMonthly = result.monthlyPayment + monthlyTax + monthlyInsurance + monthlyPMI;
  const savings = Math.abs(result.totalInterest - alt.totalInterest);
  const altLabel = term === 30 ? "15-year" : "30-year";

  // Year PMI drops off (when balance reaches 80% LTV)
  const pmiDropYear = useMemo(() => {
    if (!needsPMI || !result.amortization.length) return null;
    const target = homePrice * 0.8;
    return result.amortization.find((r) => r.remainingBalance <= target)?.year ?? null;
  }, [needsPMI, homePrice, result.amortization]);

  const hasExtraCosts = monthlyTax > 0 || monthlyInsurance > 0 || monthlyPMI > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          Mortgage Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          What's Your Monthly Payment?
        </h1>
        <p className="text-gray-500 text-lg">
          Full PITI — principal, interest, taxes, and insurance.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">

        {/* ── LOAN DETAILS ── */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Loan Details</p>

        {/* Home Price */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Home Price</label>
          <InputDollar value={priceRaw} onChange={setPriceRaw} />
        </div>

        {/* Down Payment */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Down Payment
              {homePrice > 0 && <span className="ml-2 text-gray-400 font-normal">({downPctDisplay}%)</span>}
            </label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setDownMode("$")} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${downMode === "$" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>$</button>
              <button onClick={() => setDownMode("%")} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${downMode === "%" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>%</button>
            </div>
          </div>
          {downMode === "$" ? (
            <InputDollar value={downRaw} onChange={setDownRaw} />
          ) : (
            <div className="relative">
              <input type="number" min={0} max={100} step={1} value={downPct} onChange={(e) => setDownPct(e.target.value)} className="w-full px-4 pr-8 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
            </div>
          )}
        </div>

        {/* Term */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Term</label>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            {([30, 15] as const).map((t) => (
              <button key={t} onClick={() => setTerm(t)} className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${term === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t}-Year Fixed
              </button>
            ))}
          </div>
        </div>

        {/* Rate */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate</label>
          <div className="relative">
            <input type="number" min={0} max={30} step={0.1} value={rate} onChange={(e) => setRate(e.target.value)} className="w-full px-4 pr-10 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Check Bankrate or your lender for today's current rates.</p>
        </div>

        <div className="border-t border-gray-100 mb-6"></div>

        {/* ── MONTHLY COST ASSUMPTIONS ── */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Monthly Cost Assumptions</p>

        {/* Property Tax — annual */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Tax <span className="text-gray-400 font-normal">(annual)</span>
          </label>
          <InputDollar value={taxAnnualRaw} onChange={setTaxAnnualRaw} />
          {monthlyTax > 0
            ? <p className="text-xs text-gray-400 mt-1.5">{formatCurrency(monthlyTax)}/mo</p>
            : <p className="text-xs text-gray-400 mt-1.5">National avg ~1.1% of home value/yr</p>
          }
        </div>

        {/* Homeowner's Insurance — monthly */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Homeowner's Insurance <span className="text-gray-400 font-normal">(monthly)</span>
          </label>
          <InputDollar value={insuranceMonthlyRaw} onChange={setInsuranceMonthlyRaw} />
          <p className="text-xs text-gray-400 mt-1.5">National avg ~$125–$175/mo</p>
        </div>

        {/* PMI — monthly */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PMI <span className="text-gray-400 font-normal">(monthly)</span>
          </label>
          {needsPMI ? (
            <>
              <InputDollar value={pmiMonthlyRaw || String(autoPMI)} onChange={setPmiMonthlyRaw} />
              <p className="text-xs text-amber-600 font-medium mt-1.5">
                ⚠ Required until 20% equity — auto-estimated at 0.85%/yr
                {pmiDropYear && ` · drops off around year ${pmiDropYear}`}
              </p>
            </>
          ) : (
            <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm font-medium text-green-700">
              ✓ PMI not required — down payment is {downPctDisplay}%
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 mb-6"></div>

        {/* ── RESULTS ── */}

        {/* Monthly Payment Hero */}
        <div className="bg-blue-50 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm font-semibold text-blue-700 mb-1 uppercase tracking-wide">
            {hasExtraCosts ? "Total Monthly Payment (PITI)" : "Monthly Payment"}
          </p>
          <p className="text-5xl font-extrabold text-blue-600 mb-3">
            {formatCurrency(hasExtraCosts ? totalMonthly : result.monthlyPayment)}
          </p>
          {hasExtraCosts && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-left max-w-xs mx-auto">
              <span className="text-blue-600 text-xs opacity-70">Principal & Interest</span>
              <span className="text-blue-700 text-xs font-bold text-right">{formatCurrency(result.monthlyPayment)}</span>
              {monthlyTax > 0 && <>
                <span className="text-blue-600 text-xs opacity-70">Property Tax</span>
                <span className="text-blue-700 text-xs font-bold text-right">{formatCurrency(monthlyTax)}</span>
              </>}
              {monthlyInsurance > 0 && <>
                <span className="text-blue-600 text-xs opacity-70">Insurance</span>
                <span className="text-blue-700 text-xs font-bold text-right">{formatCurrency(monthlyInsurance)}</span>
              </>}
              {monthlyPMI > 0 && <>
                <span className="text-blue-600 text-xs opacity-70">PMI</span>
                <span className="text-blue-700 text-xs font-bold text-right">{formatCurrency(monthlyPMI)}</span>
              </>}
            </div>
          )}
        </div>

        {/* Loan cost breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Loan Amount</span>
            <span className="font-semibold text-gray-900">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Interest Paid</span>
            <span className="font-semibold text-red-500">+{formatCurrency(result.totalInterest)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Cost of Loan</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.totalPaid)}</span>
          </div>
        </div>

        {/* Principal vs Interest bar */}
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
            <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(result.principalPercent * 100).toFixed(1)}%` }} />
            <div className="bg-red-400 transition-all duration-500" style={{ width: `${(result.interestPercent * 100).toFixed(1)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Principal ({(result.principalPercent * 100).toFixed(0)}%)</span>
            <span className="flex items-center gap-1">Interest ({(result.interestPercent * 100).toFixed(0)}%) <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span></span>
          </div>
        </div>

        {/* 15 vs 30 comparison */}
        {principal > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-2">vs. {altLabel} mortgage</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Monthly P&I</p>
                <p className="font-bold text-gray-900">{formatCurrency(alt.monthlyPayment)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Interest {term === 30 ? "savings" : "cost"}</p>
                <p className={`font-bold ${term === 15 ? "text-red-500" : "text-green-600"}`}>
                  {term === 30 ? "Save " : "+"}{formatCurrency(savings)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Amortization toggle */}
        {result.amortization.length > 0 && (
          <div>
            <button onClick={() => setShowAmort(!showAmort)} className="w-full flex items-center justify-between text-sm font-semibold text-gray-600 hover:text-gray-800 py-2">
              <span>Year-by-Year Breakdown</span>
              <svg className={`w-4 h-4 transition-transform ${showAmort ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAmort && (
              <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 text-gray-400 font-semibold uppercase tracking-wide text-xs">
                  <span>Year</span>
                  <span className="text-right">Principal</span>
                  <span className="text-right">Interest</span>
                  <span className="text-right">Balance</span>
                </div>
                {result.amortization
                  .filter((_, i) => i % (term === 30 ? 5 : 1) === 0 || _ === result.amortization[result.amortization.length - 1])
                  .map((row) => (
                    <div key={row.year} className={`grid grid-cols-4 px-3 py-2 border-t border-gray-100 hover:bg-gray-50 ${needsPMI && pmiDropYear === row.year ? "bg-green-50" : ""}`}>
                      <span className="text-gray-600">
                        Yr {row.year}
                        {needsPMI && pmiDropYear === row.year && <span className="ml-1 text-green-600 font-semibold">· PMI off</span>}
                      </span>
                      <span className="text-right text-blue-600">{formatCurrency(row.principalPaid)}</span>
                      <span className="text-right text-red-400">{formatCurrency(row.interestPaid)}</span>
                      <span className="text-right text-gray-900 font-medium">{formatCurrency(row.remainingBalance)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">20% Down Rule</p>
          <p className="text-sm text-gray-600">Putting down 20% avoids PMI — private mortgage insurance that adds 0.5–1% of the loan amount per year.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">15 vs 30 Year</p>
          <p className="text-sm text-gray-600">A 15-year mortgage has higher monthly payments but saves significantly in total interest over the life of the loan.</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Tax and insurance figures are estimates. Actual costs vary by location, lender, and credit profile. Consult a mortgage lender for exact figures.
      </p>
    </div>
  );
}
