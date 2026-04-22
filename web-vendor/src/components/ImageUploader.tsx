import { useRef, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

// Prefix a relative "/uploads/..." URL with the backend origin so <img src=...>
// resolves correctly when the frontend is on a different port.
function toDisplayUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_URL || "";
  return apiBase ? `${apiBase.replace(/\/$/, "")}${url}` : url;
}

export default function ImageUploader({ value, onChange, max = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (files: FileList | null) => {
    if (!files || !files.length) return;
    if (value.length + files.length > max) {
      toast.error(`Max ${max} images`);
      return;
    }
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    setUploading(true);
    try {
      const res = await api.post<{ data: { url: string }[] }>("/api/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const urls = res.data.data.map((d) => d.url);
      onChange([...value, ...urls]);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Upload failed"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url, idx) => (
          <div key={url + idx} className="relative h-20 w-20 rounded-md overflow-hidden border">
            <img src={toDisplayUrl(url)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute top-0.5 right-0.5 bg-white/80 rounded-full p-0.5 hover:bg-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < max && (
          <label
            className={`h-20 w-20 flex items-center justify-center rounded-md border-2 border-dashed text-xs cursor-pointer ${
              uploading
                ? "border-gray-200 text-gray-400"
                : "border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-700"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleSelect(e.target.files)}
            />
            {uploading ? "Uploading..." : "+ Add"}
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        PNG/JPG/WEBP, up to {max} images. Stored at /uploads.
      </p>
    </div>
  );
}
