import { BedDouble, Bath } from "lucide-react";

/**
 * At-a-glance bed/bath indicator shown next to the price on listing cards.
 * `beds` is a ReactNode so callers can pass a plain count (5) or a
 * sublet-style "available / total" string (1/4).
 */
export function BedBath({
  beds,
  baths,
  size = "sm",
}: {
  beds: React.ReactNode;
  baths?: React.ReactNode;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const fontSize = size === "md" ? "12px" : "11px";
  return (
    <div
      className="flex items-center gap-2 text-[#1B2D45]/60 shrink-0"
      style={{ fontSize, fontWeight: 600 }}
    >
      <span className="flex items-center gap-1">
        <BedDouble className={`${iconClass} text-[#1B2D45]/40`} strokeWidth={2} />
        {beds}
      </span>
      {baths != null && baths !== "" && (
        <>
          <span className="text-[#1B2D45]/15">|</span>
          <span className="flex items-center gap-1">
            <Bath className={`${iconClass} text-[#1B2D45]/40`} strokeWidth={2} />
            {baths}
          </span>
        </>
      )}
    </div>
  );
}
