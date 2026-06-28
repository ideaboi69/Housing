"use client";

import { useEffect, useState } from "react";
import { Ruler, X } from "lucide-react";

/**
 * Staged floor-plan picker for create/edit forms. Holds File objects in the
 * parent; the parent uploads them (via api.listings/sublets.uploadFloorPlans)
 * after the listing/sublet is created. Optional — floor plans are never required.
 */
export function FloorPlanUploader({
  files,
  onChange,
  max = 5,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const room = max - files.length;
    if (room <= 0) return;
    onChange([...files, ...Array.from(list).slice(0, room)]);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Ruler className="h-4 w-4 text-[#FF6B35]" />
        <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
          Floor Plan <span className="text-[#1B2D45]/40" style={{ fontWeight: 500 }}>(optional)</span>
        </label>
      </div>
      <p className="text-[#1B2D45]/45 mb-3" style={{ fontSize: "11px" }}>
        Upload a layout diagram if you have one. Shown in its own section on the listing.
      </p>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {previews.map((src, idx) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAF8F4]">
              <img src={src} alt={`Floor plan ${idx + 1}`} className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== idx))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove floor plan"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < max && (
        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#E8E4DC] p-4 text-center transition-colors hover:border-[#FF6B35]/30">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          <Ruler className="mx-auto mb-1.5 h-5 w-5 text-[#98A3B0]" />
          <p className="text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 500 }}>
            {files.length === 0 ? "Add floor plan" : `Add more (${files.length}/${max})`}
          </p>
          <p className="text-[#98A3B0]/80 mt-0.5" style={{ fontSize: "10px" }}>PNG, JPG, or WebP</p>
        </label>
      )}
    </div>
  );
}
