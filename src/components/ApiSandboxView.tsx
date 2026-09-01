import React, { useState } from 'react';
import { CheckCircle2, Code2, Copy, Play, Send, Terminal } from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  category: string;
  summary: string;
  headers?: Record<string, string>;
  defaultBody?: any;
}

export const ApiSandboxView: React.FC = () => {
  const endpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/api/v1/accounts',
      category: 'Accounts',
      summary: 'List all Chart of Accounts with real-time net balances',
    },
    {
      method: 'POST',
      path: '/api/v1/accounts',
      category: 'Accounts',
      summary: 'Create a new ledger account',
      defaultBody: {
        code: '1060-TREASURY',
        name: 'Yield Treasury Reserves',
        type: 'ASSET',
        currency: 'USD',
        description: 'Commercial money market treasury deposits',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/transactions',
      category: 'Transactions',
      summary: 'List double-entry transactions with filter options',
    },
    {
      method: 'POST',
      path: '/api/v1/transactions',
      category: 'Transactions',
      summary: 'Post an atomic double-entry transaction with Idempotency',
      headers: {
        'Idempotency-Key': `idem-${Date.now()}`,
      },
      defaultBody: {
        reference: `INV-API-${Math.floor(1000 + Math.random() * 9000)}`,
        description: 'Customer Subscription Payment via REST API',
        currency: 'USD',
        status: 'POSTED',
        items: [
          {
            accountId: 'acc_1010',
            direction: 'DEBIT',
            amount: 25000, // $250.00
            description: 'Cash received',
          },
          {
            accountId: 'acc_4010',
            direction: 'CREDIT',
            amount: 25000,
            description: 'Subscription revenue',
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/api/v1/reports/trial-balance',
      category: 'Reports',
      summary: 'Generate real-time Trial Balance statement',
    },
    {
      method: 'GET',
      path: '/api/v1/reports/balance-sheet',
      category: 'Reports',
      summary: 'Generate Balance Sheet (Assets = Liabilities + Equity)',
    },
    {
      method: 'GET',
      path: '/api/v1/reports/income-statement',
      category: 'Reports',
      summary: 'Generate Profit & Loss (Income Statement)',
    },
    {
      method: 'GET',
      path: '/api/v1/audit/verify-chain',
      category: 'Security & Audit',
      summary: 'Cryptographically verify all SHA-256 Merkle block hashes',
    },
    {
      method: 'GET',
      path: '/api/v1/tests/run',
      category: 'Testing',
      summary: 'Execute all 11 automated test suites against ledger engine',
    },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(endpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(
    endpoints[0].defaultBody ? JSON.stringify(endpoints[0].defaultBody, null, 2) : ''
  );
  const [idempotencyHeader, setIdempotencyHeader] = useState<string>(
    endpoints[0].headers?.['Idempotency-Key'] || ''
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setIdempotencyHeader(ep.headers?.['Idempotency-Key'] || (ep.method === 'POST' ? `idem-${Date.now()}` : ''));
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyHeader) {
        headers['Idempotency-Key'] = idempotencyHeader;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const duration = Math.round(performance.now() - start);
      setResponseDuration(duration);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} http://localhost:3000${selectedEndpoint.path} \\\n  -H "Content-Type: application/json"`;
    if (idempotencyHeader) {
      curl += ` \\\n  -H "Idempotency-Key: ${idempotencyHeader}"`;
    }
    if (selectedEndpoint.method !== 'GET' && requestBody) {
      curl += ` \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
    }
    return curl;
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">REST API Developer Sandbox</h2>
          <p className="text-xs text-slate-500">
            Interactive playground and OpenAPI specification runner for LedgerFlow endpoints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoints Catalog */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            API Endpoints Catalog
          </h3>

          <div className="space-y-1.5">
            {endpoints.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-2.5 rounded-lg transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border border-indigo-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ep.method === 'GET'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ep.method === 'POST'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{ep.path}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{ep.summary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Request & Response Inspector */}
        <div className="lg:col-span-8 space-y-4">
          {/* Request Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 font-mono text-sm">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedEndpoint.method === 'GET'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="text-slate-900 font-bold">{selectedEndpoint.path}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={copyCurl}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-mono inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedCurl ? 'Copied cURL!' : 'Copy cURL'}</span>
                </button>

                <button
                  onClick={handleExecuteRequest}
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs font-mono transition cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </div>

            {/* Idempotency Key Input if POST */}
            {selectedEndpoint.method === 'POST' && (
              <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-xs">
                <span className="text-slate-600 font-semibold font-mono">Header [Idempotency-Key]:</span>
                <input
                  type="text"
                  value={idempotencyHeader}
                  onChange={(e) => setIdempotencyHeader(e.target.value)}
                  className="flex-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Request Body JSON editor if POST/PATCH */}
            {selectedEndpoint.method !== 'GET' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase font-bold tracking-wider mb-1">
                  Request Payload (JSON Body)
                </label>
                <textarea
                  rows={8}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Response Inspector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                Response Payload
              </span>
              {responseStatus && (
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      responseStatus < 300
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                  <span className="text-slate-500">{responseDuration}ms</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto min-h-[160px] text-slate-200">
              {isLoading ? (
                <div className="text-slate-400 py-6 text-center">Executing request against LedgerFlow API...</div>
              ) : responseData ? (
                <pre className="text-emerald-400">{JSON.stringify(responseData, null, 2)}</pre>
              ) : (
                <div className="text-slate-400 py-6 text-center">
                  Click "Send Request" to execute against the live LedgerFlow API.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
