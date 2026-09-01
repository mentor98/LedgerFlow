import React, { useState } from 'react';
import { Account, AccountStatus, AccountType } from '../types/ledger';
import { formatCurrency, formatDate, getAccountTypeBadge } from '../utils/formatters';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Filter,
  Lock,
  Plus,
  Search,
  Unlock,
} from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  onOpenNewAccount: () => void;
  onSelectAccountStatement: (account: Account) => void;
  onToggleStatus: (account: Account) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onOpenNewAccount,
  onSelectAccountStatement,
  onToggleStatus,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAccounts = accounts.filter((acc) => {
    const matchesType = selectedType === 'ALL' || acc.type === selectedType;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      acc.code.toLowerCase().includes(query) ||
      acc.name.toLowerCase().includes(query) ||
      (acc.description && acc.description.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h2>
          <p className="text-xs text-slate-500">
            Standard GAAP/Fintech general ledger chart of accounts with strict normal balances
          </p>
        </div>

        <button
          onClick={onOpenNewAccount}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code (e.g. 1010), name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-medium">
          {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {type === 'ALL' ? 'All Accounts' : type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Normal Bal</th>
                <th className="py-3 px-4 text-right">Posted Debits</th>
                <th className="py-3 px-4 text-right">Posted Credits</th>
                <th className="py-3 px-4 text-right">Net Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const badge = getAccountTypeBadge(account.type);
                  const isFrozen = account.status === 'FROZEN';
                  const bal = account.balance;

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/80 transition group">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {account.code}
                        </span>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {account.name}
                        </div>
                        {account.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {account.description}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {account.type}
                        </span>
                      </td>

                      {/* Normal Balance */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap font-medium">
                        {account.normalBalance}
                      </td>

                      {/* Posted Debits */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                        {formatCurrency(bal?.postedDebitBalance ?? 0, account.currency)}
                      </td>

                      {/* Posted Credits */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                        {formatCurrency(bal?.postedCreditBalance ?? 0, account.currency)}
                      </td>

                      {/* Net Balance */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            (bal?.netBalance ?? 0) >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }
                        >
                          {formatCurrency(bal?.netBalance ?? 0, account.currency)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(account)}
                          title={isFrozen ? 'Account is FROZEN. Click to reactivate.' : 'Account is ACTIVE. Click to freeze.'}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border inline-flex items-center space-x-1 cursor-pointer transition ${
                            isFrozen
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isFrozen ? <Lock className="w-2.5 h-2.5 mr-0.5" /> : <Unlock className="w-2.5 h-2.5 mr-0.5" />}
                          <span>{account.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectAccountStatement(account)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 hover:border-slate-300 font-semibold transition cursor-pointer text-xs shadow-2xs"
                        >
                          <FileText className="w-3 h-3 text-indigo-500" />
                          <span>Statement</span>
                        </button>
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
