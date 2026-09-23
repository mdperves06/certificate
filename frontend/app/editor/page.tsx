"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Type, 
  Square, 
  Circle, 
  Minus, 
  QrCode, 
  Image as ImageIcon, 
  Sliders, 
  Trash2, 
  Copy, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  Save, 
  Sparkles, 
  Layers, 
  Move, 
  Lock, 
  Unlock, 
  Eraser, 
  ArrowLeft,
  Play
} from "lucide-react";
import { 
  fetchTemplateById, 
  createTemplate, 
  updateTemplate, 
  uploadAsset, 
  generatePreviews, 
  TemplateData, 
  FieldData 
} from "@/lib/api";
import { useToast } from "@/components/Toast";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const templateIdParam = searchParams.get("templateId");

  // Template State
  const [templateId, setTemplateId] = useState<number | null>(templateIdParam ? parseInt(templateIdParam) : null);
  const [templateName, setTemplateName] = useState("Untitled Certificate");
  const [category, setCategory] = useState("General");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [borderStyle, setBorderStyle] = useState("none");
  const [backgroundAssetUrl, setBackgroundAssetUrl] = useState<string | null>(null);
  const [backgroundAssetId, setBackgroundAssetId] = useState<number | null>(null);

  // Fields and Layers
  const [fields, setFields] = useState<FieldData[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Canvas Viewport
  const [zoom, setZoom] = useState(0.5);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [saving, setSaving] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<FieldData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Dragging & Resizing Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0, mouseY: 0, initialX: 0, initialY: 0
  });
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initialW: number; initialH: number }>({
    mouseX: 0, mouseY: 0, initialW: 0, initialH: 0
  });

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      fetchTemplateById(templateId)
        .then((t) => {
          setTemplateName(t.name);
          setCategory(t.category);
          setOrientation(t.orientation as "landscape" | "portrait");
          setWidth(t.width);
          setHeight(t.height);
          setBackgroundColor(t.background_color);
          setBorderStyle(t.border_style);
          setBackgroundAssetId(t.background_asset_id || null);
          setFields(t.fields);
          setHistory([t.fields]);
          setHistoryIndex(0);
        })
        .catch(() => {
          toast("Failed to load template", "error");
        });
    } else {
      // Default empty template with recipient_name
      const initialFields: FieldData[] = [
        {
          name: "recipient_name",
          field_type: "dynamic_text",
          x: 360,
          y: 450,
          width: 1200,
          height: 120,
          font_family: "Inter",
          font_size: 60,
          font_weight: "bold",
          color: "#111827",
          align: "center",
          vertical_align: "middle",
          auto_fit: true,
          min_font_size: 24,
          default_value: "Recipient Full Name"
        }
      ];
      setFields(initialFields);
      setHistory([initialFields]);
      setHistoryIndex(0);
    }
  }, [templateId]);

  // Push to history
  const pushHistory = (newFields: FieldData[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newFields);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setFields(newFields);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setFields(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setFields(history[newIdx]);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      // Delete selected
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFieldId && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        deleteSelectedField();
      }
      // Nudge with arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedFieldId && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setFields((prev) => {
          const updated = prev.map((f, i) => {
            const fKey = f.id ? `id-${f.id}` : `idx-${i}`;
            if (fKey !== selectedFieldId) return f;
            let nx = f.x;
            let ny = f.y;
            if (e.key === "ArrowLeft") nx -= step;
            if (e.key === "ArrowRight") nx += step;
            if (e.key === "ArrowUp") ny -= step;
            if (e.key === "ArrowDown") ny += step;
            return { ...f, x: nx, y: ny };
          });
          return updated;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFieldId, historyIndex, history]);

  // Selected Field Data
  const getSelectedField = (): FieldData | null => {
    if (!selectedFieldId) return null;
    return fields.find((f, i) => (f.id ? `id-${f.id}` : `idx-${i}`) === selectedFieldId) || null;
  };

  const updateSelectedField = (updates: Partial<FieldData>) => {
    const updated = fields.map((f, i) => {
      const fKey = f.id ? `id-${f.id}` : `idx-${i}`;
      if (fKey === selectedFieldId) {
        return { ...f, ...updates };
      }
      return f;
    });
    pushHistory(updated);
  };

  const deleteSelectedField = () => {
    if (!selectedFieldId) return;
    const updated = fields.filter((f, i) => (f.id ? `id-${f.id}` : `idx-${i}`) !== selectedFieldId);
    pushHistory(updated);
    setSelectedFieldId(null);
  };

  // Add Element Handlers
  const addDynamicField = (name: string, label: string) => {
    const newField: FieldData = {
      name: name,
      field_type: "dynamic_text",
      x: 360,
      y: 350 + (fields.length * 30) % 300,
      width: 1200,
      height: 90,
      font_family: "Inter",
      font_size: 42,
      font_weight: "bold",
      color: "#111827",
      align: "center",
      vertical_align: "middle",
      auto_fit: true,
      min_font_size: 18,
      default_value: label
    };
    const updated = [...fields, newField];
    pushHistory(updated);
    setSelectedFieldId(`idx-${updated.length - 1}`);
  };

  const addStaticText = () => {
    const newField: FieldData = {
      name: "static_text",
      field_type: "static_text",
      x: 460,
      y: 200,
      width: 1000,
      height: 60,
      font_family: "Montserrat",
      font_size: 24,
      font_weight: "normal",
      color: "#4B5563",
      align: "center",
      vertical_align: "middle",
      default_value: "This is presented to acknowledge completion of"
    };
    const updated = [...fields, newField];
    pushHistory(updated);
    setSelectedFieldId(`idx-${updated.length - 1}`);
  };

  const addShape = (shapeType: "rectangle" | "circle" | "line") => {
    const newField: FieldData = {
      name: `shape_${shapeType}`,
      field_type: "shape",
      x: 810,
      y: 750,
      width: shapeType === "line" ? 300 : 150,
      height: shapeType === "line" ? 4 : 150,
      color: "#D4AF37",
      extra_props: JSON.stringify({ shape_type: shapeType, stroke_width: 2, fill_color: "#D4AF37", outline_color: "#926815" })
    };
    const updated = [...fields, newField];
    pushHistory(updated);
    setSelectedFieldId(`idx-${updated.length - 1}`);
  };

  const addQRCode = () => {
    const newField: FieldData = {
      name: "qr_verification",
      field_type: "qr",
      x: 890,
      y: 780,
      width: 140,
      height: 140,
      color: "#111827"
    };
    const updated = [...fields, newField];
    pushHistory(updated);
    setSelectedFieldId(`idx-${updated.length - 1}`);
  };

  const addEraseMask = () => {
    // Solid mask region to cover previous name on uploaded certificate demo
    const newField: FieldData = {
      name: "recipient_name",
      field_type: "dynamic_text",
      x: 400,
      y: 400,
      width: 1120,
      height: 110,
      mask_behind: true,
      mask_color: "#FFFFFF",
      font_family: "Inter",
      font_size: 54,
      font_weight: "bold",
      color: "#111827",
      align: "center",
      auto_fit: true,
      min_font_size: 20,
      default_value: "Recipient Name (Over Mask)"
    };
    const updated = [...fields, newField];
    pushHistory(updated);
    setSelectedFieldId(`idx-${updated.length - 1}`);
    toast("Added Field with Background Erase/Mask enabled", "info");
  };

  // Background Image Upload
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const asset = await uploadAsset(file);
      setBackgroundAssetId(asset.id);
      setBackgroundAssetUrl(asset.url);
      if (asset.width && asset.height) {
        setWidth(asset.width);
        setHeight(asset.height);
        setOrientation(asset.width >= asset.height ? "landscape" : "portrait");
      }
      toast("Background certificate demo uploaded successfully", "success");
    } catch (err: any) {
      toast(err.message || "Failed to upload background asset", "error");
    }
  };

  // Save Template
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<TemplateData> = {
        name: templateName,
        category,
        orientation,
        width,
        height,
        background_color: backgroundColor,
        border_style: borderStyle,
        background_asset_id: backgroundAssetId,
        fields
      };
      if (templateId) {
        await updateTemplate(templateId, payload);
        toast("Template updated successfully!", "success");
      } else {
        const created = await createTemplate(payload);
        setTemplateId(created.id!);
        toast("Template created successfully!", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  };

  // Live Preview Modal
  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    try {
      // Save template first if needed
      let targetId = templateId;
      if (!targetId) {
        const created = await createTemplate({
          name: templateName,
          category,
          orientation,
          width,
          height,
          background_color: backgroundColor,
          border_style: borderStyle,
          background_asset_id: backgroundAssetId,
          fields
        });
        targetId = created.id!;
        setTemplateId(targetId);
      } else {
        await updateTemplate(targetId, { fields, background_color: backgroundColor, border_style: borderStyle });
      }

      const res = await generatePreviews(targetId, [
        { recipient_name: "Mohammad Abdul Karim Chowdhury", course_name: "Advanced Full-Stack Engineering", date: "2026-09-23", certificate_id: "CERT-2026-PREVIEW" }
      ]);
      if (res.previews.length > 0) {
        setPreviewImage(res.previews[0].base64_image);
      }
    } catch (err: any) {
      toast(err.message || "Preview generation failed", "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Drag and Move
  const handleMouseDownElement = (e: React.MouseEvent, fieldKey: string, field: FieldData) => {
    e.stopPropagation();
    setSelectedFieldId(fieldKey);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: field.x,
      initialY: field.y
    };
  };

  const handleMouseDownResize = (e: React.MouseEvent, field: FieldData) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialW: field.width,
      initialH: field.height
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    const selected = getSelectedField();
    if (!selected) return;

    if (isDragging) {
      const dx = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const dy = (e.clientY - dragStartRef.current.mouseY) / zoom;
      let newX = Math.round(dragStartRef.current.initialX + dx);
      let newY = Math.round(dragStartRef.current.initialY + dy);

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      setFields((prev) =>
        prev.map((f, i) => {
          const fKey = f.id ? `id-${f.id}` : `idx-${i}`;
          if (fKey === selectedFieldId) {
            return { ...f, x: Math.max(0, newX), y: Math.max(0, newY) };
          }
          return f;
        })
      );
    } else if (isResizing) {
      const dw = (e.clientX - resizeStartRef.current.mouseX) / zoom;
      const dh = (e.clientY - resizeStartRef.current.mouseY) / zoom;
      let newW = Math.round(resizeStartRef.current.initialW + dw);
      let newH = Math.round(resizeStartRef.current.initialH + dh);

      if (snapToGrid) {
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
      }

      setFields((prev) =>
        prev.map((f, i) => {
          const fKey = f.id ? `id-${f.id}` : `idx-${i}`;
          if (fKey === selectedFieldId) {
            return { ...f, width: Math.max(50, newW), height: Math.max(20, newH) };
          }
          return f;
        })
      );
    }
  }, [isDragging, isResizing, zoom, snapToGrid, gridSize, selectedFieldId, fields]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      pushHistory([...fields]);
    }
  }, [isDragging, isResizing, fields]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const selectedField = getSelectedField();

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Studio Control Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/templates")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Back to Templates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 px-2 py-1 text-sm font-semibold text-white focus:outline-none"
            placeholder="Template Name"
          />
          <span className="text-xs text-slate-500 hidden sm:inline">
            {orientation.toUpperCase()} • {width}×{height}
          </span>
        </div>

        {/* Center: Undo / Redo & Zoom */}
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium px-1 text-slate-300 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(0.5)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Template"}
          </button>
          {templateId && (
            <button
              onClick={() => router.push(`/generate?templateId=${templateId}`)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
            >
              <Play className="w-3.5 h-3.5" /> Generate
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body: Left Palette + Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Palette */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 space-y-6 overflow-y-auto hidden md:block">
          {/* Dynamic Variables Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Fields
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => addDynamicField("recipient_name", "{{recipient_name}}")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-200 transition-all text-left"
              >
                <span>Recipient Name</span>
                <span className="text-[10px] text-indigo-400 font-mono">{"{{name}}"}</span>
              </button>
              <button
                onClick={() => addDynamicField("course_name", "{{course_name}}")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-200 transition-all text-left"
              >
                <span>Course / Title</span>
                <span className="text-[10px] text-indigo-400 font-mono">{"{{course}}"}</span>
              </button>
              <button
                onClick={() => addDynamicField("date", "2026-09-23")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-200 transition-all text-left"
              >
                <span>Date of Issue</span>
                <span className="text-[10px] text-indigo-400 font-mono">{"{{date}}"}</span>
              </button>
              <button
                onClick={() => addDynamicField("certificate_id", "CERT-2026-0001")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-200 transition-all text-left"
              >
                <span>Certificate ID</span>
                <span className="text-[10px] text-indigo-400 font-mono">{"{{id}}"}</span>
              </button>
            </div>
          </div>

          {/* Mode B: Demo Masking & Erase Tool */}
          <div className="space-y-2.5 p-3 rounded-xl bg-slate-800/40 border border-amber-500/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Eraser className="w-3.5 h-3.5" /> Erase / Mask Region
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              For uploaded certificate artwork: place a field with background mask to cleanly cover the old recipient name.
            </p>
            <button
              onClick={addEraseMask}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-medium text-amber-300 text-center"
            >
              + Add Field with Mask
            </button>
          </div>

          {/* Basic Elements */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Elements
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={addStaticText}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 gap-1.5"
              >
                <Type className="w-4 h-4 text-indigo-400" />
                <span>Text</span>
              </button>
              <button
                onClick={addQRCode}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 gap-1.5"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>QR Code</span>
              </button>
              <button
                onClick={() => addShape("rectangle")}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 gap-1.5"
              >
                <Square className="w-4 h-4 text-sky-400" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => addShape("line")}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 gap-1.5"
              >
                <Minus className="w-4 h-4 text-amber-400" />
                <span>Line</span>
              </button>
            </div>
          </div>

          {/* Canvas Settings */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Page Layout
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Border Frame</label>
                <select
                  value={borderStyle}
                  onChange={(e) => setBorderStyle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="gold_double">Gold Double Border</option>
                  <option value="modern_thin">Modern Thin Slate</option>
                  <option value="navy_accent">Navy Accent Frame</option>
                  <option value="classic_ornate">Classic Ornate</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Background Image Demo</label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 cursor-pointer bg-slate-800/40 text-slate-300">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>{backgroundAssetId ? "Replace Image" : "Upload Artwork"}</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleBackgroundUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Visual Canvas Viewport */}
        <div
          ref={canvasRef}
          onClick={() => setSelectedFieldId(null)}
          className="flex-1 canvas-grid-bg relative overflow-auto flex items-center justify-center p-8 cursor-default"
        >
          {/* Certificate Board */}
          <div
            style={{
              width: `${width * zoom}px`,
              height: `${height * zoom}px`,
              backgroundColor: backgroundColor,
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)"
            }}
            className="relative transition-all select-none overflow-hidden shrink-0 border border-slate-700/50"
          >
            {/* Background Image Asset if Uploaded */}
            {backgroundAssetUrl && (
              <img
                src={backgroundAssetUrl}
                alt="Certificate Artwork"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Decorative Borders */}
            {borderStyle === "gold_double" && (
              <div
                style={{
                  position: "absolute",
                  inset: `${40 * zoom}px`,
                  border: `${3 * zoom}px solid #b48c1e`,
                  pointerEvents: "none"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: `${15 * zoom}px`,
                    border: `${8 * zoom}px solid #d4af37`,
                    pointerEvents: "none"
                  }}
                />
              </div>
            )}

            {borderStyle === "modern_thin" && (
              <div
                style={{
                  position: "absolute",
                  inset: `${45 * zoom}px`,
                  border: `${4 * zoom}px solid #475569`,
                  pointerEvents: "none"
                }}
              />
            )}

            {borderStyle === "navy_accent" && (
              <div
                style={{
                  position: "absolute",
                  inset: `${35 * zoom}px`,
                  border: `${10 * zoom}px solid #0f172a`,
                  pointerEvents: "none"
                }}
              />
            )}

            {/* Dynamic & Static Elements Rendering */}
            {fields.map((field, index) => {
              const fieldKey = field.id ? `id-${field.id}` : `idx-${index}`;
              const isSelected = selectedFieldId === fieldKey;

              return (
                <div
                  key={fieldKey}
                  onMouseDown={(e) => handleMouseDownElement(e, fieldKey, field)}
                  style={{
                    position: "absolute",
                    left: `${field.x * zoom}px`,
                    top: `${field.y * zoom}px`,
                    width: `${field.width * zoom}px`,
                    height: `${field.height * zoom}px`,
                    zIndex: field.z_index || index + 1,
                    cursor: isDragging ? "grabbing" : "grab"
                  }}
                  className={`group transition-shadow ${
                    isSelected ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-900" : "hover:ring-1 hover:ring-indigo-400/50"
                  }`}
                >
                  {/* Mask Background (if erase tool is enabled) */}
                  {field.mask_behind && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: field.mask_color || "#FFFFFF",
                        zIndex: 0
                      }}
                    />
                  )}

                  {/* Element Content */}
                  <div className="w-full h-full relative z-10 flex flex-col justify-center overflow-hidden">
                    {field.field_type === "shape" ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: field.color || "#D4AF37"
                        }}
                      />
                    ) : field.field_type === "qr" ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center p-2 rounded border border-slate-700">
                        <QrCode className="w-full h-full text-white" />
                      </div>
                    ) : (
                      <div
                        style={{
                          fontFamily: field.font_family || "Inter",
                          fontSize: `${(field.font_size || 32) * zoom}px`,
                          fontWeight: field.font_weight || "normal",
                          color: field.color || "#111827",
                          textAlign: (field.align as any) || "center",
                          lineHeight: 1.2
                        }}
                        className="truncate select-none px-1"
                      >
                        {field.default_value || field.placeholder || field.name}
                      </div>
                    )}
                  </div>

                  {/* Resize Handle (Bottom-Right) */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => handleMouseDownResize(e, field)}
                      className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize z-30"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Inspector Panel */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/70 p-4 space-y-6 overflow-y-auto hidden lg:block">
          {selectedField ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Element Inspector
                </span>
                <button
                  onClick={deleteSelectedField}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                  title="Delete element"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Geometry */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">Dimensions & Coordinates</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-0.5">X Position</label>
                    <input
                      type="number"
                      value={Math.round(selectedField.x)}
                      onChange={(e) => updateSelectedField({ x: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Y Position</label>
                    <input
                      type="number"
                      value={Math.round(selectedField.y)}
                      onChange={(e) => updateSelectedField({ y: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Width</label>
                    <input
                      type="number"
                      value={Math.round(selectedField.width)}
                      onChange={(e) => updateSelectedField({ width: parseInt(e.target.value) || 50 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Height</label>
                    <input
                      type="number"
                      value={Math.round(selectedField.height)}
                      onChange={(e) => updateSelectedField({ height: parseInt(e.target.value) || 20 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Typography if text */}
              {selectedField.field_type !== "shape" && selectedField.field_type !== "qr" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300">Typography</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-slate-500 block mb-0.5">Font Family</label>
                      <select
                        value={selectedField.font_family || "Inter"}
                        onChange={(e) => updateSelectedField({ font_family: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                      >
                        <option value="Inter">Inter (Clean Modern)</option>
                        <option value="Montserrat">Montserrat (Geometric Sans)</option>
                        <option value="Playfair Display">Playfair Display (Prestige Serif)</option>
                        <option value="Noto Sans Bengali">Noto Sans Bengali (বাংলা ফন্ট)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 block mb-0.5">Font Size</label>
                        <input
                          type="number"
                          value={selectedField.font_size || 32}
                          onChange={(e) => updateSelectedField({ font_size: parseInt(e.target.value) || 12 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5">Weight</label>
                        <select
                          value={selectedField.font_weight || "normal"}
                          onChange={(e) => updateSelectedField({ font_weight: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                        >
                          <option value="normal">Regular</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-0.5">Text Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={selectedField.color || "#111827"}
                          onChange={(e) => updateSelectedField({ color: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={selectedField.color || "#111827"}
                          onChange={(e) => updateSelectedField({ color: e.target.value })}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-0.5">Horizontal Alignment</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-center font-medium">
                        {["left", "center", "right"].map((align) => (
                          <button
                            key={align}
                            onClick={() => updateSelectedField({ align })}
                            className={`py-1 rounded capitalize ${
                              selectedField.align === align ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Smart Auto-Fit Options */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedField.auto_fit ?? true}
                          onChange={(e) => updateSelectedField({ auto_fit: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300 font-medium">Smart Auto-fit Downscaling</span>
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Automatically scales down font size for long names so they never overflow bounding box boundaries.
                      </p>
                    </div>

                    {/* Masking Options */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedField.mask_behind || false}
                          onChange={(e) => updateSelectedField({ mask_behind: e.target.checked })}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                        />
                        <span className="text-amber-300 font-medium">Erase / Mask Behind Field</span>
                      </label>
                      {selectedField.mask_behind && (
                        <div className="flex items-center gap-2 pl-5">
                          <label className="text-[11px] text-slate-400">Mask Fill:</label>
                          <input
                            type="color"
                            value={selectedField.mask_color || "#FFFFFF"}
                            onChange={(e) => updateSelectedField({ mask_color: e.target.value })}
                            className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-2 text-slate-500">
              <Layers className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Click any element on the canvas to inspect and customize its properties.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Eye className="w-4 h-4" /> Live High-DPI Render Preview
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-center min-h-[300px] bg-slate-950 rounded-xl overflow-hidden p-4 border border-slate-800/80">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Rendering deterministic high-DPI certificate...</span>
                </div>
              ) : previewImage ? (
                <img src={previewImage} alt="Certificate Render Preview" className="max-h-[60vh] object-contain rounded-lg shadow-xl" />
              ) : (
                <p className="text-xs text-rose-400">Failed to render preview.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>Verified identical WYSIWYG coordinate rendering using Pillow engine.</span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500"
              >
                Back to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Certificate Studio Editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
