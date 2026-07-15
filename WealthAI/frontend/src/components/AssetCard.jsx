import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AssetCard({ title, value, change, isPositive, isTax }) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });

  // Safe check: verifies the value exists and is a number (including 0)
  const hasValue = value !== undefined && value !== null && !isNaN(value);
  const displayValue = hasValue ? formatter.format(value) : "Loading...";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-gray-500 text-sm font-semibold mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${isTax ? 'text-orange-600' : 'text-gray-800'}`}>
        {displayValue}
      </p>
      {!isTax && hasValue && value > 0 && (
        <span className={`text-sm font-medium flex items-center mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4 mr-0.5" /> : <ArrowDownRight className="h-4 w-4 mr-0.5" />}
          {change}
        </span>
      )}
    </div>
  );
}