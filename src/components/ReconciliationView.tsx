import React, { useState } from 'react';
import { Account, ReconciliationReport } from '../types/ledger';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  AlertCircle,
  CheckCircle2,
  FileCheck,
  GitBranch,
  Play,
  Plus,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';

interface ReconciliationViewProps {
  accounts: Account[];
  reconciliations: ReconciliationReport[];
  onRefreshReconciliations: () => void;
  onPostAdjustingTx: (payload: any) => Promise<void>;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  accounts,
  reconciliations,
  onRefreshReconciliations,
  onPostAdjustingTx,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts.find((a) => a.code === '1010')?.id || accounts[0]?.id || ''
  );
  const [statementBalanceDollars, setStatementBalanceDollars] = useState<string>('298250.00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReport, setActiveReport] = useState<ReconciliationReport | null>(
    reconciliations[0] || null
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Preset sample feeds for testing reconciliation
  const sampleFeeds = [
    {
      date: new Date().toISOString(),
      amount: 25000000, // $250k initial funding
      reference: 'TX-INIT-001',
      description: 'Founder Angel Seed Wire Deposit',
    },
    {
      date: new Date().toISOString(),
      amount: 4800000, // $48k contract
      reference: 'TX-REV-001',
      description: 'Acme Corp Enterprise Annual Contract Wire',
    },
    {
      date: new Date().toISOString(),
      amount: 1940000, // $19.4k Stripe net settlement
      reference: 'TX-STRIPE-001',
      description: 'Stripe Payments Batch Settlement Net',
    },
    {
      date: new Date().toISOString(),
      amount: 150000, // $1,500 unrecorded bank interest / fee
      reference: 'JPMC-MONTHLY-INTEREST',
      description: 'Monthly Commercial Treasury Yield Interest Credit',
    },
  ];

  const handleRunReconciliation = async () => {
    if (!selectedAccountId) return;
    setIsProcessing(true);
    try {
      const cents = Math.round((parseFloat(statementBalanceDollars) || 0) * 100);
      const report = await api.runReconciliation({
        accountId: selectedAccountId,
        statementEndingBalance: cents,
        feedItems: sampleFeeds,
      });
      setActiveReport(report);
      onRefreshReconciliations();
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveInterestDiscrepancy = async () => {
    if (!activeReport || !selectedAccount) return;
    const interestAccount = accounts.find((a) => a.code === '4030') || accounts.find((a) => a.type === 'REVENUE');
    if (!interestAccount) {
      alert('Interest revenue account not found');
      return;
    }

    try {
      await onPostAdjustingTx({
        reference: `REC-ADJ-${Date.now().toString().slice(-4)}`,
        description: 'Auto-Reconciliation Adjusting Entry: Bank Treasury Interest Yield',
        items: [
          { accountId: selectedAccount.id, direction: 'DEBIT', amount: Math.abs(activeReport.discrepancy) },
          { accountId: interestAccount.id, direction: 'CREDIT', amount: Math.abs(activeReport.discrepancy) },
        ],
      });
      alert('Adjusting journal entry posted! Discrepancy successfully resolved.');
      onRefreshReconciliations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bank & Gateway Reconciliation Engine</h2>
          <p className="text-xs text-slate-500">
            Auto-match external bank statements and payment processor feeds with double-entry ledger items
          </p>
        </div>
      </div>

      {/* Reconciliation Runner Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-indigo-600" />
          <span>New Reconciliation Session</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Ledger Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({formatCurrency(a.balance?.netBalance ?? 0, a.currency)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">External Statement Ending Balance ($)</label>
            <input
              type="number"
              step="0.01"
              value={statementBalanceDollars}
              onChange={(e) => setStatementBalanceDollars(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunReconciliation}
              disabled={isProcessing}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold font-mono text-white transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isProcessing ? 'Reconciling...' : 'Run Auto-Matcher'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Reconciliation Results */}
      {activeReport && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-900 text-base">
                  Reconciliation Report for [{activeReport.accountCode}] {activeReport.accountName}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    activeReport.status === 'MATCHED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {activeReport.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Executed on {formatDate(activeReport.createdAt)}</p>
            </div>

            {activeReport.discrepancy !== 0 && (
              <button
                onClick={handleResolveInterestDiscrepancy}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Resolve via Adjusting Entry</span>
              </button>
            )}
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-bold block">External Bank Statement</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatCurrency(activeReport.statementEndingBalance)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Internal Ledger Balance</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatCurrency(activeReport.ledgerEndingBalance)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Net Discrepancy</span>
              <span className={`text-base font-bold mt-1 block ${activeReport.discrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(activeReport.discrepancy)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Match Statistics</span>
              <span className="text-base font-bold text-emerald-600 mt-1 block">
                {activeReport.matchedCount} Matched / {activeReport.unmatchedCount} Unmatched
              </span>
            </div>
          </div>

          {/* Line Item Matcher Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
              Statement Feed Line Item Matches
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">External Reference</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Reconciliation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {activeReport.statementItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{formatDate(item.date)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.reference}</td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">{item.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            item.matchType === 'EXACT_MATCH'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.matchType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
