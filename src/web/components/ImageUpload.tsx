import { useRef, useState } from "react";
import { api, imageUrl } from "../lib/api";
import { resizeImage } from "../lib/resizeImage";
import { Button } from "./ui";

export function ImageUpload({ value, onChange }: { value: string | null; onChange: (key: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const form = new FormData();
      form.append("file", new File([blob], "photo", { type: blob.type }));
      const { key } = await api.post<{ key: string }>("/api/admin/upload", form);
      onChange(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200">
        {value ? <img src={imageUrl(value)} alt="" className="size-full object-cover" /> : <span className="text-xs text-stone-400">No photo</span>}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Uploading…" : value ? "Change photo" : "Upload photo"}
          </Button>
          {value && (
            <Button type="button" variant="danger" disabled={busy} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    </div>
  );
}
