"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Layers, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Edit3, 
  Play, 
  Sparkles,
  Award
} from "lucide-react";
import { fetchTemplates, deleteTemplate, duplicateTemplate, TemplateData } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Academic", "Workshop", "Achievement", "General"];

  const loadTemplates = () => {
    setLoading(true);
    fetchTemplates(category, search)
      .then(setTemplates)
      .catch(() => toast("Failed to load templates", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, [category]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      toast("Template deleted", "info");
      loadTemplates();
    } catch {
      toast("Failed to delete template", "error");
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateTemplate(id);
      toast("Template duplicated", "success");
      loadTemplates();
    } catch {
      toast("Failed to duplicate template", "error");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-400" /> Template Library
          </h1>
          <p className="text-sm text-slate-400">
            Pre-designed and custom certificate templates with reusable layouts and dynamic placeholders.
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Create Template
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                category === c
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadTemplates()}
            placeholder="Search templates..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
          <Layers className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-semibold text-base text-slate-200">No templates found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create your first custom certificate template.
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Design Certificate
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {t.category}
                  </span>
                  {t.is_starter && (
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Sparkles className="w-3 h-3" /> Starter
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {t.description || "Reusable high-DPI certificate template"}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="capitalize">{t.orientation} ({t.width}×{t.height})</span>
                  <span>{t.fields.length} dynamic fields</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(t.id!)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {!t.is_starter && (
                      <button
                        onClick={() => handleDelete(t.id!)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/editor?templateId=${t.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <Link
                      href={`/generate?templateId=${t.id}`}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1 shadow-md shadow-indigo-600/30"
                    >
                      <Play className="w-3.5 h-3.5" /> Use
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
