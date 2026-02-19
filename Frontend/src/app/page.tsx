import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "cribb — Student Housing, Finally Done Right",
  description:
    "Find trusted, verified student housing near University of Guelph. Real reviews, transparent pricing, and a Health Score on every listing.",
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute right-0 top-0 w-[55%] h-full"
            style={{
              background:
                "linear-gradient(135deg, transparent 0%, rgba(255,107,53,0.04) 30%, rgba(255,182,39,0.06) 60%, rgba(255,107,53,0.03) 100%)",
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-20 relative z-10">
          <div className="max-w-[600px]">
            <h1
              className="text-[#1B2D45]"
              style={{ fontSize: "48px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              Student housing,
              <br />
              finally done right.
            </h1>

            <p
              className="mt-5 text-[#1B2D45]/55 max-w-[520px]"
              style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.7 }}
            >
              Find trusted, verified listings near University of Guelph. Real
              reviews, transparent pricing, and a Health Score on every listing so
              you never rent blind.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <Link
                href="/browse"
                className="px-7 py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all inline-block"
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  boxShadow: "0 4px 20px rgba(255,107,53,0.35)",
                }}
              >
                Browse Listings →
              </Link>
              <button
                className="px-7 py-3.5 rounded-xl border-2 border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.03] transition-all"
                style={{ fontSize: "16px", fontWeight: 600 }}
              >
                I&apos;m a Landlord →
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-[#FF6B35]/20 flex items-center justify-center"
                    style={{ zIndex: 4 - i, fontSize: "12px" }}
                  >
                    🎓
                  </div>
                ))}
              </div>
              <div>
                <span className="text-[#1B2D45]/70" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Trusted by{" "}
                  <span className="text-[#1B2D45]" style={{ fontWeight: 700 }}>
                    2,400+
                  </span>{" "}
                  Guelph students
                </span>
                <span className="mx-2 text-[#1B2D45]/20">·</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFB627" }}>
                  ★ 4.8
                </span>
                <span className="text-[#1B2D45]/50" style={{ fontSize: "13px", fontWeight: 400 }}>
                  {" "}average rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#FAF8F4] py-16 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800 }}>
            How cribb works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            {[
              { icon: "🔍", title: "Browse & Filter", desc: "Search by price, distance, lease length, and more. Every listing has a Health Score." },
              { icon: "📊", title: "Compare & Pin", desc: "Pin your favorites to your board. Compare health scores, reviews, and prices side by side." },
              { icon: "🤝", title: "Connect & Move In", desc: "Contact landlords directly. Read real student reviews before you commit." },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div style={{ fontSize: "40px" }}>{step.icon}</div>
                <h3 className="mt-4 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-[#1B2D45]/50" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health Score Preview */}
      <section className="py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800 }}>
              The Health Score 💚
            </h2>
            <p className="mt-3 text-[#1B2D45]/50 max-w-[500px] mx-auto" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              Every listing gets scored on what actually matters to students.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: "Price vs Market", emoji: "💰", desc: "How rent compares to similar listings" },
              { label: "Landlord Reputation", emoji: "⭐", desc: "Based on real student reviews" },
              { label: "Maintenance", emoji: "🔧", desc: "How fast issues get fixed" },
              { label: "Lease Clarity", emoji: "📋", desc: "How complete the listing info is" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl border border-black/[0.06] p-5 text-center hover:shadow-md transition-shadow"
              >
                <div style={{ fontSize: "28px" }}>{item.emoji}</div>
                <h4 className="mt-3 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                  {item.label}
                </h4>
                <p className="mt-1.5 text-[#1B2D45]/40" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF8F4] py-16 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800 }}>
            Ready to find your cribb?
          </h2>
          <p className="mt-3 text-[#1B2D45]/50" style={{ fontSize: "15px", lineHeight: 1.6 }}>
            Join thousands of Guelph students who found better housing.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block px-8 py-4 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(255,107,53,0.3)",
            }}
          >
            Start Browsing →
          </Link>
        </div>
      </section>
    </>
  );
}
