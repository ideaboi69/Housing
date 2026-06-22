import { Sparkles } from "lucide-react";

/**
 * Marks a seeded demo row as a sample so users don't mistake it for a real,
 * available listing. `pill` is the compact card variant; `note` is the fuller
 * detail-page banner.
 */
export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#1B2D45] text-white ${className}`}
      style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.02em", padding: "3px 8px" }}
      title="Demo listing — shown to preview how Cribb looks ahead of launch"
    >
      <Sparkles className="h-2.5 w-2.5" /> Sample
    </span>
  );
}

export function SampleNote({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-[#1B2D45]/12 bg-[#1B2D45]/[0.04] px-3.5 py-2.5 ${className}`}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1B2D45]" />
      <p className="text-[#1B2D45]/75" style={{ fontSize: "12.5px", lineHeight: 1.5, fontWeight: 500 }}>
        <span style={{ fontWeight: 700 }}>This is a sample.</span> It&apos;s here to show how listings look on Cribb while we onboard founding landlords ahead of our September launch.
      </p>
    </div>
  );
}
