"use client";

import { useState } from "react";
import {
  User, Lock, Bell, Home, Users, Shield, ChevronRight,
  Camera, Check, Eye, EyeOff, Trash2, Moon, Sun,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type SettingsTab = "profile" | "preferences" | "roommate" | "notifications" | "account";

interface TabDef {
  key: SettingsTab;
  label: string;
  icon: typeof User;
  description: string;
}

const TABS: TabDef[] = [
  { key: "profile", label: "Profile", icon: User, description: "Your personal information" },
  { key: "preferences", label: "Housing Preferences", icon: Home, description: "Budget, move-in, and area" },
  { key: "roommate", label: "Roommate Profile", icon: Users, description: "Lifestyle & matching settings" },
  { key: "notifications", label: "Notifications", icon: Bell, description: "Email and push alerts" },
  { key: "account", label: "Account & Security", icon: Lock, description: "Password, email, and data" },
];

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";
const labelClass = "text-[#5C6B7A] block mb-1.5";
const labelStyle = { fontSize: "11px" as const, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] p-5 md:p-6" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
      <div className="mb-5">
        <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>{title}</h3>
        {description && <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "12px" }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-black/[0.04] mt-5">
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all disabled:opacity-50"
        style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{label}</span>
      <button onClick={() => onChange(!enabled)}
        className={`w-10 h-[22px] rounded-full transition-colors relative ${enabled ? "bg-[#FF6B35]" : "bg-[#E8E4DC]"}`}>
        <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform shadow-sm ${enabled ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
      </button>
    </div>
  );
}

function PillSelector({ options, selected, onChange, multi = false }: {
  options: { key: string; label: string; emoji?: string }[];
  selected: string[];
  onChange: (keys: string[]) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt.key);
        return (
          <button key={opt.key}
            onClick={() => {
              if (multi) {
                onChange(isActive ? selected.filter((k) => k !== opt.key) : [...selected, opt.key]);
              } else {
                onChange([opt.key]);
              }
            }}
            className={`px-3 py-1.5 rounded-full border transition-all ${
              isActive
                ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                : "border-[#E8E4DC] bg-white text-[#5C6B7A] hover:border-[#1B2D45]/20"
            }`}
            style={{ fontSize: "12px", fontWeight: 600 }}>
            {opt.emoji && <span className="mr-1">{opt.emoji}</span>}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROFILE TAB
   ═══════════════════════════════════════════════════════ */

function ProfileTab() {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [program, setProgram] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1200);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Profile Photo">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #FFB627)", fontSize: "28px", fontWeight: 700 }}>
              {(firstName?.[0] || "").toUpperCase()}{(lastName?.[0] || "").toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-black/[0.08] flex items-center justify-center shadow-sm hover:bg-[#FAF8F4] transition-colors">
              <Camera className="w-3.5 h-3.5 text-[#5C6B7A]" />
            </button>
          </div>
          <div>
            <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>Upload a photo</p>
            <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>JPG, PNG up to 5MB. This will be visible on your roommate profile.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal Information" description="This info is used across cribb">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Program</label>
              <input type="text" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g. Computer Science" className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }}>
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year+</option>
                <option value="grad">Graduate</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few words about yourself..." rows={3}
              className={`${inputClass} resize-none`} style={{ fontSize: "13px", lineHeight: 1.6 }} />
            <p className="text-[#98A3B0] mt-1 text-right" style={{ fontSize: "10px" }}>{bio.length}/200</p>
          </div>
        </div>
        <SaveBar onSave={handleSave} saving={saving} />
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HOUSING PREFERENCES TAB
   ═══════════════════════════════════════════════════════ */

function PreferencesTab() {
  const [budget, setBudget] = useState("700");
  const [moveIn, setMoveIn] = useState("");
  const [leaseTerm, setLeaseTerm] = useState(["12-month"]);
  const [areas, setAreas] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [mustHaves, setMustHaves] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-5">
      <SectionCard title="Budget & Timing" description="Helps us show you relevant listings">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Monthly Budget (CAD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A3B0]" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className={`${inputClass} pl-7`} style={{ fontSize: "13px", fontWeight: 500 }} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Ideal Move-in Date</label>
              <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className={inputClass} style={{ fontSize: "13px" }} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Lease Term</label>
            <PillSelector options={[
              { key: "4-month", label: "4 months" },
              { key: "8-month", label: "8 months" },
              { key: "12-month", label: "12 months" },
              { key: "flexible", label: "Flexible" },
            ]} selected={leaseTerm} onChange={setLeaseTerm} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Location & Property" description="What kind of place are you looking for?">
        <div className="space-y-4">
          <div>
            <label className={labelClass} style={labelStyle}>Preferred Areas</label>
            <PillSelector multi options={[
              { key: "near-campus", label: "Near Campus", emoji: "🎓" },
              { key: "downtown", label: "Downtown", emoji: "🏙️" },
              { key: "south-end", label: "South End", emoji: "🌳" },
              { key: "east-end", label: "East End", emoji: "🏘️" },
              { key: "west-end", label: "West End", emoji: "🛣️" },
              { key: "stone-rd", label: "Stone Rd Area", emoji: "🛒" },
            ]} selected={areas} onChange={setAreas} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Property Type</label>
            <PillSelector multi options={[
              { key: "house", label: "House", emoji: "🏠" },
              { key: "apartment", label: "Apartment", emoji: "🏢" },
              { key: "basement", label: "Basement", emoji: "🪜" },
              { key: "townhouse", label: "Townhouse", emoji: "🏘️" },
              { key: "studio", label: "Studio", emoji: "🛏️" },
            ]} selected={propertyTypes} onChange={setPropertyTypes} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Must-Haves</label>
            <PillSelector multi options={[
              { key: "furnished", label: "Furnished" },
              { key: "parking", label: "Parking" },
              { key: "utilities", label: "Utilities Incl." },
              { key: "laundry", label: "In-unit Laundry" },
              { key: "ac", label: "A/C" },
              { key: "pets", label: "Pet Friendly" },
              { key: "dishwasher", label: "Dishwasher" },
            ]} selected={mustHaves} onChange={setMustHaves} />
          </div>
        </div>
        <SaveBar onSave={() => {}} saving={saving} />
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOMMATE PROFILE TAB
   ═══════════════════════════════════════════════════════ */

function RoommateTab() {
  const [visible, setVisible] = useState(true);
  const [sleepSchedule, setSleepSchedule] = useState<string[]>([]);
  const [cleanliness, setCleanliness] = useState<string[]>([]);
  const [noise, setNoise] = useState<string[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-5">
      <SectionCard title="Profile Visibility">
        <Toggle enabled={visible} onChange={setVisible} label="Show me in Roommate matching" />
        <p className="text-[#98A3B0] -mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
          When enabled, other students can discover your profile. Your last name and contact info stay hidden until you mutually match.
        </p>
      </SectionCard>

      <SectionCard title="My Lifestyle" description="Used to match you with compatible roommates">
        <div className="space-y-5">
          <div>
            <label className={labelClass} style={labelStyle}>Sleep Schedule</label>
            <PillSelector options={[
              { key: "early-bird", label: "Early Bird", emoji: "🌅" },
              { key: "night-owl", label: "Night Owl", emoji: "🦉" },
              { key: "flexible-sleep", label: "Flexible", emoji: "😴" },
            ]} selected={sleepSchedule} onChange={setSleepSchedule} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Cleanliness</label>
            <PillSelector options={[
              { key: "very-clean", label: "Very Clean", emoji: "✨" },
              { key: "moderate", label: "Moderate", emoji: "👍" },
              { key: "relaxed", label: "Relaxed", emoji: "🤙" },
            ]} selected={cleanliness} onChange={setCleanliness} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Noise Level</label>
            <PillSelector options={[
              { key: "quiet", label: "Quiet", emoji: "🤫" },
              { key: "moderate-noise", label: "Moderate", emoji: "🎵" },
              { key: "lively", label: "Lively", emoji: "🎉" },
            ]} selected={noise} onChange={setNoise} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Guests & Social</label>
            <PillSelector options={[
              { key: "rarely", label: "Rarely have guests", emoji: "🏠" },
              { key: "sometimes", label: "Sometimes", emoji: "👋" },
              { key: "social", label: "Love hosting", emoji: "🥳" },
            ]} selected={guests} onChange={setGuests} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Vibe Tags" description="Pick up to 5 that describe you">
        <PillSelector multi options={[
          { key: "studious", label: "Studious", emoji: "📚" },
          { key: "gym-rat", label: "Gym Rat", emoji: "💪" },
          { key: "gamer", label: "Gamer", emoji: "🎮" },
          { key: "cook", label: "Loves Cooking", emoji: "🍳" },
          { key: "outdoorsy", label: "Outdoorsy", emoji: "🥾" },
          { key: "music", label: "Music Lover", emoji: "🎧" },
          { key: "pet-lover", label: "Pet Lover", emoji: "🐶" },
          { key: "introvert", label: "Introvert", emoji: "🧘" },
          { key: "extrovert", label: "Extrovert", emoji: "🗣️" },
          { key: "creative", label: "Creative", emoji: "🎨" },
          { key: "foodie", label: "Foodie", emoji: "🍕" },
          { key: "420", label: "420 Friendly", emoji: "🌿" },
        ]} selected={lifestyle} onChange={(keys) => setLifestyle(keys.slice(0, 5))} />
        <p className="text-[#98A3B0] mt-2" style={{ fontSize: "10px" }}>{lifestyle.length}/5 selected</p>
      </SectionCard>

      <SectionCard title="Dealbreakers" description="Things you can't compromise on">
        <PillSelector multi options={[
          { key: "no-smoking", label: "No Smoking", emoji: "🚭" },
          { key: "no-pets", label: "No Pets", emoji: "🚫🐱" },
          { key: "no-parties", label: "No Loud Parties", emoji: "🔇" },
          { key: "no-overnight", label: "No Overnight Guests", emoji: "🚪" },
          { key: "same-gender", label: "Same Gender Only", emoji: "👤" },
        ]} selected={dealbreakers} onChange={setDealbreakers} />
        <SaveBar onSave={() => {}} saving={saving} />
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════════════ */

function NotificationsTab() {
  const [emailNew, setEmailNew] = useState(true);
  const [emailPrice, setEmailPrice] = useState(true);
  const [emailMatch, setEmailMatch] = useState(true);
  const [emailBubble, setEmailBubble] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-5">
      <SectionCard title="Email Notifications" description="What should we email you about?">
        <div className="divide-y divide-black/[0.04]">
          <Toggle enabled={emailNew} onChange={setEmailNew} label="New listings matching my preferences" />
          <Toggle enabled={emailPrice} onChange={setEmailPrice} label="Price drops on saved listings" />
          <Toggle enabled={emailMatch} onChange={setEmailMatch} label="New roommate matches" />
          <Toggle enabled={emailBubble} onChange={setEmailBubble} label="Weekly Bubble digest" />
          <Toggle enabled={emailMarketing} onChange={setEmailMarketing} label="cribb news and updates" />
        </div>
        <SaveBar onSave={() => {}} saving={saving} />
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACCOUNT & SECURITY TAB
   ═══════════════════════════════════════════════════════ */

function AccountTab() {
  const { user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-5">
      <SectionCard title="Email Address">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {user?.email_verified ? (
                <span className="flex items-center gap-1 text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 600 }}>
                  <Shield className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#FFB627]" style={{ fontSize: "11px", fontWeight: 600 }}>
                  <Shield className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
          </div>
          <button className="px-3.5 py-2 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:border-[#1B2D45]/20 transition-colors"
            style={{ fontSize: "12px", fontWeight: 600 }}>
            Change Email
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Change Password">
        <div className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>Current Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••" className={`${inputClass} pr-10`} style={{ fontSize: "13px" }} />
              <button onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A3B0] hover:text-[#5C6B7A] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>New Password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••"
                className={inputClass} style={{ fontSize: "13px" }} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Confirm Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••"
                className={inputClass} style={{ fontSize: "13px" }} />
            </div>
          </div>
        </div>
        <SaveBar onSave={() => {}} saving={saving} />
      </SectionCard>

      <SectionCard title="Danger Zone">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>Delete Account</p>
            <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>
              Permanently delete your account, listings, reviews, and matches. This can&apos;t be undone.
            </p>
          </div>
          <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E71D36]/20 text-[#E71D36]/70 hover:bg-[#E71D36]/5 hover:border-[#E71D36]/30 transition-all"
            style={{ fontSize: "12px", fontWeight: 600 }}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user } = useAuthStore();

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    profile: <ProfileTab />,
    preferences: <PreferencesTab />,
    roommate: <RoommateTab />,
    notifications: <NotificationsTab />,
    account: <AccountTab />,
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>
            Settings
          </h1>
          <p className="text-[#98A3B0] mt-1" style={{ fontSize: "14px" }}>
            Manage your profile, preferences, and account
          </p>
        </div>

        <div className="flex gap-6 md:gap-8 items-start">
          {/* Sidebar nav */}
          <div className="hidden md:block w-[240px] shrink-0 space-y-1 sticky top-[80px]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-white border border-black/[0.04] text-[#1B2D45]"
                      : "text-[#5C6B7A] hover:bg-white/60 hover:text-[#1B2D45]"
                  }`}
                  style={{ boxShadow: isActive ? "0 1px 4px rgba(27,45,69,0.04)" : undefined }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-[#FF6B35]/10" : "bg-[#1B2D45]/[0.04]"
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#FF6B35]" : "text-[#98A3B0]"}`} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500 }}>{tab.label}</p>
                    <p className="text-[#98A3B0] truncate" style={{ fontSize: "10px" }}>{tab.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile tab selector */}
          <div className="md:hidden w-full">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                        : "border-[#E8E4DC] bg-white text-[#5C6B7A]"
                    }`}
                    style={{ fontSize: "12px", fontWeight: isActive ? 700 : 500 }}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0 hidden md:block">
            {tabContent[activeTab]}
          </div>
        </div>

        {/* Mobile content (below tabs) */}
        <div className="md:hidden mt-2">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}
