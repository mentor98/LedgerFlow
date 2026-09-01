import {
  Account,
  AuditLog,
  BalanceSheetReport,
  GeneralLedgerAccountReport,
  IncomeStatementReport,
  ReconciliationReport,
  TestSuiteSummary,
  Transaction,
  TrialBalanceReport,
} from '../types/ledger';

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Accounts
  listAccounts: async (): Promise<Account[]> => {
    const res = await fetch(`${BASE_URL}/accounts`);
    return handleResponse<Account[]>(res);
  },
  getAccounts: async (): Promise<Account[]> => {
    const res = await fetch(`${BASE_URL}/accounts`);
    return handleResponse<Account[]>(res);
  },

  createAccount: async (payload: {
    code: string;
    name: string;
    type: string;
    currency?: string;
    description?: string;
    parentId?: string | null;
  }): Promise<Account> => {
    const res = await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Account>(res);
  },

  getAccount: async (id: string): Promise<Account> => {
    const res = await fetch(`${BASE_URL}/accounts/${id}`);
    return handleResponse<Account>(res);
  },

  updateAccount: async (id: string, updates: { status?: string; name?: string; description?: string }): Promise<Account> => {
    const res = await fetch(`${BASE_URL}/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Account>(res);
  },

  updateAccountStatus: async (id: string, status: string): Promise<Account> => {
    const res = await fetch(`${BASE_URL}/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Account>(res);
  },

  getAccountStatement: async (id: string) => {
    const res = await fetch(`${BASE_URL}/accounts/${id}/statement`);
    return handleResponse<any>(res);
  },

  // Transactions
  listTransactions: async (params?: { accountId?: string; status?: string; reference?: string; limit?: number }): Promise<Transaction[]> => {
    const query = new URLSearchParams();
    if (params?.accountId) query.set('accountId', params.accountId);
    if (params?.status) query.set('status', params.status);
    if (params?.reference) query.set('reference', params.reference);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/transactions?${query.toString()}`);
    return handleResponse<Transaction[]>(res);
  },
  getTransactions: async (params?: { accountId?: string; status?: string; reference?: string; limit?: number }): Promise<Transaction[]> => {
    return api.listTransactions(params);
  },

  postTransaction: async (
    payload: {
      reference: string;
      description: string;
      currency?: string;
      items: Array<{
        accountId: string;
        direction: 'DEBIT' | 'CREDIT';
        amount: number;
        currency?: string;
        description?: string;
      }>;
      status?: 'POSTED' | 'PENDING';
      metadata?: Record<string, any>;
    },
    idempotencyKey?: string
  ): Promise<Transaction> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<Transaction>(res);
  },
  createTransaction: async (
    payload: any,
    idempotencyKey?: string
  ): Promise<Transaction> => {
    return api.postTransaction(payload, idempotencyKey);
  },

  reverseTransaction: async (id: string, reason: string, idempotencyKey?: string): Promise<{ originalTransaction: Transaction; reversalTransaction: Transaction }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const res = await fetch(`${BASE_URL}/transactions/${id}/reverse`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });
    return handleResponse<{ originalTransaction: Transaction; reversalTransaction: Transaction }>(res);
  },

  commitTransaction: async (id: string): Promise<Transaction> => {
    const res = await fetch(`${BASE_URL}/transactions/${id}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Transaction>(res);
  },

  // Reports
  getTrialBalance: async (currency = 'USD'): Promise<TrialBalanceReport> => {
    const res = await fetch(`${BASE_URL}/reports/trial-balance?currency=${currency}`);
    return handleResponse<TrialBalanceReport>(res);
  },

  getBalanceSheet: async (currency = 'USD'): Promise<BalanceSheetReport> => {
    const res = await fetch(`${BASE_URL}/reports/balance-sheet?currency=${currency}`);
    return handleResponse<BalanceSheetReport>(res);
  },

  getIncomeStatement: async (currency = 'USD'): Promise<IncomeStatementReport> => {
    const res = await fetch(`${BASE_URL}/reports/income-statement?currency=${currency}`);
    return handleResponse<IncomeStatementReport>(res);
  },

  getGeneralLedger: async (): Promise<GeneralLedgerAccountReport[]> => {
    const res = await fetch(`${BASE_URL}/reports/general-ledger`);
    return handleResponse<GeneralLedgerAccountReport[]>(res);
  },

  // Reconciliation
  runReconciliation: async (payload: {
    accountId: string;
    statementEndingBalance: number;
    periodStart?: string;
    periodEnd?: string;
    feedItems: any[];
  }): Promise<ReconciliationReport> => {
    const res = await fetch(`${BASE_URL}/reconciliation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<ReconciliationReport>(res);
  },

  listReconciliations: async (): Promise<ReconciliationReport[]> => {
    const res = await fetch(`${BASE_URL}/reconciliation`);
    return handleResponse<ReconciliationReport[]>(res);
  },
  getReconciliations: async (): Promise<ReconciliationReport[]> => {
    const res = await fetch(`${BASE_URL}/reconciliation`);
    return handleResponse<ReconciliationReport[]>(res);
  },

  // Audit & Chain
  getAuditLogs: async (limit = 100): Promise<AuditLog[]> => {
    const res = await fetch(`${BASE_URL}/audit/logs?limit=${limit}`);
    return handleResponse<AuditLog[]>(res);
  },

  verifyChain: async (): Promise<{ isValid: boolean; totalTransactions: number; details: string }> => {
    const res = await fetch(`${BASE_URL}/audit/verify-chain`);
    return handleResponse<{ isValid: boolean; totalTransactions: number; details: string }>(res);
  },

  // Test Suite
  runTestSuite: async (): Promise<TestSuiteSummary> => {
    const res = await fetch(`${BASE_URL}/tests/run`);
    return handleResponse<TestSuiteSummary>(res);
  },
  runTests: async (): Promise<TestSuiteSummary> => {
    const res = await fetch(`${BASE_URL}/tests/run`);
    return handleResponse<TestSuiteSummary>(res);
  },

  // Reset & Seed
  resetLedger: async () => {
    const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
    return res.json();
  },
  seedData: async () => {
    const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
    return res.json();
  },
};
