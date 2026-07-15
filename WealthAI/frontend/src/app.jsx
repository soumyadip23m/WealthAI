import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AssetCard from './components/AssetCard';
import { WealthAPI } from './services/api';
import AddAsset from './components/AddAsset';
import Portfolio from './components/Portfolio';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [prices, setPrices] = useState({ NIFTY: 0, SENSEX: 0 });
  const [portfolio, setPortfolio] = useState({
    holdings: [],
    summary: { total_investment: 0, total_current_value: 0, total_pnl: 0, total_pnl_pct: 0 }
  });

  const refreshData = async () => {
    try {
      const nifty = await WealthAPI.getMarketData('%5ENSEI');
      const sensex = await WealthAPI.getMarketData('%5EBSESN');
      const portData = await WealthAPI.getPortfolio();

      setPrices({ NIFTY: nifty?.c || 0, SENSEX: sensex?.c || 0 });
      setPortfolio({
        holdings: Array.isArray(portData?.holdings) ? portData.holdings : [],
        summary: portData?.summary || { total_investment: 0, total_current_value: 0, total_pnl: 0, total_pnl_pct: 0 }
      });
    } catch (err) {
      console.error("Failed to parse dynamic tracking metrics:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  });
  console.log("STEP 3: App is rendering. Current view state is ->", currentView);
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-800 font-sans">
      <Sidebar currentView={currentView} onNavigate={(view) => {
        console.log("STEP 2: App received navigation instruction for:", view);
        setCurrentView(view);
      }} />

      {/* View Router */}
      {currentView === 'portfolio' ? (

        <Portfolio portfolio={portfolio} />
      ) : currentView === 'add-asset' ? (
        <AddAsset
          onBack={() => setCurrentView('dashboard')}
          onSuccess={async () => {
            await refreshData();
            setCurrentView('dashboard');
          }}
        />
      ) : (
        <main className="flex-1 overflow-y-auto p-8 block">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
            <button
              type="button"
              onClick={() => setCurrentView('add-asset')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-medium transition-all active:scale-95 flex items-center gap-1 cursor-pointer z-10"
            >
              <Plus className="h-4 w-4" /> Add Asset
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AssetCard title="Nifty 50" value={prices.NIFTY} change="Live" isPositive={true} />
            <AssetCard title="Sensex" value={prices.SENSEX} change="Live" isPositive={true} />
            <AssetCard
              title="Total Portfolio Value"
              value={portfolio.summary.total_current_value}
              change={`${portfolio.summary.total_pnl_pct >= 0 ? '+' : ''}${portfolio.summary.total_pnl_pct}%`}
              isPositive={portfolio.summary.total_pnl >= 0}
            />
            <AssetCard title="Tax Liability Est." value={50000} isTax={true} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Invested Assets & Real-Time Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-sm font-semibold">
                    <th className="pb-3">Asset Ticker</th>
                    <th className="pb-3">Holdings Qty</th>
                    <th className="pb-3">Avg Buy Price</th>
                    <th className="pb-3">Current Value</th>
                    <th className="pb-3">Live Market Price</th>
                    <th className="pb-3 text-right">Net P&L</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {portfolio.holdings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">
                        No assets found. Click "Add Asset" to begin tracking.
                      </td>
                    </tr>
                  ) : (
                    portfolio.holdings.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {item?.name || item?.asset_name || "Unknown Asset"}
                            </span>

                            <span className="text-xs text-gray-500">
                              {item?.symbol || "-"}
                            </span>
                          </div>
                        </td>                        <td className="py-4 text-gray-600">{item?.quantity || 0}</td>
                        <td className="py-4 text-gray-600">{currencyFormatter.format(item?.average_price || 0)}</td>
                        <td className="py-4 font-semibold text-gray-800">{currencyFormatter.format(item?.current_value || 0)}</td>
                        <td className="py-4 text-gray-600">{currencyFormatter.format(item?.live_price || 0)}</td>
                        <td className={`py-4 text-right font-bold ${item?.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="flex items-center justify-end gap-0.5">
                            {item?.pnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {currencyFormatter.format(item?.pnl || 0)} ({Number(item?.pnl_pct || 0).toFixed(2)}%)
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={async () => {
                              if(window.confirm(`Are you sure you want to delete ${item.symbol}?`)) {
                                await WealthAPI.deleteAsset(item.id);
                                refreshData();
                              }
                            }}
                            className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}