"use client";

import { useEffect, useRef, useState } from "react";
import { Ruler, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type Item = { id: number; image_url: string };

/**
 * Floor-plan manager for EDIT surfaces (existing listing/sublet). Uploads and
 * deletes immediately against the live entity, so changes persist without a
 * separate save step. Floor plans are optional and capped at 5.
 */
export function FloorPlanManager({
  kind,
  id,
  initial,
}: {
  kind: "listing" | "sublet";
  id: number;
  /** Pre-filtered floor-plan images if the parent already has them. */
  initial?: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initial ?? []);
  const [loading, setLoading] = useState(initial === undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const max = 5;

  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const entity = kind === "listing" ? await api.listings.getById(id) : await api.sublets.getById(id);
        if (cancelled) return;
        const plans = (entity.images ?? [])
          .filter((img) => img.is_floor_plan)
          .map((img) => ({ id: img.id, image_url: img.image_url }));
        setItems(plans);
      } catch {
        if (!cancelled) setError("Couldn't load floor plans.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [kind, id, initial]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (items.length + files.length > max) {
      setError(`Maximum ${max} floor plans.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const arr = Array.from(files);
      const uploaded =
        kind === "listing"
          ? await api.listings.uploadFloorPlans(id, arr)
          : await api.sublets.uploadFloorPlans(id, arr);
      setItems((prev) => [...prev, ...uploaded.map((u) => ({ id: u.id, image_url: u.image_url }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (imageId: number) => {
    setBusy(true);
    setError("");
    try {
      if (kind === "listing") await api.listings.deleteImage(id, imageId);
      else await api.sublets.deleteImage(id, imageId);
      setItems((prev) => prev.filter((i) => i.id !== imageId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Ruler className="h-4 w-4 text-[#FF6B35]" />
        <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
          Floor Plan <span className="text-[#1B2D45]/40" style={{ fontWeight: 500 }}>(optional)</span>
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <div key={it.id} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAF8F4]">
              <img src={it.image_url} alt="Floor plan" className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => remove(it.id)}
                disabled={busy}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
                aria-label="Remove floor plan"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {items.length < max && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/[0.08] text-[#1B2D45]/30 transition-all hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.02] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <span style={{ fontSize: "20px" }}>+</span>}
              <span style={{ fontSize: "8px", fontWeight: 500 }}>Add</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { upload(e.target.files); e.target.value = ""; }}
          />
        </div>
      )}

      {error && <p className="mt-1.5 text-[#E71D36]" style={{ fontSize: "11px" }}>{error}</p>}
    </div>
  );
}
