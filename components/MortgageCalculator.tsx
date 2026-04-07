"use client";

import { useState, useMemo, useCallback } from "react";
import { calculateLoan, maxLoanFromPayment } from "@/lib/loanCalculations";
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

  // Affordability
  const [affordOpen, setAffordOpen] = useState(false);
  const [incomeRaw, setIncomeRaw] = useState("");
  const [debtsRaw, setDebtsRaw] = useState("");

  // UI
  const [showAmort, setShowAmort] = useState(false);
  const [chartTooltip, setChartTooltip] = useState<{ year: number; balance: number; svgX: number; svgY: number } | null>(null);

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

  // Affordability derived
  const monthlyIncome = parseDollar(incomeRaw);
  const monthlyDebts = parseDollar(debtsRaw);
  const frontEndMax = monthlyIncome * 0.28; // 28% rule (housing only)
  const backEndMax = Math.max(0, monthlyIncome * 0.36 - monthlyDebts); // 36% rule minus existing debts
  const affordMaxPayment = Math.min(frontEndMax, backEndMax);
  // Max loan from max P&I (payment minus escrow estimates)
  const escrowEstimate = monthlyTax + monthlyInsurance + (needsPMI ? autoPMI : 0);
  const maxPandI = Math.max(0, affordMaxPayment - escrowEstimate);
  const maxLoan = annualRate > 0 ? maxLoanFromPayment(maxPandI, annualRate, term * 12) : 0;
  const maxHomePrice = downPctNum > 0 ? maxLoan / (1 - downPctNum / 100) : maxLoan + downPayment;

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

      {/* Affordability Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button
          onClick={() => setAffordOpen(!affordOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏠</span>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">How Much Can I Afford?</p>
              <p className="text-xs text-gray-400">Based on your monthly income</p>
            </div>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${affordOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {affordOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gross Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="8,000"
                    value={incomeRaw}
                    onChange={(e) => setIncomeRaw(fmtDollar(parseDollar(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Monthly Debt Payments</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={debtsRaw}
                    onChange={(e) => setDebtsRaw(fmtDollar(parseDollar(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">car, student loans, cards</p>
              </div>
            </div>

            {monthlyIncome > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-blue-600 opacity-70">Max monthly payment</p>
                    <p className="text-lg font-extrabold text-blue-700">{formatCurrency(affordMaxPayment)}</p>
                    <p className="text-xs text-blue-600 opacity-60">28/36% rules</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 opacity-70">Estimated max home price</p>
                    <p className="text-lg font-extrabold text-blue-700">{formatCurrency(Math.round(maxHomePrice / 1000) * 1000)}</p>
                    <p className="text-xs text-blue-600 opacity-60">at {downPctDisplay}% down, {rate}%</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const rounded = Math.round(maxHomePrice / 1000) * 1000;
                    setPriceRaw(fmtDollar(rounded));
                    setAffordOpen(false);
                  }}
                  className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use this home price →
                </button>
              </div>
            )}
          </div>
        )}
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

        {/* Balance Over Time Chart */}
        {result.amortization.length > 1 && (() => {
          const cW = 600, cH = 160, padB = 22, padT = 8;
          const innerH = cH - padT - padB;
          const pts: { year: number; balance: number }[] = [
            { year: 0, balance: principal },
            ...result.amortization.map(r => ({ year: r.year, balance: r.remainingBalance })),
          ];
          const maxB = principal;
          const toX = (yr: number) => (yr / (term)) * cW;
          const toY = (b: number) => padT + innerH - (b / maxB) * innerH;
          const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.year)} ${toY(p.balance)}`).join(" ");
          const area = `${path} L ${toX(term)} ${padT + innerH} L 0 ${padT + innerH} Z`;
          const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: principal * f, y: toY(principal * f) }));
          return (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Remaining Balance Over Time</p>
              <div className="bg-gray-50 rounded-xl overflow-hidden px-2 pt-2 pb-1">
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${cW} ${cH}`}
                    className="w-full block"
                    preserveAspectRatio="none"
                    style={{ cursor: "crosshair" }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      const yr = pct * term;
                      const nearest = pts.reduce((best, p) => Math.abs(p.year - yr) < Math.abs(best.year - yr) ? p : best);
                      setChartTooltip({ year: nearest.year, balance: nearest.balance, svgX: toX(nearest.year), svgY: toY(nearest.balance) });
                    }}
                    onMouseLeave={() => setChartTooltip(null)}
                  >
                    <defs>
                      <linearGradient id="mortGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path d={area} fill="url(#mortGrad)" />
                    <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
                    {[5, 10, 15, 20, 25, 30].filter(y => y <= term).map(y => (
                      <text key={y} x={toX(y)} y={cH - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">Yr {y}</text>
                    ))}
                    {chartTooltip && (
                      <>
                        <line x1={chartTooltip.svgX} y1={padT} x2={chartTooltip.svgX} y2={padT + innerH} stroke="#d1d5db" strokeWidth="1.5" />
                        <circle cx={chartTooltip.svgX} cy={chartTooltip.svgY} r="5" fill="#3b82f6" stroke="white" strokeWidth="2.5" />
                      </>
                    )}
                  </svg>
                  {chartTooltip && (
                    <div
                      className="absolute pointer-events-none z-10"
                      style={{ left: `${(chartTooltip.svgX / cW) * 100}%`, top: `${(chartTooltip.svgY / cH) * 100}%`, transform: "translate(-50%, calc(-100% - 12px)" }}
                    >
                      <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                        <div className="opacity-70">Year {chartTooltip.year}</div>
                        <div className="font-extrabold text-sm">{formatCurrency(chartTooltip.balance)}</div>
                      </div>
                      <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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
