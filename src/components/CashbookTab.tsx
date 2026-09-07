import React, { useState } from 'react';

type Transaction = {
  id: string;
  date: string;
  month: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
};

type CashbookProps = {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedMonth: string;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCashBalance: React.Dispatch<React.SetStateAction<number>>;
  getMonthStr: (dateStr: string) => string;
};

export default function CashbookTab({
  transactions,
  filteredTransactions,
  selectedMonth,
  setTransactions,
  setCashBalance,
  getMonthStr
}: CashbookProps) {
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Salary In');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-800 p-1 rounded-xl">
        <button onClick={() => setTxType('income')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${txType === 'income' ? 'bg-[#00556A] text-white shadow' : 'text-gray-400'}`}>Income</button>
        <button onClick={() => setTxType('expense')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${txType === 'expense' ? 'bg-[#FF5437] text-white shadow' : 'text-gray-400'}`}>Expense</button>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (!txAmount || !txDate) return;
        const amt = parseFloat(txAmount);
        const monthStr = getMonthStr(txDate);

        if (editingTxId) {
          const oldTx = transactions.find(t => t.id === editingTxId);
          if (oldTx) {
            const diff = (txType === 'income' ? amt : -amt) - (oldTx.type === 'income' ? oldTx.amount : -oldTx.amount);
            setCashBalance(prev => prev + diff);
          }
          setTransactions(transactions.map(t => t.id === editingTxId ? {
            ...t, date: txDate, month: monthStr, type: txType, amount: amt, category: txCategory, note: txNote
          } : t));
          setEditingTxId(null);
        } else {
          const newTx: Transaction = {
            id: Date.now().toString(),
            date: txDate,
            month: monthStr,
            type: txType,
            amount: amt,
            category: txCategory,
            note: txNote
          };
          setTransactions([newTx, ...transactions]);
          setCashBalance(prev => txType === 'income' ? prev + amt : prev - amt);
        }

        setTxAmount(''); setTxNote('');
      }} className="space-y-3 bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <p className="text-xs font-semibold text-gray-300">{editingTxId ? 'Edit Transaction' : 'New Transaction Entry'}</p>
        <input 
          type="date" 
          value={txDate} 
          onChange={(e) => setTxDate(e.target.value)} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:border-[#00556A] focus:outline-none cursor-pointer" 
        />
        <input type="number" placeholder="Amount (৳)" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:border-[#00556A] focus:outline-none" />
        <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none">
          {txType === 'income' ? (
            <><option value="Salary In">Salary In</option><option value="Business In">Business In</option><option value="Others In">Others In</option></>
          ) : (
            <><option value="Food / Grocery">Food / Grocery</option><option value="Rent">Rent</option><option value="Transport">Transport</option><option value="Others">Others</option></>
          )}
        </select>
        <input type="text" placeholder="Note (Optional)" value={txNote} onChange={(e) => setTxNote(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
        <div className="flex gap-2">
          <button type="submit" className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all ${editingTxId ? 'bg-[#FF5437] hover:opacity-90' : 'bg-[#00556A] hover:opacity-90'}`}>
            {editingTxId ? 'Update Entry' : 'Add Entry'}
          </button>
          {editingTxId && (
            <button type="button" onClick={() => { setEditingTxId(null); setTxAmount(''); setTxNote(''); }} className="px-4 py-2.5 bg-gray-700 text-xs rounded-lg font-semibold">Cancel</button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Entries ({selectedMonth})</h3>
        {filteredTransactions.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No records found.</p> : null}
        {filteredTransactions.map(t => (
          <div key={t.id} className="flex justify-between items-center bg-gray-800/80 p-3 rounded-xl border border-gray-700/50 shadow-sm">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">{t.category}</p>
              <p className="text-[11px] text-gray-400">{t.date} {t.note ? `• ${t.note}` : ''}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-[#FF5437]'}`}>{t.type === 'income' ? '+' : '-'}৳{t.amount}</span>
              <button onClick={() => {
                setEditingTxId(t.id);
                setTxType(t.type);
                setTxAmount(t.amount.toString());
                setTxCategory(t.category);
                setTxDate(t.date);
                setTxNote(t.note);
              }} className="text-gray-300 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded">✏️</button>
              <button onClick={() => {
                setTransactions(transactions.filter(item => item.id !== t.id));
                setCashBalance(prev => t.type === 'income' ? prev - t.amount : prev + t.amount);
              }} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-gray-700 rounded">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}