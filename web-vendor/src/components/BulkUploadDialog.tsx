import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface RowResult {
  row: number;
  action: "created" | "updated" | "error";
  sku?: string;
  productId?: string;
  error?: string;
}

interface Response {
  totalRows: number;
  created: number;
  updated: number;
  errors: number;
  results: RowResult[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

const SAMPLE = `name,slug,sku,categorySlug,price,stock,description,shortDescription,compareAtPrice,lowStockThreshold,weight,tags,images,isActive,variantsJson
Men Crew Neck Tee,men-crew-neck-tee,TEE-CN-001,men,499,50,Soft cotton crew-neck tee,Breathable cotton tee,699,5,180,"tee|cotton",,true,"[{""sku"":""TEE-CN-001-RED-M"",""attributes"":{""color"":""Red"",""size"":""M""},""price"":499,""stock"":20},{""sku"":""TEE-CN-001-BLK-L"",""attributes"":{""color"":""Black"",""size"":""L""},""price"":499,""stock"":30}]"
`;

export default function BulkUploadDialog({ open, onClose, onDone }: Props) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<Response | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    setResult(null);
    try {
      const res = await api.post<{ data: Response }>(
        "/api/vendor/products/bulk",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(res.data.data);
      if (res.data.data.created + res.data.data.updated > 0) {
        toast.success(
          `${res.data.data.created} created, ${res.data.data.updated} updated`
        );
        onDone();
      }
      if (res.data.data.errors > 0) {
        toast.error(`${res.data.data.errors} row(s) failed`);
      }
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Upload failed"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bulk upload products</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:underline"
          >
            Close
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-2">
          Upload a CSV with one product per row. Rows with an existing{" "}
          <code>slug</code> are updated; others are created.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Required columns: name, slug, sku, categorySlug, price, stock,
          description. Optional: shortDescription, compareAtPrice,
          lowStockThreshold, weight, tags (pipe-separated), images
          (pipe-separated URLs), isActive, variantsJson (JSON array).
        </p>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={downloadSample}
            className="text-sm text-primary-700 hover:underline"
          >
            Download sample CSV
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            className="text-sm"
          />
          {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
        </div>

        {result && (
          <div className="border rounded-md">
            <div className="bg-gray-50 px-3 py-2 text-sm flex gap-4">
              <span>Total: {result.totalRows}</span>
              <span className="text-green-700">Created: {result.created}</span>
              <span className="text-blue-700">Updated: {result.updated}</span>
              <span className="text-red-700">Errors: {result.errors}</span>
            </div>
            <ul className="divide-y text-xs max-h-72 overflow-auto">
              {result.results.map((r, i) => (
                <li
                  key={i}
                  className={`px-3 py-2 ${
                    r.action === "error" ? "bg-red-50" : ""
                  }`}
                >
                  <span className="font-mono">#{r.row}</span>{" "}
                  <span className="font-semibold">{r.action}</span>
                  {r.sku && <span className="text-gray-600"> · {r.sku}</span>}
                  {r.error && <span className="text-red-700"> — {r.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
