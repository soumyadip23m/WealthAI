import React from 'react';
import { Home, PieChart, Brain, FileText } from 'lucide-react';

export default function Sidebar({ currentView, onNavigate }) {

  return (
    <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-lg z-20 shrink-0 h-full">
      <div className="p-6 text-2xl font-bold border-b border-slate-700">
        WealthAI<span className="text-blue-500">.</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <button 
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center px-4 py-3 rounded transition-colors text-left font-medium cursor-pointer ${
            currentView === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-slate-800'
          }`}
        >
          <Home className="mr-3 h-5 w-5" /> Dashboard
        </button>
        
        <button 
          type="button"
          onClick={() => {
            console.log("STEP 1: Sidebar button clicked!"); 
            console.log("onNavigate =", onNavigate);
            onNavigate('portfolio'); }}
          className={`w-full flex items-center px-4 py-3 rounded transition-colors text-left font-medium cursor-pointer ${
            currentView === 'portfolio' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-slate-800'
          }`}
        >
          <PieChart className="mr-3 h-5 w-5" /> Portfolio
        </button>

        <button 
          type="button"
          onClick={() => alert("AI Insights module active on Dashboard tab.")}
          className="w-full flex items-center px-4 py-3 rounded text-gray-300 hover:bg-slate-800 transition-colors text-left font-medium cursor-pointer"
        >
          <Brain className="mr-3 h-5 w-5" /> AI Insights
        </button>
        
        <button 
          type="button"
          onClick={() => alert("Tax reporting is calculated automatically from net realized P&L.")}
          className="w-full flex items-center px-4 py-3 rounded text-gray-300 hover:bg-slate-800 transition-colors text-left font-medium cursor-pointer"
        >
          <FileText className="mr-3 h-5 w-5" /> Tax Reports
        </button>
      </nav>
    </aside>
  );
}