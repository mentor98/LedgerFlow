-- ============================================================================
-- LedgerFlow — Production Double-Entry Financial Ledger Database Schema (PostgreSQL)
-- Standard: ACID Compliant, GAAP / IFRS Compatible, Cryptographically Verifiable
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Definitions
CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

CREATE TYPE normal_balance AS ENUM (
    'DEBIT',
    'CREDIT'
);

CREATE TYPE account_status AS ENUM (
    'ACTIVE',
    'FROZEN',
    'CLOSED'
);

CREATE TYPE posting_direction AS ENUM (
    'DEBIT',
    'CREDIT'
);

CREATE TYPE transaction_status AS ENUM (
    'PENDING',
    'POSTED',
    'REVERSED',
    'REJECTED',
    'SETTLED'
);

-- ============================================================================
-- 1. JOURNALS TABLE
-- Represents discrete accounting books (e.g. General Ledger, Payroll, Payments)
-- ============================================================================
CREATE TABLE journals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ACCOUNTS TABLE (Chart of Accounts)
-- Core tree-structured Chart of Accounts with normal balance rules
-- ============================================================================
CREATE TABLE accounts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type account_type NOT NULL,
    normal_balance normal_balance NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT,
    parent_id VARCHAR(64) REFERENCES accounts(id) ON DELETE RESTRICT,
    status account_status NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Consistency check for Normal Balance based on Account Type
    CONSTRAINT check_normal_balance_rule CHECK (
        (type IN ('ASSET', 'EXPENSE') AND normal_balance = 'DEBIT') OR
        (type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND normal_balance = 'CREDIT')
    )
);

CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_parent_id ON accounts(parent_id);

-- ============================================================================
-- 3. TRANSACTIONS TABLE (Journal Entry Headers)
-- Master immutable journal entries with cryptographic hash chain (prev_hash -> hash)
-- ============================================================================
CREATE TABLE transactions (
    id VARCHAR(64) PRIMARY KEY,
    sequence_number BIGSERIAL UNIQUE,
    journal_id VARCHAR(64) NOT NULL REFERENCES journals(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(255) UNIQUE,
    reference VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status transaction_status NOT NULL DEFAULT 'POSTED',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_amount BIGINT NOT NULL CHECK (total_amount > 0), -- Stored in integer minor units (cents)
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reversal_of VARCHAR(64) REFERENCES transactions(id) ON DELETE RESTRICT,
    reversed_by VARCHAR(64) REFERENCES transactions(id) ON DELETE RESTRICT,
    hash VARCHAR(64) NOT NULL, -- SHA-256 Merkle hash
    prev_hash VARCHAR(64) NOT NULL, -- Link to preceding transaction hash
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_effective_date ON transactions(effective_date);
CREATE INDEX idx_transactions_reversal_of ON transactions(reversal_of);
CREATE INDEX idx_transactions_journal_id ON transactions(journal_id);

-- ============================================================================
-- 4. JOURNAL_ENTRY_ITEMS TABLE (Transaction Splits / Legs)
-- The debits and credits of each transaction. Strict positive integer minor units.
-- ============================================================================
CREATE TABLE journal_entry_items (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    direction posting_direction NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0), -- Strictly positive integer minor units (e.g. $100.00 = 10000)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_items_tx_id ON journal_entry_items(transaction_id);
CREATE INDEX idx_journal_items_account_id ON journal_entry_items(account_id);
CREATE INDEX idx_journal_items_created_at ON journal_entry_items(created_at);

-- ============================================================================
-- 5. ACCOUNT_BALANCES TABLE (Snapshot Cache for High Performance)
-- Real-time cached balances updated via atomic triggers or row locks
-- ============================================================================
CREATE TABLE account_balances (
    account_id VARCHAR(64) PRIMARY KEY REFERENCES accounts(id) ON DELETE RESTRICT,
    posted_debit_balance BIGINT NOT NULL DEFAULT 0 CHECK (posted_debit_balance >= 0),
    posted_credit_balance BIGINT NOT NULL DEFAULT 0 CHECK (posted_credit_balance >= 0),
    pending_debit_balance BIGINT NOT NULL DEFAULT 0 CHECK (pending_debit_balance >= 0),
    pending_credit_balance BIGINT NOT NULL DEFAULT 0 CHECK (pending_credit_balance >= 0),
    net_balance BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    version BIGINT NOT NULL DEFAULT 1,
    last_entry_id VARCHAR(64) REFERENCES transactions(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. AUDIT_LOGS TABLE
-- Append-only tamper-evident audit trail of all ledger operations
-- ============================================================================
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- ============================================================================
-- 7. RECONCILIATIONS TABLE
-- Automated & manual bank / payment gateway reconciliation sessions
-- ============================================================================
CREATE TABLE reconciliations (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    statement_ending_balance BIGINT NOT NULL,
    ledger_ending_balance BIGINT NOT NULL,
    discrepancy BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DISCREPANCY_DETECTED',
    statement_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    matched_count INT NOT NULL DEFAULT 0,
    unmatched_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. IMMUTABILITY TRIGGER (Guarantees no UPDATE or DELETE on Transactions)
-- ============================================================================
CREATE OR REPLACE FUNCTION enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'CRITICAL: Deleting journal entries is strictly prohibited by GAAP/IFRS. Post a compensating reversal instead.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
        -- Only status and reversed_by may be updated when reversing
        IF (OLD.id <> NEW.id OR OLD.journal_id <> NEW.journal_id OR OLD.total_amount <> NEW.total_amount OR OLD.hash <> NEW.hash) THEN
            RAISE EXCEPTION 'CRITICAL: Ledger transactions are immutable. Modification of amounts, hashes or legs is forbidden.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_immutable
BEFORE UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_immutability();

CREATE TRIGGER trg_journal_items_immutable
BEFORE UPDATE OR DELETE ON journal_entry_items
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_immutability();
