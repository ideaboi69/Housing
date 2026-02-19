import Link from "next/link";

export default function SubletsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <h1 className="text-[#1B2D45]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Summer Sublets ☀️
        </h1>
        <p className="mt-2 text-[#1B2D45]/50" style={{ fontSize: "14px" }}>
          Find and list summer sublets. Date-based search, price negotiation, and roommate info.
        </p>
        <div className="mt-12 text-center py-20 bg-white rounded-xl border border-black/[0.06]">
          <div style={{ fontSize: "48px" }}>🏗️</div>
          <h3 className="mt-4 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>
            Coming Soon
          </h3>
          <p className="mt-2 text-[#1B2D45]/40" style={{ fontSize: "14px" }}>
            The sublet marketplace is being built. Check back soon!
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            Browse Regular Listings →
          </Link>
        </div>
      </div>
    </div>
  );
}
