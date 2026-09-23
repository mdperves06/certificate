"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, QrCode, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { verifyCertificate } from "@/lib/api";

export default function VerificationSearchPage() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    try {
      const res = await verifyCertificate(certId.trim());
      setResult(res);
    } catch {
      setResult({ is_valid: false, status: "not_found", certificate_id: certId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-3 pt-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-lg shadow-indigo-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Certificate Authenticity Verification
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Verify the authenticity and integrity of certificates issued through Certificate Studio.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleVerify} className="max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="Enter Certificate ID (e.g. CERT-2026-0001)"
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !certId.trim()}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-40"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {/* Verification Result Card */}
      {result && (
        <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl animate-in zoom-in-95 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {result.is_valid ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-base text-white">
                  {result.is_valid ? "Official Valid Certificate" : result.status === "revoked" ? "Certificate Revoked" : "Certificate Not Found"}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {result.certificate_id}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                result.is_valid
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {result.status}
            </span>
          </div>

          {result.is_valid && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs">Recipient</span>
                <span className="font-bold text-slate-100">{result.recipient_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs">Program / Course</span>
                <span className="font-medium text-slate-200">{result.course_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs">Issue Date</span>
                <span className="text-slate-300">{result.issue_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs">Issuer</span>
                <span className="text-slate-300">{result.organization || "Certificate Studio"}</span>
              </div>
            </div>
          )}

          {!result.is_valid && (
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              The certificate ID entered could not be matched with any active issued credential. Please ensure the code is typed correctly without extra spaces.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
