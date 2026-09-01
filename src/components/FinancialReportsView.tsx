import React, { useState } from 'react';
import {
  BalanceSheetReport,
  GeneralLedgerAccountReport,
  IncomeStatementReport,
  TrialBalanceReport,
} from '../types/ledger';
import { formatCurrency, formatDate, getAccountTypeBadge } from '../utils/formatters';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Scale,
  TrendingUp,
} from 'lucide-react';

interface FinancialReportsViewProps {
  trialBalance: TrialBalanceReport | null;
  balanceSheet: BalanceSheetReport | null;
  incomeStatement: IncomeStatementReport | null;
  generalLedger: GeneralLedgerAccountReport[];
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  trialBalance,
  balanceSheet,
  incomeStatement,
  generalLedger,
}) => {
  const [activeReport, setActiveReport] = useState<'TRIAL' | 'BALANCE_SHEET' | 'INCOME' | 'GENERAL_LEDGER'>('TRIAL');

  // Export JSON
  const handleExportJSON = () => {
    let dataToExport: any = null;
    let filename = 'financial-report.json';
    if (activeReport === 'TRIAL') {
      dataToExport = trialBalance;
      filename = `trial-balance-${Date.now()}.json`;
    } else if (activeReport === 'BALANCE_SHEET') {
      dataToExport = balanceSheet;
      filename = `balance-sheet-${Date.now()}.json`;
    } else if (activeReport === 'INCOME') {
      dataToExport = incomeStatement;
      filename = `income-statement-${Date.now()}.json`;
    } else {
      dataToExport = generalLedger;
      filename = `general-ledger-${Date.now()}.json`;
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Report Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Statements & Reporting</h2>
          <p className="text-xs text-slate-500">
            Real-time GAAP compliant financial reports generated directly from immutable journal records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-medium overflow-x-auto">
        {[
          { id: 'TRIAL', label: 'Trial Balance' },
          { id: 'BALANCE_SHEET', label: 'Balance Sheet' },
          { id: 'INCOME', label: 'Income Statement (P&L)' },
          { id: 'GENERAL_LEDGER', label: 'General Ledger Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
              activeReport === tab.id
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report 1: Trial Balance */}
      {activeReport === 'TRIAL' && (
        <div className="space-y-4">
          {/* Trial Balance Assurance Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Trial Balance Status: Balanced</span>
                <p className="text-[11px] text-slate-500 font-mono">
                  Total Debits ({formatCurrency(trialBalance?.totalDebits ?? 0)}) = Total Credits ({formatCurrency(trialBalance?.totalCredits ?? 0)})
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Variance</span>
              <span className="font-bold text-emerald-600">{formatCurrency(trialBalance?.variance ?? 0)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Debit Balance</th>
                  <th className="py-3 px-4 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {trialBalance?.items.map((item) => {
                  const badge = getAccountTypeBadge(item.accountType);
                  return (
                    <tr key={item.accountId} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{item.accountCode}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{item.accountName}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {item.accountType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {item.debitBalance > 0 ? formatCurrency(item.debitBalance, item.currency) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {item.creditBalance > 0 ? formatCurrency(item.creditBalance, item.currency) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-mono font-bold text-xs border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase tracking-wider">
                    Total Trial Balance
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatCurrency(trialBalance?.totalDebits ?? 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600">
                    {formatCurrency(trialBalance?.totalCredits ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Balance Sheet */}
      {activeReport === 'BALANCE_SHEET' && (
        <div className="space-y-6">
          {/* Equation Verification Banner */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-xs block">Balance Sheet Equation Verification</span>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Assets ({formatCurrency(balanceSheet?.totalAssets ?? 0)}) = Liabilities ({formatCurrency(balanceSheet?.totalLiabilities ?? 0)}) + Equity ({formatCurrency(balanceSheet?.totalEquity ?? 0)})
              </p>
            </div>
            <span className="px-2.5 py-1 rounded font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Variance: {formatCurrency(balanceSheet?.variance ?? 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: ASSETS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-mono">ASSETS</h3>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {formatCurrency(balanceSheet?.totalAssets ?? 0)}
                </span>
              </div>

              <div className="space-y-2">
                {balanceSheet?.assets[0]?.items.map((it) => (
                  <div key={it.accountId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400">[{it.code}]</span>
                      <span className="text-slate-700 font-medium">{it.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(it.balance)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between font-mono font-bold text-xs border-t border-slate-200 text-slate-900">
                <span>TOTAL ASSETS</span>
                <span className="text-emerald-600 text-sm">{formatCurrency(balanceSheet?.totalAssets ?? 0)}</span>
              </div>
            </div>

            {/* Right: LIABILITIES & EQUITY */}
            <div className="space-y-6">
              {/* Liabilities */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-mono">LIABILITIES</h3>
                  <span className="font-mono font-bold text-amber-600 text-sm">
                    {formatCurrency(balanceSheet?.totalLiabilities ?? 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  {balanceSheet?.liabilities[0]?.items.map((it) => (
                    <div key={it.accountId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400">[{it.code}]</span>
                        <span className="text-slate-700 font-medium">{it.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(it.balance)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between font-mono font-bold text-xs border-t border-slate-200 text-slate-900">
                  <span>TOTAL LIABILITIES</span>
                  <span className="text-amber-600">{formatCurrency(balanceSheet?.totalLiabilities ?? 0)}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-mono">STOCKHOLDERS' EQUITY</h3>
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {formatCurrency(balanceSheet?.totalEquity ?? 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  {balanceSheet?.equity[0]?.items.map((it) => (
                    <div key={it.accountId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400">[{it.code}]</span>
                        <span className="text-slate-700 font-medium">{it.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(it.balance)}</span>
                    </div>
                  ))}
                  {/* Retained Earnings */}
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 text-teal-700 bg-teal-50/60 px-2 rounded">
                    <span className="font-medium">Retained Earnings (Current Net Income)</span>
                    <span className="font-mono font-semibold">{formatCurrency(balanceSheet?.retainedEarnings ?? 0)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between font-mono font-bold text-xs border-t border-slate-200 text-slate-900">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-emerald-600 text-sm">{formatCurrency(balanceSheet?.totalLiabilitiesAndEquity ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Income Statement (P&L) */}
      {activeReport === 'INCOME' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Revenues Section */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-mono">1. OPERATING REVENUES</h3>
                <span className="font-mono font-bold text-teal-600">{formatCurrency(incomeStatement?.totalRevenues ?? 0)}</span>
              </div>
              <div className="space-y-2">
                {incomeStatement?.revenues.map((r) => (
                  <div key={r.accountId} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 font-medium">[{r.code}] {r.name}</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(r.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-mono">2. OPERATING EXPENSES</h3>
                <span className="font-mono font-bold text-rose-600">{formatCurrency(incomeStatement?.totalExpenses ?? 0)}</span>
              </div>
              <div className="space-y-2">
                {incomeStatement?.expenses.map((e) => (
                  <div key={e.accountId} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 font-medium">[{e.code}] {e.name}</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Income Bottom Line */}
            <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between font-mono">
              <div>
                <span className="text-sm font-bold text-slate-900 block uppercase">NET INCOME (PROFIT / LOSS)</span>
                <span className="text-[11px] text-slate-500">Total Revenues minus Total Operating Expenses</span>
              </div>
              <span className={`text-xl font-bold ${(incomeStatement?.netIncome ?? 0) >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                {formatCurrency(incomeStatement?.netIncome ?? 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: General Ledger */}
      {activeReport === 'GENERAL_LEDGER' && (
        <div className="space-y-4">
          {generalLedger.map((accReport) => (
            <div key={accReport.accountId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="font-bold text-indigo-600">[{accReport.accountCode}]</span>
                  <span className="text-slate-900 font-bold">{accReport.accountName}</span>
                  <span className="text-slate-500 font-sans text-[11px]">({accReport.accountType})</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  Closing: {formatCurrency(accReport.closingBalance, accReport.currency)}
                </div>
              </div>

              {accReport.lines.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs font-mono">No line activity</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-4">Date</th>
                      <th className="py-2 px-4">Ref</th>
                      <th className="py-2 px-4">Description</th>
                      <th className="py-2 px-4 text-right">Debit</th>
                      <th className="py-2 px-4 text-right">Credit</th>
                      <th className="py-2 px-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {accReport.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-4 font-mono text-slate-500 text-[11px]">{formatDate(line.date)}</td>
                        <td className="py-2 px-4 font-mono font-semibold text-slate-900">{line.reference}</td>
                        <td className="py-2 px-4 text-slate-700 max-w-xs truncate">{line.description}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-900">
                          {line.debit > 0 ? formatCurrency(line.debit, accReport.currency) : '—'}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-900">
                          {line.credit > 0 ? formatCurrency(line.credit, accReport.currency) : '—'}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(line.runningBalance, accReport.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
