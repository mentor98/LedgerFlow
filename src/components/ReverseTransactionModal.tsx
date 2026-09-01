import React, { useState } from 'react';
import { Transaction } from '../types/ledger';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AlertTriangle, RotateCcw, Scale, X } from 'lucide-react';

interface ReverseTransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onConfirmReverse: (transactionId: string, reason: string) => Promise<void>;
}

export const ReverseTransactionModal: React.FC<ReverseTransactionModalProps> = ({
  transaction,
  onClose,
  onConfirmReverse,
}) => {
  const [reason, setReason] = useState('Customer refund / transaction cancellation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid reason is required for accounting audit compliance.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirmReverse(transaction.id, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reverse transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reverse Transaction</h3>
              <p className="text-xs text-slate-500">Atomic compensating double-entry journal reversal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Tx Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900">{transaction.reference}</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(transaction.totalAmount, transaction.currency)}
              </span>
            </div>
            <p className="text-slate-700 font-medium">{transaction.description}</p>
            <div className="text-[11px] text-slate-500 font-mono">
              Posted: {formatDate(transaction.postedAt)} | {transaction.items.length} splits
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-950">GAAP / SOX Immutability Rule</span>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                The original transaction record will NOT be deleted or mutated. A mirror compensating double-entry
                transaction will be posted swapping debits & credits, nullifying net balance changes and appending to the SHA-256 hash chain.
              </p>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Reason for Reversal *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Chargeback, customer dispute, duplicate billing correction..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-bold text-white transition cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting Reversal...' : 'Confirm Reversal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
