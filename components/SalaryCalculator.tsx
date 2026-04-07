"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  calculatePaycheck,
  PERIODS,
  PERIOD_LABELS,
  FilingStatus,
  PayFrequency,
} from "@/lib/paycheckCalculations";
import { formatCurrency } from "@/lib/calculations";

// 2025 approximate flat-rate state income tax (salary/wages)
const STATE_INCOME_RATES: Record<string, { name: string; rate: number; note?: string }> = {
  AL: { name: "Alabama", rate: 0.05 },
  AK: { name: "Alaska", rate: 0, note: "No state income tax" },
  AZ: { name: "Arizona", rate: 0.025, note: "2.5% flat" },
  AR: { name: "Arkansas", rate: 0.044 },
  CA: { name: "California", rate: 0.093 },
  CO: { name: "Colorado", rate: 0.044, note: "4.4% flat" },
  CT: { name: "Connecticut", rate: 0.05 },
  DE: { name: "Delaware", rate: 0.066 },
  FL: { name: "Florida", rate: 0, note: "No state income tax" },
  GA: { name: "Georgia", rate: 0.0549 },
  HI: { name: "Hawaii", rate: 0.0825 },
  ID: { name: "Idaho", rate: 0.058 },
  IL: { name: "Illinois", rate: 0.0495, note: "4.95% flat" },
  IN: { name: "Indiana", rate: 0.0305, note: "3.05% flat" },
  IA: { name: "Iowa", rate: 0.057 },
  KS: { name: "Kansas", rate: 0.057 },
  KY: { name: "Kentucky", rate: 0.04, note: "4% flat" },
  LA: { name: "Louisiana", rate: 0.0425 },
  ME: { name: "Maine", rate: 0.0715 },
  MD: { name: "Maryland", rate: 0.075, note: "Includes avg local tax" },
  MA: { name: "Massachusetts", rate: 0.05, note: "5% flat" },
  MI: { name: "Michigan", rate: 0.0425, note: "4.25% flat" },
  MN: { name: "Minnesota", rate: 0.0705 },
  MS: { name: "Mississippi", rate: 0.05 },
  MO: { name: "Missouri", rate: 0.0495 },
  MT: { name: "Montana", rate: 0.0675 },
  NE: { name: "Nebraska", rate: 0.0684 },
  NV: { name: "Nevada", rate: 0, note: "No state income tax" },
  NH: { name: "New Hampshire", rate: 0, note: "No income tax on wages" },
  NJ: { name: "New Jersey", rate: 0.055 },
  NM: { name: "New Mexico", rate: 0.059 },
  NY: { name: "New York", rate: 0.0685 },
  NC: { name: "North Carolina", rate: 0.045, note: "4.5% flat" },
  ND: { name: "North Dakota", rate: 0.025, note: "2.5% flat" },
  OH: { name: "Ohio", rate: 0.0399 },
  OK: { name: "Oklahoma", rate: 0.0475 },
  OR: { name: "Oregon", rate: 0.08 },
  PA: { name: "Pennsylvania", rate: 0.0307, note: "3.07% flat" },
  RI: { name: "Rhode Island", rate: 0.0599 },
  SC: { name: "South Carolina", rate: 0.065 },
  SD: { name: "South Dakota", rate: 0, note: "No state income tax" },
  TN: { name: "Tennessee", rate: 0, note: "No state income tax" },
  TX: { name: "Texas", rate: 0, note: "No state income tax" },
  UT: { name: "Utah", rate: 0.0465, note: "4.65% flat" },
  VT: { name: "Vermont", rate: 0.066 },
  VA: { name: "Virginia", rate: 0.0575 },
  WA: { name: "Washington", rate: 0, note: "No state income tax" },
  WV: { name: "West Virginia", rate: 0.0512 },
  WI: { name: "Wisconsin", rate: 0.0627 },
  WY: { name: "Wyoming", rate: 0, note: "No state income tax" },
  DC: { name: "Washington D.C.", rate: 0.085 },
};

const STATE_LIST = Object.entries(STATE_INCOME_RATES)
  .map(([code, d]) => ({ code, ...d }))
  .sort((a, b) => a.name.localeCompare(b.name));

function parseDollar(raw: string) {
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}
function fmtDollar(n: number) {
  return n ? n.toLocaleString("en-US") : "";
}

const FILING_OPTIONS: { value: FilingStatus; label: string; short: string }[] = [
  { value: "single", label: "Single", short: "Single" },
  { value: "married", label: "Married Filing Jointly", short: "MFJ" },
  { value: "hoh", label: "Head of Household", short: "HOH" },
  { value: "mfs", label: "Married Filing Separately", short: "MFS" },
];

const FREQ_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "semimonthly", label: "Semi-monthly" },
  { value: "monthly", label: "Monthly" },
];

export default function SalaryCalculator() {
  const [isHourly, setIsHourly] = useState(false);
  const [salaryRaw, setSalaryRaw] = useState("75,000");
  const [hourlyRaw, setHourlyRaw] = useState("36");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");

  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [frequency, setFrequency] = useState<PayFrequency>("biweekly");

  const [stateCode, setStateCode] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [stateOpen, setStateOpen] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);

  // Pre-tax deductions
  const [dedOpen, setDedOpen] = useState(false);
  const [use401kPct, setUse401kPct] = useState(true);
  const [k401Raw, setK401Raw] = useState("6"); // % or $
  const [healthRaw, setHealthRaw] = useState(""); // $ per paycheck
  const [hsaRaw, setHsaRaw] = useState(""); // $ per year

  // Close state dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateOpen(false);
        setStateSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const periods = PERIODS[frequency];

  const annualGross = useMemo(() => {
    if (isHourly) {
      const rate = parseDollar(hourlyRaw);
      const hrs = parseFloat(hoursPerWeek) || 40;
      return rate * hrs * 52;
    }
    return parseDollar(salaryRaw);
  }, [isHourly, salaryRaw, hourlyRaw, hoursPerWeek]);

  const stateRate = stateCode ? (STATE_INCOME_RATES[stateCode]?.rate ?? 0) : 0;

  const annual401k = useMemo(() => {
    const val = parseDollar(k401Raw);
    if (!val) return 0;
    if (use401kPct) return Math.min((val / 100) * annualGross, 23500); // 2025 limit
    return Math.min(val, 23500);
  }, [k401Raw, use401kPct, annualGross]);

  const annualHealth = parseDollar(healthRaw) * periods;
  const annualHSA = parseDollar(hsaRaw);

  const result = useMemo(
    () => calculatePaycheck(annualGross, filingStatus, stateRate, frequency, annual401k, annualHealth, annualHSA),
    [annualGross, filingStatus, stateRate, frequency, annual401k, annualHealth, annualHSA]
  );

  const filteredStates = stateSearch
    ? STATE_LIST.filter(
        (s) =>
          s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.code.toLowerCase().includes(stateSearch.toLowerCase())
      )
    : STATE_LIST;

  const selectedState = stateCode ? STATE_INCOME_RATES[stateCode] : null;

  // Breakdown items for the per-paycheck card
  const breakdownItems = [
    { label: "Gross Pay", value: result.grossPerPeriod, color: "text-gray-900", sign: "" },
    { label: "Federal Income Tax", value: result.federalTaxPerPeriod, color: "text-red-500", sign: "−" },
    { label: "Social Security (6.2%)", value: result.ssPerPeriod, color: "text-red-400", sign: "−" },
    { label: "Medicare (1.45%)", value: result.medicarePerPeriod, color: "text-red-400", sign: "−" },
    ...(stateCode && stateRate > 0 ? [{ label: `${selectedState?.name} State Tax`, value: result.stateTaxPerPeriod, color: "text-red-400", sign: "−" }] : []),
    ...(result.preTaxPerPeriod > 0 ? [{ label: "Pre-Tax Deductions", value: result.preTaxPerPeriod, color: "text-blue-500", sign: "−" }] : []),
  ];

  // Bar widths for visual breakdown
  const totalDeductions = result.grossPerPeriod - result.netPerPeriod;
  const fedPct = result.grossPerPeriod > 0 ? (result.federalTaxPerPeriod / result.grossPerPeriod) * 100 : 0;
  const ficaPct = result.grossPerPeriod > 0 ? ((result.ssPerPeriod + result.medicarePerPeriod) / result.grossPerPeriod) * 100 : 0;
  const statePct = result.grossPerPeriod > 0 ? (result.stateTaxPerPeriod / result.grossPerPeriod) * 100 : 0;
  const preTaxPct = result.grossPerPeriod > 0 ? (result.preTaxPerPeriod / result.grossPerPeriod) * 100 : 0;
  const netPct = result.grossPerPeriod > 0 ? (result.netPerPeriod / result.grossPerPeriod) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          Salary Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          What&apos;s Your Real Take-Home Pay?
        </h1>
        <p className="text-gray-500 text-lg">
          See exactly what hits your bank account after federal, state, and FICA taxes.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        {/* Annual / Hourly toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setIsHourly(false)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${!isHourly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Annual Salary
          </button>
          <button
            onClick={() => setIsHourly(true)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${isHourly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Hourly Rate
          </button>
        </div>

        {!isHourly ? (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Salary</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={salaryRaw}
                onChange={(e) => setSalaryRaw(fmtDollar(parseDollar(e.target.value)))}
                className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Rate</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={hourlyRaw}
                  onChange={(e) => setHourlyRaw(fmtDollar(parseDollar(e.target.value)))}
                  className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hours / Week</label>
              <input
                type="number"
                min={1}
                max={80}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        )}

        {isHourly && annualGross > 0 && (
          <div className="mb-5 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2">
            Annual equivalent: <span className="font-semibold text-gray-800">{formatCurrency(annualGross)}</span>
          </div>
        )}

        {/* Filing Status */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filing Status</label>
          <div className="grid grid-cols-4 gap-1.5">
            {FILING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilingStatus(opt.value)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  filingStatus === opt.value
                    ? "bg-green-600 text-white border-green-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.short}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {FILING_OPTIONS.find((o) => o.value === filingStatus)?.label}
          </p>
        </div>

        {/* State */}
        <div className="mb-5" ref={stateRef}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Select your state..."
              value={stateOpen ? stateSearch : (selectedState ? `${stateCode} — ${selectedState.name}` : "")}
              readOnly={!stateOpen}
              onClick={() => {
                setStateOpen(true);
                setStateSearch("");
              }}
              onChange={(e) => setStateSearch(e.target.value)}
              className="w-full px-4 pr-10 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white cursor-pointer"
            />
            <svg
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none ${stateOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {stateOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
                {filteredStates.map((s) => (
                  <button
                    key={s.code}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex justify-between items-center"
                    onClick={() => {
                      setStateCode(s.code);
                      setStateOpen(false);
                      setStateSearch("");
                    }}
                  >
                    <span className="font-medium text-gray-800">{s.name}</span>
                    <span className="text-gray-400 text-xs">
                      {s.rate > 0 ? `${(s.rate * 100).toFixed(2)}%` : "0%"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedState?.note && (
            <p className="text-xs text-gray-400 mt-1.5">{selectedState.note}</p>
          )}
        </div>

        {/* Pay Frequency */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pay Frequency</label>
          <div className="grid grid-cols-4 gap-1.5">
            {FREQ_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFrequency(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  frequency === opt.value
                    ? "bg-green-600 text-white border-green-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-Tax Deductions Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <button
          onClick={() => setDedOpen(!dedOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Pre-Tax Deductions</p>
              <p className="text-xs text-gray-400">
                {result.preTaxPerPeriod > 0
                  ? `${formatCurrency(result.preTaxPerPeriod)} / ${PERIOD_LABELS[frequency]} reduces your taxable income`
                  : "401(k), health insurance, HSA"}
              </p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${dedOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dedOpen && (
          <div className="px-6 pb-6 border-t border-gray-100 space-y-5 pt-5">
            {/* 401k */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">401(k) Contribution</label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setUse401kPct(true)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${use401kPct ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    % of salary
                  </button>
                  <button
                    onClick={() => setUse401kPct(false)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${!use401kPct ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    $ / year
                  </button>
                </div>
              </div>
              <div className="relative">
                {!use401kPct && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>}
                <input
                  type="number"
                  min={0}
                  max={use401kPct ? 100 : 23500}
                  step={use401kPct ? 0.5 : 100}
                  value={k401Raw}
                  onChange={(e) => setK401Raw(e.target.value)}
                  className={`w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white ${!use401kPct ? "pl-8 pr-4" : "px-4 pr-8"}`}
                />
                {use401kPct && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>}
              </div>
              {annual401k > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatCurrency(annual401k / periods)} per {PERIOD_LABELS[frequency]} · {formatCurrency(annual401k)} / year
                  {annual401k >= 23500 && " (2025 limit)"}
                </p>
              )}
            </div>

            {/* Health Insurance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Health Insurance <span className="font-normal text-gray-400">per paycheck</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={healthRaw}
                  onChange={(e) => setHealthRaw(fmtDollar(parseDollar(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* HSA */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                HSA Contribution <span className="font-normal text-gray-400">per year</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hsaRaw}
                  onChange={(e) => setHsaRaw(fmtDollar(parseDollar(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">2025 limit: $4,300 individual · $8,550 family</p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {annualGross > 0 && (
        <>
          {/* Net Take-Home Hero */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="bg-green-50 rounded-2xl p-6 text-center mb-6">
              <p className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">
                Net Take-Home
              </p>
              <p className="text-5xl font-extrabold text-green-600 mb-1">
                {formatCurrency(result.netPerPeriod)}
              </p>
              <p className="text-green-600 text-xs mt-1 opacity-60">
                per {PERIOD_LABELS[frequency]} · {periods}× per year
              </p>
            </div>

            {/* Stacked bar */}
            <div className="mb-6">
              <div className="flex rounded-full overflow-hidden h-3 bg-gray-100 mb-2">
                <div className="bg-green-500 transition-all duration-500" style={{ width: `${netPct.toFixed(1)}%` }} />
                <div className="bg-red-400 transition-all duration-500" style={{ width: `${fedPct.toFixed(1)}%` }} />
                <div className="bg-orange-400 transition-all duration-500" style={{ width: `${ficaPct.toFixed(1)}%` }} />
                {statePct > 0 && <div className="bg-red-300 transition-all duration-500" style={{ width: `${statePct.toFixed(1)}%` }} />}
                {preTaxPct > 0 && <div className="bg-blue-400 transition-all duration-500" style={{ width: `${preTaxPct.toFixed(1)}%` }} />}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Take-home ({netPct.toFixed(0)}%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Federal ({fedPct.toFixed(0)}%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />FICA ({ficaPct.toFixed(0)}%)</span>
                {statePct > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300 inline-block" />State ({statePct.toFixed(0)}%)</span>}
                {preTaxPct > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Pre-tax ({preTaxPct.toFixed(0)}%)</span>}
              </div>
            </div>

            {/* Per-paycheck breakdown */}
            <div className="space-y-2 mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Per {PERIOD_LABELS[frequency]} breakdown
              </p>
              {breakdownItems.map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.color}`}>
                    {item.sign}{formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Net Take-Home</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(result.netPerPeriod)}</span>
              </div>
            </div>

            {/* Annual Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Annual Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Salary</span>
                <span className="font-semibold text-gray-900">{formatCurrency(result.annualGross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Federal Income Tax</span>
                <span className="font-semibold text-red-500">−{formatCurrency(result.annualFederalTax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Social Security</span>
                <span className="font-semibold text-red-400">−{formatCurrency(result.annualSS)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Medicare</span>
                <span className="font-semibold text-red-400">−{formatCurrency(result.annualMedicare)}</span>
              </div>
              {result.annualStateTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">State Income Tax</span>
                  <span className="font-semibold text-red-400">−{formatCurrency(result.annualStateTax)}</span>
                </div>
              )}
              {result.annualPreTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pre-Tax Deductions</span>
                  <span className="font-semibold text-blue-500">−{formatCurrency(result.annualPreTax)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="font-bold text-gray-800">Annual Take-Home</span>
                <span className="font-bold text-green-600">{formatCurrency(result.annualNet)}</span>
              </div>
            </div>
          </div>

          {/* Tax Rate Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Tax Rates</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Effective Federal Rate</span>
                  <span className="font-bold text-gray-900">{(result.effectiveFederalRate * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(result.effectiveFederalRate * 100 / 37 * 100, 100).toFixed(1)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Effective Total Rate</span>
                  <span className="font-bold text-gray-900">{(result.effectiveTotalRate * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(result.effectiveTotalRate * 100 / 55 * 100, 100).toFixed(1)}%` }} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-600">Marginal Federal Rate</p>
                  <p className="text-xs text-gray-400">Rate on your next dollar of income</p>
                </div>
                <span className="font-bold text-gray-900 text-lg">{(result.marginalFederalRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Affiliate CTA — swap href for your TurboTax affiliate link */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 mb-1">File your taxes in minutes</p>
                <p className="text-sm text-gray-500">TurboTax guides you step by step — get your maximum refund, guaranteed.</p>
              </div>
              <a
                href="https://turbotax.intuit.com/"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="shrink-0 bg-green-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                Start for Free →
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-3">Sponsored · TurboTax</p>
          </div>

          {/* Tips */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Boost Your Take-Home</p>
              <p className="text-sm text-gray-600">
                Every dollar you put into a 401(k) or HSA reduces your federal and state taxable income — saving you your marginal rate times that contribution.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Effective vs. Marginal</p>
              <p className="text-sm text-gray-600">
                Your effective rate is what you actually pay on average. The marginal rate is what you&apos;d pay on a raise — useful to know before negotiating.
              </p>
            </div>
          </div>
        </>
      )}

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Estimates use 2025 federal tax brackets and standard deductions. State rates are simplified flat-rate approximations. Does not include local taxes, deductions beyond standard, or investment income.
      </p>
    </div>
  );
}
