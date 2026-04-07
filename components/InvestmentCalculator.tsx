"use client";

import { useState, useMemo } from "react";
import { calculateInvestment } from "@/lib/investmentCalculations";
import { formatCurrency, formatMillions } from "@/lib/calculations";

const RATE_PRESETS = [
  { label: "Conservative", value: 4, sub: "bonds/CDs" },
  { label: "Moderate", value: 7, sub: "S&P 500 avg" },
  { label: "Aggressive", value: 10, sub: "growth stocks" },
];

const BENCHMARKS = [
  { ticker: "VOO",   name: "S&P 500 ETF",       type: "ETF",   return: 12.7 },
  { ticker: "QQQ",   name: "NASDAQ-100 ETF",     type: "ETF",   return: 18.4 },
  { ticker: "NVDA",  name: "NVIDIA",             type: "Stock", return: 52.4 },
  { ticker: "MSFT",  name: "Microsoft",          type: "Stock", return: 25.6 },
  { ticker: "AAPL",  name: "Apple",              type: "Stock", return: 16.3 },
  { ticker: "TSLA",  name: "Tesla",              type: "Stock", return: 29.2 },
  { ticker: "META",  name: "Meta (Facebook)",    type: "Stock", return: 22.1 },
  { ticker: "AMZN",  name: "Amazon",             type: "Stock", return: 23.8 },
  { ticker: "GOOGL", name: "Alphabet (Google)",  type: "Stock", return: 19.2 },
];

function parseDollarInput(raw: string): number {
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}

function formatDollarInput(value: number): string {
  if (!value) return "";
  return value.toLocaleString("en-US");
}

export default function InvestmentCalculator() {
  const [currentAge, setCurrentAge] = useState(25);
  const [retireAge, setRetireAge] = useState(65);
  const [initialRaw, setInitialRaw] = useState("10,000");
  const [monthlyRaw, setMonthlyRaw] = useState("500");
  const [rate, setRate] = useState(7);
  const [customRate, setCustomRate] = useState("");
  const [usingCustomRate, setUsingCustomRate] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);

  const initialAmount = parseDollarInput(initialRaw);
  const monthlyContribution = parseDollarInput(monthlyRaw);
  const benchmarkRate = BENCHMARKS.find((b) => b.ticker === selectedBenchmark)?.return ?? rate;
  const effectiveRate = selectedBenchmark
    ? benchmarkRate
    : usingCustomRate
    ? parseFloat(customRate) || 0
    : rate;
  const years = Math.max(retireAge - currentAge, 1);

  const result = useMemo(
    () => calculateInvestment(initialAmount, monthlyContribution, effectiveRate, currentAge, retireAge),
    [initialAmount, monthlyContribution, effectiveRate, currentAge, retireAge]
  );

  function handleRatePreset(value: number) {
    setRate(value);
    setUsingCustomRate(false);
    setCustomRate("");
    setSelectedBenchmark(null);
  }

  function handleBenchmark(ticker: string) {
    setSelectedBenchmark(ticker);
    setUsingCustomRate(false);
    setCustomRate("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          Compound Interest Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          What Will Your Money Grow To?
        </h1>
        <p className="text-gray-500 text-lg">
          See the real power of compounding — what consistent investing actually builds.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Age Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Age</label>
            <input
              type="number"
              min={10}
              max={80}
              value={currentAge}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 0;
                setCurrentAge(v);
                if (v >= retireAge) setRetireAge(v + 1);
              }}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Retire at Age</label>
            <input
              type="number"
              min={currentAge + 1}
              max={100}
              value={retireAge}
              onChange={(e) => setRetireAge(parseInt(e.target.value) || currentAge + 1)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Time horizon pill */}
        <div className="text-center mb-6">
          <span className="inline-block bg-gray-100 text-gray-600 text-sm font-medium px-4 py-1.5 rounded-full">
            {years} years of growth
          </span>
        </div>

        {/* Dollar Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Starting Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={initialRaw}
                onChange={(e) => setInitialRaw(formatDollarInput(parseDollarInput(e.target.value)))}
                className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Contribution</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={monthlyRaw}
                onChange={(e) => setMonthlyRaw(formatDollarInput(parseDollarInput(e.target.value)))}
                className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        </div>

        {/* Rate Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Annual Return Rate
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {RATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleRatePreset(preset.value)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                  !usingCustomRate && rate === preset.value
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div>{preset.label}</div>
                <div className={`text-xs font-bold mt-0.5 ${!usingCustomRate && rate === preset.value ? "text-green-600" : "text-gray-400"}`}>
                  {preset.value}% · {preset.sub}
                </div>
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              placeholder="Custom rate %"
              value={customRate}
              onFocus={() => { setUsingCustomRate(true); setSelectedBenchmark(null); }}
              onChange={(e) => {
                setCustomRate(e.target.value);
                setUsingCustomRate(true);
                setSelectedBenchmark(null);
              }}
              className={`w-full px-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-colors ${
                usingCustomRate ? "border-green-500 ring-2 ring-green-500" : "border-gray-200"
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">%</span>
          </div>
        </div>

        {/* Benchmark Table */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Or pick a real benchmark <span className="font-normal normal-case text-gray-300">· approx. 10-yr avg return</span>
          </p>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {BENCHMARKS.map((b, i) => {
              const isSelected = selectedBenchmark === b.ticker;
              const isEtf = b.type === "ETF";
              return (
                <button
                  key={b.ticker}
                  onClick={() => handleBenchmark(b.ticker)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left border-b last:border-b-0 border-gray-100 ${
                    isSelected
                      ? "bg-green-50 border-green-100"
                      : "bg-white hover:bg-gray-50"
                  } ${i === 0 ? "" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm w-12 ${isSelected ? "text-green-700" : "text-gray-900"}`}>
                      {b.ticker}
                    </span>
                    <div>
                      <span className={`text-sm ${isSelected ? "text-green-700" : "text-gray-600"}`}>{b.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${isEtf ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                        {b.type}
                      </span>
                    </div>
                  </div>
                  <span className={`font-extrabold text-sm tabular-nums ${
                    b.return >= 40 ? "text-purple-600" :
                    b.return >= 20 ? "text-green-600" :
                    "text-green-500"
                  }`}>
                    {b.return}%
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-300 mt-2">Past performance does not predict future results.</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Result Hero */}
        <div className="bg-green-50 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">
            Portfolio at Age {retireAge}
          </p>
          <p className="text-5xl font-extrabold text-green-600 mb-1">
            {formatMillions(result.finalValue)}
          </p>
          <p className="text-green-700 text-sm opacity-75">{formatCurrency(result.finalValue)}</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total You Invest</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.totalContributed)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Market Growth</span>
            <span className="font-semibold text-green-600">+{formatCurrency(result.totalGrowth)}</span>
          </div>
        </div>

        {/* Growth Bar */}
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
            <div
              className="bg-gray-400 transition-all duration-500"
              style={{ width: `${(result.contributedPercent * 100).toFixed(1)}%` }}
            />
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${(result.growthPercent * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>Your money ({(result.contributedPercent * 100).toFixed(0)}%)</span>
            <span>Market growth ({(result.growthPercent * 100).toFixed(0)}%)</span>
          </div>
        </div>

        {/* Milestones */}
        {result.milestones.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Growth Milestones</p>
            <div className="space-y-2">
              {result.milestones.map((m, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center px-4 py-2.5 rounded-xl text-sm ${
                    i === result.milestones.length - 1
                      ? "bg-green-50 font-semibold"
                      : "bg-gray-50"
                  }`}
                >
                  <span className={i === result.milestones.length - 1 ? "text-green-700" : "text-gray-600"}>
                    Age {m.age} ({m.year}yr)
                  </span>
                  <span className={i === result.milestones.length - 1 ? "text-green-700" : "text-gray-900"}>
                    {formatMillions(m.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">
            The 7% Rule
          </p>
          <p className="text-sm text-gray-600">
            The S&P 500 has averaged ~10% annually before inflation, ~7% after. Most financial planners use 7% for projections.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">
            Start Earlier, Not Bigger
          </p>
          <p className="text-sm text-gray-600">
            Starting 10 years earlier often beats doubling your contribution. Time is the most powerful variable.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Projections assume a fixed annual return. Actual market returns vary. Not financial advice — consult a fiduciary advisor.
      </p>
    </div>
  );
}
