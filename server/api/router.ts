import { Router, Request, Response } from 'express';
import { globalLedgerEngine } from '../engine/ledgerEngine.ts';

export const apiRouter = Router();

// Middleware to extract Idempotency Key from headers
function getIdempotencyKey(req: Request): string | undefined {
  return (
    (req.headers['idempotency-key'] as string) ||
    (req.headers['x-idempotency-key'] as string) ||
    undefined
  );
}

// 1. Health check & Engine Info
apiRouter.get('/health', (req: Request, res: Response) => {
  const accounts = globalLedgerEngine.listAccounts();
  const txs = globalLedgerEngine.listTransactions();
  res.json({
    status: 'healthy',
    version: '1.0.0-GA',
    engine: 'LedgerFlow Double-Entry Core',
    stats: {
      totalAccounts: accounts.length,
      totalTransactions: txs.length,
      isChainValid: globalLedgerEngine.verifyLedgerIntegrity().isValid,
    },
    timestamp: new Date().toISOString(),
  });
});

// 2. Accounts
apiRouter.get('/accounts', (req: Request, res: Response) => {
  try {
    const accounts = globalLedgerEngine.listAccounts();
    res.json({ data: accounts, count: accounts.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/accounts', (req: Request, res: Response) => {
  try {
    const { code, name, type, currency, description, parentId, status, metadata } = req.body;
    if (!code || !name || !type) {
      res.status(400).json({ error: 'Missing required fields: code, name, and type are mandatory.' });
      return;
    }
    const account = globalLedgerEngine.createAccount({
      code,
      name,
      type,
      currency,
      description,
      parentId,
      status,
      metadata,
    });
    res.status(201).json({ data: account, message: 'Account created successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/accounts/:id', (req: Request, res: Response) => {
  try {
    const account = globalLedgerEngine.getAccount(req.params.id);
    if (!account) {
      res.status(404).json({ error: `Account with ID '${req.params.id}' not found` });
      return;
    }
    res.json({ data: account });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/accounts/:id', (req: Request, res: Response) => {
  try {
    const updated = globalLedgerEngine.updateAccount(req.params.id, req.body);
    res.json({ data: updated, message: 'Account updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/accounts/:id/statement', (req: Request, res: Response) => {
  try {
    const statement = globalLedgerEngine.getAccountStatement(req.params.id);
    res.json({ data: statement });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// 3. Journals
apiRouter.get('/journals', (req: Request, res: Response) => {
  try {
    const journals = globalLedgerEngine.listJournals();
    res.json({ data: journals, count: journals.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/journals', (req: Request, res: Response) => {
  try {
    const { name, code, currency, description } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'name and code are required' });
      return;
    }
    const journal = globalLedgerEngine.createJournal({ name, code, currency, description });
    res.status(201).json({ data: journal });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Transactions & Double-Entry Postings
apiRouter.get('/transactions', (req: Request, res: Response) => {
  try {
    const { accountId, status, reference, limit } = req.query;
    const transactions = globalLedgerEngine.listTransactions({
      accountId: accountId as string,
      status: status as any,
      reference: reference as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({ data: transactions, count: transactions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/transactions', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = getIdempotencyKey(req) || req.body.idempotencyKey;
    const { reference, description, items, currency, effectiveDate, status, metadata, journalId } = req.body;

    if (!reference || !description || !items) {
      res.status(400).json({ error: 'reference, description, and items are required fields.' });
      return;
    }

    const transaction = await globalLedgerEngine.postTransaction({
      journalId,
      reference,
      description,
      items,
      currency,
      effectiveDate,
      idempotencyKey,
      status,
      metadata,
    });

    res.status(201).json({ data: transaction, message: 'Double-entry transaction posted successfully.' });
  } catch (err: any) {
    const statusCode = err.message.includes('conflict') ? 409 : 400;
    res.status(statusCode).json({ error: err.message });
  }
});

apiRouter.get('/transactions/:id', (req: Request, res: Response) => {
  try {
    const tx = globalLedgerEngine.getTransaction(req.params.id);
    if (!tx) {
      res.status(404).json({ error: `Transaction with ID '${req.params.id}' not found` });
      return;
    }
    res.json({ data: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/transactions/:id/reverse', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = getIdempotencyKey(req) || req.body.idempotencyKey;
    const { reason, metadata } = req.body;
    if (!reason) {
      res.status(400).json({ error: 'Reason is required for transaction reversal.' });
      return;
    }
    const result = await globalLedgerEngine.reverseTransaction({
      transactionId: req.params.id,
      reason,
      idempotencyKey,
      metadata,
    });
    res.json({
      data: result,
      message: `Transaction ${req.params.id} reversed with compensating transaction ${result.reversalTransaction.id}`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/transactions/:id/commit', async (req: Request, res: Response) => {
  try {
    const committed = await globalLedgerEngine.commitTransaction(req.params.id);
    res.json({ data: committed, message: 'Pending transaction committed to POSTED status.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Financial Reports
apiRouter.get('/reports/trial-balance', (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string) || 'USD';
    const report = globalLedgerEngine.generateTrialBalance(currency);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/balance-sheet', (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string) || 'USD';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString();
    const report = globalLedgerEngine.generateBalanceSheet(asOfDate, currency);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/income-statement', (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string) || 'USD';
    const periodStart = req.query.periodStart as string;
    const periodEnd = req.query.periodEnd as string;
    const report = globalLedgerEngine.generateIncomeStatement(periodStart, periodEnd, currency);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/general-ledger', (req: Request, res: Response) => {
  try {
    const report = globalLedgerEngine.generateGeneralLedger();
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Reconciliation
apiRouter.post('/reconciliation/run', (req: Request, res: Response) => {
  try {
    const { accountId, statementEndingBalance, periodStart, periodEnd, feedItems } = req.body;
    if (!accountId || statementEndingBalance === undefined || !feedItems) {
      res.status(400).json({ error: 'accountId, statementEndingBalance, and feedItems are required.' });
      return;
    }
    const report = globalLedgerEngine.runReconciliation({
      accountId,
      statementEndingBalance: Math.round(statementEndingBalance),
      periodStart: periodStart || '2026-01-01',
      periodEnd: periodEnd || new Date().toISOString(),
      feedItems,
    });
    res.status(201).json({ data: report, message: 'Reconciliation session completed.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/reconciliation', (req: Request, res: Response) => {
  try {
    const recs = globalLedgerEngine.listReconciliations();
    res.json({ data: recs, count: recs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reconciliation/:id', (req: Request, res: Response) => {
  try {
    const rec = globalLedgerEngine.getReconciliation(req.params.id);
    if (!rec) {
      res.status(404).json({ error: `Reconciliation with ID '${req.params.id}' not found` });
      return;
    }
    res.json({ data: rec });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Audit & Cryptographic Chain Verification
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = globalLedgerEngine.getAuditLogs(limit);
    res.json({ data: logs, count: logs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/audit/verify-chain', (req: Request, res: Response) => {
  try {
    const verification = globalLedgerEngine.verifyLedgerIntegrity();
    res.json({ data: verification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Test Suite Runner
apiRouter.get('/tests/run', async (req: Request, res: Response) => {
  try {
    const testSummary = await globalLedgerEngine.runTestSuite();
    res.json({ data: testSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Reset / Seed
apiRouter.post('/reset', (req: Request, res: Response) => {
  try {
    globalLedgerEngine.resetLedger();
    res.json({ message: 'Ledger successfully reset and re-seeded with standard chart of accounts.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
