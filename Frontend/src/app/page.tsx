"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Heart, User } from "lucide-react";

/* ════════════════════════════════════════════════════════
   Images / Data
   ════════════════════════════════════════════════════════ */

const healthBreakdowns = [
  { emoji: "📊", label: "Price", score: 82, color: "#2EC4B6" },
  { emoji: "📍", label: "Location", score: 91, color: "#4ADE80" },
  { emoji: "🏠", label: "Amenities", score: 78, color: "#2EC4B6" },
  { emoji: "⭐", label: "Tenant Reviews", score: 88, color: "#4ADE80" },
];

const founders = [
  { name: "David", program: "Computer Science", image: "/david.jpg" },
  { name: "OJ", program: "Computer Science", image: "/oj.jpg" },
];

const demands = [
  { id: 1, budget: "$500–$700/room", moveIn: "Sep 2026", tags: ["Furnished", "Near campus", "2+ bedrooms"], desc: "Looking for a 2BR apartment within walking distance of campus for Sep. Prefer furnished with utilities included.", student: "3rd year student" },
  { id: 2, budget: "$400–$550/room", moveIn: "Sep 2026", tags: ["Parking", "Laundry", "Pet-friendly"], desc: "Need a room in a shared house, ideally with parking and in-unit laundry. Flexible on distance if on a bus route.", student: "2nd year student" },
  { id: 3, budget: "$600–$800/room", moveIn: "Jan 2027", tags: ["Studio", "Downtown", "Utilities incl."], desc: "Looking for a studio or bachelor downtown for a winter sublet. Budget flexible for the right place.", student: "4th year student" },
];

const popularListings = [
  { id: "4", title: "Sunny 2BR near Stone Rd Mall", street: "45 Stone Rd W, Unit 302", price: 650, propertyType: "Apartment", beds: 2, walkTime: 12, healthScore: 92, views: 312, popular: true, image: "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBraXRjaGVuJTIwYnJpZ2h0fGVufDF8fHx8MTc3MTM5Njc5Nnww&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "1", title: "Cozy Townhouse on College Ave", street: "118 College Ave W", price: 725, propertyType: "Townhouse", beds: 3, walkTime: 5, healthScore: 88, views: 245, popular: true, image: "https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbSUyMHN0dWRlbnQlMjBob3VzaW5nfGVufDF8fHx8MTc3MTM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "2", title: "Spacious House near Campus", street: "87 Edinburgh Rd S", price: 875, propertyType: "House", beds: 5, walkTime: 8, healthScore: 95, views: 198, popular: true, image: "https://images.unsplash.com/photo-1760119097393-e022c73027d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3duaG91c2UlMjBleHRlcmlvciUyMHN1bm55fGVufDF8fHx8MTc3MTM5Njc5N3ww&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "5", title: "Modern Apartment with Balcony", street: "415 Gordon St, Unit B", price: 750, propertyType: "Apartment", beds: 3, walkTime: 10, healthScore: 81, views: 156, popular: false, image: "https://images.unsplash.com/photo-1718066236079-9085195c389e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBsaXZpbmclMjByb29tJTIwbW9kZXJuJTIwYnJpZ2h0fGVufDF8fHx8MTc3MTM5Njc5OHww&ixlib=rb-4.1.0&q=80&w=1080" },
];

const footerColumns = [
  { title: "Browse", links: [{ label: "All Listings", to: "/browse" }, { label: "Sublets", to: "/sublets" }, { label: "Near Campus", to: "/browse" }, { label: "Downtown", to: "/browse" }] },
  { title: "Community", links: [{ label: "Roommates", to: "/roommates" }, { label: "The Bubble", to: "/the-bubble" }] },
  { title: "For Landlords", links: [{ label: "List a Property", to: "/landlord/login" }, { label: "Dashboard", to: "/landlord" }, { label: "How It Works", to: "/landlord/login" }] },
  { title: "cribb", links: [{ label: "Sign Up", to: "/signup" }, { label: "Log In", to: "/login" }] },
];

const showcaseFeatures = [
  {
    id: "compare",
    title: "Pin & Compare",
    eyebrow: "Decision Mode",
    desc: "Save listings to your board, line them up side by side, and stop bouncing between tabs, screenshots, and spreadsheets.",
    accent: "#FF6B35",
    bg: "rgba(255,107,53,0.10)",
    bullets: ["Saved picks tray", "Quick price checks", "Side-by-side decisions"],
  },
  {
    id: "bubble",
    title: "The Bubble",
    eyebrow: "Campus Pulse",
    desc: "A student-first feed for housing tips, local deals, and what's happening around Guelph so the app feels useful even before you sign a lease.",
    accent: "#2EC4B6",
    bg: "rgba(46,196,182,0.10)",
    bullets: ["Housing tips", "Campus news", "Student deals"],
  },
  {
    id: "marketplace",
    title: "Cribb Marketplace",
    eyebrow: "Move-In Utility",
    desc: "Furniture, textbooks, and move-out essentials in the same ecosystem, right when students are setting up or clearing out their place.",
    accent: "#FFB627",
    bg: "rgba(255,182,39,0.12)",
    bullets: ["Buy & sell fast", "Move-in essentials", "No random middlemen"],
  },
  {
    id: "roommates",
    title: "Roommate Matching",
    eyebrow: "Build Your Group",
    desc: "Help students go from solo searchers to complete groups with compatibility cues, shareable invites, and a clearer path to filling a place.",
    accent: "#4ADE80",
    bg: "rgba(74,222,128,0.10)",
    bullets: ["Compatibility cues", "Invite links", "Group discovery"],
  },
] as const;

/* ════════════════════════════════════════════════════════
   Helper Components
   ════════════════════════════════════════════════════════ */

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const sw = 8;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const progress = (score / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,196,182,0.12)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2EC4B6" strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c - progress} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[#1B2D45]" style={{ fontSize: "36px", fontWeight: 900 }}>87</span>
        <span className="text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 600, marginTop: "-4px" }}>Great Match</span>
      </div>
    </div>
  );
}

function MiniScoreRing({ score }: { score: number }) {
  const size = 36, sw = 3, r = (size - sw) / 2, c = 2 * Math.PI * r, p = (score / 100) * c;
  const color = score >= 85 ? "#4ADE80" : score >= 65 ? "#FFB627" : "#E71D36";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.3)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c - p} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 800 }}>{score}</span>
    </div>
  );
}

function ListingPreviewCard({ listing }: { listing: typeof popularListings[0] }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link href={`/browse/${listing.id}`} className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all group block">
      <div className="relative h-[160px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute top-2.5 left-2.5"><MiniScoreRing score={listing.healthScore} /></div>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <Heart className={`w-4 h-4 ${saved ? "fill-[#E71D36] text-[#E71D36]" : "text-[#1B2D45]/40"}`} />
        </button>
        {listing.popular && <div className="absolute bottom-2.5 left-2.5 bg-[#FF6B35] text-white px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 600 }}>Popular</div>}
      </div>
      <div className="p-4">
        <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{listing.title}</h3>
        <p className="text-[#1B2D45]/40 truncate mt-0.5" style={{ fontSize: "11px", fontWeight: 400 }}>{listing.street}</p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-[#FF6B35]" style={{ fontSize: "20px", fontWeight: 800 }}>${listing.price}</span>
          <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 400 }}>/room/mo</span>
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <span className="bg-[#1B2D45]/5 text-[#1B2D45]/60 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 500 }}>{listing.propertyType}</span>
          <span className="bg-[#1B2D45]/5 text-[#1B2D45]/60 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 500 }}>{listing.beds} bed</span>
          <span className="bg-[#1B2D45]/5 text-[#1B2D45]/60 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 500 }}>🚶 {listing.walkTime} min</span>
        </div>
      </div>
    </Link>
  );
}

function ShowcaseVisual({ featureId }: { featureId: (typeof showcaseFeatures)[number]["id"] }) {
  if (featureId === "compare") {
    return (
      <div className="rounded-[28px] border border-[#1B2D45]/10 bg-[linear-gradient(180deg,#fff7f1_0%,#fffdf9_100%)] p-4 md:p-5">
        <div className="flex items-center justify-between rounded-[24px] border border-black/[0.05] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(27,45,69,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFEEE5]" style={{ fontSize: "18px" }}>📊</div>
            <div>
              <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Compare Listings</div>
              <div className="text-[#98A3B0]" style={{ fontSize: "11px", fontWeight: 500 }}>2 listings · Best values highlighted in green</div>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#98A3B0]" style={{ fontSize: "18px" }}>×</div>
        </div>

        <div className="mt-4 rounded-[24px] border border-[#FF6B35]/12 bg-[linear-gradient(135deg,rgba(255,107,53,0.04)_0%,rgba(255,182,39,0.04)_100%)] p-5">
          <div className="flex items-center gap-2">
            <span className="text-[#FF6B35]" style={{ fontSize: "15px" }}>✦</span>
            <span className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>AI Analysis</span>
          </div>
          <p className="mt-3 text-[#5C6B7A]" style={{ fontSize: "14px", lineHeight: 1.7 }}>
            Cozy Townhouse on College Ave has the strongest Cribb Score (88), suggesting better overall quality and landlord reputation. Bright Studio on Gordon St is the most budget-friendly at $680/room.
          </p>
        </div>

        <div className="mt-4 rounded-[24px] border border-black/[0.05] bg-white p-5 shadow-[0_1px_4px_rgba(27,45,69,0.04)]">
          <div className="grid gap-4 md:grid-cols-[190px_1fr_1fr]">
            <div />
            {[
              { title: "Cozy Townhouse on College Ave", address: "118 College Ave W, Guelph", score: 88, color: "#4ADE80", link: false },
              { title: "Bright Studio on Gordon St", address: "220 Gordon St, Unit 4B, Guelph", score: 79, color: "#FFB627", link: true },
            ].map((listing) => (
              <div key={listing.title}>
                <div className="relative h-[120px] rounded-[18px] bg-[linear-gradient(135deg,#F5F0E8_0%,#EEE7DC_100%)]">
                  <div className="absolute inset-0 flex items-center justify-center text-[34px]">🏡</div>
                  <div
                    className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: listing.color, fontSize: "14px", fontWeight: 800 }}
                  >
                    {listing.score}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>{listing.title}</div>
                  <div className="mt-1 text-[#B4BBC4]" style={{ fontSize: "11px", fontWeight: 600 }}>{listing.address}</div>
                  {listing.link && (
                    <div className="mt-2 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>View listing ↗</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[18px] border border-black/[0.04]">
            {[
              { label: "Price / Room", a: "$725", b: "$680", best: "b" },
              { label: "Total Rent", a: "$2,175", b: "$680", best: "b" },
              { label: "Cribb Score", a: "88", b: "79", best: "a" },
              { label: "Distance", a: "0.4 km", b: "0.5 km", best: "a" },
              { label: "Walk Time", a: "5 min", b: "6 min", best: "a" },
              { label: "Type", a: "townhouse", b: "apartment", best: "" },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-[190px_1fr_1fr] border-t border-black/[0.04] first:border-t-0">
                <div className="bg-[#FCFBF8] px-5 py-4 text-[#7E8896]" style={{ fontSize: "12px", fontWeight: 700 }}>{row.label}</div>
                <div className="px-5 py-4 text-center" style={{ fontSize: "14px", fontWeight: 700, color: row.best === "a" ? "#4ADE80" : "#1B2D45" }}>{row.a}</div>
                <div className="px-5 py-4 text-center" style={{ fontSize: "14px", fontWeight: 700, color: row.best === "b" ? "#4ADE80" : row.label === "Cribb Score" ? "#FFB627" : "#1B2D45" }}>{row.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featureId === "bubble") {
    return (
      <div className="rounded-[28px] border border-[#1B2D45]/10 bg-[radial-gradient(circle_at_top,#fff3eb_0%,#fffaf7_36%,#ffffff_100%)] p-4 md:p-5">
        <div className="rounded-[24px] border border-[#FF6B35]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(255,248,243,0.82)_100%)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[#1B2D45]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.03em" }}>
                The Bubble <span className="text-[#FF6B35]/55">◌◌</span>
              </div>
              <p className="mt-2 text-[#1B2D45]/45" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                What&apos;s happening in Guelph — events, deals, tips & more
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["🎉 Homecoming", "🍕 New Eats", "☀️ Patio Season", "🎓 Campus News"].map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1.5 text-[#1B2D45]/70 shadow-[0_1px_4px_rgba(27,45,69,0.06)]" style={{ fontSize: "11px", fontWeight: 700 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[18px] bg-[#FF6B35] px-4 py-3 text-white shadow-[0_10px_24px_rgba(255,107,53,0.2)]" style={{ fontSize: "13px", fontWeight: 700 }}>
              Become a Writer
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All Posts", active: true },
              { label: "Events" },
              { label: "Deals" },
              { label: "News" },
              { label: "Lifestyle" },
            ].map((item) => (
              <span
                key={item.label}
                className={`rounded-full px-4 py-2 ${item.active ? "bg-[#FF6B35] text-white" : "bg-white text-[#8190A3] border border-black/[0.05]"}`}
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className="flex items-center rounded-full border border-black/[0.05] bg-white p-1">
            {["Trending", "New", "Top"].map((item, index) => (
              <span
                key={item}
                className={`rounded-full px-4 py-1.5 ${index === 0 ? "bg-[#FF6B35] text-white" : "text-[#A3ACB8]"}`}
                style={{ fontSize: "11px", fontWeight: 700 }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-[#FFB627]/20 bg-[linear-gradient(135deg,#FAF8F4_0%,#FFF8E8_100%)] p-4 shadow-[0_2px_8px_rgba(255,182,39,0.08)]" style={{ borderLeft: "4px solid #FFB627" }}>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>📌 This Week in Guelph</h4>
              <span className="rounded-full bg-[#FFB627]/12 px-3 py-1 text-[#B8860B]" style={{ fontSize: "10px", fontWeight: 700 }}>Curated by cribb</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Homecoming 2026 lineup announced — tickets March 1st",
                "Yuki Ramen opens on Gordon St with student discounts",
                "UC south entrance closed for March renovations",
                "Patios are open — see the community's top picks",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 text-[#5C6B7A]" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFB627]/15 text-[#B8860B]" style={{ fontSize: "10px", fontWeight: 800 }}>
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[22px] border border-[#FF6B35]/15 bg-[linear-gradient(135deg,#FFFAF7_0%,#FFFFFF_100%)] p-4 shadow-[0_2px_12px_rgba(255,107,53,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]" style={{ fontSize: "16px" }}>✦</div>
                <div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Become a Writer</div>
                  <div className="mt-1 text-[#5C6B7A]" style={{ fontSize: "12px", lineHeight: 1.5 }}>Get the verified badge and share with the UofG community</div>
                </div>
              </div>
            </div>
            <div className="rounded-[22px] border border-black/[0.05] bg-white p-4 shadow-[0_1px_4px_rgba(27,45,69,0.04)]">
              <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>↗ Trending This Week</div>
              <div className="mt-3 space-y-3">
                {[
                  { title: "Homecoming 2026 lineup just dropped", votes: 248 },
                  { title: "Best patios to hit up this spring", votes: 201 },
                  { title: "New ramen spot on Gordon St is amazing", votes: 192 },
                ].map((item, index) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFEDE5] text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 800 }}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{item.title}</div>
                      <div className="mt-1 text-[#98A3B0]" style={{ fontSize: "11px", fontWeight: 600 }}>▲ {item.votes}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-black/[0.05] bg-white p-5 shadow-[0_1px_4px_rgba(27,45,69,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF6B35,#FFB627)] text-white" style={{ fontSize: "15px", fontWeight: 800 }}>
                J
              </div>
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>Jordan</div>
                <div className="text-[#98A3B0]" style={{ fontSize: "11px", fontWeight: 600 }}>2h ago</div>
              </div>
            </div>
            <span className="rounded-full bg-[#F2EEFF] px-3 py-1 text-[#6C5CE7]" style={{ fontSize: "10px", fontWeight: 700 }}>🎉 Events</span>
          </div>
          <div className="mt-4 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.2 }}>
            Homecoming 2026 lineup just dropped!
          </div>
          <p className="mt-3 text-[#5C6B7A]" style={{ fontSize: "14px", lineHeight: 1.7 }}>
            They got Tory Lanez and bbno$ headlining at Alumni Stadium. Tickets go live March 1st for students...
          </p>
          <div className="mt-4 flex items-center gap-4 text-[#5C6B7A]" style={{ fontSize: "12px", fontWeight: 600 }}>
            <span>📅 Sep 27, 2026</span>
            <span>📍 Alumni Stadium</span>
          </div>
        </div>
      </div>
    );
  }

  if (featureId === "marketplace") {
    return (
      <div className="rounded-[28px] border border-[#1B2D45]/10 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] p-4 md:p-5">
        <div className="rounded-[24px] border border-[#FFB627]/15 bg-white p-4 shadow-[0_10px_30px_rgba(255,182,39,0.10)]">
          <div className="mb-4 rounded-[22px] border-[2px] border-[#1B2D45] bg-[linear-gradient(135deg,#FF6B35_0%,#FFB627_100%)] px-4 py-4 text-white shadow-[5px_5px_0px_#1B2D45]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>Moving out? Sell your stuff before you leave.</div>
                <div className="mt-1 text-white/75" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  Spring move-out season is here. List items in 60 seconds.
                </div>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>
                Sell Something
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>MOVE-IN / MOVE-OUT</div>
              <div className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Marketplace that feels built into the housing flow</div>
            </div>
            <div className="rounded-full bg-[#FFB627]/15 px-3 py-1 text-[#C88700]" style={{ fontSize: "11px", fontWeight: 700 }}>
              Zero fees
            </div>
          </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
              { title: "Desk Lamp", price: "$18", tone: "#FFB627", badge: "Like New" },
              { title: "Mini Fridge", price: "$60", tone: "#FF6B35", badge: "Popular" },
              { title: "Textbook Set", price: "$35", tone: "#2EC4B6", badge: "Bundle" },
              { title: "Office Chair", price: "$40", tone: "#1B2D45", badge: "Fast pickup" },
              ].map((item) => (
              <div key={item.title} className="rounded-[22px] border border-black/[0.05] bg-[#FAF8F4] p-3">
                <div className="relative h-24 rounded-[18px]" style={{ background: `linear-gradient(135deg, ${item.tone}22 0%, #ffffff 100%)` }}>
                  <div className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1" style={{ fontSize: "9px", fontWeight: 700, color: item.tone }}>
                    {item.badge}
                  </div>
                </div>
                <div className="mt-3 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{item.title}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[#FF6B35]" style={{ fontSize: "13px", fontWeight: 800 }}>{item.price}</span>
                  <span className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 700 }}>24h</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[22px] bg-[#1B2D45] px-4 py-4 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>Moving out? Sell your stuff before you leave.</div>
                <div className="mt-1 text-white/55" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  Makes Cribb useful beyond discovery and helps students finish the move, not just find the place.
                </div>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2 text-center" style={{ fontSize: "11px", fontWeight: 700 }}>
                List in 60s
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-[#1B2D45]/10 bg-[linear-gradient(180deg,#fdfbf7_0%,#ffffff_100%)] p-4 md:p-5">
      <div className="rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-[0_1px_4px_rgba(27,45,69,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 900 }}>Roommates</div>
            <div className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 500 }}>Browse houses with availability</div>
          </div>
          <div className="rounded-[18px] bg-[#FF6B35] px-4 py-3 text-white shadow-[0_6px_0px_rgba(229,94,46,0.55)]" style={{ fontSize: "12px", fontWeight: 700 }}>
            + Create Group
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[18px] border border-black/[0.05] bg-[#FAF8F4] px-4 py-3">
          <span className="text-[#8190A3]" style={{ fontSize: "12px", fontWeight: 500 }}>🛡 Your roommate profile is active</span>
          <span className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>✏️ Redo Quiz</span>
        </div>

        <div className="mt-4 inline-flex rounded-[18px] border-[3px] border-[#1B2D45] bg-white p-1.5 shadow-[2px_2px_0px_rgba(27,45,69,0.06)]">
          <span className="rounded-[14px] bg-[#1B2D45] px-5 py-3 text-white" style={{ fontSize: "12px", fontWeight: 700 }}>👥 Groups</span>
          <span className="px-5 py-3 text-[#8190A3]" style={{ fontSize: "12px", fontWeight: 700 }}>Individuals</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["All Groups", "Need 1 More", "All Girls", "Co-ed", "Near Campus", "Downtown", "Under $700"].map((item, index) => (
            <span
              key={item}
              className={`rounded-full px-4 py-2 ${index === 0 ? "bg-[#FF6B35] text-white border-[#E55E2E]" : "bg-white text-[#1B2D45] border-[#1B2D45]"}`}
              style={{ fontSize: "11px", fontWeight: 700, borderWidth: "2.5px", boxShadow: index === 0 ? "3px 3px 0px rgba(255,107,53,0.15)" : "2px 2px 0px rgba(27,45,69,0.06)" }}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            {
              name: "REDF HOY",
              score: 71,
              banner: "linear-gradient(135deg, #FF6B35 0%, #FFB627 100%)",
              text: "2/4",
              price: "$674/mo",
              utilities: "Extra",
              moveIn: "Fall 2026",
              availability: "⏳ Has a place",
              address: "📍 Availability at BFBFFVHNVNN",
              accent: "#FFB627",
            },
            {
              name: "The Edinburgh Girls",
              score: 67,
              banner: "linear-gradient(135deg, #8294A8 0%, #C9D2DD 100%)",
              text: "3/4",
              price: "$690/mo",
              utilities: "Extra",
              moveIn: "Fall 2026",
              availability: "Verified place",
              address: "📍 Availability at 87 Edinburgh Rd S, Guelph, ON",
              accent: "#4ADE80",
            },
          ].map((group, index) => (
            <div key={group.name} className="overflow-hidden rounded-[24px] border-[3px] border-[#1B2D45] bg-white shadow-[6px_6px_0px_rgba(27,45,69,0.08)]">
              <div className="relative h-[96px] px-5 py-4 text-white" style={{ background: group.banner }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: index === 0 ? "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)" : undefined, backgroundSize: index === 0 ? "12px 12px" : undefined }} />
                <div className="relative z-10 flex items-start justify-between">
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>{group.name}</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-white bg-[#FFF7EA] text-[#FFB627]" style={{ fontSize: "13px", fontWeight: 800 }}>
                    {group.score}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[4px] border-white bg-[#FFE7DA] text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 800 }}>D</div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[4px] border-white bg-[#FFE7DA] text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 800 }}>{index === 0 ? "R" : "A"}</div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[4px] border-dashed border-[#F2D9CB] bg-[#FFF7F1] text-[#FFB08B]" style={{ fontSize: "14px", fontWeight: 700 }}>+</div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[4px] border-dashed border-[#F2D9CB] bg-[#FFF7F1] text-[#FFB08B]" style={{ fontSize: "14px", fontWeight: 700 }}>{index === 0 ? "+" : ""}</div>
                  </div>
                  <span className="text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 700 }}>{group.text}</span>
                </div>
                <p className="mt-4 text-[#8190A3]" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  {index === 0
                    ? "Looking for a couple more people to fill a place with a calm, tidy vibe."
                    : "3 girls looking for 1 more to fill our 4-bedroom on Edinburgh."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "Rent", value: group.price },
                    { label: "Utilities", value: group.utilities },
                    { label: "Move-in", value: group.moveIn },
                    { label: "Availability", value: group.availability },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-black/[0.05] bg-[#FAF8F4] px-4 py-3">
                      <div className="text-[#98A3B0]" style={{ fontSize: "10px", fontWeight: 700 }}>{item.label}</div>
                      <div className={`${item.label === "Availability" ? "" : "text-[#6C7787]"}`} style={{ fontSize: "12px", fontWeight: 700, color: item.label === "Availability" ? group.accent : undefined }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-[16px] border px-4 py-3" style={{ borderColor: `${group.accent}30`, background: `${group.accent}10`, color: group.accent, fontSize: "12px", fontWeight: 700 }}>
                  {group.address}
                </div>
                <div className="mt-4 text-right text-[#FF6B35]" style={{ fontSize: "13px", fontWeight: 700 }}>
                  View group →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [activeShowcase, setActiveShowcase] = useState<(typeof showcaseFeatures)[number]["id"]>("compare");
  const activeFeature = showcaseFeatures.find((feature) => feature.id === activeShowcase) ?? showcaseFeatures[0];

  return (
    <>
      {/* ═══ 1. HERO ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 relative z-10">
          <div className="flex items-center gap-12 lg:gap-16">
            {/* Left — copy */}
            <div className="max-w-[520px] shrink-0">
              <h1 className="text-[#1B2D45]" style={{ fontSize: "48px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Student housing,<br />finally done right.
              </h1>
              <p className="mt-5 text-[#1B2D45]/55 max-w-[480px]" style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.7 }}>
                Find trusted, verified listings near University of Guelph. Real reviews, transparent pricing, and a Cribb Score on every listing so you never rent blind.
              </p>
              <div className="flex items-center gap-3 mt-8">
                <Link href="/browse" className="px-7 py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all inline-block" style={{ fontSize: "16px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.35)" }}>
                  Browse Listings →
                </Link>
                <Link href="/landlord/login" className="px-7 py-3.5 rounded-xl border-2 border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.03] transition-all inline-block" style={{ fontSize: "16px", fontWeight: 600 }}>
                  I&apos;m a Landlord →
                </Link>
              </div>
              {/* Honest tagline */}
              <div className="flex items-center gap-3 mt-8 flex-wrap">
                <div className="inline-flex items-center gap-2 bg-[#FAF8F4] border border-black/5 rounded-full px-4 py-1.5">
                  <span style={{ fontSize: "13px" }}>🎓</span>
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>Built by UofG students</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#FAF8F4] border border-black/5 rounded-full px-4 py-1.5">
                  <span style={{ fontSize: "13px" }}>💚</span>
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>Cribb Score on every listing</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#FAF8F4] border border-black/5 rounded-full px-4 py-1.5">
                  <span style={{ fontSize: "13px" }}>🔒</span>
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>Sign in with your @uoguelph.ca email</span>
                </div>
              </div>
            </div>

            {/* Right — scrolling photo mosaic */}
            <div className="hidden lg:block flex-1 relative" style={{ height: "420px" }}>
              {/* Fade edges */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="flex gap-3" style={{ height: "100%" }}>
                  {/* Column 1 — scrolls up */}
                  <div className="flex-1 flex flex-col gap-3 animate-scroll-up">
                    {[
                      "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1579632151052-92f741fb9b79?w=400&h=350&fit=crop",
                      "https://images.unsplash.com/photo-1718066236079-9085195c389e?w=400&h=280&fit=crop",
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=320&fit=crop",
                      "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1579632151052-92f741fb9b79?w=400&h=350&fit=crop",
                    ].map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`c1-${url}-${i}`} src={url} alt="" className="w-full rounded-xl object-cover" style={{ height: i % 2 === 0 ? "200px" : "240px" }} />
                    ))}
                  </div>
                  {/* Column 2 — scrolls down */}
                  <div className="flex-1 flex flex-col gap-3 animate-scroll-down">
                    {[
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=280&fit=crop",
                      "https://images.unsplash.com/photo-1760119097393-e022c73027d1?w=400&h=320&fit=crop",
                      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=350&fit=crop",
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=280&fit=crop",
                      "https://images.unsplash.com/photo-1760119097393-e022c73027d1?w=400&h=320&fit=crop",
                    ].map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`c2-${url}-${i}`} src={url} alt="" className="w-full rounded-xl object-cover" style={{ height: i % 2 === 0 ? "230px" : "190px" }} />
                    ))}
                  </div>
                  {/* Column 3 — scrolls up slower */}
                  <div className="flex-1 flex flex-col gap-3 animate-scroll-up-slow">
                    {[
                      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=320&fit=crop",
                      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=280&fit=crop",
                      "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?w=400&h=350&fit=crop",
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=320&fit=crop",
                      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=280&fit=crop",
                    ].map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`c3-${url}-${i}`} src={url} alt="" className="w-full rounded-xl object-cover" style={{ height: i % 2 === 0 ? "210px" : "250px" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. FEATURE SHOWCASE ══════════════════════════ */}
      <section className="bg-[#FAF8F4] py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              More than just listings.
            </h2>
            <p className="text-[#1B2D45]/60 mt-4 max-w-2xl mx-auto" style={{ fontSize: "16px", lineHeight: 1.7 }}>
              Cribb works best when it feels like your housing control center: compare options, stay plugged into student life, and handle everything around the move.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {showcaseFeatures.map((feature) => {
                const isActive = feature.id === activeFeature.id;
                return (
                  <motion.button
                    key={feature.id}
                    type="button"
                    onClick={() => setActiveShowcase(feature.id)}
                    onMouseEnter={() => setActiveShowcase(feature.id)}
                    onFocus={() => setActiveShowcase(feature.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className={`rounded-[26px] border p-5 text-left transition-all ${
                      isActive
                        ? "bg-white shadow-[0_18px_40px_rgba(27,45,69,0.10)]"
                        : "bg-white/65 hover:bg-white hover:shadow-[0_12px_28px_rgba(27,45,69,0.08)]"
                    }`}
                    style={{ borderColor: isActive ? `${feature.accent}45` : "rgba(27,45,69,0.06)" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full px-2.5 py-1" style={{ background: feature.bg, color: feature.accent, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>
                          {feature.eyebrow}
                        </div>
                        <h3 className="mt-3 text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1.15 }}>
                          {feature.title}
                        </h3>
                      </div>
                      <div
                        className="mt-1 h-3.5 w-3.5 rounded-full border-[3px] shrink-0"
                        style={{
                          borderColor: isActive ? feature.accent : "rgba(27,45,69,0.18)",
                          backgroundColor: isActive ? feature.accent : "transparent",
                        }}
                      />
                    </div>
                    <p className="mt-3 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                      {feature.desc}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {feature.bullets.map((bullet) => (
                        <span key={bullet} className="rounded-full border border-black/[0.05] bg-[#FAF8F4] px-2.5 py-1 text-[#1B2D45]/55" style={{ fontSize: "10px", fontWeight: 700 }}>
                          {bullet}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="rounded-[34px] border border-black/[0.06] bg-white p-4 md:p-5 shadow-[0_24px_60px_rgba(27,45,69,0.08)]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1"
                  style={{
                    background: activeFeature.bg,
                    color: activeFeature.accent,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  {activeFeature.eyebrow}
                </span>
                <span className="rounded-full bg-[#1B2D45]/[0.05] px-3 py-1 text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 700 }}>
                  Featured workflow
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: 16, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.985 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <div className="mt-4 max-w-[620px]">
                    <h3 className="text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 800, lineHeight: 1.1 }}>
                      {activeFeature.title}
                    </h3>
                    <p className="mt-3 text-[#1B2D45]/55" style={{ fontSize: "15px", lineHeight: 1.7 }}>
                      {activeFeature.desc}
                    </p>
                  </div>

                  <div className="mt-7">
                    <ShowcaseVisual featureId={activeFeature.id} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. HEALTH SCORE ═══════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="bg-white rounded-3xl border border-black/5 p-10 flex flex-col md:flex-row gap-10 md:gap-16 items-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex-1 min-w-0">
              <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.2 }}>Every listing gets<br />a Cribb Score</h2>
              <p className="mt-4 text-[#1B2D45]/50 max-w-[440px]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7 }}>No more guessing. Every listing is scored 0-100 based on price, location, amenities, and real tenant reviews — so you can compare with confidence.</p>
              <div className="flex items-center gap-5 mt-7 flex-wrap">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#4ADE80]" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>85+ Great Match</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FFB627]" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>65-84 Good Option</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#E71D36]" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>&lt;65 Review Carefully</span></div>
              </div>
              <p className="mt-5 text-[#1B2D45]/35" style={{ fontSize: "12px", fontWeight: 400, fontStyle: "italic" }}>Scores update as tenant reviews come in. New listings are scored on property data alone.</p>
            </div>
            <div className="w-full md:w-[380px] shrink-0">
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                <div className="flex justify-center mb-6"><ScoreRing score={87} size={120} /></div>
                <div className="space-y-3">
                  {healthBreakdowns.map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "13px" }}>{b.emoji}</span>
                          <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{b.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{b.score}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1B2D45]/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${b.score}%`, backgroundColor: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. BUILT BY STUDENTS ═════════════════════════ */}
      <section style={{ backgroundColor: "#F5F0E8" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
          <h2 className="text-[#1B2D45] max-w-[600px] mx-auto" style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.25 }}>Built by students who got tired of the housing search.</h2>
          <p className="mt-4 text-[#1B2D45]/50 max-w-[560px] mx-auto" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7 }}>
            We spent too long on sketchy sites, ghosted by landlords, and signing leases we didn&apos;t understand. So we built cribb — the platform we wish existed in first year.
          </p>
          <div className="flex items-center justify-center gap-12 mt-10">
            {founders.map((f) => (
              <div key={f.name} className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.image} alt={f.name} className="w-20 h-20 rounded-full object-cover border-[3px] border-white shadow-sm" />
                <span className="mt-3 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>{f.name}</span>
                <span className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 400 }}>{f.program}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/60 border border-black/5 rounded-full px-4 py-1.5">
            <span style={{ fontSize: "13px" }}>🎓</span>
            <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>University of Guelph</span>
          </div>
        </div>
      </section>

      {/* ═══ 6. DEMAND BOARD PREVIEW ══════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800 }}>Students are looking for housing right now</h2>
          <p className="text-[#1B2D45]/50 mt-2" style={{ fontSize: "15px", fontWeight: 400 }}>Post what you need on the Demand Board — let landlords come to you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {demands.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-black/[0.06] p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#FF6B35]" style={{ fontSize: "17px", fontWeight: 700 }}>{d.budget}</span>
                <span className="bg-[#1B2D45]/[0.06] text-[#1B2D45]/60 px-2.5 py-1 rounded-lg" style={{ fontSize: "11px", fontWeight: 600 }}>{d.moveIn}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {d.tags.map((tag) => (
                  <span key={tag} className="bg-[#FF6B35]/[0.08] text-[#FF6B35] px-2.5 py-0.5 rounded-full border border-[#FF6B35]/[0.12]" style={{ fontSize: "11px", fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
              <p className="text-[#1B2D45]/50 mb-4" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.6 }}>{d.desc}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-black/5">
                <div className="w-6 h-6 rounded-full bg-[#1B2D45]/[0.08] flex items-center justify-center"><User className="w-3 h-3 text-[#1B2D45]/40" /></div>
                <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>{d.student}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="px-7 py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}>Post Your Request →</button>
        </div>
      </section>

      {/* ═══ 7. POPULAR LISTINGS ══════════════════════════ */}
      <section className="bg-[#FAF8F4]">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800 }}>Popular near campus 🔥</h2>
            <Link href="/browse" className="text-[#FF6B35] hover:underline" style={{ fontSize: "14px", fontWeight: 600 }}>See all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularListings.map((listing) => <ListingPreviewCard key={listing.id} listing={listing} />)}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════ */}
      <footer className="bg-[#1B2D45]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-8 md:mb-14">
            <div className="md:w-[200px] shrink-0">
              <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}>cribb</Link>
              <p className="text-white/30 mt-2" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.6 }}>Student housing, finally done right.</p>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h4 className="text-white/50 mb-3 md:mb-4" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{col.title}</h4>
                  <ul className="space-y-2 md:space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}><Link href={link.to} className="text-white/40 hover:text-white/70 transition-colors" style={{ fontSize: "13px", fontWeight: 400 }}>{link.label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.08]" />
          <div className="flex flex-col md:flex-row items-center justify-between mt-4 md:mt-6 gap-3">
            <span className="text-white/25" style={{ fontSize: "12px", fontWeight: 400 }}>© 2026 cribb · Built for UoG students 🐻‍❄️</span>
            <div className="flex items-center gap-3 md:gap-5 flex-wrap justify-center">
              <span className="text-white/30 hidden md:inline" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.03em" }}>HEALTH SCORE</span>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4ADE80]" /><span className="text-white/30" style={{ fontSize: "11px" }}>85+ Great</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FFB627]" /><span className="text-white/30" style={{ fontSize: "11px" }}>65-84 Good</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#E71D36]" /><span className="text-white/30" style={{ fontSize: "11px" }}>&lt;65 Caution</span></div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
