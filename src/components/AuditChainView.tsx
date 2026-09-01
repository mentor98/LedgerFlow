import React, { useState } from 'react';
import { AuditLog, Transaction } from '../types/ledger';
import { api } from '../utils/api';
import { formatDate, truncateHash } from '../utils/formatters';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Copy,
  Layers,
  Link as LinkIcon,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react';

interface AuditChainViewProps {
  transactions: Transaction[];
  auditLogs: AuditLog[];
  isChainValid: boolean;
  onRefresh: () => void;
}

export const AuditChainView: React.FC<AuditChainViewProps> = ({
  transactions,
  auditLogs,
  isChainValid,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'CHAIN' | 'AUDIT_LOGS'>('CHAIN');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      const result = await api.verifyChain();
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({ isValid: false, details: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Cryptographic Hash Chain</h2>
          <p className="text-xs text-slate-500">
            Immutable SHA-256 Merkle chain linking every journal transaction to prevent database tampering
          </p>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={isVerifying}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer font-mono disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Cryptographic Proofs'}</span>
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 shadow-xs ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <span className="font-bold block text-sm">
              {verificationResult.isValid ? 'Cryptographic Integrity Check: PASSED' : 'Integrity Check: FAILED'}
            </span>
            <p className="font-mono text-[11px] opacity-90">{verificationResult.details}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('CHAIN')}
          className={`px-3.5 py-1.5 rounded-md transition cursor-pointer ${
            activeTab === 'CHAIN'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
          }`}
        >
          Cryptographic Hash Chain ({transactions.length} Blocks)
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-3.5 py-1.5 rounded-md transition cursor-pointer ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
          }`}
        >
          Immutable Event Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Visual Cryptographic Hash Chain */}
      {activeTab === 'CHAIN' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono flex items-center justify-between shadow-xs">
            <span>
              Genesis Block Hash: <span className="text-slate-400">0000000000000000000000000000000000000000000000000000000000000000</span>
            </span>
            <span className="text-indigo-600 font-bold">SHA-256 Chained</span>
          </div>

          <div className="space-y-3">
            {[...transactions].reverse().map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      Block #{tx.sequenceNumber}
                    </span>
                    <span className="font-bold text-slate-900">{tx.reference}</span>
                    <span className="text-slate-500 font-sans">({tx.description})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{formatDate(tx.postedAt)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                  {/* Prev Hash Link */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Previous Block Hash (Link):</span>
                    <span className="text-slate-600 break-all">{tx.prevHash}</span>
                  </div>

                  {/* Current Block Hash */}
                  <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    <span className="text-indigo-700 block text-[10px] uppercase font-bold">Current Block SHA-256 Signature:</span>
                    <span className="text-indigo-900 break-all font-semibold">{tx.hash}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>{tx.items.length} splits | Total: ${(tx.totalAmount / 100).toFixed(2)}</span>
                  <span className="text-slate-400">ID: {tx.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{log.actor}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.targetType}:{log.targetId.slice(0, 12)}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
