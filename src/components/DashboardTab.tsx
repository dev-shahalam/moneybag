import React from 'react';

type DashboardProps = {
  cashBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalLoanDue: number;
  totalLoanReceivable: number;
  totalAssetsValue: number;
  selectedMonth: string;
};

export default function DashboardTab({
  cashBalance,
  totalIncome,
  totalExpense,
  totalLoanDue,
  totalLoanReceivable,
  totalAssetsValue,
  selectedMonth
}: DashboardProps) {
  // Percentages for modern bar views
  const grandTotal = totalIncome + totalExpense + totalLoanDue + totalLoanReceivable + totalAssetsValue;
  const incPercent = grandTotal > 0 ? Math.round((totalIncome / grandTotal) * 100) : 0;
  const expPercent = grandTotal > 0 ? Math.round((totalExpense / grandTotal) * 100) : 0;
  const duePercent = grandTotal > 0 ? Math.round((totalLoanDue / grandTotal) * 100) : 0;
  const getPercent = grandTotal > 0 ? Math.round((totalLoanReceivable / grandTotal) * 100) : 0;
  const assetPercent = grandTotal > 0 ? Math.round((totalAssetsValue / grandTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      
      {/* Top Cards: Total Cash & Total Assets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#00556A] to-teal-950 p-4 rounded-2xl shadow-lg border border-teal-700/40">
          <p className="text-[11px] text-teal-200 uppercase tracking-wider font-semibold">Total Cash in Hand</p>
          <h2 className="text-2xl font-extrabold mt-1">৳ {cashBalance.toLocaleString()}</h2>
        </div>
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 rounded-2xl shadow-lg border border-indigo-700/40">
          <p className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Total Assets</p>
          <h2 className="text-2xl font-extrabold mt-1">৳ {totalAssetsValue.toLocaleString()}</h2>
        </div>
      </div>

      {/* Income, Expense, Loan Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/90 p-3.5 rounded-xl border border-gray-700/60 shadow-sm">
          <p className="text-xs text-emerald-400 font-semibold">Income</p>
          <p className="text-lg font-bold mt-1">৳ {totalIncome}</p>
        </div>
        <div className="bg-gray-800/90 p-3.5 rounded-xl border border-gray-700/60 shadow-sm">
          <p className="text-xs text-[#FF5437] font-semibold">Expense</p>
          <p className="text-lg font-bold mt-1">৳ {totalExpense}</p>
        </div>
        <div className="bg-gray-800/90 p-3.5 rounded-xl border border-gray-700/60 shadow-sm">
          <p className="text-xs text-amber-400 font-semibold">Total Loan Due (Pay)</p>
          <p className="text-lg font-bold mt-1">৳ {totalLoanDue}</p>
        </div>
        <div className="bg-gray-800/90 p-3.5 rounded-xl border border-gray-700/60 shadow-sm">
          <p className="text-xs text-blue-400 font-semibold">Loan Receivable (Get)</p>
          <p className="text-lg font-bold mt-1">৳ {totalLoanReceivable}</p>
        </div>
      </div>

      {/* Modern Line / Bar Progress Overview (Replacing Pie Chart) */}
      <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 space-y-4 shadow-md">
        <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-300">📊 Financial Overview Distribution</h3>
          <span className="text-[10px] bg-[#00556A] text-teal-200 px-2.5 py-0.5 rounded-full font-medium">{selectedMonth}</span>
        </div>

        {/* Net Flow Summary Badge */}
        <div className="bg-gray-900/60 border border-gray-800 p-3 rounded-xl text-center">
          <span className="text-[11px] text-gray-400 block mb-0.5">Net Financial Flow</span>
          <span className="text-lg font-extrabold text-white">৳ {grandTotal.toLocaleString()}</span>
        </div>

        {/* Modern Progress Bars Breakdown */}
        <div className="space-y-3.5 pt-1">
          {/* Assets Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-purple-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Assets</span>
              <span className="text-white">৳ {totalAssetsValue} ({assetPercent}%)</span>
            </div>
            <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${assetPercent}%` }}></div>
            </div>
          </div>

          {/* Income Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Income</span>
              <span className="text-white">৳ {totalIncome} ({incPercent}%)</span>
            </div>
            <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${incPercent}%` }}></div>
            </div>
          </div>

          {/* Expense Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-[#FF5437] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF5437] inline-block"></span> Expense</span>
              <span className="text-white">৳ {totalExpense} ({expPercent}%)</span>
            </div>
            <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
              <div className="bg-[#FF5437] h-full rounded-full transition-all duration-500" style={{ width: `${expPercent}%` }}></div>
            </div>
          </div>

          {/* Due & Receivable Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-gray-900/50 p-2.5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span> Due ({duePercent}%)
              </div>
              <div className="text-sm font-bold text-white">৳ {totalLoanDue}</div>
            </div>
            <div className="bg-gray-900/50 p-2.5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-1.5 text-[11px] text-blue-400 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span> Get ({getPercent}%)
              </div>
              <div className="text-sm font-bold text-white">৳ {totalLoanReceivable}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}