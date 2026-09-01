import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  GitBranch,
  Layers,
  PlayCircle,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'reports'
  | 'reconciliation'
  | 'audit'
  | 'api'
  | 'tests'
  | 'docs';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTx: () => void;
  onOpenNewAccount?: () => void;
  onReset?: () => void;
  isChainValid: boolean;
  totalTransactions?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTx,
  onOpenNewAccount,
  onReset,
  isChainValid,
  totalTransactions = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Engine Identifier */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <Scale className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Ledger<span className="text-indigo-600">Flow</span>
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold rounded uppercase tracking-wider border border-slate-200">
                v2.4.0-stable
              </span>
            </div>
          </div>

          {/* Engine Status Indicators & Quick Actions */}
          <div className="flex items-center space-x-4">
            {/* Engine Status */}
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Engine Status: <strong className="text-slate-800 font-semibold">Healthy</strong></span>
            </div>

            {/* Cryptographic Chain Status Pill */}
            <div
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
                isChainValid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                  : 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chain: {isChainValid ? 'VERIFIED' : 'TAMPERED'}</span>
            </div>

            {/* Quick Action Buttons */}
            {onOpenNewAccount && (
              <button
                id="nav-new-account-btn"
                onClick={onOpenNewAccount}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>New Account</span>
              </button>
            )}

            <button
              id="nav-new-tx-btn"
              onClick={onOpenNewTx}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Post Transaction</span>
            </button>

            {onReset && (
              <button
                id="nav-reset-btn"
                onClick={onReset}
                title="Reset ledger to standard chart of accounts"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 bg-slate-50/50">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none text-xs font-medium">
          {[
            { id: 'dashboard', label: 'General Ledger', icon: Zap },
            { id: 'accounts', label: 'Chart of Accounts', icon: Layers },
            { id: 'transactions', label: 'Journal Entries', icon: Scale },
            { id: 'reports', label: 'Financial Statements', icon: FileSpreadsheet },
            { id: 'reconciliation', label: 'Reconciliation', icon: GitBranch },
            { id: 'audit', label: 'Audit Log & Merkle Chain', icon: ShieldCheck },
            { id: 'api', label: 'API Sandbox', icon: Terminal },
            { id: 'tests', label: 'Test Suite', icon: PlayCircle },
            { id: 'docs', label: 'Documentation & SQL', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
