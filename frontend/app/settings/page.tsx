"use client";

import { useState } from "react";
import { Settings, Save, Shield, HardDrive, Printer, Building, Sliders } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("Certificate Studio Organization");
  const [idPrefix, setIdPrefix] = useState("CERT-2026-");
  const [defaultDpi, setDefaultDpi] = useState("150");
  const [defaultFormat, setDefaultFormat] = useState("both");
  const [defaultFont, setDefaultFont] = useState("Inter");
  const [retentionDays, setRetentionDays] = useState("30");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Settings saved successfully!", "success");
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-400" /> Platform Settings
        </h1>
        <p className="text-sm text-slate-400">
          Configure default certificate rendering parameters, organization metadata, and file retention policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" /> Organization Branding
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Organization / Issuer Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Default Certificate ID Prefix</label>
              <input
                type="text"
                value={idPrefix}
                onChange={(e) => setIdPrefix(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Print & Rendering Engine */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" /> Deterministic Rendering Engine
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Export Print DPI</label>
              <select
                value={defaultDpi}
                onChange={(e) => setDefaultDpi(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
              >
                <option value="150">150 DPI (Balanced Size & Quality)</option>
                <option value="300">300 DPI (Ultra-Sharp Press Print)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Default Output Format</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
              >
                <option value="both">PDF + PNG</option>
                <option value="pdf">PDF Only</option>
                <option value="png">PNG Only</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Primary Font Family</label>
              <select
                value={defaultFont}
                onChange={(e) => setDefaultFont(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
              >
                <option value="Inter">Inter (Sans-Serif)</option>
                <option value="Montserrat">Montserrat (Geometric)</option>
                <option value="Playfair Display">Playfair Display (Serif)</option>
                <option value="Noto Sans Bengali">Noto Sans Bengali (বাংলা)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & File Storage */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" /> Data Safety & Privacy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Temporary File Retention (Days)</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">QR Verification Base Domain</label>
              <input
                type="text"
                disabled
                value="http://localhost:3000/verify/"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 text-slate-400 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
