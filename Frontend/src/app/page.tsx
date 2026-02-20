"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Pin, MessageCircle, ChevronRight, Heart, User } from "lucide-react";

/* ════════════════════════════════════════════════════════
   Images / Data
   ════════════════════════════════════════════════════════ */

const neighborhoods = [
  { name: "Campus", listings: 24, avgRent: "$620", x: 48, y: 42, w: 22, h: 28, color: "rgba(46,196,182,0.25)", borderColor: "rgba(46,196,182,0.5)", labelColor: "#2EC4B6" },
  { name: "Stone Road", listings: 18, avgRent: "$580", x: 38, y: 12, w: 26, h: 22, color: "rgba(255,107,53,0.2)", borderColor: "rgba(255,107,53,0.45)", labelColor: "#FF6B35" },
  { name: "South End", listings: 31, avgRent: "$640", x: 58, y: 60, w: 24, h: 26, color: "rgba(46,196,182,0.18)", borderColor: "rgba(46,196,182,0.4)", labelColor: "#4ADE80" },
  { name: "Downtown", listings: 15, avgRent: "$710", x: 16, y: 35, w: 24, h: 30, color: "rgba(255,182,39,0.2)", borderColor: "rgba(255,182,39,0.45)", labelColor: "#FFB627" },
  { name: "Exhibition", listings: 12, avgRent: "$550", x: 72, y: 30, w: 18, h: 24, color: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.4)", labelColor: "#A855F7" },
];

const landmarks = [
  { name: "UoG Main", x: 52, y: 48, size: 6 },
  { name: "Stone Rd Mall", x: 45, y: 20, size: 4 },
  { name: "Bus Terminal", x: 24, y: 42, size: 4 },
  { name: "Exhibition Park", x: 78, y: 38, size: 4 },
  { name: "Guelph Lake", x: 85, y: 15, size: 5 },
];

const healthBreakdowns = [
  { emoji: "📊", label: "Price vs Market", weight: 30, score: 82, color: "#2EC4B6" },
  { emoji: "⭐", label: "Landlord Reputation", weight: 30, score: 91, color: "#4ADE80" },
  { emoji: "🔧", label: "Maintenance Speed", weight: 20, score: 88, color: "#4ADE80" },
  { emoji: "📋", label: "Lease Clarity", weight: 20, score: 85, color: "#2EC4B6" },
];

const howItWorksSteps = [
  { icon: <Search className="w-6 h-6 text-white" />, bg: "#FF6B35", title: "Browse & Filter", desc: "Search by price, distance, lease type, furnishing, and more. Every listing shows walk time and bus time to campus." },
  { icon: <Pin className="w-6 h-6 text-white" />, bg: "#2EC4B6", title: "Save & Compare", desc: "Pin listings to your board. Compare health scores, prices, and reviews side by side." },
  { icon: <MessageCircle className="w-6 h-6 text-white" />, bg: "#1B2D45", title: "Contact with Confidence", desc: "Reach out to verified landlords. You'll know their ratings, response time, and what other students say." },
];

const founders = [
  { name: "David", program: "4th year, Software Engineering", image: "https://images.unsplash.com/photo-1724118135481-50436d913231?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" },
  { name: "OJ", program: "3rd year, Marketing Management", image: "https://images.unsplash.com/photo-1611181355758-089959e2cfb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGJveSUyMHN0dWRlbnQlMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNDA2NjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080" },
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
  { title: "Community", links: [{ label: "Roommates", to: "/roommates" }, { label: "Demand Board", to: "/demand-board" }, { label: "Reviews", to: "#" }] },
  { title: "For Landlords", links: [{ label: "List a Property", to: "#" }, { label: "Pricing", to: "#" }, { label: "How It Works", to: "#" }] },
  { title: "About", links: [{ label: "Our Story", to: "#" }, { label: "Contact", to: "#" }, { label: "Privacy", to: "#" }, { label: "Terms", to: "#" }] },
];

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

/* ════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════ */

export default function HomePage() {
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
                Find trusted, verified listings near University of Guelph. Real reviews, transparent pricing, and a Health Score on every listing so you never rent blind.
              </p>
              <div className="flex items-center gap-3 mt-8">
                <Link href="/browse" className="px-7 py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all inline-block" style={{ fontSize: "16px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.35)" }}>
                  Browse Listings →
                </Link>
                <button className="px-7 py-3.5 rounded-xl border-2 border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.03] transition-all" style={{ fontSize: "16px", fontWeight: 600 }}>
                  I&apos;m a Landlord →
                </button>
              </div>
              {/* Honest tagline */}
              <div className="flex items-center gap-3 mt-8 flex-wrap">
                <div className="inline-flex items-center gap-2 bg-[#FAF8F4] border border-black/5 rounded-full px-4 py-1.5">
                  <span style={{ fontSize: "13px" }}>🎓</span>
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>Built by UofG students</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#FAF8F4] border border-black/5 rounded-full px-4 py-1.5">
                  <span style={{ fontSize: "13px" }}>💚</span>
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>Health Score on every listing</span>
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
                      <img key={`c1-${i}`} src={url} alt="" className="w-full rounded-xl object-cover" style={{ height: i % 2 === 0 ? "200px" : "240px" }} />
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
                      <img key={`c2-${i}`} src={url} alt="" className="w-full rounded-xl object-cover" style={{ height: i % 2 === 0 ? "230px" : "190px" }} />
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
                      <img key={`c3-${i}`} src={url} alt="" className="w-full rounded-xl object-cover" style={{ height: i % 2 === 0 ? "210px" : "250px" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. NEIGHBORHOOD MAP ═══════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.01em" }}>Explore by neighborhood</h2>
          <p className="text-[#1B2D45]/50 mt-2" style={{ fontSize: "15px", fontWeight: 400 }}>Click a neighborhood to see listings in that area.</p>
        </div>
        <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden mx-auto" style={{ background: "#0D1B2A", height: "360px", maxWidth: "1000px" }}>
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
            {Array.from({ length: 20 }).map((_, i) => <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 5}%`} x2="100%" y2={`${(i + 1) * 5}%`} stroke="white" strokeWidth="1" />)}
            {Array.from({ length: 20 }).map((_, i) => <line key={`v-${i}`} x1={`${(i + 1) * 5}%`} y1="0" x2={`${(i + 1) * 5}%`} y2="100%" stroke="white" strokeWidth="1" />)}
          </svg>
          {/* Roads */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <line x1="10%" y1="30%" x2="90%" y2="30%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <line x1="15%" y1="70%" x2="85%" y2="70%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <line x1="50%" y1="5%" x2="50%" y2="95%" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <line x1="30%" y1="10%" x2="30%" y2="90%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <line x1="70%" y1="10%" x2="70%" y2="90%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
          </svg>
          {/* Neighborhood zones */}
          {neighborhoods.map((n) => (
            <div key={n.name} className="absolute rounded-xl cursor-pointer transition-all hover:scale-105 group" style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.w}%`, height: `${n.h}%`, transform: "translate(-50%, -50%)", background: n.color, border: `1.5px solid ${n.borderColor}` }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span style={{ fontSize: "12px", fontWeight: 700, color: n.labelColor, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{n.name}</span>
                <span style={{ fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{n.listings} listings</span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>avg. {n.avgRent}/rm</span>
              </div>
            </div>
          ))}
          {/* Landmarks */}
          {landmarks.map((l) => (
            <div key={l.name} className="absolute group" style={{ left: `${l.x}%`, top: `${l.y}%`, transform: "translate(-50%, -50%)" }}>
              <div className="rounded-full bg-white/20 border border-white/30" style={{ width: l.size, height: l.size }} />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/10 backdrop-blur-sm text-white/70 px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 500 }}>{l.name}</div>
            </div>
          ))}
          {/* UoG marker */}
          <div className="absolute" style={{ left: "52%", top: "48%", transform: "translate(-50%, -50%)" }}>
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[#2EC4B6] animate-ping absolute inset-0 opacity-40" />
              <div className="w-3 h-3 rounded-full bg-[#2EC4B6] border-2 border-white/40 relative z-10" />
            </div>
          </div>
          {/* Legend */}
          <div className="absolute bottom-3 left-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
              <span style={{ fontSize: "9px", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>University of Guelph</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span style={{ fontSize: "9px", fontWeight: 500, color: "rgba(255,255,255,0.3)" }}>Landmark</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. HEALTH SCORE ═══════════════════════════════ */}
      <section className="bg-[#FAF8F4]">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="bg-white rounded-3xl border border-black/5 p-10 flex flex-col md:flex-row gap-10 md:gap-16 items-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex-1 min-w-0">
              <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.2 }}>Every listing gets<br />a Health Score</h2>
              <p className="mt-4 text-[#1B2D45]/50 max-w-[440px]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7 }}>No more guessing. Every score is computed from real data and student reviews — so you can compare listings with confidence.</p>
              <div className="flex items-center gap-5 mt-7 flex-wrap">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#4ADE80]" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>85+ Great Match</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FFB627]" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>65-84 Good Option</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#E71D36]" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>&lt;65 Review Carefully</span></div>
              </div>
              <p className="mt-5 text-[#1B2D45]/35" style={{ fontSize: "12px", fontWeight: 400, fontStyle: "italic" }}>No hidden ratings. No fake reviews. Just transparent data.</p>
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
                          <span className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 500 }}>{b.weight}%</span>
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

      {/* ═══ 4. HOW IT WORKS ═══════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 800 }}>How it works</h2>
        </div>
        <div className="flex flex-col md:flex-row items-start gap-4">
          {howItWorksSteps.map((step, i) => (
            <div key={step.title} className="flex items-start flex-1">
              <div className="bg-white rounded-2xl border border-black/5 p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex-1 text-center hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-shadow">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: step.bg }}>{step.icon}</div>
                <h3 className="text-[#1B2D45] mb-2" style={{ fontSize: "17px", fontWeight: 700 }}>{step.title}</h3>
                <p className="text-[#1B2D45]/50" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
              {i < howItWorksSteps.length - 1 && (
                <div className="hidden md:flex items-center px-2 mt-20 shrink-0">
                  <div className="w-8 border-t-2 border-dashed border-[#1B2D45]/10" />
                  <ChevronRight className="w-4 h-4 text-[#1B2D45]/15 -ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 5. BUILT BY STUDENTS ═════════════════════════ */}
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
