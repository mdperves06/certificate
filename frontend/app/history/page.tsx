"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  History, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  FileArchive
} from "lucide-react";
import { fetchBatchHistory, BatchItem } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function HistoryPage() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    setLoading(true);
    fetchBatchHistory()
      .then(setBatches)
      .catch(() => toast("Failed to load generation history", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-400" /> Generation History
          </h1>
          <p className="text-sm text-slate-400">
            View past certificate batches, inspect generation reports, and download ZIP archives.
          </p>
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
          <History className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-semibold text-base text-slate-200">No generation batches yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you generate a batch of certificates, it will appear here with instant download access and record status.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <Play className="w-4 h-4" /> Start First Generation
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">Batch Name</th>
                  <th className="py-3.5 px-4 font-semibold">Recipients</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Format</th>
                  <th className="py-3.5 px-4 font-semibold">Date Created</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {b.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="text-emerald-400 font-semibold">{b.success_count}</span>
                      <span className="text-slate-500"> / {b.total_count} certs</span>
                      {b.failed_count > 0 && (
                        <span className="ml-1.5 text-rose-400 text-[10px]">({b.failed_count} failed)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : b.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-slate-400 font-mono text-[11px]">
                      {b.output_format}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.zip_download_url ? (
                        <a
                          href={b.zip_download_url}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download ZIP
                        </a>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
