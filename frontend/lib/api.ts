export interface FieldData {
  id?: number;
  name: string;
  field_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  z_index?: number;
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  color?: string;
  align?: string;
  vertical_align?: string;
  auto_fit?: boolean;
  min_font_size?: number;
  wrap?: boolean;
  opacity?: number;
  locked?: boolean;
  mask_behind?: boolean;
  mask_color?: string;
  default_value?: string;
  placeholder?: string;
  extra_props?: string;
}

export interface TemplateData {
  id?: number;
  name: string;
  description?: string;
  category: string;
  orientation: string;
  width: number;
  height: number;
  background_asset_id?: number | null;
  background_color: string;
  border_style: string;
  version?: number;
  is_starter?: boolean;
  created_at?: string;
  updated_at?: string;
  fields: FieldData[];
}

export interface BatchItem {
  id: string;
  name: string;
  template_id: number;
  template_version: number;
  total_count: number;
  success_count: number;
  failed_count: number;
  status: string;
  output_format: string;
  zip_filename?: string;
  zip_download_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

const API_BASE = "";

export async function fetchTemplates(category?: string, search?: string): Promise<TemplateData[]> {
  const params = new URLSearchParams();
  if (category && category !== "All") params.append("category", category);
  if (search) params.append("search", search);
  const res = await fetch(`${API_BASE}/api/templates?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export async function fetchTemplateById(id: number): Promise<TemplateData> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`);
  if (!res.ok) throw new Error("Failed to load template");
  return res.json();
}

export async function createTemplate(data: Partial<TemplateData>): Promise<TemplateData> {
  const res = await fetch(`${API_BASE}/api/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create template");
  return res.json();
}

export async function updateTemplate(id: number, data: Partial<TemplateData>): Promise<TemplateData> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update template");
  return res.json();
}

export async function deleteTemplate(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete template");
}

export async function duplicateTemplate(id: number): Promise<TemplateData> {
  const res = await fetch(`${API_BASE}/api/templates/${id}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to duplicate template");
  return res.json();
}

export async function uploadAsset(file: File): Promise<{ id: number; url: string; width?: number; height?: number; original_filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/assets/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function uploadRecipientFile(file: File): Promise<{
  headers: string[];
  rows: Record<string, any>[];
  total_rows: number;
  detected_mappings: Record<string, string>;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/importers/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "File parse error" }));
    throw new Error(err.detail || "Failed to parse recipient file");
  }
  return res.json();
}

export async function pasteRecipientData(rawText: string): Promise<{
  headers: string[];
  rows: Record<string, any>[];
  total_rows: number;
  detected_mappings: Record<string, string>;
}> {
  const res = await fetch(`${API_BASE}/api/importers/paste`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: rawText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Parse error" }));
    throw new Error(err.detail || "Failed to parse pasted text");
  }
  return res.json();
}

export async function validateRecipientRows(templateId: number, mappings: Record<string, string>, rows: Record<string, any>[]): Promise<{
  is_valid: boolean;
  total_rows: number;
  valid_rows_count: number;
  errors_count: number;
  warnings_count: number;
  issues: { row_index: number; column: string; message: string; level: string }[];
}> {
  const res = await fetch(`${API_BASE}/api/importers/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId, mappings, rows }),
  });
  if (!res.ok) throw new Error("Validation check failed");
  return res.json();
}

export async function generatePreviews(templateId: number, sampleRows: Record<string, any>[]): Promise<{
  previews: { row_index: number; certificate_id: string; recipient_name: string; base64_image: string; error?: string }[];
}> {
  const res = await fetch(`${API_BASE}/api/generator/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId, data_rows: sampleRows }),
  });
  if (!res.ok) throw new Error("Failed to render previews");
  return res.json();
}

export async function startBatchGeneration(params: {
  name: string;
  template_id: number;
  data_rows: Record<string, any>[];
  output_format?: string;
  id_prefix?: string;
  filename_pattern?: string;
}): Promise<BatchItem> {
  const res = await fetch(`${API_BASE}/api/generator/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to start batch generation");
  return res.json();
}

export async function fetchBatchStatus(batchId: string): Promise<BatchItem> {
  const res = await fetch(`${API_BASE}/api/generator/batch/${batchId}`);
  if (!res.ok) throw new Error("Failed to check batch progress");
  return res.json();
}

export async function fetchBatchHistory(): Promise<BatchItem[]> {
  const res = await fetch(`${API_BASE}/api/generator/history`);
  if (!res.ok) throw new Error("Failed to fetch generation history");
  return res.json();
}

export async function verifyCertificate(certificateId: string): Promise<{
  is_valid: boolean;
  status: string;
  certificate_id: string;
  recipient_name?: string;
  course_name?: string;
  issue_date?: string;
  organization?: string;
  issued_at?: string;
}> {
  const res = await fetch(`${API_BASE}/api/verification/${encodeURIComponent(certificateId)}`);
  if (!res.ok) throw new Error("Failed to query verification status");
  return res.json();
}
