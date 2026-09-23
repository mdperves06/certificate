"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  Upload, 
  Clipboard, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  Play, 
  Eye, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  RefreshCw,
  FileCheck
} from "lucide-react";
import { 
  fetchTemplates, 
  uploadRecipientFile, 
  pasteRecipientData, 
  validateRecipientRows, 
  generatePreviews, 
  startBatchGeneration, 
  fetchBatchStatus, 
  TemplateData, 
  BatchItem 
} from "@/lib/api";
import { useToast } from "@/components/Toast";

function GenerateWizardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const initialTemplateId = searchParams.get("templateId") ? parseInt(searchParams.get("templateId")!) : null;
  const initialMode = searchParams.get("mode") || "standard";

  // Wizard Step: 1 = Template, 2 = Data, 3 = Mapping & Validation, 4 = Preview & Generate
  const [step, setStep] = useState(initialTemplateId ? 2 : 1);

  // Step 1: Templates
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialTemplateId);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Step 2: Data Import
  const [importMode, setImportMode] = useState<"file" | "paste">(initialMode === "paste" ? "paste" : "file");
  const [rawPastedText, setRawPastedText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [parsingData, setParsingData] = useState(false);

  // Step 3: Column Mapping & Validation
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [validationReport, setValidationReport] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // Step 4: Preview & Generation
  const [previewSamples, setPreviewSamples] = useState<any[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [batchName, setBatchName] = useState("Graduation Batch");
  const [outputFormat, setOutputFormat] = useState<"both" | "pdf" | "png">("both");
  const [idPrefix, setIdPrefix] = useState("CERT-2026-");

  // Progress Tracking
  const [generating, setGenerating] = useState(false);
  const [activeBatch, setActiveBatch] = useState<BatchItem | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then((data) => {
        setTemplates(data);
        if (!selectedTemplateId && data.length > 0) {
          setSelectedTemplateId(data[0].id!);
        }
      })
      .finally(() => setLoadingTemplates(false));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingData(true);
    try {
      const res = await uploadRecipientFile(file);
      setHeaders(res.headers);
      setRows(res.rows);
      setTotalRows(res.total_rows);
      setFieldMappings(res.detected_mappings);
      toast(`Successfully imported ${res.total_rows} recipients`, "success");
      setStep(3);
    } catch (err: any) {
      toast(err.message || "Failed to process recipient file", "error");
    } finally {
      setParsingData(false);
    }
  };

  // Handle Paste
  const handlePasteSubmit = async () => {
    if (!rawPastedText.trim()) {
      toast("Please paste recipient names or data first", "warning");
      return;
    }
    setParsingData(true);
    try {
      const res = await pasteRecipientData(rawPastedText);
      setHeaders(res.headers);
      setRows(res.rows);
      setTotalRows(res.total_rows);
      setFieldMappings(res.detected_mappings);
      toast(`Detected ${res.total_rows} recipient records`, "success");
      setStep(3);
    } catch (err: any) {
      toast(err.message || "Failed to parse text", "error");
    } finally {
      setParsingData(false);
    }
  };

  // Run Data Validation
  const handleValidateAndProceed = async () => {
    if (!selectedTemplateId) return;
    setValidating(true);
    try {
      const rep = await validateRecipientRows(selectedTemplateId, fieldMappings, rows);
      setValidationReport(rep);
      if (rep.is_valid || rep.errors_count === 0) {
        toast("Data validation passed!", "success");
        // Prepare preview for Step 4
        loadPreviews();
        setStep(4);
      } else {
        toast(`Validation found ${rep.errors_count} critical issues`, "error");
      }
    } catch (err: any) {
      toast(err.message || "Validation failed", "error");
    } finally {
      setValidating(false);
    }
  };

  // Load sample previews
  const loadPreviews = async () => {
    if (!selectedTemplateId) return;
    setLoadingPreviews(true);
    try {
      // Map first 3 rows
      const sampleMapped = rows.slice(0, 3).map((r, i) => {
        const item: Record<string, any> = {};
        for (const [tplField, col] of Object.entries(fieldMappings)) {
          item[tplField] = r[col];
        }
        item["certificate_id"] = `${idPrefix}${String(i + 1).padStart(4, "0")}`;
        return item;
      });

      const res = await generatePreviews(selectedTemplateId, sampleMapped);
      setPreviewSamples(res.previews);
      setCurrentPreviewIndex(0);
    } catch (err: any) {
      toast(err.message || "Could not generate preview", "error");
    } finally {
      setLoadingPreviews(false);
    }
  };

  // Start Batch Generation
  const handleStartGeneration = async () => {
    if (!selectedTemplateId) return;
    setGenerating(true);

    // Map all rows according to user's configured mappings
    const mappedRows = rows.map((r) => {
      const item: Record<string, any> = {};
      for (const [tplField, col] of Object.entries(fieldMappings)) {
        item[tplField] = r[col];
      }
      return item;
    });

    try {
      const batch = await startBatchGeneration({
        name: batchName || "Certificate Batch",
        template_id: selectedTemplateId,
        data_rows: mappedRows,
        output_format: outputFormat,
        id_prefix: idPrefix,
        filename_pattern: "{certificate_id}_{recipient_name}"
      });

      setActiveBatch(batch);
      toast("Batch generation started!", "info");

      // Polling for progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await fetchBatchStatus(batch.id);
          setActiveBatch(status);
          if (status.status === "completed" || status.status === "failed") {
            clearInterval(pollInterval);
            setGenerating(false);
            if (status.status === "completed") {
              toast(`Batch complete! ${status.success_count} certificates ready.`, "success");
            } else {
              toast("Batch generation failed: " + status.error_message, "error");
            }
          }
        } catch {
          clearInterval(pollInterval);
          setGenerating(false);
        }
      }, 1200);

    } catch (err: any) {
      toast(err.message || "Failed to start batch", "error");
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Wizard Progress Stepper */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          Batch Certificate Generator
        </h1>
        <p className="text-sm text-slate-400">
          Personalize hundreds or thousands of certificates with verified high-DPI rendering and instant ZIP download.
        </p>

        {/* Stepper pills */}
        <div className="flex items-center gap-2 md:gap-4 mt-6 overflow-x-auto pb-2">
          {[
            { num: 1, label: "1. Select Template" },
            { num: 2, label: "2. Recipient Data" },
            { num: 3, label: "3. Field Mapping" },
            { num: 4, label: "4. Preview & Generate" },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                step === s.num
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : step > s.num
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900 border border-slate-800 text-slate-500"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Template */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Choose a Certificate Template
            </h2>
            <Link
              href="/editor"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              + Create New Design
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id!)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedTemplateId === t.id
                    ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10">
                      {t.category}
                    </span>
                    <span className="text-slate-500 capitalize">{t.orientation}</span>
                  </div>
                  <h3 className="font-semibold text-slate-100">{t.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{t.description || "Production certificate"}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedTemplateId}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm disabled:opacity-40"
            >
              Next: Import Recipient Data <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Import Recipient Data */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              Import Recipients for: <span className="text-indigo-300 font-semibold">{selectedTemplate?.name}</span>
            </h2>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-medium">
              <button
                onClick={() => setImportMode("file")}
                className={`px-3 py-1 rounded-md transition-all ${
                  importMode === "file" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Upload File (CSV/Excel)
              </button>
              <button
                onClick={() => setImportMode("paste")}
                className={`px-3 py-1 rounded-md transition-all ${
                  importMode === "paste" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Paste Names
              </button>
            </div>
          </div>

          {importMode === "file" ? (
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-3xl p-10 text-center bg-slate-900/40 transition-all flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-slate-200">
                  {parsingData ? "Processing spreadsheet..." : "Drag and drop your spreadsheet here"}
                </h3>
                <p className="text-xs text-slate-400">
                  Supports CSV, Excel (.xlsx, .xls) with Unicode and Bengali character support.
                </p>
              </div>
              <label className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer shadow-lg shadow-indigo-600/20">
                Browse Files
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">
                  Paste recipient names (one per line, or copy-paste columns from Excel/Google Sheets):
                </label>
                <button
                  type="button"
                  onClick={() => setRawPastedText("John Doe\nJane Smith\nMohammad Abdul Karim Chowdhury\nমোঃ পারভেজ আহমেদ\nAntara Humaira")}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Insert Sample Data
                </button>
              </div>
              <textarea
                rows={8}
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                placeholder="John Doe&#10;Jane Smith&#10;Mohammad Abdul Karim Chowdhury&#10;মোঃ পারভেজ আহমেদ"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl p-4 text-sm font-mono text-slate-200 focus:outline-none"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={parsingData || !rawPastedText.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-40"
              >
                {parsingData ? "Parsing..." : "Parse Recipient Names"}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Field Mapping & Validation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                Map Certificate Fields to Spreadsheet Columns
              </h2>
              <p className="text-xs text-slate-400">
                Match each certificate placeholder variable to your imported data column.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              {totalRows} Total Records
            </span>
          </div>

          {/* Mapping Grid */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Field Mappings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {["recipient_name", "course_name", "date", "recipient_email", "certificate_id"].map((fieldKey) => (
                <div key={fieldKey} className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium capitalize">
                    {fieldKey.replace("_", " ")}
                  </label>
                  <select
                    value={fieldMappings[fieldKey] || ""}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, [fieldKey]: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Ignore / Default --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Warnings / Error Banner */}
          {validationReport && (
            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {validationReport.is_valid ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Ready for batch generation ({validationReport.valid_rows_count} valid records)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {validationReport.errors_count} critical data issues detected
                  </span>
                )}
              </div>
              {validationReport.issues.length > 0 && (
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto pt-2 border-t border-slate-800 text-slate-400">
                  {validationReport.issues.slice(0, 10).map((issue: any, i: number) => (
                    <li key={i} className="flex items-center gap-1.5">
                      {issue.level === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{issue.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Raw Data Preview Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Data Preview (First 5 Rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">#</th>
                    {headers.map((h) => (
                      <th key={h} className="py-2 px-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="py-2 px-3">{r[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleValidateAndProceed}
              disabled={validating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/30"
            >
              {validating ? "Validating..." : "Validate & Preview"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Live Preview & Batch Generation */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Preview Sample Certificates & Run Batch
              </h2>
              <p className="text-xs text-slate-400">
                Inspect sample rendered certificates before generating the complete batch.
              </p>
            </div>
            <button
              onClick={loadPreviews}
              disabled={loadingPreviews}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPreviews ? "animate-spin" : ""}`} /> Refresh Previews
            </button>
          </div>

          {/* Sample Previews Viewer */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sample {currentPreviewIndex + 1} of {previewSamples.length}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPreviewIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentPreviewIndex === 0}
                  className="p-1 rounded bg-slate-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPreviewIndex((idx) => Math.min(previewSamples.length - 1, idx + 1))}
                  disabled={currentPreviewIndex === previewSamples.length - 1}
                  className="p-1 rounded bg-slate-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center min-h-[350px] bg-slate-950 rounded-xl p-4 border border-slate-800">
              {loadingPreviews ? (
                <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Rendering sample certificates...</span>
                </div>
              ) : previewSamples.length > 0 && previewSamples[currentPreviewIndex]?.base64_image ? (
                <img
                  src={previewSamples[currentPreviewIndex].base64_image}
                  alt="Sample Certificate"
                  className="max-h-[50vh] object-contain rounded-lg shadow-xl"
                />
              ) : (
                <p className="text-xs text-slate-500">No preview generated.</p>
              )}
            </div>
          </div>

          {/* Batch Configuration */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Batch Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Batch Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Export Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="both">PDF + PNG (Recommended)</option>
                  <option value="pdf">PDF Only (Print-Ready)</option>
                  <option value="png">PNG Only (Web High-DPI)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Certificate ID Prefix</label>
                <input
                  type="text"
                  value={idPrefix}
                  onChange={(e) => setIdPrefix(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Active Generation Progress Card */}
          {activeBatch && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-base">
                    {activeBatch.status === "completed" ? "🎉 Generation Complete!" : "Generating Certificates..."}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {activeBatch.success_count} of {activeBatch.total_count} processed
                  </p>
                </div>
                {activeBatch.status === "completed" && activeBatch.zip_download_url && (
                  <a
                    href={activeBatch.zip_download_url}
                    download
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30"
                  >
                    <Download className="w-4 h-4" /> Download ZIP Package
                  </a>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  style={{
                    width: `${Math.round(((activeBatch.success_count + activeBatch.failed_count) / Math.max(1, activeBatch.total_count)) * 100)}%`
                  }}
                  className="bg-indigo-600 h-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Mapping
            </button>
            {!generating && !activeBatch?.zip_download_url && (
              <button
                onClick={handleStartGeneration}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30"
              >
                <Play className="w-4 h-4" /> Generate {totalRows} Certificates
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Generator Wizard...</div>}>
      <GenerateWizardContent />
    </Suspense>
  );
}
