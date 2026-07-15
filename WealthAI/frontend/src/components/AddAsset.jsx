import React, { useState, useRef } from 'react';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { WealthAPI } from '../services/api';

export default function AddAsset({ onBack, onSuccess }) {
  // Get local date correctly adjusted for the user's timezone
  const getLocalDate = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  };

  const [form, setForm] = useState({ 
    type: 'BUY',
    symbol: '', 
    quantity: '', 
    price: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  // Autocomplete & Dropdown States
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  const handleSymbolChange = (e) => {
    const value = e.target.value.toUpperCase();
    setForm({ ...form, symbol: value });

    // Clear the previous timer if user is still typing fast
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    setShowDropdown(true);

    // Wait 300ms after user stops typing before calling the live API
    debounceRef.current = setTimeout(async () => {
      const results = await WealthAPI.searchSymbols(value);
      setSuggestions(results);
      setIsLoadingSuggestions(false);
    }, 300);
  };

  const selectSuggestion = (item) => {
    setForm({ ...form, symbol: item.symbol });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.price || !form.date) return;

    const res = await WealthAPI.addTransaction({
      transaction_type: form.type,
      symbol: form.symbol,
      quantity: parseFloat(form.quantity),
      price_per_unit: parseFloat(form.price),
      transaction_date: form.date
    });

    if (res.success) {
      onSuccess();
    } else {
      alert(`Error committing transaction: ${res.error}`);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
      <header className="mb-8 flex items-center gap-4">
        <button 
          type="button"
          onClick={onBack}
          className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add Asset Transaction</h1>
          <p className="text-sm text-gray-500 mt-0.5">Search and select a live ticker to record your purchase.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleAddAsset} className="space-y-6">
          
          {/* Transaction Type Toggle */}
          <div className="flex gap-4 mb-4">
            <button type="button" onClick={() => setForm({...form, type: 'BUY'})} className={`flex-1 py-2 rounded-xl font-bold border transition-colors cursor-pointer ${form.type === 'BUY' ? 'bg-green-100 border-green-600 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>BUY</button>
            <button type="button" onClick={() => setForm({...form, type: 'SELL'})} className={`flex-1 py-2 rounded-xl font-bold border transition-colors cursor-pointer ${form.type === 'SELL' ? 'bg-red-100 border-red-600 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>SELL</button>
          </div>

          {/* Stock Symbol Auto-Complete Container */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Stock Symbol (Yahoo Format)
            </label>
            <div className="relative">
              <input 
                type="text" 
                required 
                placeholder="Type company name or ticker (e.g. RELIANCE, TATA, AAPL)..." 
                value={form.symbol} 
                onChange={handleSymbolChange}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 250)} // Delay blur so click registers
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all uppercase font-medium"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Live Suggestions Dropdown Menu */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-50 animate-fade-in">
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4 text-blue-600" /> Searching live markets...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    No matching tickers found. Keep typing or enter manually.
                  </div>
                ) : (
                  suggestions.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => selectSuggestion(item)}
                      className="p-3 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-center justify-between text-left"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block">{item.symbol}</span>
                        <span className="text-xs text-gray-500 line-clamp-1">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 whitespace-nowrap ml-2">
                        {item.exchange || 'MARKET'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Quantity Bought</label>
              <input 
                type="number" step="any" required placeholder="e.g. 10" 
                value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Price Per Unit (INR)</label>
              <input 
                type="number" step="any" required placeholder="e.g. 2450" 
                value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Purchase Date</label>
            <input 
              type="date" required 
              value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onBack}
              className="w-1/3 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-center cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
            >
              Commit Entry
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}