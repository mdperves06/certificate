"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  FileText, 
  UploadCloud, 
  ClipboardCheck, 
  Layers, 
  Award, 
  Users, 
  Download, 
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight
} from "lucide-react";
import { fetchTemplates, fetchBatchHistory, TemplateData, BatchItem } from "@/lib/api";

export default function Dashboard() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tList, bList] = await Promise.allSettled([
          fetchTemplates(),
          fetchBatchHistory()
        ]);
        if (tList.status === "fulfilled") setTemplates(tList.value);
        if (bList.status === "fulfilled") setBatches(bList.value);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCertificates = batches.reduce((acc, b) => acc + (b.success_count || 0), 0);
  const totalRecipients = batches.reduce((acc, b) => acc + (b.total_count || 0), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/40 border border-indigo-800/40 p-8 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Certificate Studio SaaS Suite
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Design once. Generate hundreds in seconds.
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Professional certificate creation with smart auto-fitting text, native Bangla/Unicode font support, deterministic high-DPI rendering, and 1-click bulk ZIP export.
          </p>
          <div className="flex flex-wrap gap-3 pt-3">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" /> Create from Scratch
            </Link>
            <Link
              href="/generate?mode=existing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" /> Upload Existing Certificate
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
      </div>

      {/* Quick Launch Cards (Mode A & Mode B) */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          Quick Launch Workflows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Mode A Create from Scratch */}
          <Link
            href="/editor"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all shadow-md hover:shadow-indigo-500/10"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-100 group-hover:text-indigo-300 transition-colors">
                Mode A: Design Canvas
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose orientation, add shapes, borders, logos, and insert dynamic fields like {"{{recipient_name}}"} and QR verification codes.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-medium text-indigo-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              Launch Studio Editor <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 2: Mode B Upload Existing Certificate Demo */}
          <Link
            href="/generate?mode=existing"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all shadow-md hover:shadow-emerald-500/10"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-100 group-hover:text-emerald-300 transition-colors">
                Mode B: Use Existing Certificate
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your existing certificate image or PDF. Mask the old recipient name, place dynamic text overlays, and batch personalize.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-medium text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              Upload Demo Artwork <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 3: Quick Name-Only Mode */}
          <Link
            href="/generate?mode=paste"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all shadow-md hover:shadow-amber-500/10"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-100 group-hover:text-amber-300 transition-colors">
                Quick Paste Names
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                No spreadsheet needed. Simply paste a list of recipient names from clipboard and generate batch certificates in seconds.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-medium text-amber-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              Paste & Generate <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs uppercase font-semibold tracking-wider">Templates</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">{templates.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase font-semibold tracking-wider">Generated</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">{totalCertificates}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-xs uppercase font-semibold tracking-wider">Total Recipients</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">{totalRecipients}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase font-semibold tracking-wider">Batches Run</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">{batches.length}</p>
        </div>
      </div>

      {/* Main Content Two Columns: Recent Templates & Recent Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (2 cols): Reusable Templates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Certificate Templates
            </h2>
            <Link
              href="/templates"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {templates.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-slate-400 text-sm">No templates found in library yet.</p>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                <Plus className="w-4 h-4" /> Create First Template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {t.category}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">{t.orientation}</span>
                    </div>
                    <h3 className="font-semibold text-base text-slate-100">{t.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.description || "Reusable certificate layout"}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500">{t.fields.length} dynamic fields</span>
                    <div className="flex gap-2">
                      <Link
                        href={`/editor?templateId=${t.id}`}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/generate?templateId=${t.id}`}
                        className="px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Use
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (1 col): Recent Batches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Recent Batches
            </h2>
            <Link
              href="/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-slate-400 text-sm">No batches generated yet.</p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                <Play className="w-3.5 h-3.5" /> Run First Batch
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-slate-200 truncate">{b.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{b.success_count}/{b.total_count} certs</span>
                      <span>•</span>
                      <span className="capitalize">{b.output_format}</span>
                    </div>
                  </div>
                  <div>
                    {b.zip_download_url ? (
                      <a
                        href={b.zip_download_url}
                        download
                        className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 text-xs font-medium"
                        title="Download ZIP"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-amber-400 capitalize px-2 py-0.5 rounded bg-amber-500/10">
                        {b.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
