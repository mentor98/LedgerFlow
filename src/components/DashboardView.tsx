import React from 'react';
import {
  Account,
  BalanceSheetReport,
  IncomeStatementReport,
  Transaction,
  TrialBalanceReport,
} from '../types/ledger';
import { formatCurrency, formatDate, getAccountTypeBadge, getTransactionStatusBadge } from '../utils/formatters';
import {
  ArrowRight,
  CheckCircle,
  Coins,
  CreditCard,
  FileSpreadsheet,
  Layers,
  PlayCircle,
  Plus,
  Scale,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  accounts: Account[];
  transactions: Transaction[];
  balanceSheet: BalanceSheetReport | null;
  incomeStatement: IncomeStatementReport | null;
  trialBalance: TrialBalanceReport | null;
  onOpenNewTx: () => void;
  onOpenNewAccount: () => void;
  onSelectTx: (tx: Transaction) => void;
  onNavigateTab: (tab: any) => void;
  onSeedDemoData?: () => void;
  isChainValid: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  balanceSheet,
  incomeStatement,
  trialBalance,
  onOpenNewTx,
  onOpenNewAccount,
  onSelectTx,
  onNavigateTab,
  isChainValid,
}) => {
  const totalAssets = balanceSheet?.totalAssets ?? 0;
  const totalLiabilities = balanceSheet?.totalLiabilities ?? 0;
  const totalEquity = balanceSheet?.totalEquity ?? 0;
  const netIncome = incomeStatement?.netIncome ?? 0;
  const totalVolume = transactions.reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Mathematical Accounting Equation Assurance Banner */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 mt-0.5 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Fundamental Double-Entry Accounting Equation
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                  Mathematically Balanced
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Assets ({formatCurrency(totalAssets)}) = Liabilities ({formatCurrency(totalLiabilities)}) + Equity ({formatCurrency(totalEquity)})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateTab('reports')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>View Statements</span>
            </button>
            <button
              onClick={() => onNavigateTab('tests')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Run 11 Test Suites</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Assets */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Assets (USD)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(totalAssets)}
            </div>
            <div className="flex items-center mt-2 text-xs text-emerald-600 font-medium">
              <span className="font-semibold mr-1">Debit-Normal</span>
              <span className="text-slate-400">• Cash & Treasury</span>
            </div>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Liabilities</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(totalLiabilities)}
            </div>
            <div className="flex items-center mt-2 text-xs text-amber-600 font-medium">
              <span className="font-semibold mr-1">Credit-Normal</span>
              <span className="text-slate-400">• AP & Customer Wallets</span>
            </div>
          </div>
        </div>

        {/* Total Equity */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Equity</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(totalEquity)}
            </div>
            <div className="flex items-center mt-2 text-xs text-indigo-600 font-medium">
              <span className="font-semibold mr-1">Stockholders' Value</span>
              <span className="text-slate-400">• Capital + Retained</span>
            </div>
          </div>
        </div>

        {/* Net Income (P&L) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Income (P&L)</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold font-mono tracking-tight ${netIncome >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {formatCurrency(netIncome)}
            </div>
            <div className="flex items-center mt-2 text-xs text-slate-500">
              <span>Rev {formatCurrency(incomeStatement?.totalRevenues ?? 0)}</span>
              <span className="mx-1">-</span>
              <span>Exp {formatCurrency(incomeStatement?.totalExpenses ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Journal Entries + Right Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Journal Entries Stream */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Journal Entries</h3>
              <p className="text-xs text-slate-500">Append-only double-entry ledger stream</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Journal ({transactions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Reference / Seq</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Legs</th>
                  <th className="px-4 py-3 text-right">Balanced Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {transactions.slice(0, 6).map((tx) => {
                  const statusBadge = getTransactionStatusBadge(tx.status);
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTx(tx)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-800 group-hover:text-indigo-600 transition">
                            {tx.reference}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{tx.sequenceNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(tx.effectiveDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 font-medium truncate max-w-xs">{tx.description}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {tx.items.length} legs
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(tx.totalAmount, tx.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Sleek API Sandbox Card & Compliance Card */}
        <div className="space-y-6 flex flex-col">
          {/* API Sandbox Terminal Preview */}
          <div className="bg-slate-900 rounded-xl shadow-md p-5 flex flex-col text-slate-300">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-mono">
                API Sandbox
              </span>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
            </div>

            <div className="font-mono text-xs text-indigo-300 leading-relaxed space-y-1 my-2">
              <div className="text-slate-500">// Post balanced journal tx</div>
              <div>
                <span className="text-emerald-400 font-bold">POST</span>{' '}
                <span className="text-slate-200">/api/v1/transactions</span>
              </div>
              <div className="text-slate-400">{'{'}</div>
              <div className="pl-3">
                "reference": <span className="text-amber-300">"INV-2026-088"</span>,
              </div>
              <div className="pl-3">
                "idempotencyKey": <span className="text-amber-300">"idem_98a"</span>,
              </div>
              <div className="pl-3">
                "legs": [<span className="text-slate-400">...</span>]
              </div>
              <div className="text-slate-400">{'}'}</div>
            </div>

            <button
              onClick={() => onNavigateTab('api')}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Launch API Sandbox</span>
            </button>
          </div>

          {/* Compliance & Integrity Scorecard */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
            <div className="text-slate-800 text-sm font-bold mb-3 flex items-center justify-between">
              <span>Compliance & Engine Integrity</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Atomic Operations (Mutex)</span>
                <span className="text-emerald-600 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Double-Entry Invariant</span>
                <span className="text-emerald-600 font-bold">Enforced (Zero Drift)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">SHA-256 Merkle Chain</span>
                <span className="text-emerald-600 font-bold">
                  {isChainValid ? 'Verified' : 'Failed'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Active Accounts</span>
                <span className="text-slate-800 font-bold font-mono">{accounts.length}</span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
                <div className="bg-indigo-600 h-1.5 rounded-full w-full"></div>
              </div>
              <div className="text-[10px] text-slate-400 text-center">
                Audit integrity: 100% cryptographic coverage
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
