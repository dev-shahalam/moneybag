'use client';
import React, { useState } from 'react';

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
  amount: number; // For normal assets or total DPS amount
  note?: string;
  dpsTotalMonths?: string;
  dpsMonthlyAmount?: string;
  deposits?: DpsDeposit[]; // Monthly deposit history for DPS
};

const ASSET_CATEGORIES = [
  'Hand Cash',
  'FDR',
  'DPS',
  'Investments',
  'Accounts Receivable',
  'Other Assets'
];

type AssetsProps = {
  assets: Asset[];
  filteredAssets: Asset[];
  selectedMonth: string;
  cashBalance: number;
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  setCashBalance: React.Dispatch<React.SetStateAction<number>>;
  getMonthStr: (dateStr: string) => string;
};

export default function AssetsTab({
  assets,
  filteredAssets,
  selectedMonth,
  cashBalance,
  setAssets,
  setCashBalance,
  getMonthStr
}: AssetsProps) {
  const [assetCategory, setAssetCategory] = useState(ASSET_CATEGORIES[0]);
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState(''); // Initial amount or Total value
  const [assetDate, setAssetDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetNote, setAssetNote] = useState('');

  // DPS specific creation fields
  const [dpsTotalMonths, setDpsTotalMonths] = useState('');
  const [dpsMonthlyAmount, setDpsMonthlyAmount] = useState('');

  // Modal or sub-form state for adding monthly deposit to a specific DPS
  const [activeDpsId, setActiveDpsId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      
      {/* Main Asset Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!assetName.trim() || !assetDate) return;
        const initialAmt = assetCategory === 'DPS' ? (parseFloat(dpsMonthlyAmount) || 0) : (parseFloat(assetAmount) || 0);
        const monthStr = getMonthStr(assetDate);

        if (editingAssetId) {
          setAssets(assets.map(a => a.id === editingAssetId ? {
            ...a, 
            date: assetDate, 
            month: monthStr, 
            category: assetCategory, 
            name: assetName.trim(), 
            note: assetNote,
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
            deposits: assetCategory === 'DPS' ? [{
              id: Date.now().toString(),
              date: assetDate,
              monthStr: monthStr,
              amount: initialAmt
            }] : []
          };
          setAssets([newAsset, ...assets]);
        }
        setAssetName(''); setAssetAmount(''); setAssetNote(''); setDpsTotalMonths(''); setDpsMonthlyAmount('');
      }} className="space-y-3 bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <p className="text-xs font-semibold text-gray-300">{editingAssetId ? 'Edit Asset Record' : 'Add New Asset'}</p>
        
        <input 
          type="date" 
          value={assetDate} 
          onChange={(e) => setAssetDate(e.target.value)} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none cursor-pointer" 
        />

        <select 
          value={assetCategory} 
          onChange={(e) => setAssetCategory(e.target.value)} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none"
        >
          {ASSET_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input 
          type="text" 
          placeholder="Asset Name (e.g. Dutch Bangla Bank, Gold, Land)" 
          value={assetName} 
          onChange={(e) => setAssetName(e.target.value)} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" 
        />

        {/* If DPS is selected, we don't ask for total amount directly, we ask for Monthly Amount & Tenure */}
        {assetCategory === 'DPS' ? (
          <div className="space-y-3 p-3 bg-gray-900/80 rounded-xl border border-teal-800/50">
            <p className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">DPS Scheme Details</p>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Total Tenure (e.g. 60 Months)" 
                value={dpsTotalMonths} 
                onChange={(e) => setDpsTotalMonths(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none" 
              />
              <input 
                type="number" 
                placeholder="Monthly Installment (৳)" 
                value={dpsMonthlyAmount} 
                onChange={(e) => setDpsMonthlyAmount(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none" 
              />
            </div>
            <p className="text-[10px] text-gray-400">* First month installment will be added automatically. Later you can add subsequent monthly deposits.</p>
          </div>
        ) : (
          <input 
            type="number" 
            placeholder="Total Amount / Value (৳)" 
            value={assetAmount} 
            onChange={(e) => setAssetAmount(e.target.value)} 
            className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" 
          />
        )}

        <input 
          type="text" 
          placeholder="Note (Optional)" 
          value={assetNote} 
          onChange={(e) => setAssetNote(e.target.value)} 
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-sm text-gray-100 focus:outline-none" 
        />

        <div className="flex gap-2">
          <button type="submit" className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all ${editingAssetId ? 'bg-[#FF5437]' : 'bg-[#00556A]'}`}>
            {editingAssetId ? 'Update Asset' : 'Save Asset'}
          </button>
          {editingAssetId && (
            <button type="button" onClick={() => { setEditingAssetId(null); setAssetName(''); setAssetAmount(''); setAssetNote(''); setDpsTotalMonths(''); setDpsMonthlyAmount(''); }} className="px-4 py-2.5 bg-gray-700 text-xs rounded-lg font-semibold">Cancel</button>
          )}
        </div>
      </form>

      {/* Monthly Deposit Modal / Form for DPS */}
      {activeDpsId && (
        <div className="bg-teal-950/40 p-4 rounded-xl border border-teal-700 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-teal-300">Add Monthly DPS Deposit</p>
            <button onClick={() => setActiveDpsId(null)} className="text-gray-400 hover:text-white text-xs">✕ Close</button>
          </div>
          <input 
            type="date" 
            value={depositDate} 
            onChange={(e) => setDepositDate(e.target.value)} 
            className="w-full bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none cursor-pointer" 
          />
          <input 
            type="number" 
            placeholder="Deposit Amount (৳)" 
            value={depositAmount} 
            onChange={(e) => setDepositAmount(e.target.value)} 
            className="w-full bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs text-gray-100 focus:outline-none" 
          />
          <button 
            onClick={() => {
              if (!depositAmount || !depositDate) return;
              const depAmt = parseFloat(depositAmount);
              const mStr = getMonthStr(depositDate);

              setAssets(assets.map(a => {
                if (a.id === activeDpsId) {
                  const newDeposits = [
                    ...(a.deposits || []),
                    { id: Date.now().toString(), date: depositDate, monthStr: mStr, amount: depAmt }
                  ];
                  const newTotalAmount = newDeposits.reduce((sum, d) => sum + d.amount, 0);
                  return { ...a, amount: newTotalAmount, deposits: newDeposits };
                }
                return a;
              }));

              setActiveDpsId(null);
              setDepositAmount('');
            }} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-bold text-xs text-white"
          >
            Confirm & Add Deposit
          </button>
        </div>
      )}

      {/* Assets List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assets List ({selectedMonth})</h3>
        {filteredAssets.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No asset records found.</p> : null}
        {filteredAssets.map(a => (
          <div key={a.id} className="bg-gray-800/80 p-3 rounded-xl border border-gray-700/50 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{a.name} <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded ml-1">{a.category}</span></p>
                <p className="text-[11px] text-gray-400">
                  {a.date} 
                  {a.category === 'DPS' && a.dpsTotalMonths ? ` • Tenure: ${a.dpsTotalMonths}` : ''}
                  {a.note ? ` • ${a.note}` : ''}
                </p>
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

            {/* If DPS, show a button to add monthly payment & deposit history breakdown */}
            {a.category === 'DPS' && (
              <div className="pt-2 border-t border-gray-700/60 flex justify-between items-center text-xs">
                <span className="text-teal-300 font-medium">Deposits: {a.deposits?.length || 1} Months Paid</span>
                <button 
                  onClick={() => setActiveDpsId(a.id)} 
                  className="bg-teal-700 hover:bg-teal-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                >
                  + Add Monthly Deposit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}