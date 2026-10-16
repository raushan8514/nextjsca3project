import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ShieldCheck, Search, Award, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface VerifyViewProps {
  initialCertId?: string;
}

export const VerifyView: React.FC<VerifyViewProps> = ({ initialCertId = '' }) => {
  const [certId, setCertId] = useState(initialCertId);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (idToVerify?: string) => {
    const targetId = idToVerify || certId;
    if (!targetId.trim()) return;

    setIsLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const res = await api.verifyPublicCertificate(targetId.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        message: err.message || 'Certificate ID was not found in the official registry.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      setCertId(initialCertId);
      handleVerify(initialCertId);
    }
  }, [initialCertId]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Official Credential Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Verify the authenticity of a student's CEFR achievement credential using their unique cryptographically logged Certificate ID.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="e.g. LP-2026-ENG-4912"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono uppercase"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={!certId.trim() || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? 'Verifying...' : 'Verify Credential'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 mt-3 text-center">
          Format: <span className="font-mono text-slate-600">LP-YYYY-LANG-XXXX</span> (Example: LP-2026-ENG-4912)
        </p>
      </div>

      {/* Verification Result Card */}
      {searched && (
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Querying cryptographic records from database...</p>
            </div>
          ) : result?.valid ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-8 shadow-md">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official Authentic Credential Verified
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium">
                    Confirmed against the authoritative LingoPro academic registry.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Recipient Name</p>
                  <p className="text-base font-bold text-slate-900">{result.recipientName}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Certificate ID</p>
                  <p className="text-base font-bold font-mono text-purple-700">{result.certId}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Course Title</p>
                  <p className="text-xs font-bold text-slate-900">{result.courseTitle}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Final Exam Score</p>
                  <p className="text-base font-bold text-slate-900 tabular-nums">{result.finalScore}%</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>Date Conferred: <strong>{new Date(result.issueDate).toLocaleDateString()}</strong></span>
                <span>Privacy-Safe: Zero user credentials exposed</span>
              </div>
            </div>
          ) : result?.isRevoked ? (
            <div className="bg-white rounded-2xl border-2 border-rose-500 p-8 shadow-md">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900">
                    Certificate Revoked by Administrator
                  </h3>
                  <p className="text-xs text-rose-700">
                    This academic credential is no longer valid or recognized.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1 mb-4">
                <p><strong>Credential ID:</strong> <span className="font-mono">{result.certId}</span></p>
                <p><strong>Recipient:</strong> {result.recipientName}</p>
                <p><strong>Revocation Reason:</strong> {result.revokedReason}</p>
                <p><strong>Revoked On:</strong> {new Date(result.revokedAt).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Credential Not Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active or historical record matches the requested ID. Please check the spelling or contact the credential holder.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
