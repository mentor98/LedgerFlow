import React, { useEffect, useState } from 'react';
import { Account } from '../types/ledger';
import { api } from '../utils/api';
import { formatCurrency, formatDate, getAccountTypeBadge } from '../utils/formatters';
import { Download, FileText, Loader2, X } from 'lucide-react';

interface AccountStatementModalProps {
  account: Account | null;
  onClose: () => void;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({ account, onClose }) => {
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (account) {
      setLoading(true);
      api
        .getAccountStatement(account.id)
        .then((data) => {
          setStatement(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [account]);

  if (!account) return null;

  const badge = getAccountTypeBadge(account.type);

  const handleExportCSV = () => {
    if (!statement || !statement.lines) return;
    const headers = ['Date', 'Transaction ID', 'Reference', 'Description', 'Direction', 'Amount (Cents)', 'Amount (Formatted)', 'Running Balance'];
    const rows = statement.lines.map((l: any) => [
      l.date,
      l.transactionId,
      `"${l.reference}"`,
      `"${l.description}"`,
      l.direction,
      l.amount,
      formatCurrency(l.amount, account.currency),
      formatCurrency(l.runningBalance, account.currency),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `statement-${account.code}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-900 text-base">
                  [{account.code}] {account.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {account.type}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Normal Balance: <span className="font-mono font-semibold text-slate-700">{account.normalBalance}</span> | Currency: {account.currency}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              disabled={!statement || statement.lines?.length === 0}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition text-xs font-medium inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Calculating chronological ledger statement...</span>
            </div>
          ) : !statement || statement.lines?.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono">
              No transactions posted to this account yet.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-mono font-bold">Total Cumulative Debits</span>
                  <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                    {formatCurrency(statement.totalDebits, account.currency)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-mono font-bold">Total Cumulative Credits</span>
                  <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                    {formatCurrency(statement.totalCredits, account.currency)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200">
                  <span className="text-[11px] text-indigo-700 uppercase tracking-wider block font-mono font-bold">Closing Net Balance</span>
                  <span className="text-lg font-bold font-mono text-indigo-900 mt-1 block">
                    {formatCurrency(statement.closingBalance, account.currency)}
                  </span>
                </div>
              </div>

              {/* Chronological Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Direction</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {statement.lines.map((l: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{formatDate(l.date)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{l.reference}</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate font-sans">{l.description}</td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              l.direction === 'DEBIT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {l.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(l.amount, account.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {formatCurrency(l.runningBalance, account.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
