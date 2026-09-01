import React, { useEffect, useState } from 'react';
import { Account, PostingDirection } from '../types/ledger';
import { formatCurrency } from '../utils/formatters';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Key,
  Layers,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface SplitLegDraft {
  id: string;
  accountId: string;
  direction: PostingDirection;
  amountDollars: string; // e.g. "150.00"
  description?: string;
}

interface TransactionComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onPostTransaction: (payload: any, idempotencyKey?: string) => Promise<void>;
}

export const TransactionComposerModal: React.FC<TransactionComposerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onPostTransaction,
}) => {
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState<'POSTED' | 'PENDING'>('POSTED');
  const [useIdempotency, setUseIdempotency] = useState(true);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [legs, setLegs] = useState<SplitLegDraft[]>([
    { id: '1', accountId: '', direction: 'DEBIT', amountDollars: '100.00', description: '' },
    { id: '2', accountId: '', direction: 'CREDIT', amountDollars: '100.00', description: '' },
  ]);

  // Generate unique keys on open
  useEffect(() => {
    if (isOpen) {
      const rnd = Math.floor(100000 + Math.random() * 900000);
      setReference(`TX-ORD-${rnd}`);
      setIdempotencyKey(`idem-${Date.now()}-${rnd}`);
      setErrorMessage(null);
      // Pick initial accounts if empty
      const cash = accounts.find((a) => a.code === '1010') || accounts[0];
      const rev = accounts.find((a) => a.code === '4010') || accounts[1];
      if (cash && rev) {
        setLegs([
          { id: '1', accountId: cash.id, direction: 'DEBIT', amountDollars: '150.00', description: 'Cash received' },
          { id: '2', accountId: rev.id, direction: 'CREDIT', amountDollars: '150.00', description: 'Subscription revenue' },
        ]);
        setDescription('Enterprise Platform Annual SaaS Subscription');
      }
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  // Calculate sum of debits and credits in integer cents
  let sumDebitsCents = 0;
  let sumCreditsCents = 0;

  for (const leg of legs) {
    const val = parseFloat(leg.amountDollars) || 0;
    const cents = Math.round(val * 100);
    if (cents > 0) {
      if (leg.direction === 'DEBIT') {
        sumDebitsCents += cents;
      } else {
        sumCreditsCents += cents;
      }
    }
  }

  const varianceCents = sumDebitsCents - sumCreditsCents;
  const isBalanced = sumDebitsCents > 0 && varianceCents === 0;

  // Preset Template loader
  const applyPreset = (presetType: string) => {
    const cash = accounts.find((a) => a.code === '1010')?.id || '';
    const treasury = accounts.find((a) => a.code === '1020')?.id || '';
    const stripeEscrow = accounts.find((a) => a.code === '1030')?.id || '';
    const rev = accounts.find((a) => a.code === '4010')?.id || '';
    const fees = accounts.find((a) => a.code === '5030')?.id || '';
    const aws = accounts.find((a) => a.code === '5010')?.id || '';
    const payroll = accounts.find((a) => a.code === '5020')?.id || '';
    const equity = accounts.find((a) => a.code === '3010')?.id || '';

    const rnd = Math.floor(1000 + Math.random() * 9000);

    switch (presetType) {
      case 'SAAS_SUB':
        setReference(`SUB-MRR-${rnd}`);
        setDescription('Customer monthly SaaS subscription payment via credit card');
        setLegs([
          { id: '1', accountId: cash, direction: 'DEBIT', amountDollars: '200.00', description: 'Net bank deposit' },
          { id: '2', accountId: rev, direction: 'CREDIT', amountDollars: '200.00', description: 'SaaS recurring revenue' },
        ]);
        break;
      case 'STRIPE_SPLIT':
        setReference(`STRIPE-PAY-${rnd}`);
        setDescription('Customer payment with payment gateway processing fee split');
        setLegs([
          { id: '1', accountId: cash, direction: 'DEBIT', amountDollars: '97.10', description: 'Net settlement to bank' },
          { id: '2', accountId: fees, direction: 'DEBIT', amountDollars: '2.90', description: 'Stripe merchant processing fee' },
          { id: '3', accountId: rev, direction: 'CREDIT', amountDollars: '100.00', description: 'Gross customer invoice' },
        ]);
        break;
      case 'PAYROLL':
        setReference(`PAYROLL-SPRINT-${rnd}`);
        setDescription('Engineering sprint payroll and developer compensation disbursement');
        setLegs([
          { id: '1', accountId: payroll, direction: 'DEBIT', amountDollars: '12500.00', description: 'Engineering salary expense' },
          { id: '2', accountId: cash, direction: 'CREDIT', amountDollars: '12500.00', description: 'Direct deposit bank disbursement' },
        ]);
        break;
      case 'AWS_BILL':
        setReference(`AWS-INV-${rnd}`);
        setDescription('Cloud infrastructure and database cluster hosting fee');
        setLegs([
          { id: '1', accountId: aws, direction: 'DEBIT', amountDollars: '3450.00', description: 'Cloud infrastructure hosting' },
          { id: '2', accountId: cash, direction: 'CREDIT', amountDollars: '3450.00', description: 'Operating cash payment' },
        ]);
        break;
      case 'SEED_CAPITAL':
        setReference(`INV-SEED-${rnd}`);
        setDescription('Seed round convertible note & equity investment');
        setLegs([
          { id: '1', accountId: cash, direction: 'DEBIT', amountDollars: '500000.00', description: 'Treasury cash injection' },
          { id: '2', accountId: equity, direction: 'CREDIT', amountDollars: '500000.00', description: 'Common stock & preferred equity' },
        ]);
        break;
    }
  };

  const handleAddLeg = () => {
    setLegs([
      ...legs,
      {
        id: String(Date.now()),
        accountId: accounts[0]?.id || '',
        direction: 'DEBIT',
        amountDollars: '0.00',
        description: '',
      },
    ]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 2) return;
    setLegs(legs.filter((_, i) => i !== idx));
  };

  const handleLegChange = (idx: number, field: keyof SplitLegDraft, val: any) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: val };
    setLegs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setErrorMessage('Cannot submit: Debits must equal Credits exactly.');
      return;
    }

    // Check account selections
    for (let i = 0; i < legs.length; i++) {
      if (!legs[i].accountId) {
        setErrorMessage(`Please select an account for Leg #${i + 1}.`);
        return;
      }
      const cents = Math.round((parseFloat(legs[i].amountDollars) || 0) * 100);
      if (cents <= 0) {
        setErrorMessage(`Leg #${i + 1} amount must be greater than zero.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        reference: reference.trim(),
        description: description.trim(),
        currency,
        status,
        items: legs.map((leg) => ({
          accountId: leg.accountId,
          direction: leg.direction,
          amount: Math.round((parseFloat(leg.amountDollars) || 0) * 100),
          description: leg.description || description,
        })),
      };

      await onPostTransaction(payload, useIdempotency ? idempotencyKey : undefined);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Post Double-Entry Transaction</h3>
              <p className="text-xs text-slate-500">Atomic journal entry with multi-leg splits and Merkle proof</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Presets Bar */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Load Transaction Template Preset:</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'SAAS_SUB', label: 'SaaS Subscription' },
                { id: 'STRIPE_SPLIT', label: 'Payment + Merchant Fee Split' },
                { id: 'PAYROLL', label: 'Engineering Payroll' },
                { id: 'AWS_BILL', label: 'Cloud Infrastructure' },
                { id: 'SEED_CAPITAL', label: 'Seed Equity Funding' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer text-[11px] font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Transaction Reference *</label>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TX-ORD-98742"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setReference(`TX-ORD-${Math.floor(100000 + Math.random() * 900000)}`)}
                  title="Generate new unique reference"
                  className="px-2.5 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Transaction Lifecycle</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="POSTED">POSTED (Immediate)</option>
                <option value="PENDING">PENDING (Two-Phase Hold)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description / Memo *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly Enterprise SaaS Platform Fee settlement"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Idempotency Protection Toggle */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useIdempotency}
                  onChange={(e) => setUseIdempotency(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Enforce Idempotency Protection</span>
              </label>
              <span className="text-[11px] text-slate-500">Prevents network replay duplicates</span>
            </div>

            {useIdempotency && (
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 rounded-md bg-white border border-slate-300 font-mono text-[11px] text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIdempotencyKey(`idem-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] cursor-pointer"
                >
                  Regenerate
                </button>
              </div>
            )}
          </div>

          {/* Double-Entry Split Legs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
                Transaction Splits / Legs (Minimum 2)
              </span>
              <button
                type="button"
                onClick={handleAddLeg}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200 transition cursor-pointer text-[11px]"
              >
                <Plus className="w-3 h-3" />
                <span>Add Leg</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {legs.map((leg, idx) => (
                <div
                  key={leg.id}
                  className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  {/* Direction */}
                  <select
                    value={leg.direction}
                    onChange={(e) => handleLegChange(idx, 'direction', e.target.value)}
                    className={`px-2 py-1.5 rounded-md font-mono font-bold text-xs border focus:outline-none ${
                      leg.direction === 'DEBIT'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>

                  {/* Account Selector */}
                  <select
                    required
                    value={leg.accountId}
                    onChange={(e) => handleLegChange(idx, 'accountId', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({a.type})
                      </option>
                    ))}
                  </select>

                  {/* Amount in dollars */}
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={leg.amountDollars}
                      onChange={(e) => handleLegChange(idx, 'amountDollars', e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 font-mono text-right text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Delete leg button */}
                  {legs.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLeg(idx)}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Balance Validator Bar */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-semibold">
                  {isBalanced ? 'Balanced Double-Entry' : 'Unbalanced Transaction'}
                </span>
                <div className="text-[11px] opacity-80 font-mono mt-0.5">
                  Debits: {formatCurrency(sumDebitsCents)} | Credits: {formatCurrency(sumCreditsCents)}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] uppercase tracking-wider block opacity-70">Variance</span>
              <span className="font-bold text-xs">{formatCurrency(varianceCents)}</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
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
              disabled={!isBalanced || isSubmitting}
              className={`px-5 py-2 rounded-lg font-bold font-mono text-white transition cursor-pointer flex items-center space-x-1.5 ${
                isBalanced && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post to Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
