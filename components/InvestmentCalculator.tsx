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
  const [currentAge, setCurrentAge] = useState("25");
  const [retireAge, setRetireAge] = useState("65");
  const [initialRaw, setInitialRaw] = useState("10,000");
  const [monthlyRaw, setMonthlyRaw] = useState("500");
  const [rate, setRate] = useState(7);
  const [customRate, setCustomRate] = useState("");
  const [usingCustomRate, setUsingCustomRate] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);

  // Withdrawal
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(false);
  const [withdrawalAge, setWithdrawalAge] = useState("65");
  const [withdrawalRaw, setWithdrawalRaw] = useState("5,000");
  const [endAge, setEndAge] = useState("85");

  // Tooltip
  const [tooltip, setTooltip] = useState<{
    age: number; value: number; svgX: number; svgY: number; phase: "growth" | "withdrawal"; clientX: number; clientY: number;
  } | null>(null);

  const initialAmount = parseDollarInput(initialRaw);
  const monthlyContribution = parseDollarInput(monthlyRaw);
  const monthlyWithdrawal = parseDollarInput(withdrawalRaw);
  const benchmarkRate = BENCHMARKS.find((b) => b.ticker === selectedBenchmark)?.return ?? rate;
  const effectiveRate = selectedBenchmark
    ? benchmarkRate
    : usingCustomRate
    ? parseFloat(customRate) || 0
    : rate;

  const currentAgeNum = parseInt(currentAge) || 25;
  const retireAgeNum = parseInt(retireAge) || 65;
  const withdrawalAgeNum = parseInt(withdrawalAge) || currentAgeNum + 1;
  const endAgeNum = parseInt(endAge) || 85;

  const years = Math.max(retireAgeNum - currentAgeNum, 1);

  const result = useMemo(
    () =>
      calculateInvestment(
        initialAmount,
        monthlyContribution,
        effectiveRate,
        currentAgeNum,
        retireAgeNum,
        withdrawalEnabled ? withdrawalAgeNum : null,
        monthlyWithdrawal,
        withdrawalEnabled ? endAgeNum : retireAgeNum
      ),
    [initialAmount, monthlyContribution, effectiveRate, currentAgeNum, retireAgeNum, withdrawalEnabled, withdrawalAgeNum, monthlyWithdrawal, endAgeNum]
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

  // SVG chart
  const chartWidth = 600;
  const chartHeight = 180;
  const padL = 0;
  const padR = 0;
  const padT = 8;
  const padB = 24;
  const innerW = chartWidth - padL - padR;
  const innerH = chartHeight - padT - padB;

  const points = result.chartPoints;
  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const minAge = points[0]?.age ?? currentAge;
  const maxAge = points[points.length - 1]?.age ?? retireAge;
  const ageRange = Math.max(maxAge - minAge, 1);

  function toX(age: number) {
    return padL + ((age - minAge) / ageRange) * innerW;
  }
  function toY(val: number) {
    return padT + innerH - (val / maxVal) * innerH;
  }

  // Build SVG path
  const growthPoints = points.filter((p) => p.phase === "growth");
  const withdrawalPoints = points.filter((p) => p.phase === "withdrawal");

  function buildPath(pts: typeof points) {
    if (pts.length < 2) return "";
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.age)} ${toY(p.value)}`).join(" ");
  }

  function buildArea(pts: typeof points) {
    if (pts.length < 2) return "";
    const line = buildPath(pts);
    const lastX = toX(pts[pts.length - 1].age);
    const firstX = toX(pts[0].age);
    const bottom = padT + innerH;
    return `${line} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
  }

  function handleChartMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (points.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pctX = (e.clientX - rect.left) / rect.width;
    const age = minAge + pctX * ageRange;
    const nearest = points.reduce((best, p) =>
      Math.abs(p.age - age) < Math.abs(best.age - age) ? p : best
    );
    setTooltip({
      age: nearest.age,
      value: nearest.value,
      svgX: toX(nearest.age),
      svgY: toY(nearest.value),
      phase: nearest.phase,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  }

  // X-axis age labels
  const ageLabelCount = 5;
  const ageLabels: number[] = [];
  for (let i = 0; i <= ageLabelCount; i++) {
    ageLabels.push(Math.round(minAge + (ageRange * i) / ageLabelCount));
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
              onChange={(e) => setCurrentAge(e.target.value)}
              onBlur={() => {
                const v = Math.max(10, Math.min(80, currentAgeNum));
                setCurrentAge(String(v));
                if (v >= retireAgeNum) setRetireAge(String(v + 1));
              }}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Retire at Age</label>
            <input
              type="number"
              min={currentAgeNum + 1}
              max={100}
              value={retireAge}
              onChange={(e) => setRetireAge(e.target.value)}
              onBlur={() => setRetireAge(String(Math.max(currentAgeNum + 1, Math.min(100, retireAgeNum))))}

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
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Annual Return Rate
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {RATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleRatePreset(preset.value)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                  !usingCustomRate && !selectedBenchmark && rate === preset.value
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div>{preset.label}</div>
                <div className={`text-xs font-bold mt-0.5 ${!usingCustomRate && !selectedBenchmark && rate === preset.value ? "text-green-600" : "text-gray-400"}`}>
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
            {BENCHMARKS.map((b) => {
              const isSelected = selectedBenchmark === b.ticker;
              return (
                <button
                  key={b.ticker}
                  onClick={() => handleBenchmark(b.ticker)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left border-b last:border-b-0 border-gray-100 ${
                    isSelected ? "bg-green-50 border-green-100" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm w-12 ${isSelected ? "text-green-700" : "text-gray-900"}`}>
                      {b.ticker}
                    </span>
                    <div>
                      <span className={`text-sm ${isSelected ? "text-green-700" : "text-gray-600"}`}>{b.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${b.type === "ETF" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
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

        {/* Withdrawal Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Monthly Withdrawal</label>
            <button
              onClick={() => setWithdrawalEnabled(!withdrawalEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                withdrawalEnabled ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  withdrawalEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {withdrawalEnabled && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Start at age</label>
                <input
                  type="number"
                  min={currentAgeNum + 1}
                  max={endAgeNum - 1}
                  value={withdrawalAge}
                  onChange={(e) => setWithdrawalAge(e.target.value)}
                  onBlur={() => setWithdrawalAge(String(Math.max(currentAgeNum + 1, Math.min(endAgeNum - 1, withdrawalAgeNum))))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Monthly amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={withdrawalRaw}
                    onChange={(e) => setWithdrawalRaw(formatDollarInput(parseDollarInput(e.target.value)))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Show until age</label>
                <input
                  type="number"
                  min={withdrawalAgeNum + 1}
                  max={120}
                  value={endAge}
                  onChange={(e) => setEndAge(e.target.value)}
                  onBlur={() => setEndAge(String(Math.max(withdrawalAgeNum + 1, Math.min(120, endAgeNum))))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          )}
          {withdrawalEnabled && result.balanceDepletedAge && (
            <p className="text-xs text-red-500 mt-2 font-medium">
              ⚠ At this withdrawal rate, your balance runs out around age {result.balanceDepletedAge}.
            </p>
          )}
          {withdrawalEnabled && !result.balanceDepletedAge && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✓ Portfolio sustains this withdrawal through age {endAge}.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Chart */}
        {points.length > 1 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Portfolio Over Time</p>
            <div className="w-full overflow-hidden rounded-xl bg-gray-50 px-2 pt-2 pb-1">
              <div className="relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full block"
                  preserveAspectRatio="none"
                  style={{ cursor: "crosshair" }}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="withdrawalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Growth area */}
                  {growthPoints.length > 1 && (
                    <>
                      <path d={buildArea(growthPoints)} fill="url(#growthGrad)" />
                      <path d={buildPath(growthPoints)} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
                    </>
                  )}

                  {/* Withdrawal area */}
                  {withdrawalPoints.length > 1 && growthPoints.length > 0 && (
                    <>
                      <path
                        d={buildArea([growthPoints[growthPoints.length - 1], ...withdrawalPoints])}
                        fill="url(#withdrawalGrad)"
                      />
                      <path
                        d={buildPath([growthPoints[growthPoints.length - 1], ...withdrawalPoints])}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {/* X-axis labels */}
                  {ageLabels.map((age) => (
                    <text
                      key={age}
                      x={toX(age)}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#9ca3af"
                    >
                      {age}
                    </text>
                  ))}

                  {/* Hover crosshair */}
                  {tooltip && (
                    <>
                      <line
                        x1={tooltip.svgX} y1={padT}
                        x2={tooltip.svgX} y2={padT + innerH}
                        stroke="#d1d5db"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={tooltip.svgX}
                        cy={tooltip.svgY}
                        r="5"
                        fill={tooltip.phase === "withdrawal" ? "#f97316" : "#22c55e"}
                        stroke="white"
                        strokeWidth="2.5"
                      />
                    </>
                  )}
                </svg>

                {/* Tooltip bubble */}
                {tooltip && (() => {
                  const vw = window.innerWidth;
                  const xShift = tooltip.clientX < 90 ? "0%" : tooltip.clientX > vw - 90 ? "-100%" : "-50%";
                  const yShift = tooltip.clientY < 160 ? "16px" : "calc(-100% - 16px)";
                  return (
                    <div
                      className="fixed pointer-events-none z-50"
                      style={{ left: tooltip.clientX, top: tooltip.clientY, transform: `translate(${xShift}, ${yShift})` }}
                    >
                      <div className={`rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg text-white ${
                        tooltip.phase === "withdrawal" ? "bg-orange-500" : "bg-gray-900"
                      }`}>
                        <div className="opacity-75 font-medium">Age {tooltip.age}</div>
                        <div className="font-extrabold text-sm">{formatCurrency(tooltip.value)}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-4 px-1 pb-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-400">Growth</span>
                </div>
                {withdrawalEnabled && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-orange-400 rounded"></div>
                    <span className="text-xs text-gray-400">Withdrawal</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result Hero */}
        <div className="bg-green-50 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">
            Portfolio at Age {withdrawalEnabled ? endAge : retireAge}
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
                    m.age === retireAgeNum
                      ? "bg-green-50 font-semibold"
                      : m.phase === "withdrawal"
                      ? "bg-orange-50"
                      : "bg-gray-50"
                  }`}
                >
                  <span className={m.age === retireAgeNum ? "text-green-700" : m.phase === "withdrawal" ? "text-orange-600" : "text-gray-600"}>
                    Age {m.age} ({m.year}yr)
                    {m.phase === "withdrawal" && <span className="text-xs ml-1 opacity-60">· withdrawing</span>}
                  </span>
                  <span className={m.age === retireAgeNum ? "text-green-700" : m.phase === "withdrawal" ? "text-orange-600" : "text-gray-900"}>
                    {formatMillions(m.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Affiliate CTA — Robinhood referral */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900 mb-1">Start investing commission-free</p>
            <p className="text-sm text-gray-500">Join Robinhood and earn rewards just for signing up — no account minimums.</p>
          </div>
          <a
            href="/go/robinhood"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-green-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Get Started →
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3">Referral · Robinhood</p>
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
