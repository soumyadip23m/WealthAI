import React from 'react';
import { PieChart, BarChart2, ArrowUpRight, ArrowDownRight, Layers, Briefcase } from 'lucide-react';

export default function Portfolio({ portfolio }) {
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];
  const summary = portfolio?.summary || {};

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  });

  const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

  // Calculate total portfolio basis using live value OR fallback to initial buy investment
  const totalVal = holdings.reduce((sum, item) => {
    const activeVal = Number(item.current_value) > 0 ? Number(item.current_value) : Number(item.investment) || 0;
    return sum + activeVal;
  }, 0) || 1;

  let accumulatedPercent = 0;
  const pieGradientStops = holdings.map((item, idx) => {
    // Fall back to investment baseline if Yahoo API returned 0
    const activeVal = Number(item.current_value) > 0 ? Number(item.current_value) : Number(item.investment) || 0;
    const percent = (activeVal / totalVal) * 100;
    const start = accumulatedPercent;
    accumulatedPercent += percent;
    const color = chartColors[idx % chartColors.length];
    return `${color} ${start}% ${accumulatedPercent}%`;
  }).join(', ');

  const pieStyle = holdings.length > 0 && accumulatedPercent > 0 ? {
    background: `conic-gradient(${pieGradientStops})`
  } : { background: '#e5e7eb' };

  // Find peak baseline scale for horizontal bar rendering
  const maxHoldingValue = holdings.reduce((max, item) => {
    const activeVal = Number(item.current_value) > 0 ? Number(item.current_value) : Number(item.investment) || 0;
    return Math.max(max, activeVal, Number(item.investment) || 0);
  }, 0) || 1;

  return (
    <main className="flex-1 overflow-y-auto p-8 block bg-gray-50">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
          <Briefcase className="h-8 w-8 text-blue-600" /> Portfolio Analytics & Performance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Deep-dive visual breakdown of your asset distributions, valuation growth, and live profit/loss margins.
        </p>
      </header>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Invested Capital</span>
          <p className="text-2xl font-bold text-gray-800 mt-1">{currencyFormatter.format(Number(summary.total_investment) || 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Market Valuation</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{currencyFormatter.format(Number(summary.total_current_value) || 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Realized & Unrealized P&L</span>
          <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${(Number(summary.total_pnl) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(Number(summary.total_pnl) || 0) >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
            {currencyFormatter.format(Number(summary.total_pnl) || 0)} ({Number(summary.total_pnl_pct) || 0}%)
          </p>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <Layers className="h-12 w-12 mx-auto mb-3 text-gray-300 stroke-[1.5]" />
          <p className="text-lg font-medium text-gray-600">No portfolio assets found.</p>
          <p className="text-sm mt-1">Switch to the Dashboard and click "+ Add Asset" to record transactions and generate visual graphs.</p>
        </div>
      ) : (
        <>
          {/* Section 1: Pie Chart & Asset Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-base font-bold text-gray-800 self-start mb-6 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-500" /> Asset Allocation (By Value)
              </h3>

              <div className="relative w-56 h-56 rounded-full shadow-inner flex items-center justify-center my-2 transition-transform hover:scale-105 duration-300" style={pieStyle}>
                <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Assets</span>
                  <span className="text-2xl font-black text-gray-800">{holdings.length}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <h3 className="text-base font-bold text-gray-800 mb-4">Allocation Legend & Valuation Share</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {holdings.map((item, idx) => {
                  const activeVal = Number(item.current_value) > 0 ? Number(item.current_value) : Number(item.investment) || 0;
                  const sharePct = ((activeVal / totalVal) * 100).toFixed(1);
                  const dotColor = chartColors[idx % chartColors.length];
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50 hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: dotColor }}></span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {item?.name || item?.asset_name || "Unknown Asset"}
                          </span>

                          <span className="text-xs text-gray-500">
                            {item?.symbol || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-sm">{currencyFormatter.format(activeVal)}</p>
                        <p className="text-xs font-semibold text-gray-500">{sharePct}% of portfolio</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Performance Bar Graph */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-500" /> Capital Performance (Invested vs. Live Value)
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-300 rounded"></span> Invested Capital</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-600 rounded"></span> Current Market Value</span>
              </div>
            </div>

            <div className="space-y-6">
              {holdings.map((item, idx) => {
                const investVal = Number(item.investment) || 0;
                const activeVal = Number(item.current_value) > 0 ? Number(item.current_value) : investVal;

                const investScalePct = Math.min((investVal / maxHoldingValue) * 100, 100);
                const currentScalePct = Math.min((activeVal / maxHoldingValue) * 100, 100);
                const isProfit = (Number(item.pnl) || 0) >= 0;

                return (
                  <div key={idx} className="space-y-1.5 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between text-sm font-bold">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {item?.name || item?.asset_name || "Unknown Asset"}
                        </span>

                        <span className="text-xs text-gray-500">
                          {item?.symbol || "-"} • {item?.quantity} units held
                        </span>
                      </div>                      <span className={isProfit ? 'text-green-600' : 'text-red-600'}>
                        {isProfit ? '+' : ''}{Number(item?.pnl_pct || 0).toFixed(2)}% ({currencyFormatter.format(Number(item?.pnl || 0))})
                      </span>
                    </div>

                    {/* Bar 1: Invested Baseline */}
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex items-center">
                      <div className="bg-gray-400 h-full rounded-full transition-all duration-500" style={{ width: `${investScalePct}%` }}></div>
                    </div>

                    {/* Bar 2: Live Market Growth/Deficit */}
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex items-center">
                      <div className={`h-full rounded-full transition-all duration-500 ${isProfit ? 'bg-blue-600' : 'bg-rose-500'}`} style={{ width: `${currentScalePct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}