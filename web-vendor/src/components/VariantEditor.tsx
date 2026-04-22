import ImageUploader from "./ImageUploader";

export interface Variant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  image?: string;
}

interface Props {
  value: Variant[];
  onChange: (v: Variant[]) => void;
}

export default function VariantEditor({ value, onChange }: Props) {
  const set = (idx: number, patch: Partial<Variant>) => {
    onChange(value.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };
  const setAttrs = (idx: number, raw: string) => {
    // Attributes are displayed as "k=v; k=v" for simplicity.
    const obj: Record<string, string> = {};
    for (const pair of raw.split(";")) {
      const [k, ...rest] = pair.split("=");
      if (k?.trim() && rest.length) obj[k.trim()] = rest.join("=").trim();
    }
    set(idx, { attributes: obj });
  };
  const attrsStr = (v: Variant) =>
    Object.entries(v.attributes || {})
      .map(([k, val]) => `${k}=${val}`)
      .join("; ");

  const add = () =>
    onChange([...value, { sku: "", attributes: {}, price: 0, stock: 0 }]);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {value.map((v, idx) => (
        <div
          key={idx}
          className="border rounded-md p-3 bg-gray-50 space-y-2"
        >
          <div className="grid grid-cols-4 gap-2">
            <input
              placeholder="SKU"
              className="rounded-md border-gray-300 text-sm"
              value={v.sku}
              onChange={(e) => set(idx, { sku: e.target.value })}
            />
            <input
              placeholder="Attrs e.g. color=Red; size=M"
              className="rounded-md border-gray-300 text-sm col-span-2"
              value={attrsStr(v)}
              onChange={(e) => setAttrs(idx, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
            <input
              type="number"
              placeholder="Price"
              className="rounded-md border-gray-300 text-sm"
              value={v.price}
              onChange={(e) => set(idx, { price: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Stock"
              className="rounded-md border-gray-300 text-sm"
              value={v.stock}
              onChange={(e) => set(idx, { stock: Number(e.target.value) })}
            />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Variant image (optional)</div>
            <ImageUploader
              value={v.image ? [v.image] : []}
              onChange={(urls) => set(idx, { image: urls[0] || undefined })}
              max={1}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-primary-700 hover:underline"
      >
        + Add variant
      </button>
    </div>
  );
}
