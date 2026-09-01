import React, { useState } from 'react';
import { Transaction } from '../types/ledger';
import { formatCurrency, formatDate, getTransactionStatusBadge, truncateHash } from '../utils/formatters';
import { CheckCircle2, Code2, Copy, FileText, Key, RotateCcw, Scale, ShieldCheck, X } from 'lucide-react';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
  onReverseTx: (tx: Transaction) => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
  onReverseTx,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [viewJson, setViewJson] = useState(false);

  if (!transaction) return null;

  const statusBadge = getTransactionStatusBadge(transaction.status);

  const copyFullHash = () => {
    navigator.clipboard.writeText(transaction.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-900 text-base">
                  {transaction.reference}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                >
                  {transaction.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">Block Sequence #{transaction.sequenceNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewJson(!viewJson)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              title="Toggle JSON View"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {viewJson ? (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400 shadow-inner">
              <pre>{JSON.stringify(transaction, null, 2)}</pre>
            </div>
          ) : (
            <>
              {/* Primary Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Description</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{transaction.description}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Total Amount</span>
                    <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                      {formatCurrency(transaction.totalAmount, transaction.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Effective Date</span>
                    <span className="text-xs font-mono text-slate-700 mt-0.5 block">
                      {formatDate(transaction.effectiveDate)}
                    </span>
                  </div>
                </div>

                {transaction.idempotencyKey && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Idempotency Key</span>
                    <span className="font-mono text-indigo-700 text-[11px] font-semibold">{transaction.idempotencyKey}</span>
                  </div>
                )}
              </div>

              {/* Splits Legs Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
                  Double-Entry Legs / Splits ({transaction.items.length})
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Direction</th>
                        <th className="py-2 px-3">Account</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transaction.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                item.direction === 'DEBIT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {item.direction}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-semibold text-slate-900">
                              {item.accountCode || item.accountId}
                            </div>
                            {item.accountName && (
                              <div className="text-[11px] text-slate-500 truncate">{item.accountName}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.amount, item.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cryptographic Hash Chain Proof */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cryptographic Block Signature</span>
                  </span>
                  <button
                    onClick={copyFullHash}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-mono inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">SHA-256 Block Hash:</span>
                    <span className="text-slate-700 break-all bg-white p-1.5 rounded block border border-slate-200 text-[11px]">
                      {transaction.hash}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Previous Block Link (prevHash):</span>
                    <span className="text-slate-500 break-all bg-white p-1.5 rounded block border border-slate-200 text-[11px]">
                      {transaction.prevHash}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">ID: {transaction.id}</span>
          {transaction.status === 'POSTED' && !transaction.reversedBy && (
            <button
              onClick={() => {
                onClose();
                onReverseTx(transaction);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-300 hover:border-rose-300 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reverse Transaction</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
