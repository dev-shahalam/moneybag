import React, { useState } from 'react';

type Loan = {
  id: string;
  date: string;
  month: string;
  type: 'taken' | 'given';
  person: string;
  totalAmount: number;
  paidAmount: number;
};

type LoansProps = {
  loans: Loan[];
  filteredLoans: Loan[];
  selectedMonth: string;
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  getMonthStr: (dateStr: string) => string;
};

export default function LoansTab({
  loans,
  filteredLoans,
  selectedMonth,
  setLoans,
  getMonthStr
}: LoansProps) {
  const [loanType, setLoanType] = useState<'taken' | 'given'>('taken');
  const [loanPerson, setLoanPerson] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPaidAmount, setLoanPaidAmount] = useState('0');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanError, setLoanError] = useState('');
  
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [repayLoanId, setRepayLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-800 p-1 rounded-xl">
        <button onClick={() => setLoanType('taken')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${loanType === 'taken' ? 'bg-[#FF5437] text-white' : 'text-gray-400'}`}>Loan Taken (Due)</button>
        <button onClick={() => setLoanType('given')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${loanType === 'given' ? 'bg-[#00556A] text-white' : 'text-gray-400'}`}>Loan Given (Get)</button>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (!loanPerson.trim() || !loanAmount || !loanDate) return;
        const total = parseFloat(loanAmount);
        const paid = parseFloat(loanPaidAmount) || 0;
        const trimmedPerson = loanPerson.trim().toLowerCase();
        const monthStr = getMonthStr(loanDate);

        if (editingLoanId) {
          setLoans(loans.map(l => l.id === editingLoanId ? {
            ...l, date: loanDate, month: monthStr, type: loanType, person: loanPerson.trim(), totalAmount: total, paidAmount: paid
          } : l));
          setEditingLoanId(null);
          setLoanError('');
        } else {
          const existingLoan = loans.find(l => l.person.toLowerCase() === trimmedPerson && l.type === loanType && (l.totalAmount - l.paidAmount > 0));
          if (existingLoan) {
            setLoanError(`⚠️ "${loanPerson.trim()}" has already an active loan record!`);
            return;
          }

          const newLoan: Loan = {
            id: Date.now().toString(),
            date: loanDate,
            month: monthStr,
            type: loanType,
            person: loanPerson.trim(),
            totalAmount: total,
            paidAmount: paid
          };
          setLoans([newLoan, ...loans]);
          setLoanError('');
        }
        setLoanPerson(''); setLoanAmount(''); setLoanPaidAmount('0');
      }} className="space-y-3 bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <p className="text-xs font-semibold text-gray-300">{editingLoanId ? 'Edit Loan Record' : 'New Loan Record'}</p>
        {loanError && <p className="text-xs text-[#FF5437] bg-red-950/40 p-2 rounded border border-red-800">{loanError}</p>}
        
        <input 
          type="date" 
          value={loanDate} 
          onChange={(e) => setLoanDate(e.target.value)} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none cursor-pointer" 
        />
        
        <input 
          type="text" 
          placeholder="Person Name (e.g. Shah Alam, Anas, Nipa)" 
          value={loanPerson} 
          onChange={(e) => { setLoanPerson(e.target.value); setLoanError(''); }} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" 
        />
        
        <input type="number" placeholder="Total Amount (৳)" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
        
        {editingLoanId && (
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Already Paid / Returned Amount (৳):</label>
            <input type="number" placeholder="Paid Amount (৳)" value={loanPaidAmount} onChange={(e) => setLoanPaidAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all ${editingLoanId ? 'bg-[#FF5437]' : 'bg-[#00556A]'}`}>
            {editingLoanId ? 'Update Loan Record' : 'Save Loan'}
          </button>
          {editingLoanId && (
            <button type="button" onClick={() => { setEditingLoanId(null); setLoanPerson(''); setLoanAmount(''); setLoanPaidAmount('0'); setLoanError(''); }} className="px-4 py-2.5 bg-gray-700 text-xs rounded-lg font-semibold">Cancel</button>
          )}
        </div>
      </form>

      <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700 space-y-3">
        <p className="text-xs font-semibold text-[#FF5437]">Pay / Receive Partial Loan Amount</p>
        <select value={repayLoanId} onChange={(e) => setRepayLoanId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none">
          <option value="">Select Person (Due / Receivable)</option>
          {loans.filter(l => l.totalAmount - l.paidAmount > 0).map(l => (
            <option key={l.id} value={l.id}>
              {l.person} ({l.type === 'taken' ? 'Due: ৳' : 'Get: ৳'}{l.totalAmount - l.paidAmount})
            </option>
          ))}
        </select>
        <input type="number" placeholder="Payment Amount (৳)" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
        <button onClick={() => {
          if (!repayLoanId || !repayAmount) return;
          const payAmt = parseFloat(repayAmount);
          setLoans(loans.map(l => l.id === repayLoanId ? { ...l, paidAmount: l.paidAmount + payAmt } : l));
          setRepayAmount(''); setRepayLoanId('');
        }} className="w-full bg-[#FF5437] hover:opacity-90 py-2.5 rounded-lg font-bold text-sm text-white transition-all">Confirm Payment</button>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Loans ({selectedMonth})</h3>
        {filteredLoans.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No loan records for this month.</p> : null}
        {filteredLoans.map(l => {
          const remaining = l.totalAmount - l.paidAmount;
          return (
            <div key={l.id} className="flex justify-between items-center bg-gray-800/80 p-3 rounded-xl border border-gray-700/50 shadow-sm">
              <div>
                <p className="font-semibold text-sm">{l.person} <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 ml-1">{l.type === 'taken' ? 'Taken' : 'Given'}</span></p>
                <p className="text-[11px] text-gray-400">{l.date} | Total: ৳{l.totalAmount} | Paid: ৳{l.paidAmount}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-bold text-sm ${l.type === 'taken' ? 'text-[#FF5437]' : 'text-emerald-400'}`}>
                  ৳{remaining}
                </span>
                <button onClick={() => {
                  setEditingLoanId(l.id);
                  setLoanType(l.type);
                  setLoanPerson(l.person);
                  setLoanAmount(l.totalAmount.toString());
                  setLoanPaidAmount(l.paidAmount.toString());
                  setLoanDate(l.date);
                  setLoanError('');
                }} className="text-gray-300 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded">✏️</button>
                <button onClick={() => setLoans(loans.filter(item => item.id !== l.id))} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-gray-700 rounded">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}