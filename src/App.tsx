/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Account,
  AuditLog,
  BalanceSheetReport,
  GeneralLedgerAccountReport,
  IncomeStatementReport,
  ReconciliationReport,
  Transaction,
  TrialBalanceReport,
} from './types/ledger';
import { api } from './utils/api';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AccountsView } from './components/AccountsView';
import { TransactionsView } from './components/TransactionsView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { ReconciliationView } from './components/ReconciliationView';
import { AuditChainView } from './components/AuditChainView';
import { ApiSandboxView } from './components/ApiSandboxView';
import { TestRunnerView } from './components/TestRunnerView';
import { DocsView } from './components/DocsView';
import { TransactionComposerModal } from './components/TransactionComposerModal';
import { NewAccountModal } from './components/NewAccountModal';
import { AccountStatementModal } from './components/AccountStatementModal';
import { ReverseTransactionModal } from './components/ReverseTransactionModal';
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Ledger state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementReport | null>(null);
  const [generalLedger, setGeneralLedger] = useState<GeneralLedgerAccountReport[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationReport[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);

  // Modal / Drawer state
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [selectedStatementAccount, setSelectedStatementAccount] = useState<Account | null>(null);
  const [selectedInspectTx, setSelectedInspectTx] = useState<Transaction | null>(null);
  const [selectedReverseTx, setSelectedReverseTx] = useState<Transaction | null>(null);

  // Fetch all initial data from backend API
  const refreshAllData = async () => {
    try {
      const [
        accs,
        txs,
        logs,
        tb,
        bs,
        is,
        gl,
        recList,
        verifyRes,
      ] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getAuditLogs(),
        api.getTrialBalance(),
        api.getBalanceSheet(),
        api.getIncomeStatement(),
        api.getGeneralLedger(),
        api.getReconciliations(),
        api.verifyChain(),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setAuditLogs(logs);
      setTrialBalance(tb);
      setBalanceSheet(bs);
      setIncomeStatement(is);
      setGeneralLedger(gl);
      setReconciliations(recList);
      setIsChainValid(verifyRes.isValid);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Action handlers
  const handlePostTransaction = async (payload: any, idempotencyKey?: string) => {
    await api.createTransaction(payload, idempotencyKey);
    await refreshAllData();
  };

  const handleCreateAccount = async (payload: any) => {
    await api.createAccount(payload);
    await refreshAllData();
  };

  const handleToggleAccountStatus = async (account: Account) => {
    const newStatus = account.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    await api.updateAccountStatus(account.id, newStatus);
    await refreshAllData();
  };

  const handleConfirmReverse = async (transactionId: string, reason: string) => {
    await api.reverseTransaction(transactionId, reason);
    await refreshAllData();
  };

  const handleCommitPending = async (tx: Transaction) => {
    await api.commitTransaction(tx.id);
    await refreshAllData();
  };

  const handleSeedDemoData = async () => {
    setLoading(true);
    try {
      await api.seedData();
      await refreshAllData();
    } catch (err) {
      console.error('Failed to seed demo data:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTx={() => setIsNewTxOpen(true)}
        onOpenNewAccount={() => setIsNewAccountOpen(true)}
        onReset={handleSeedDemoData}
        isChainValid={isChainValid}
        totalTransactions={transactions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="font-mono text-xs font-medium">Initializing LedgerFlow Engine state...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                accounts={accounts}
                transactions={transactions}
                trialBalance={trialBalance}
                balanceSheet={balanceSheet}
                incomeStatement={incomeStatement}
                onOpenNewTx={() => setIsNewTxOpen(true)}
                onOpenNewAccount={() => setIsNewAccountOpen(true)}
                onSelectTx={(tx) => setSelectedInspectTx(tx)}
                onSeedDemoData={handleSeedDemoData}
                isChainValid={isChainValid}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                onOpenNewAccount={() => setIsNewAccountOpen(true)}
                onSelectAccountStatement={(acc) => setSelectedStatementAccount(acc)}
                onToggleStatus={handleToggleAccountStatus}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                accounts={accounts}
                onOpenNewTx={() => setIsNewTxOpen(true)}
                onSelectTx={(tx) => setSelectedInspectTx(tx)}
                onReverseTx={(tx) => setSelectedReverseTx(tx)}
                onCommitTx={handleCommitPending}
              />
            )}

            {activeTab === 'reports' && (
              <FinancialReportsView
                trialBalance={trialBalance}
                balanceSheet={balanceSheet}
                incomeStatement={incomeStatement}
                generalLedger={generalLedger}
              />
            )}

            {activeTab === 'reconciliation' && (
              <ReconciliationView
                accounts={accounts}
                reconciliations={reconciliations}
                onRefreshReconciliations={refreshAllData}
                onPostAdjustingTx={handlePostTransaction}
              />
            )}

            {activeTab === 'audit' && (
              <AuditChainView
                transactions={transactions}
                auditLogs={auditLogs}
                isChainValid={isChainValid}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'sandbox' && <ApiSandboxView />}

            {activeTab === 'tests' && (
              <TestRunnerView testResults={testResults} onRefreshTests={refreshAllData} />
            )}

            {activeTab === 'docs' && <DocsView />}
          </>
        )}
      </main>

      {/* Modals and Drawers */}
      <TransactionComposerModal
        isOpen={isNewTxOpen}
        onClose={() => setIsNewTxOpen(false)}
        accounts={accounts}
        onPostTransaction={handlePostTransaction}
      />

      <NewAccountModal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
        accounts={accounts}
        onCreateAccount={handleCreateAccount}
      />

      <AccountStatementModal
        account={selectedStatementAccount}
        onClose={() => setSelectedStatementAccount(null)}
      />

      <ReverseTransactionModal
        transaction={selectedReverseTx}
        onClose={() => setSelectedReverseTx(null)}
        onConfirmReverse={handleConfirmReverse}
      />

      <TransactionDetailDrawer
        transaction={selectedInspectTx}
        onClose={() => setSelectedInspectTx(null)}
        onReverseTx={(tx) => setSelectedReverseTx(tx)}
      />
    </div>
  );
}
