import React, { useState } from 'react';
import { Account, Transaction, TransactionStatus } from '../types/ledger';
import { formatCurrency, formatDate, getTransactionStatusBadge, truncateHash } from '../utils/formatters';
import {
  CheckCircle2,
  Copy,
  Filter,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onOpenNewTx: () => void;
  onSelectTx: (tx: Transaction) => void;
  onReverseTx: (tx: Transaction) => void;
  onCommitTx: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  onOpenNewTx,
  onSelectTx,
  onReverseTx,
  onCommitTx,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = selectedStatus === 'ALL' || tx.status === selectedStatus;
    const matchesAccount =
      selectedAccountId === 'ALL' || tx.items.some((it) => it.accountId === selectedAccountId);
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      tx.reference.toLowerCase().includes(query) ||
      tx.description.toLowerCase().includes(query) ||
      tx.id.toLowerCase().includes(query);
    return matchesStatus && matchesAccount && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Journal & Transaction Ledger</h2>
          <p className="text-xs text-slate-500">
            Append-only double-entry ledger with SHA-256 Merkle chain and atomic reversal guarantees
          </p>
        </div>

        <button
          onClick={onOpenNewTx}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post Transaction</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference (e.g. TX-REV-001), description, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        {/* Account Filter & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-indigo-600 transition text-xs font-medium"
          >
            <option value="ALL">All Filter Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1">
            {['ALL', 'POSTED', 'PENDING', 'REVERSED'].map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Seq / Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Split Legs (Debits & Credits)</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const statusBadge = getTransactionStatusBadge(tx.status);
                  const isReversible = tx.status === 'POSTED' && !tx.reversedBy;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTx(tx)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      {/* Seq & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">#{tx.sequenceNumber}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatDate(tx.effectiveDate)}</div>
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {tx.reference}
                        </div>
                        {tx.reversalOf && (
                          <div className="text-[10px] font-mono text-purple-600 font-semibold mt-0.5">
                            Reversal of orig tx
                          </div>
                        )}
                        {tx.reversedBy && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Reversed by {tx.reversedBy.slice(0, 10)}...
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">{tx.description}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{tx.id}</div>
                      </td>

                      {/* Splits Summary */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          {tx.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center space-x-2 text-[11px] font-mono">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  item.direction === 'DEBIT'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {item.direction}
                              </span>
                              <span className="text-slate-700 font-semibold">{item.accountCode || item.accountId.slice(0, 8)}</span>
                              <span className="text-slate-500">
                                {formatCurrency(item.amount, item.currency)}
                              </span>
                            </div>
                          ))}
                          {tx.items.length > 3 && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              +{tx.items.length - 3} more legs...
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(tx.totalAmount, tx.currency)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Hash */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          onClick={(e) => handleCopyHash(tx.hash, e)}
                          title={`Click to copy SHA-256 Hash:\n${tx.hash}\nPrev Hash:\n${tx.prevHash}`}
                          className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{truncateHash(tx.hash, 6, 6)}</span>
                          <Copy className="w-3 h-3 text-slate-400" />
                        </div>
                        {copiedHash === tx.hash && (
                          <div className="text-[10px] text-indigo-600 font-mono font-semibold mt-0.5">Copied!</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {tx.status === 'PENDING' && (
                            <button
                              onClick={() => onCommitTx(tx)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition text-xs flex items-center space-x-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Commit</span>
                            </button>
                          )}

                          {isReversible && (
                            <button
                              onClick={() => onReverseTx(tx)}
                              className="px-2 py-1 rounded bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 hover:border-rose-200 transition text-xs flex items-center space-x-1 shadow-2xs"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-400" />
                              <span>Reverse</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
