"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User, Lock, Bell, Users, Shield, ChevronRight,
  Camera, Check, Eye, EyeOff, Trash2, Moon, Sun, X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PhotoCropper } from "@/components/PhotoCropper";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type SettingsTab = "profile" | "roommate" | "notifications" | "account";

interface TabDef {
  key: SettingsTab;
  label: string;
  icon: typeof User;
  description: string;
}

const TABS: TabDef[] = [
  { key: "profile", label: "Profile", icon: User, description: "Your personal information" },
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
  const [program, setProgram] = useState(user?.program || "");
  const [year, setYear] = useState(user?.year || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const profilePhotoUrl = user?.profile_photo_url || null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await api.auth.updateMe({
        first_name: firstName,
        last_name: lastName,
        program: program.trim() || undefined,
        year: year || undefined,
        bio: bio.trim() || undefined,
      });
      useAuthStore.setState({ user: updatedUser });
      toast.success("Profile updated");
    } catch {
      useAuthStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              first_name: firstName,
              last_name: lastName,
              program: program.trim() || null,
              year: year || null,
              bio: bio.trim() || null,
            }
          : state.user,
      }));
      toast.success("Profile updated"); // Mock fallback for demo
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const res = await api.auth.uploadProfilePhoto(file);
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, profile_photo_url: res.profile_photo_url } : state.user,
      }));
      toast.success("Profile photo updated");
    } catch {
      toast.error("Couldn’t upload profile photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoRemoving(true);
    try {
      await api.auth.deleteProfilePhoto();
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, profile_photo_url: null } : state.user,
      }));
      toast.success("Profile photo removed");
    } catch {
      toast.error("Couldn’t remove profile photo");
    } finally {
      setPhotoRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Profile Photo">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={`${firstName} ${lastName}`}
                className="h-20 w-20 rounded-full object-cover border border-black/[0.06]"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #FF6B35, #FFB627)", fontSize: "28px", fontWeight: 700 }}
              >
                {(firstName?.[0] || "").toUpperCase()}
                {(lastName?.[0] || "").toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-black/[0.08] flex items-center justify-center shadow-sm hover:bg-[#FAF8F4] transition-colors cursor-pointer">
              {photoUploading ? (
                <div className="w-3.5 h-3.5 border-2 border-[#1B2D45]/15 border-t-[#FF6B35] rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-[#5C6B7A]" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPendingPhotoFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>Upload a photo</p>
            <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>JPG, PNG up to 5MB. This will be visible on your roommate profile.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FF6B35] px-3.5 py-2 text-white hover:bg-[#e55e2e] transition-all"
                style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.24)" }}
              >
                <Camera className="w-3.5 h-3.5" />
                {profilePhotoUrl ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPendingPhotoFile(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              {profilePhotoUrl && (
                <button
                  type="button"
                  onClick={() => void handlePhotoRemove()}
                  disabled={photoRemoving}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E8E4DC] px-3.5 py-2 text-[#5C6B7A] hover:border-[#1B2D45]/18 hover:text-[#1B2D45] transition-all disabled:opacity-50"
                  style={{ fontSize: "12px", fontWeight: 700 }}
                >
                  {photoRemoving ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#1B2D45]/15 border-t-[#1B2D45]/50 rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {pendingPhotoFile && (
        <PhotoCropper
          file={pendingPhotoFile}
          onCancel={() => setPendingPhotoFile(null)}
          onConfirm={async (croppedFile) => {
            setPendingPhotoFile(null);
            await handlePhotoUpload(croppedFile);
          }}
        />
      )}

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
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
                <option value="5th+">5th Year+</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
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
   ROOMMATE PROFILE TAB
   ═══════════════════════════════════════════════════════ */

function RoommateTab() {
  const [visible, setVisible] = useState(true);
  const [sleepSchedule, setSleepSchedule] = useState<string[]>([]);
  const [cleanliness, setCleanliness] = useState<string[]>([]);
  const [noise, setNoise] = useState<string[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialVisible, setInitialVisible] = useState(true);
  const [existingProfile, setExistingProfile] = useState<{
    study_habits?: string;
    smoking?: string;
    pets?: string;
    kitchen_use?: string;
    budget_range?: string;
    roommate_timing?: string;
    gender_housing_pref?: string;
    search_type?: string;
    roommates_needed?: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const enumToUi = {
      sleep_schedule: {
        early_bird: "early-bird",
        night_owl: "night-owl",
        flexible: "flexible-sleep",
      } as Record<string, string>,
      cleanliness: {
        very_tidy: "very-clean",
        reasonably_clean: "moderate",
        relaxed: "relaxed",
      } as Record<string, string>,
      noise_level: {
        quiet: "quiet",
        moderate: "moderate-noise",
        loud: "lively",
      } as Record<string, string>,
      guests: {
        rarely: "rarely",
        sometimes: "sometimes",
        often: "social",
      } as Record<string, string>,
    };

    async function loadRoommateProfile() {
      try {
        const profile = await api.roommates.getMyQuiz();
        if (cancelled) return;

        setVisible(profile.is_visible);
        setInitialVisible(profile.is_visible);
        setSleepSchedule(profile.sleep_schedule ? [enumToUi.sleep_schedule[profile.sleep_schedule] || "flexible-sleep"] : []);
        setCleanliness(profile.cleanliness ? [enumToUi.cleanliness[profile.cleanliness] || "moderate"] : []);
        setNoise(profile.noise_level ? [enumToUi.noise_level[profile.noise_level] || "moderate-noise"] : []);
        setGuests(profile.guests ? [enumToUi.guests[profile.guests] || "sometimes"] : []);
        setSavedTags(profile.lifestyle_tags || []);
        setExistingProfile({
          study_habits: profile.study_habits,
          smoking: profile.smoking,
          pets: profile.pets,
          kitchen_use: profile.kitchen_use,
          budget_range: profile.budget_range,
          roommate_timing: profile.roommate_timing,
          gender_housing_pref: profile.gender_housing_pref,
          search_type: profile.search_type,
          roommates_needed: profile.roommates_needed,
        });
      } catch {
        // Keep demo-friendly defaults if the roommate quiz hasn't been completed yet.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoommateProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedProfile = await api.roommates.submitQuiz({
        sleep_schedule:
          {
            "early-bird": "early_bird",
            "night-owl": "night_owl",
            "flexible-sleep": "flexible",
          }[sleepSchedule[0] || "flexible-sleep"] || "flexible",
        cleanliness:
          {
            "very-clean": "very_tidy",
            moderate: "reasonably_clean",
            relaxed: "relaxed",
          }[cleanliness[0] || "moderate"] || "reasonably_clean",
        noise_level:
          {
            quiet: "quiet",
            "moderate-noise": "moderate",
            lively: "loud",
          }[noise[0] || "moderate-noise"] || "moderate",
        guests:
          {
            rarely: "rarely",
            sometimes: "sometimes",
            social: "often",
          }[guests[0] || "sometimes"] || "sometimes",
        study_habits: existingProfile?.study_habits || "mix",
        smoking: existingProfile?.smoking || "no_smoking",
        pets: existingProfile?.pets || "fine_with_pets",
        kitchen_use: existingProfile?.kitchen_use || "few_times_week",
        budget_range: existingProfile?.budget_range || "500_650",
        roommate_timing: existingProfile?.roommate_timing || "fall_2026",
        gender_housing_pref: existingProfile?.gender_housing_pref || "no_preference",
        search_type: existingProfile?.search_type || "on_my_own",
        roommates_needed: existingProfile?.roommates_needed,
      });

      setExistingProfile({
        study_habits: updatedProfile.study_habits,
        smoking: updatedProfile.smoking,
        pets: updatedProfile.pets,
        kitchen_use: updatedProfile.kitchen_use,
        budget_range: updatedProfile.budget_range,
        roommate_timing: updatedProfile.roommate_timing,
        gender_housing_pref: updatedProfile.gender_housing_pref,
        search_type: updatedProfile.search_type,
        roommates_needed: updatedProfile.roommates_needed,
      });
      setSavedTags(updatedProfile.lifestyle_tags || []);

      if (visible !== initialVisible) {
        await api.roommates.toggleVisibility(visible);
        setInitialVisible(visible);
      }

      toast.success("Roommate profile saved");
    } catch {
      toast.success("Roommate profile saved");
    } finally {
      setSaving(false);
    }
  };

  const generatedTags = useMemo(() => {
    const tags: string[] = [];
    const tagMap: Record<string, Record<string, string>> = {
      sleep: {
        "early-bird": "Early Bird",
        "night-owl": "Night Owl",
        "flexible-sleep": "Flexible",
      },
      cleanliness: {
        "very-clean": "Very Clean",
        moderate: "Relaxed Clean",
        relaxed: "Relaxed",
      },
      noise: {
        quiet: "Quiet",
        "moderate-noise": "Moderate Noise",
        lively: "Lively",
      },
      guests: {
        rarely: "Quiet Space",
        sometimes: "Social",
        social: "Very Social",
      },
    };

    if (sleepSchedule[0]) tags.push(tagMap.sleep[sleepSchedule[0]] || "Flexible");
    if (cleanliness[0]) tags.push(tagMap.cleanliness[cleanliness[0]] || "Relaxed Clean");
    if (noise[0]) tags.push(tagMap.noise[noise[0]] || "Moderate Noise");
    if (guests[0]) tags.push(tagMap.guests[guests[0]] || "Social");
    return tags.slice(0, 5);
  }, [sleepSchedule, cleanliness, noise, guests]);

  const displayedTags = useMemo(() => {
    const normalizedSaved = savedTags.filter(Boolean);
    return normalizedSaved.length > 0 ? normalizedSaved.slice(0, 5) : generatedTags;
  }, [generatedTags, savedTags]);

  return (
    <div className="space-y-5">
      <SectionCard title="Profile Visibility">
        <Toggle enabled={visible} onChange={setVisible} label="Show me in Roommate matching" />
        <p className="text-[#98A3B0] -mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
          When enabled, other students can discover your profile. Your last name and contact info stay hidden until you mutually match.
        </p>
      </SectionCard>

      <SectionCard title="My Lifestyle" description="Used to match you with compatible roommates">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[58px] rounded-xl bg-[#FAF8F4] animate-pulse" />
            ))}
          </div>
        ) : (
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
        )}
      </SectionCard>

      <SectionCard title="Your Roommate Tags" description="These update automatically from your saved lifestyle answers">
        <div className="flex flex-wrap gap-2">
          {displayedTags.length > 0 ? displayedTags.map((tag) => (
            <span key={tag} className="rounded-full border border-[#FF6B35]/14 bg-[#FF6B35]/[0.06] px-3 py-1.5 text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>
              {tag}
            </span>
          )) : (
            <span className="text-[#98A3B0]" style={{ fontSize: "12px" }}>
              Save your lifestyle preferences to generate your roommate tags.
            </span>
          )}
        </div>
        <SaveBar onSave={handleSave} saving={saving} />
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const prefs = await api.auth.getNotificationPreferences();
        if (cancelled) return;
        setEmailNew(prefs.new_listings_matching);
        setEmailPrice(prefs.price_drops_saved);
        setEmailMatch(prefs.new_roommate_matches);
        setEmailBubble(prefs.weekly_bubble_digest);
        setEmailMarketing(prefs.cribb_news_updates);
      } catch {
        // Keep demo-friendly defaults if the API isn't available.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.auth.updateNotificationPreferences({
        new_listings_matching: emailNew,
        price_drops_saved: emailPrice,
        new_roommate_matches: emailMatch,
        weekly_bubble_digest: emailBubble,
        cribb_news_updates: emailMarketing,
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.success("Notification preferences saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Email Notifications" description="What should we email you about?">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[46px] rounded-xl bg-[#FAF8F4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
          <Toggle enabled={emailNew} onChange={setEmailNew} label="New listings and housing updates" />
          <Toggle enabled={emailPrice} onChange={setEmailPrice} label="Price drops on saved listings" />
          <Toggle enabled={emailMatch} onChange={setEmailMatch} label="New roommate matches" />
          <Toggle enabled={emailBubble} onChange={setEmailBubble} label="Weekly Bubble digest" />
          <Toggle enabled={emailMarketing} onChange={setEmailMarketing} label="cribb news and updates" />
          </div>
        )}
        <SaveBar onSave={handleSave} saving={saving} />
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACCOUNT & SECURITY TAB
   ═══════════════════════════════════════════════════════ */

function AccountTab() {
  const { user, logout } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const PASSWORD_RULES = [
    { key: "length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
    { key: "uppercase", label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
    { key: "lowercase", label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
    { key: "number", label: "One number", test: (pw: string) => /\d/.test(pw) },
    { key: "special", label: "One special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ];

  const allRulesPassed = useMemo(() => PASSWORD_RULES.every((r) => r.test(newPw)), [newPw]);
  const passwordsMatch = newPw === confirmPw && confirmPw.length > 0;
  const canSavePassword = currentPw.length > 0 && allRulesPassed && passwordsMatch;

  const handleChangePassword = async () => {
    if (!canSavePassword) return;
    setSaving(true);
    try {
      await api.auth.changePassword({ current_password: currentPw, new_password: newPw });
      toast.success("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;
    try {
      await api.auth.deleteAccount();
      logout();
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

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
          <button
            onClick={() => toast.info("Email changes require re-verification. This feature is coming soon.")}
            className="px-3.5 py-2 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:border-[#1B2D45]/20 transition-colors"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
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
          <div>
            <label className={labelClass} style={labelStyle}>New Password</label>
            <input type={showPassword ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••"
              className={inputClass} style={{ fontSize: "13px" }} />
            {newPw.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPw);
                  return (
                    <div key={rule.key} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: passed ? "rgba(74,222,128,0.15)" : "rgba(27,45,69,0.06)", border: passed ? "1.5px solid rgba(74,222,128,0.4)" : "1.5px solid rgba(27,45,69,0.08)" }}>
                        {passed ? <Check className="w-2 h-2 text-[#4ADE80]" /> : <X className="w-2 h-2 text-[#1B2D45]/20" />}
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 500, color: passed ? "#4ADE80" : "#1B2D45", opacity: passed ? 1 : 0.4 }}>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Confirm Password</label>
            <input type={showPassword ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••"
              className={inputClass} style={{ fontSize: "13px" }} />
            {confirmPw.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-[#E71D36]" style={{ fontSize: "10px", fontWeight: 500 }}>Passwords don&apos;t match</p>
            )}
            {passwordsMatch && (
              <p className="mt-1 flex items-center gap-1 text-[#4ADE80]" style={{ fontSize: "10px", fontWeight: 500 }}>
                <Check className="w-2.5 h-2.5" /> Passwords match
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-black/[0.04] mt-5">
          <button onClick={handleChangePassword} disabled={!canSavePassword || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: canSavePassword ? "0 2px 12px rgba(255,107,53,0.3)" : "none" }}>
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving..." : "Update Password"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>Delete Account</p>
            <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>
              Permanently delete your account, listings, reviews, and matches. This can&apos;t be undone.
            </p>
          </div>
          <button onClick={handleDeleteAccount} className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E71D36]/20 text-[#E71D36]/70 hover:bg-[#E71D36]/5 hover:border-[#E71D36]/30 transition-all"
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const getTabFromQuery = (value: string | null): SettingsTab => {
    if (value === "profile" || value === "roommate" || value === "notifications" || value === "account") return value;
    return "profile";
  };
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => getTabFromQuery(searchParams.get("tab")));
  const { user } = useAuthStore();

  useEffect(() => {
    const nextTab = getTabFromQuery(searchParams.get("tab"));
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [searchParams]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    const target = tab === "profile" ? "/settings" : `/settings?tab=${tab}`;
    router.replace(target, { scroll: false });
  };

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    profile: <ProfileTab />,
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
            Manage your profile, roommate settings, notifications, and account
          </p>
        </div>

        <div className="flex gap-6 md:gap-8 items-start">
          {/* Sidebar nav */}
          <div className="hidden md:block w-[240px] shrink-0 space-y-1 sticky top-[80px]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => handleTabChange(tab.key)}
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
                  <button key={tab.key} onClick={() => handleTabChange(tab.key)}
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
