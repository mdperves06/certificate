"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Award, Calendar, User, BookOpen, Building } from "lucide-react";
import { verifyCertificate } from "@/lib/api";

export default function CertificateIdVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const certId = decodeURIComponent(resolvedParams.id);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    verifyCertificate(certId)
      .then(setResult)
      .catch(() => setResult({ is_valid: false, status: "not_found", certificate_id: certId }))
      .finally(() => setLoading(false));
  }, [certId]);

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          href="/verify"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Check Another Certificate
        </Link>
        <span className="text-xs text-indigo-400 font-mono font-semibold">
          {certId}
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Verifying certificate credentials...</p>
        </div>
      ) : result && result.is_valid ? (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verified Certificate</h1>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
              Official Credential Recorded on System
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <User className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Issued To</p>
                <p className="text-base font-bold text-white">{result.recipient_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Course / Program</p>
                <p className="text-sm font-semibold text-slate-200">{result.course_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Issue Date</p>
                  <p className="text-sm font-semibold text-slate-200">{result.issue_date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Building className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Issuing Body</p>
                  <p className="text-sm font-semibold text-slate-200">{result.organization || "Certificate Studio"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Authenticated via QR Verification Hash • Certificate Studio
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {result?.status === "revoked" ? "Certificate Revoked" : "Certificate Not Found"}
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            The requested certificate ID <code className="text-rose-300 font-mono font-semibold">{certId}</code> does not match any valid certificate in the registry.
          </p>
        </div>
      )}
    </div>
  );
}
