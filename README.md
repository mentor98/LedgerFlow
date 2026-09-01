# LedgerFlow — Open-Source Financial Ledger Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Double-Entry](https://img.shields.io/badge/Accounting-Double--Entry%20GAAP-green.svg)](#accounting-model)
[![Data Integrity](https://img.shields.io/badge/Integrity-SHA--256%20Merkle%20Chain-purple.svg)](#cryptographic-audit-trail)
[![Precision](https://img.shields.io/badge/Math-Integer%20Minor%20Units%20(Cents)-orange.svg)](#financial-precision)

**LedgerFlow** is a modern, developer-first, open-source double-entry accounting and financial transaction ledger engine. Built specifically for fintech engineers, payment platforms, neo-banks, marketplaces, and SaaS platforms who need an immutable, auditable, and mathematically correct financial core.

---

## 📑 Table of Contents

1. [The Problem: Why Custom Ledgers Fail](#the-problem)
2. [The Double-Entry Accounting Model](#the-double-entry-accounting-model)
3. [System Architecture](#system-architecture)
4. [Financial Precision & Cent-Based Arithmetic](#financial-precision)
5. [Cryptographic Tamper-Evident Hash Chaining](#cryptographic-audit-trail)
6. [Idempotency & Concurrency Control](#idempotency--concurrency)
7. [Transaction Lifecycle & Atomic Reversals](#transaction-lifecycle--reversals)
8. [Automated Bank & Payment Reconciliation](#reconciliation-engine)
9. [Financial Statements & Reporting](#financial-reporting)
10. [REST API Reference](#rest-api-reference)
11. [PostgreSQL Database Schema](#database-schema)
12. [Testing Suite & Edge Cases](#testing-suite)
13. [Setup & Local Development](#setup--development)
14. [Production Deployment & Hardening](#production-deployment)
15. [Contributing & License](#license)

---

## 🚨 The Problem

Fintech developers repeatedly reinvent financial ledgers with standard relational tables (e.g. `users.balance = balance + 50`), leading to catastrophic edge cases:
- **Floating-Point Drift**: Using `FLOAT` or `DOUBLE` generates subtle rounding discrepancies ($0.10 + 0.20 = 0.30000000000000004$).
- **Single-Entry Mutation**: Mutating a single balance column destroys the audit trail. When balances don't match, forensic reconstruction is impossible.
- **Race Conditions**: Parallel API requests cause double-spend or lost updates without serialization locks.
- **Missing Idempotency**: Network retries cause double charges or duplicate journal entries.
- **Mutable Histories**: Modifying or deleting historic transactions violates GAAP, IFRS, and SOX compliance rules.

LedgerFlow solves this by treating every financial movement as an **immutable, balanced double-entry transaction** backed by cryptographic signatures.

---

## ⚖️ The Double-Entry Accounting Model

Every financial transaction in LedgerFlow consists of at least two balanced splits (legs) that strictly satisfy the Fundamental Accounting Equation:

$$\sum \text{Debits} = \sum \text{Credits}$$

### The Expanded Accounting Equation

$$\text{Assets} + \text{Expenses} = \text{Liabilities} + \text{Equity} + \text{Revenue}$$

### Normal Balances Matrix

| Account Type | Category | Normal Balance | Increases With | Decreases With | Financial Statement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ASSET** | Balance Sheet | **DEBIT** | Debit (+) | Credit (-) | Balance Sheet |
| **LIABILITY** | Balance Sheet | **CREDIT** | Credit (+) | Debit (-) | Balance Sheet |
| **EQUITY** | Balance Sheet | **CREDIT** | Credit (+) | Debit (-) | Balance Sheet |
| **REVENUE** | Income Statement | **CREDIT** | Credit (+) | Debit (-) | Income Statement (P&L) |
| **EXPENSE** | Income Statement | **DEBIT** | Debit (+) | Credit (-) | Income Statement (P&L) |

**Net Balance Calculation Formula:**
- For `DEBIT` normal accounts: $\text{Net Balance} = \text{Posted Debits} - \text{Posted Credits}$
- For `CREDIT` normal accounts: $\text{Net Balance} = \text{Posted Credits} - \text{Posted Debits}$

---

## 🏗️ System Architecture

```
                                  ┌──────────────────────────┐
                                  │      REST API Client     │
                                  │ (Fintech App / Webhooks) │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │    Idempotency Guard     │  <-- Cached Responses / Collision Check
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │   Atomic Concurrency     │  <-- Row Locks / Serialization Queue
                                  │        Lock Queue        │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                    ┌──────────────────────────────────────────────────────┐
                    │            LedgerFlow Core Accounting Engine         │
                    ├──────────────────────────────────────────────────────┤
                    │  1. Check Account States (Active vs Frozen vs Closed)│
                    │  2. Verify Legs (Min 2 splits, >0 minor units)       │
                    │  3. Validate sum(Debits) == sum(Credits)             │
                    │  4. Compute SHA-256 Hash Chain: H(H_prev + Payload)  │
                    │  5. Append-only Transaction & Legs Storage           │
                    │  6. Update Real-time Balance Snapshot Cache          │
                    │  7. Write Tamper-Evident Immutable Audit Log         │
                    └───────────────────────────┬──────────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │   Financial Reporting   │    │  Reconciliation Engine  │    │  Cryptographic Audit    │
    │ • Trial Balance         │    │ • Bank Statement Match  │    │ • SHA-256 Merkle Chain  │
    │ • Balance Sheet         │    │ • Gateway Feed Compare  │    │ • Block Verification    │
    │ • Income Statement      │    │ • Discrepancy Flagging  │    │ • Full Actor Event Logs │
    │ • General Ledger        │    │ • Resolution Actions    │    │                         │
    └─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

---

## 🔢 Financial Precision

All monetary quantities in LedgerFlow are stored as **integer minor units** (e.g., cents in USD/EUR, satoshis in BTC, yen in JPY):
- `$100.00 USD` is represented as `10000`.
- `$0.33 USD` is represented as `33`.
- Negative numbers in legs are strictly forbidden; direction is explicitly represented via `DEBIT` or `CREDIT`.

This guarantees **zero floating-point accumulation errors** across millions of transactions.

---

## 🔗 Cryptographic Audit Trail

Every journal transaction is linked into a cryptographically sealed hash chain:

$$H_i = \text{SHA-256}\left(\text{JSON}\left(\text{seq}_i, H_{i-1}, \text{txId}_i, \text{totalAmount}_i, \text{currency}_i, \text{legs}_i\right)\right)$$

The `verifyLedgerIntegrity()` algorithm scans the entire historical ledger, recomputing all SHA-256 block signatures and confirming the continuity of `prevHash -> hash`. Any direct database tampering or modification is immediately flagged.

---

## 🛡️ Idempotency & Concurrency

When clients post transactions with an `Idempotency-Key` HTTP header:
1. **First Request**: Evaluates the transaction, posts the entry, and caches the response.
2. **Identical Replay**: Returns the exact cached `201 Created` payload instantly without duplicate ledger entries.
3. **Payload Conflict**: If the same key is reused with modified amounts or accounts, returns `409 Conflict`.

---

## 🔄 Transaction Lifecycle & Reversals

```
[ PENDING ] ──────(commit)──────► [ POSTED ] ──────(reverse)──────► [ REVERSED ]
     │                                                                     │
     └────────────(reject)──────► [ REJECTED ]                             ▼
                                                              [ Compensating Journal ]
                                                              (Swaps Debits & Credits)
```

In accordance with accounting standards, transactions are **never deleted**. Reversing a transaction creates a new compensating journal entry with swapped legs, referencing the original ID.

---

## 📊 REST API Reference

### 1. Accounts
- `GET /api/v1/accounts` — List accounts with real-time net balances.
- `POST /api/v1/accounts` — Create an account.
- `GET /api/v1/accounts/:id` — Retrieve account details.
- `PATCH /api/v1/accounts/:id` — Update status (`ACTIVE`, `FROZEN`, `CLOSED`).
- `GET /api/v1/accounts/:id/statement` — Chronological statement with running balance.

### 2. Transactions
- `GET /api/v1/transactions` — List journal entries (supports filtering).
- `POST /api/v1/transactions` — Post double-entry transaction (`Idempotency-Key` supported).
- `GET /api/v1/transactions/:id` — Get transaction details & cryptographic proof.
- `POST /api/v1/transactions/:id/reverse` — Atomically reverse a transaction.
- `POST /api/v1/transactions/:id/commit` — Commit a pending authorization hold.

### 3. Financial Statements
- `GET /api/v1/reports/trial-balance` — Trial balance with zero-variance verification.
- `GET /api/v1/reports/balance-sheet` — Balance sheet ($Assets = Liabilities + Equity$).
- `GET /api/v1/reports/income-statement` — Profit & Loss statement.
- `GET /api/v1/reports/general-ledger` — Comprehensive general ledger.

### 4. Reconciliation & Audit
- `POST /api/v1/reconciliation/run` — Run matching against external feeds.
- `GET /api/v1/audit/logs` — List immutable audit trail logs.
- `GET /api/v1/audit/verify-chain` — Verify cryptographic hash integrity.
- `GET /api/v1/tests/run` — Run the automated test suite.

---

## 🧪 Testing Suite & Edge Cases

LedgerFlow includes 11 automated test suites:
1. **Fundamental Double-Entry Balancing** ($\sum \text{Debits} == \sum \text{Credits}$)
2. **Imbalance Rejection Constraint** (Strict 400 Bad Request on unbalanced entries)
3. **Normal Balance Sign & Arithmetic** (Asset/Expense debit-normal vs Liability/Equity/Revenue credit-normal)
4. **Idempotency Key Protection** (Replay cache & conflict detection)
5. **Atomic Transaction Reversals** (Compensating entry, double-reversal prevention)
6. **Cryptographic SHA-256 Hash Chain Integrity** (Merkle chain validation)
7. **Frozen & Closed Account Protection** (Guards against posting to locked accounts)
8. **Two-Phase Commit** (Hold & commit lifecycle)
9. **Automated Bank & Payment Reconciliation** (Matching & discrepancy checks)
10. **Financial Arithmetic Precision** (Integer cent math without floating-point drift)
11. **High-Concurrency Atomic Transaction Lock** (Parallel execution safety)

---

## 🚀 Setup & Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/ledgerflow.git
cd ledgerflow

# Install dependencies
npm install

# Start the full-stack engine and interactive console
npm run dev

# Run compilation and type verification
npm run build
```

---

## 📜 License

MIT License — Copyright (c) 2026 LedgerFlow Contributors. Free for commercial and open-source use.
