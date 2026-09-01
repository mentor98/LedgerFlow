export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export type PostingDirection = 'DEBIT' | 'CREDIT';

export type TransactionStatus = 'PENDING' | 'POSTED' | 'REVERSED' | 'REJECTED' | 'SETTLED';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  currency: string;
  description?: string;
  parentId?: string | null;
  status: AccountStatus;
  balance?: AccountBalance;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalance {
  accountId: string;
  postedDebitBalance: number; // in integer minor units (cents)
  postedCreditBalance: number; // in integer minor units (cents)
  pendingDebitBalance: number;
  pendingCreditBalance: number;
  netBalance: number; // Net balance respecting normal balance sign
  currency: string;
  version: number;
  lastEntryId?: string;
  updatedAt: string;
}

export interface JournalEntryItem {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  accountType?: AccountType;
  direction: PostingDirection;
  amount: number; // integer minor units (e.g. 10000 = $100.00)
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  journalId: string;
  idempotencyKey?: string;
  reference: string;
  description: string;
  status: TransactionStatus;
  currency: string;
  items: JournalEntryItem[];
  totalAmount: number; // total debit amount (= total credit amount)
  effectiveDate: string;
  postedAt: string;
  reversalOf?: string;
  reversedBy?: string;
  hash: string;
  prevHash: string;
  sequenceNumber: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Journal {
  id: string;
  name: string;
  code: string;
  currency: string;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: 'ACCOUNT_CREATED' | 'ACCOUNT_UPDATED' | 'TRANSACTION_POSTED' | 'TRANSACTION_REVERSED' | 'TRANSACTION_HELD' | 'TRANSACTION_COMMITTED' | 'RECONCILIATION_RUN' | 'INTEGRITY_VERIFIED' | 'LEDGER_SEEDED' | 'LEDGER_RESET';
  targetId: string;
  targetType: 'ACCOUNT' | 'TRANSACTION' | 'JOURNAL' | 'RECONCILIATION' | 'SYSTEM';
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface ReconciliationStatementItem {
  id: string;
  date: string;
  amount: number; // positive = credit to account, negative = debit
  currency: string;
  description: string;
  reference: string;
  matchedTransactionId?: string;
  matchType?: 'EXACT_MATCH' | 'UNMATCHED' | 'MANUAL_MATCH';
  notes?: string;
}

export interface ReconciliationReport {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  periodStart: string;
  periodEnd: string;
  statementEndingBalance: number;
  ledgerEndingBalance: number;
  discrepancy: number;
  status: 'MATCHED' | 'DISCREPANCY_DETECTED' | 'RESOLVED';
  statementItems: ReconciliationStatementItem[];
  matchedCount: number;
  unmatchedCount: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  currency: string;
  totalDebits: number;
  totalCredits: number;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceReport {
  generatedAt: string;
  currency: string;
  items: TrialBalanceItem[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  variance: number;
}

export interface BalanceSheetSection {
  title: string;
  items: {
    accountId: string;
    code: string;
    name: string;
    balance: number;
  }[];
  subtotal: number;
}

export interface BalanceSheetReport {
  generatedAt: string;
  currency: string;
  asOfDate: string;
  assets: BalanceSheetSection[];
  totalAssets: number;
  liabilities: BalanceSheetSection[];
  totalLiabilities: number;
  equity: BalanceSheetSection[];
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  variance: number;
}

export interface IncomeStatementReport {
  generatedAt: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  revenues: {
    accountId: string;
    code: string;
    name: string;
    amount: number;
  }[];
  totalRevenues: number;
  expenses: {
    accountId: string;
    code: string;
    name: string;
    amount: number;
  }[];
  totalExpenses: number;
  netIncome: number;
}

export interface GeneralLedgerLine {
  date: string;
  transactionId: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerAccountReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  lines: GeneralLedgerLine[];
}

export interface TestResultItem {
  id: string;
  name: string;
  category: 'CORE_DOUBLE_ENTRY' | 'INTEGRITY_CHAIN' | 'IDEMPOTENCY' | 'REVERSALS' | 'RECONCILIATION' | 'CONCURRENCY' | 'MULTI_CURRENCY';
  description: string;
  status: 'PASSED' | 'FAILED' | 'RUNNING' | 'PENDING';
  durationMs: number;
  error?: string;
  details?: Record<string, any>;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
  executedAt: string;
}
