import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Database,
  FileCode,
  Layers,
  Lock,
  Scale,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'ACCOUNTING' | 'ARCHITECTURE' | 'SCHEMA' | 'SECURITY' | 'IDEMPOTENCY'>('ACCOUNTING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">LedgerFlow Architecture & Developer Guide</h2>
          <p className="text-xs text-slate-500">
            Comprehensive reference manual for fintech engineers on double-entry mechanics, immutability, and API patterns
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-medium overflow-x-auto">
        {[
          { id: 'ACCOUNTING', label: '1. Accounting Model (GAAP)' },
          { id: 'ARCHITECTURE', label: '2. Ledger Engine Architecture' },
          { id: 'SCHEMA', label: '3. SQL Schema & Triggers' },
          { id: 'SECURITY', label: '4. Merkle Immutability & Audit' },
          { id: 'IDEMPOTENCY', label: '5. Idempotency Protection' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 1: Accounting Model */}
      {activeSection === 'ACCOUNTING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">The Double-Entry Accounting Invariant</h3>
              <p className="text-slate-500">Fundamental equation: Assets = Liabilities + Equity</p>
            </div>
          </div>

          <div className="space-y-4">
            <p>
              In traditional software, balances are often represented as a single mutable column on a user table (e.g. <code className="text-indigo-600 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">UPDATE users SET balance = balance + 10</code>). In fintech, this pattern is catastrophic: it creates race conditions, floating-point rounding errors, and leaves no auditable trail of where money entered or exited.
            </p>

            <p>
              LedgerFlow enforces the double-entry accounting model. Every financial event is a <strong className="text-slate-900 font-semibold">Transaction</strong> consisting of at least two balanced <strong className="text-slate-900 font-semibold">Journal Entry Splits (Legs)</strong>:
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center text-indigo-700 font-bold text-sm">
              ∑ Debits ≡ ∑ Credits (Variance = 0)
            </div>

            <h4 className="font-bold text-slate-900 pt-2 text-xs uppercase tracking-wider font-mono">
              Account Types and Normal Balances
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                <span className="text-emerald-800 font-bold block">ASSETS & EXPENSES (Debit-Normal)</span>
                <span className="text-slate-600 text-[11px] mt-1 block leading-normal">
                  • <strong className="text-slate-900">DEBIT</strong> increases the account balance.<br />
                  • <strong className="text-slate-900">CREDIT</strong> decreases the account balance.<br />
                  Formula: Balance = Total Debits - Total Credits
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200">
                <span className="text-indigo-800 font-bold block">LIABILITIES, EQUITY, REVENUE (Credit-Normal)</span>
                <span className="text-slate-600 text-[11px] mt-1 block leading-normal">
                  • <strong className="text-slate-900">CREDIT</strong> increases the account balance.<br />
                  • <strong className="text-slate-900">DEBIT</strong> decreases the account balance.<br />
                  Formula: Balance = Total Credits - Total Debits
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Architecture */}
      {activeSection === 'ARCHITECTURE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">LedgerFlow Engine Execution Pipeline</h3>
              <p className="text-slate-500">Atomic, thread-safe, and deterministic transaction lifecycle</p>
            </div>
          </div>

          <div className="space-y-4">
            <p>
              When a transaction is posted via <code className="text-indigo-600 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">POST /api/v1/transactions</code>, the engine performs the following deterministic pipeline:
            </p>

            <div className="space-y-2">
              {[
                { step: '1', title: 'Mutex Lock Acquisition', desc: 'Acquires a concurrency lock to serialize writes and prevent multi-thread balance race conditions.' },
                { step: '2', title: 'Idempotency Cache Check', desc: 'Checks the Idempotency-Key header in Redis/Memory. If previously processed, returns cached response immediately without state mutation.' },
                { step: '3', title: 'Account State Validation', desc: 'Validates that all referenced accounts exist, match transaction currency, and are not in FROZEN status.' },
                { step: '4', title: 'Zero-Variance Double-Entry Assertion', desc: 'Verifies in integer cents that ∑ Debits === ∑ Credits.' },
                { step: '5', title: 'Cryptographic SHA-256 Chaining', desc: 'Computes current block hash linking to the preceding transaction hash (prevHash).' },
                { step: '6', title: 'Atomic Balance Updates & Audit Log Entry', desc: 'Updates account balances and writes an immutable audit record.' },
                { step: '7', title: 'Mutex Lock Release', desc: 'Releases the lock for subsequent concurrent requests.' },
              ].map((s) => (
                <div key={s.step} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-3">
                  <span className="p-1 px-2 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200">{s.step}</span>
                  <div>
                    <span className="font-bold text-slate-900">{s.title}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Schema */}
      {activeSection === 'SCHEMA' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">PostgreSQL Immutability Triggers</h3>
              <p className="text-slate-500">Database-enforced append-only protections</p>
            </div>
          </div>

          <div className="space-y-4">
            <p>
              In production PostgreSQL environments, application-level checks are complemented by database triggers that strictly block <code className="text-rose-600 font-mono font-bold bg-rose-50 px-1 py-0.5 rounded">UPDATE</code> and <code className="text-rose-600 font-mono font-bold bg-rose-50 px-1 py-0.5 rounded">DELETE</code> statements on posted ledger records:
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              <pre>{`-- PostgreSQL Immutability Trigger
CREATE OR REPLACE FUNCTION enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: Ledger transactions and journal items are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_immutable
BEFORE UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_immutability();`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Security */}
      {activeSection === 'SECURITY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">SHA-256 Merkle Chaining & Audit Compliance</h3>
              <p className="text-slate-500">Cryptographically tamper-evident ledger trail</p>
            </div>
          </div>

          <div className="space-y-4">
            <p>
              Every transaction generates a SHA-256 digital hash of its contents combined with the hash of the preceding block:
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-indigo-950 font-semibold">
              Block_Hash_N = SHA256(Block_Hash_N-1 + Tx_ID + Reference + TotalAmount + Items_JSON + Timestamp)
            </div>

            <p>
              If any actor attempts to modify an amount, date, or split leg in a historical record, all subsequent hashes in the chain break immediately. The <code className="text-indigo-600 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">/api/v1/audit/verify-chain</code> endpoint continuously verifies that the chain has zero discontinuities.
            </p>
          </div>
        </div>
      )}

      {/* Section 5: Idempotency */}
      {activeSection === 'IDEMPOTENCY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Idempotency Protection & Replay Prevention</h3>
              <p className="text-slate-500">Preventing double-charges and network duplicate postings</p>
            </div>
          </div>

          <div className="space-y-4">
            <p>
              Financial APIs must be idempotent to prevent duplicate charges or duplicate entries when network timeouts occur. Clients include an <code className="text-amber-700 font-mono font-bold bg-amber-50 px-1 py-0.5 rounded">Idempotency-Key: &lt;uuid&gt;</code> header on transaction requests.
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
              {`// Client sends request with unique idempotency key
POST /api/v1/transactions
Header: Idempotency-Key: pay_req_9812491284

// If server receives a duplicate request with the same key:
// 1. Transaction is NOT processed a second time
// 2. Account balances remain unchanged
// 3. Cached original HTTP 201 response is returned with 'Idempotent-Replay: true'`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
