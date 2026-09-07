'use client';
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Types
type Transaction = {
  id: string;
  date: string;
  month: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
};

type Loan = {
  id: string;
  date: string;
  month: string;
  type: 'taken' | 'given';
  person: string;
  totalAmount: number;
  paidAmount: number;
};

type DpsDeposit = {
  id: string;
  date: string;
  monthStr: string;
  amount: number;
};

type Asset = {
  id: string;
  date: string;
  month: string;
  category: string;
  name: string;
  amount: number;
  note?: string;
  dpsTotalMonths?: string;
  dpsMonthlyAmount?: string;
  deposits?: DpsDeposit[];
};

const ASSET_CATEGORIES = [
  'Hand Cash',
  'FDR',
  'DPS',
  'Investments',
  'Accounts Receivable',
  'Other Assets'
];

export default function MoneyBagApp() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'cashbook' | 'loans' | 'assets'>('dashboard');
  
  const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Edit states
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Form states for Transactions
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Salary In');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');

  // Form states for Loans
  const [loanType, setLoanType] = useState<'taken' | 'given'>('taken');
  const [loanPerson, setLoanPerson] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPaidAmount, setLoanPaidAmount] = useState('0');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanError, setLoanError] = useState('');
  const [repayLoanId, setRepayLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  // Form states for Assets
  const [assetCategory, setAssetCategory] = useState(ASSET_CATEGORIES[0]);
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetDate, setAssetDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetNote, setAssetNote] = useState('');
  const [dpsTotalMonths, setDpsTotalMonths] = useState('');
  const [dpsMonthlyAmount, setDpsMonthlyAmount] = useState('');
  const [activeDpsId, setActiveDpsId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);

  // Auth Listener & Initial Load
  useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch data from Firestore
        setSyncStatus('Syncing from cloud...');
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.transactions) setTransactions(data.transactions);
            if (data.loans) setLoans(data.loans);
            if (data.assets) setAssets(data.assets);
            if (data.cashBalance !== undefined) setCashBalance(data.cashBalance);
            setSyncStatus('Synced');
          } else {
            // If new user, check localStorage or initialize empty
            setSyncStatus('Connected');
          }
        } catch (err) {
          console.error("Error fetching cloud data:", err);
          setSyncStatus('Sync failed');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save to Firestore & LocalStorage on data change
  useEffect(() => {
    if (!isClient || !user) return;

    const saveData = async () => {
      setSyncStatus('Saving...');
      try {
        await setDoc(doc(db, 'users', user.uid), {
          transactions,
          loans,
          assets,
          cashBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setSyncStatus('Cloud Saved');
      } catch (err) {
        console.error("Error saving to cloud:", err);
        setSyncStatus('Save failed');
      }
    };

    const timeout = setTimeout(saveData, 1000); // Debounce sync
    return () => clearTimeout(timeout);
  }, [transactions, loans, assets, cashBalance, user, isClient]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const getMonthStr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filteredTransactions = selectedMonth === 'All' 
    ? transactions 
    : transactions.filter(t => t.month === selectedMonth);

  const filteredLoans = selectedMonth === 'All'
    ? loans
    : loans.filter(l => l.month === selectedMonth || getMonthStr(l.date) === selectedMonth);

  const filteredAssets = selectedMonth === 'All'
    ? assets
    : assets.filter(a => a.month === selectedMonth || getMonthStr(a.date) === selectedMonth);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const totalLoanDue = loans.filter(l => l.type === 'taken').reduce((acc, l) => acc + (l.totalAmount - l.paidAmount), 0);
  const totalLoanReceivable = loans.filter(l => l.type === 'given').reduce((acc, l) => acc + (l.totalAmount - l.paidAmount), 0);

  const totalAssetsValue = filteredAssets.reduce((acc, a) => acc + a.amount, 0);

  const allMonthsSet = new Set([
    currentMonthStr,
    ...transactions.map(t => t.month),
    ...loans.map(l => l.month || getMonthStr(l.date)),
    ...assets.map(a => a.month || getMonthStr(a.date))
  ]);
  const availableMonths = Array.from(allMonthsSet);

  const grandTotal = totalIncome + totalExpense + totalLoanDue + totalLoanReceivable + totalAssetsValue;
  const incPercent = grandTotal > 0 ? Math.round((totalIncome / grandTotal) * 100) : 0;
  const expPercent = grandTotal > 0 ? Math.round((totalExpense / grandTotal) * 100) : 0;
  const duePercent = grandTotal > 0 ? Math.round((totalLoanDue / grandTotal) * 100) : 0;
  const getPercent = grandTotal > 0 ? Math.round((totalLoanReceivable / grandTotal) * 100) : 0;
  const assetPercent = grandTotal > 0 ? Math.round((totalAssetsValue / grandTotal) * 100) : 0;

  if (!isClient || authLoading) {
    return <div className="bg-gray-950 h-screen text-white flex items-center justify-center">Loading Money Bag...</div>;
  }

  // If user is not logged in, show Auth Screen
  if (!user) {
    return (
      <div className="flex justify-center bg-gray-950 min-h-screen text-gray-100 font-sans items-center p-4">
        <div className="w-full max-w-md bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-800 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-[#00556A]">💰 Money Bag</h2>
            <p className="text-xs text-gray-400">{isRegistering ? 'Create your cloud account' : 'Login to sync your finances'}</p>
          </div>
          
          {authError && <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded border border-red-800">{authError}</p>}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-gray-950 border border-gray-700 p-3 rounded-xl text-sm focus:outline-none focus:border-[#00556A] text-gray-100"
              required 
            />
            <input 
              type="password" 
              placeholder="Password (min 6 characters)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-gray-950 border border-gray-700 p-3 rounded-xl text-sm focus:outline-none focus:border-[#00556A] text-gray-100"
              required 
            />
            <button type="submit" className="w-full bg-[#00556A] hover:opacity-90 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md">
              {isRegistering ? 'Register Account' : 'Login'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-[#FF5437] hover:underline font-medium">
              {isRegistering ? 'Already have an account? Login here' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-gray-950 min-h-screen text-gray-100 font-sans selection:bg-[#FF5437] selection:text-white" suppressHydrationWarning>
      <div className="w-full max-w-md bg-gray-900 flex flex-col h-screen shadow-2xl relative border-x border-gray-800">
        
        <style jsx global>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(52%) sepia(85%) saturate(2497%) hue-rotate(338deg) brightness(101%) contrast(101%);
            width: 24px;
            height: 24px;
            cursor: pointer;
          }
        `}</style>

        {/* Header */}
        <header className="p-4 bg-[#00556A] text-white flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-wide">💰 Money Bag</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-teal-200">{syncStatus}</span>
            <button onClick={() => signOut(auth)} className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1 rounded font-semibold">
              Logout
            </button>
          </div>
        </header>

        {/* Month Selector Bar */}
        <div className="bg-gray-850 px-4 py-2.5 border-b border-gray-800 flex justify-between items-center text-xs">
          <span className="text-gray-400 font-medium">Filter Month:</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-800 text-[#FF5437] font-semibold border border-gray-700 px-3 py-1 rounded-lg focus:outline-none focus:border-[#FF5437]"
          >
            <option value="All">All Months (Total)</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
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

              {/* Financial Overview Distribution */}
              <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-300">📊 Financial Overview Distribution</h3>
                  <span className="text-[10px] bg-[#00556A] text-teal-200 px-2.5 py-0.5 rounded-full font-medium">{selectedMonth}</span>
                </div>

                <div className="bg-gray-900/60 border border-gray-800 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Net Financial Flow</span>
                  <span className="text-lg font-extrabold text-white">৳ {grandTotal.toLocaleString()}</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-purple-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Assets</span>
                      <span className="text-white">৳ {totalAssetsValue} ({assetPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${assetPercent}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Income</span>
                      <span className="text-white">৳ {totalIncome} ({incPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${incPercent}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-[#FF5437] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF5437] inline-block"></span> Expense</span>
                      <span className="text-white">৳ {totalExpense} ({expPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
                      <div className="bg-[#FF5437] h-full rounded-full transition-all duration-500" style={{ width: `${expPercent}%` }}></div>
                    </div>
                  </div>

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
          )}

          {/* TAB 2: CASHBOOK */}
          {activeTab === 'cashbook' && (
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
                  <button type="submit" className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all ${editingTxId ? 'bg-[#FF5437]' : 'bg-[#00556A]'}`}>
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
          )}

          {/* TAB 3: LOANS & DUE */}
          {activeTab === 'loans' && (
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
                const monthStr = getMonthStr(loanDate);

                if (editingLoanId) {
                  setLoans(loans.map(l => l.id === editingLoanId ? {
                    ...l, date: loanDate, month: monthStr, type: loanType, person: loanPerson.trim(), totalAmount: total, paidAmount: paid
                  } : l));
                  setEditingLoanId(null);
                  setLoanError('');
                } else {
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
                <input type="text" placeholder="Person Name (e.g. Shah Alam, Anas)" value={loanPerson} onChange={(e) => setLoanPerson(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
                <input type="number" placeholder="Total Amount (৳)" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
                
                {editingLoanId && (
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Already Paid Amount (৳):</label>
                    <input type="number" value={loanPaidAmount} onChange={(e) => setLoanPaidAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="submit" className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all ${editingLoanId ? 'bg-[#FF5437]' : 'bg-[#00556A]'}`}>
                    {editingLoanId ? 'Update Loan Record' : 'Save Loan'}
                  </button>
                  {editingLoanId && (
                    <button type="button" onClick={() => { setEditingLoanId(null); setLoanPerson(''); setLoanAmount(''); setLoanPaidAmount('0'); }} className="px-4 py-2.5 bg-gray-700 text-xs rounded-lg font-semibold">Cancel</button>
                  )}
                </div>
              </form>

              <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700 space-y-3">
                <p className="text-xs font-semibold text-[#FF5437]">Pay / Receive Partial Loan Amount</p>
                <select value={repayLoanId} onChange={(e) => setRepayLoanId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none">
                  <option value="">Select Person</option>
                  {loans.filter(l => l.totalAmount - l.paidAmount > 0).map(l => (
                    <option key={l.id} value={l.id}>{l.person} ({l.type === 'taken' ? 'Due: ৳' : 'Get: ৳'}{l.totalAmount - l.paidAmount})</option>
                  ))}
                </select>
                <input type="number" placeholder="Payment Amount (৳)" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
                <button onClick={() => {
                  if (!repayLoanId || !repayAmount) return;
                  const payAmt = parseFloat(repayAmount);
                  setLoans(loans.map(l => l.id === repayLoanId ? { ...l, paidAmount: l.paidAmount + payAmt } : l));
                  setRepayAmount(''); setRepayLoanId('');
                }} className="w-full bg-[#FF5437] hover:opacity-90 py-2.5 rounded-lg font-bold text-sm text-white">Confirm Payment</button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Loans ({selectedMonth})</h3>
                {filteredLoans.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No loan records found.</p> : null}
                {filteredLoans.map(l => {
                  const remaining = l.totalAmount - l.paidAmount;
                  return (
                    <div key={l.id} className="flex justify-between items-center bg-gray-800/80 p-3 rounded-xl border border-gray-700/50 shadow-sm">
                      <div>
                        <p className="font-semibold text-sm">{l.person} <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 ml-1">{l.type === 'taken' ? 'Taken' : 'Given'}</span></p>
                        <p className="text-[11px] text-gray-400">{l.date} | Total: ৳{l.totalAmount} | Paid: ৳{l.paidAmount}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${l.type === 'taken' ? 'text-[#FF5437]' : 'text-emerald-400'}`}>৳{remaining}</span>
                        <button onClick={() => {
                          setEditingLoanId(l.id);
                          setLoanType(l.type);
                          setLoanPerson(l.person);
                          setLoanAmount(l.totalAmount.toString());
                          setLoanPaidAmount(l.paidAmount.toString());
                          setLoanDate(l.date);
                        }} className="text-gray-300 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded">✏️</button>
                        <button onClick={() => setLoans(loans.filter(item => item.id !== l.id))} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-gray-700 rounded">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ASSETS */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!assetName.trim() || !assetDate) return;
                const initialAmt = assetCategory === 'DPS' ? (parseFloat(dpsMonthlyAmount) || 0) : (parseFloat(assetAmount) || 0);
                const monthStr = getMonthStr(assetDate);

                if (editingAssetId) {
                  setAssets(assets.map(a => a.id === editingAssetId ? {
                    ...a, date: assetDate, month: monthStr, category: assetCategory, name: assetName.trim(), note: assetNote,
                    dpsTotalMonths: assetCategory === 'DPS' ? dpsTotalMonths : undefined,
                    dpsMonthlyAmount: assetCategory === 'DPS' ? dpsMonthlyAmount : undefined,
                  } : a));
                  setEditingAssetId(null);
                } else {
                  const newAsset: Asset = {
                    id: Date.now().toString(),
                    date: assetDate,
                    month: monthStr,
                    category: assetCategory,
                    name: assetName.trim(),
                    amount: initialAmt,
                    note: assetNote,
                    dpsTotalMonths: assetCategory === 'DPS' ? dpsTotalMonths : undefined,
                    dpsMonthlyAmount: assetCategory === 'DPS' ? dpsMonthlyAmount : undefined,
                    deposits: assetCategory === 'DPS' ? [{ id: Date.now().toString(), date: assetDate, monthStr, amount: initialAmt }] : []
                  };
                  setAssets([newAsset, ...assets]);
                }
                setAssetName(''); setAssetAmount(''); setAssetNote(''); setDpsTotalMonths(''); setDpsMonthlyAmount('');
              }} className="space-y-3 bg-gray-800/60 p-4 rounded-xl border border-gray-700">
                <p className="text-xs font-semibold text-gray-300">{editingAssetId ? 'Edit Asset Record' : 'Add New Asset'}</p>
                <input type="date" value={assetDate} onChange={(e) => setAssetDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none cursor-pointer" />
                <select value={assetCategory} onChange={(e) => setAssetCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none">
                  {ASSET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input type="text" placeholder="Asset Name (e.g. Dutch Bangla Bank, Gold)" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />

                {assetCategory === 'DPS' ? (
                  <div className="space-y-3 p-3 bg-gray-900/80 rounded-xl border border-teal-800/50">
                    <p className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">DPS Scheme Details</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Tenure (e.g. 60 Months)" value={dpsTotalMonths} onChange={(e) => setDpsTotalMonths(e.target.value)} className="w-full bg-gray-950 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none" />
                      <input type="number" placeholder="Monthly Installment (৳)" value={dpsMonthlyAmount} onChange={(e) => setDpsMonthlyAmount(e.target.value)} className="w-full bg-gray-950 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none" />
                    </div>
                  </div>
                ) : (
                  <input type="number" placeholder="Total Amount / Value (৳)" value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
                )}

                <input type="text" placeholder="Note (Optional)" value={assetNote} onChange={(e) => setAssetNote(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" />
                <div className="flex gap-2">
                  <button type="submit" className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all ${editingAssetId ? 'bg-[#FF5437]' : 'bg-[#00556A]'}`}>
                    {editingAssetId ? 'Update Asset' : 'Save Asset'}
                  </button>
                  {editingAssetId && (
                    <button type="button" onClick={() => { setEditingAssetId(null); setAssetName(''); setAssetAmount(''); setAssetNote(''); }} className="px-4 py-2.5 bg-gray-700 text-xs rounded-lg font-semibold">Cancel</button>
                  )}
                </div>
              </form>

              {activeDpsId && (
                <div className="bg-teal-950/40 p-4 rounded-xl border border-teal-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-teal-300">Add Monthly DPS Deposit</p>
                    <button onClick={() => setActiveDpsId(null)} className="text-gray-400 hover:text-white text-xs">✕ Close</button>
                  </div>
                  <input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none cursor-pointer" />
                  <input type="number" placeholder="Deposit Amount (৳)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none" />
                  <button onClick={() => {
                    if (!depositAmount || !depositDate) return;
                    const depAmt = parseFloat(depositAmount);
                    const mStr = getMonthStr(depositDate);

                    setAssets(assets.map(a => {
                      if (a.id === activeDpsId) {
                        const newDeposits = [...(a.deposits || []), { id: Date.now().toString(), date: depositDate, monthStr: mStr, amount: depAmt }];
                        const newTotalAmount = newDeposits.reduce((sum, d) => sum + d.amount, 0);
                        return { ...a, amount: newTotalAmount, deposits: newDeposits };
                      }
                      return a;
                    }));
                    setActiveDpsId(null); setDepositAmount('');
                  }} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-bold text-xs text-white">Confirm & Add Deposit</button>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assets List ({selectedMonth})</h3>
                {filteredAssets.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No asset records found.</p> : null}
                {filteredAssets.map(a => (
                  <div key={a.id} className="bg-gray-800/80 p-3 rounded-xl border border-gray-700/50 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{a.name} <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded ml-1">{a.category}</span></p>
                        <p className="text-[11px] text-gray-400">{a.date} {a.category === 'DPS' && a.dpsTotalMonths ? `• Tenure: ${a.dpsTotalMonths}` : ''} {a.note ? `• ${a.note}` : ''}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-purple-400">৳{a.amount}</span>
                        <button onClick={() => {
                          setEditingAssetId(a.id);
                          setAssetCategory(a.category);
                          setAssetName(a.name);
                          setAssetAmount(a.amount.toString());
                          setAssetDate(a.date);
                          setAssetNote(a.note || '');
                          setDpsTotalMonths(a.dpsTotalMonths || '');
                          setDpsMonthlyAmount(a.dpsMonthlyAmount || '');
                        }} className="text-gray-300 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded">✏️</button>
                        <button onClick={() => setAssets(assets.filter(item => item.id !== a.id))} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-gray-700 rounded">🗑️</button>
                      </div>
                    </div>

                    {a.category === 'DPS' && (
                      <div className="pt-2 border-t border-gray-700/60 flex justify-between items-center text-xs">
                        <span className="text-teal-300 font-medium">Deposits: {a.deposits?.length || 1} Months Paid</span>
                        <button onClick={() => setActiveDpsId(a.id)} className="bg-teal-700 hover:bg-teal-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold">+ Add Monthly Deposit</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-3 py-2 flex justify-around items-center shadow-lg">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-[#00556A] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
            <span className="text-lg">📊</span>
            <span className="text-[11px] font-semibold mt-0.5">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('cashbook')} className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 ${activeTab === 'cashbook' ? 'bg-[#00556A] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
            <span className="text-lg">📖</span>
            <span className="text-[11px] font-semibold mt-0.5">Cashbook</span>
          </button>
          <button onClick={() => setActiveTab('loans')} className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 ${activeTab === 'loans' ? 'bg-[#00556A] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
            <span className="text-lg">🤝</span>
            <span className="text-[11px] font-semibold mt-0.5">Loans</span>
          </button>
          <button onClick={() => setActiveTab('assets')} className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 ${activeTab === 'assets' ? 'bg-[#00556A] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
            <span className="text-lg">💼</span>
            <span className="text-[11px] font-semibold mt-0.5">Cash/Assets</span>
          </button>
        </nav>

      </div>
    </div>
  );
}