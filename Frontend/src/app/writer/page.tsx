"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye, FileText, PenLine, Trash2, Plus,
  Clock, CheckCircle2, Archive, AlertCircle, X,
  Send, Loader2, ImagePlus, Camera, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useWriterStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { VerifiedWriterBadge } from "@/components/ui/Badges";
import type { PostListResponse, PostResponse, PostCategory, WriterResponse } from "@/types";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  event: { label: "Event", emoji: "🎉", color: "#6C5CE7" },
  deal: { label: "Deal", emoji: "🏪", color: "#2EC4B6" },
  news: { label: "News", emoji: "📰", color: "#1B2D45" },
  lifestyle: { label: "Lifestyle", emoji: "☀️", color: "#FFB627" },
  food: { label: "Food", emoji: "🍕", color: "#E84393" },
  other: { label: "Other", emoji: "💡", color: "#98A3B0" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", color: "#FFB627", bg: "#FFB627", icon: FileText },
  published: { label: "Published", color: "#4ADE80", bg: "#4ADE80", icon: CheckCircle2 },
  archived: { label: "Archived", color: "#98A3B0", bg: "#98A3B0", icon: Archive },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ═══════════════════════════════════════════════════════
   LOGIN GATE
   ═══════════════════════════════════════════════════════ */

function WriterLogin() {
  const { login, isLoading, error, clearError } = useWriterStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch {
      // error is set in store
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#1B2D45]/25 focus:ring-2 focus:ring-[#1B2D45]/10 transition-all";

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/10 flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-[#2D5B88]" />
          </div>
          <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>Writer Dashboard</h1>
          <p className="text-[#98A3B0] mt-1" style={{ fontSize: "13px" }}>Log in with your writer account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-black/[0.04] p-6 space-y-4" style={{ boxShadow: "0 2px 8px rgba(27,45,69,0.04)" }}>
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
          </div>
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E71D36]/5 text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 500 }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 2px 12px rgba(27,45,69,0.24)" }}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-4 text-[#98A3B0]" style={{ fontSize: "12px" }}>
          Not a writer yet? Apply from{" "}
          <a href="/writers/signup" className="text-[#1B2D45]" style={{ fontWeight: 600 }}>The Bubble</a>
        </p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   POST EDITOR MODAL
   ═══════════════════════════════════════════════════════ */

function PostEditor({ post, onClose, onSaved }: {
  post?: PostResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [category, setCategory] = useState<string>(post?.category || "");
  const [eventDate, setEventDate] = useState(post?.event_date || "");
  const [eventLocation, setEventLocation] = useState(post?.event_location || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(post?.cover_image_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!post;
  const canSave = title.trim() && content.trim() && category;

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const handleCoverSelect = (file: File | null) => {
    if (!file) return;
    if (coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (publish = false) => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      let savedPost: PostResponse;
      if (isEdit) {
        savedPost = await api.posts.update(post.id, {
          title,
          content,
          preview: content.slice(0, 160),
          category: category as PostCategory,
          event_date: eventDate || undefined,
          event_location: eventLocation || undefined,
          ...(publish ? { status: "published" as any } : {}),
        });
      } else {
        savedPost = await api.posts.create({
          title,
          content,
          preview: content.slice(0, 160),
          category: category as PostCategory,
          event_date: eventDate || undefined,
          event_location: eventLocation || undefined,
        });
        if (publish) {
          savedPost = await api.posts.update(savedPost.id, { status: "published" as any });
        }
      }
      if (coverFile) {
        savedPost = await api.posts.uploadCoverImage(savedPost.id, coverFile);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: "600px", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 shrink-0">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>{isEdit ? "Edit Post" : "New Post"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Category */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category *</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-full border transition-all ${category === key ? "border-transparent text-white" : "border-black/[0.06] text-[#5C6B7A] bg-white hover:border-black/15"}`}
                  style={{ fontSize: "11px", fontWeight: 600, backgroundColor: category === key ? meta.color : undefined }}>
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's happening?" className={inputClass} style={{ fontSize: "14px", fontWeight: 600 }} />
          </div>

          {/* Content */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your post..." rows={6}
              className={`${inputClass} resize-none`} style={{ fontSize: "13px", lineHeight: 1.6 }} />
          </div>

          {/* Event fields */}
          {category === "event" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Date</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} style={{ fontSize: "12px" }} />
              </div>
              <div>
                <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Location</label>
                <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Where?" className={inputClass} style={{ fontSize: "12px" }} />
              </div>
            </div>
          )}

          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cover Image</label>
            <div className="space-y-3">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#E8E4DC] p-5 text-center transition-colors hover:border-[#FF6B35]/30">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleCoverSelect(e.target.files?.[0] ?? null)}
                />
                <ImagePlus className="w-6 h-6 text-[#98A3B0] mx-auto mb-2" />
                <p className="text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 500 }}>
                  Upload a cover image to make the post stand out in The Bubble
                </p>
                <p className="text-[#98A3B0]/80 mt-1" style={{ fontSize: "10px" }}>
                  PNG, JPG, or WebP
                </p>
              </label>

              {coverPreview && (
                <div className="overflow-hidden rounded-xl border border-black/[0.05] bg-[#FAF8F4]">
                  <img src={coverPreview} alt="Cover preview" className="h-[180px] w-full object-cover" />
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>
                      {coverFile ? "New image ready to upload" : "Current cover image"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (coverPreview.startsWith("blob:")) {
                          URL.revokeObjectURL(coverPreview);
                        }
                        setCoverFile(null);
                        setCoverPreview("");
                      }}
                      className="text-[#E71D36]/70 hover:text-[#E71D36]"
                      style={{ fontSize: "11px", fontWeight: 700 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E71D36]/5 text-[#E71D36]" style={{ fontSize: "12px" }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/5 flex items-center justify-between gap-3 shrink-0">
          <button onClick={() => handleSave(false)} disabled={saving || !canSave}
            className="px-4 py-2.5 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.03] disabled:opacity-40 transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSave(true)} disabled={saving || !canSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-40 transition-all"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
            <Send className="w-3.5 h-3.5" /> {saving ? "Publishing..." : "Publish"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   WRITER PROFILE MODAL
   ═══════════════════════════════════════════════════════ */

function WriterProfileEditor({
  writer,
  onClose,
  onSaved,
}: {
  writer: WriterResponse;
  onClose: () => void;
  onSaved: (writer: WriterResponse) => void;
}) {
  const [firstName, setFirstName] = useState(writer.first_name);
  const [lastName, setLastName] = useState(writer.last_name);
  const [businessName, setBusinessName] = useState(writer.business_name);
  const [businessType, setBusinessType] = useState(writer.business_type || "");
  const [website, setWebsite] = useState(writer.website || "");
  const [phone, setPhone] = useState(writer.phone || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(writer.profile_photo_url || "");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "W";

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoSelect = (file: File | null) => {
    if (!file) return;
    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview("");
    setRemovePhoto(Boolean(writer.profile_photo_url));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      let updated = await api.writers.updateProfile({
        first_name: firstName,
        last_name: lastName,
        business_name: businessName,
        business_type: businessType || null,
        website: website || null,
        phone: phone || null,
      });

      if (removePhoto && !photoFile) {
        await api.writers.deleteProfilePhoto();
        updated = { ...updated, profile_photo_url: null };
      }

      if (photoFile) {
        const photo = await api.writers.uploadProfilePhoto(photoFile);
        updated = { ...updated, profile_photo_url: photo.profile_photo_url };
      }

      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't update writer profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.form
        onSubmit={handleSave}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Writer Profile</h3>
            <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>This is how your Bubble byline or business profile appears.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98A3B0] transition-colors hover:bg-[#1B2D45]/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-4 rounded-2xl border border-black/[0.04] bg-[#FAF8F4] p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#1B2D45]/10">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 900 }}>
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800 }}>Profile photo</p>
              <p className="mt-0.5 text-[#98A3B0]" style={{ fontSize: "11px", lineHeight: 1.45 }}>
                Used on writer, business, and organization bylines.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1B2D45] px-3 py-2 text-white transition-colors hover:bg-[#152438]" style={{ fontSize: "12px", fontWeight: 700 }}>
                  <Camera className="h-3.5 w-3.5" />
                  Upload
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handlePhotoSelect(event.target.files?.[0] ?? null)} />
                </label>
                {photoPreview && (
                  <button type="button" onClick={handleRemovePhoto} className="rounded-xl border border-[#E71D36]/15 px-3 py-2 text-[#E71D36]/75 transition-colors hover:bg-[#E71D36]/5" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="writer-first-name" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>First name</label>
              <input id="writer-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
            <div>
              <label htmlFor="writer-last-name" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last name</label>
              <input id="writer-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
          </div>

          <div>
            <label htmlFor="writer-business-name" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Public writer / business name</label>
            <input id="writer-business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="writer-business-type" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Writer / business type</label>
              <input id="writer-business-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Campus writer, club, business, etc." className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
            <div>
              <label htmlFor="writer-phone" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Phone</label>
              <input id="writer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
            </div>
          </div>

          <div>
            <label htmlFor="writer-website" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Website</label>
            <input id="writer-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
          </div>

          <div>
            <label htmlFor="writer-email" className="mb-1.5 block text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input id="writer-email" value={writer.email} disabled className={`${inputClass} opacity-70`} style={{ fontSize: "13px", fontWeight: 500 }} />
            <p className="mt-1.5 text-[#98A3B0]" style={{ fontSize: "10px" }}>Contact an admin for email changes.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[#E71D36]/5 px-3 py-2.5 text-[#E71D36]" style={{ fontSize: "12px" }}>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/5 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E8E4DC] px-4 py-2.5 text-[#5C6B7A] transition-all hover:bg-[#1B2D45]/[0.03]" style={{ fontSize: "13px", fontWeight: 600 }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-5 py-2.5 text-white transition-all hover:bg-[#e55e2e] disabled:opacity-50" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   POST ROW
   ═══════════════════════════════════════════════════════ */

function PostRow({ post, onEdit, onStatusChange, onDelete }: {
  post: PostListResponse;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const catMeta = CATEGORY_META[post.category] || CATEGORY_META.other;
  const statusMeta = STATUS_META[post.status] || STATUS_META.draft;
  const StatusIcon = statusMeta.icon;
  const actionBtn = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 px-4 md:px-5 py-4 bg-white rounded-xl border border-black/[0.04] hover:border-black/[0.08] transition-all"
      style={{ boxShadow: "0 1px 3px rgba(27,45,69,0.03)" }}>

      {post.cover_image_url && (
        <div className="hidden md:block w-[120px] h-[88px] shrink-0 overflow-hidden rounded-xl border border-black/[0.04] bg-[#FAF8F4]">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Category + title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="px-2 py-0.5 rounded-full text-white shrink-0" style={{ fontSize: "9px", fontWeight: 700, backgroundColor: catMeta.color }}>
            {catMeta.emoji} {catMeta.label}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: "9px", fontWeight: 700, color: statusMeta.color, backgroundColor: `${statusMeta.bg}15` }}>
            <StatusIcon className="w-3 h-3" /> {statusMeta.label}
          </span>
        </div>
        <p className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{post.title}</p>
        <p className="text-[#98A3B0] truncate mt-0.5" style={{ fontSize: "11px" }}>{post.preview || "No preview"}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[#98A3B0]" style={{ fontSize: "11px", fontWeight: 500 }}>
          <span>{post.view_count} view{post.view_count === 1 ? "" : "s"}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        {post.cover_image_url && (
          <div className="md:hidden mt-3 overflow-hidden rounded-xl border border-black/[0.04] bg-[#FAF8F4]">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-[168px] object-cover" />
          </div>
        )}
      </div>

      {/* Actions — all visible, no hidden menu */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <button onClick={onEdit} className={`${actionBtn} border-[#1B2D45]/12 text-[#1B2D45]/70 hover:border-[#1B2D45]/25 hover:text-[#1B2D45]`} style={{ fontSize: "11px", fontWeight: 600 }}>
          <PenLine className="w-3.5 h-3.5" /> Edit
        </button>

        {post.status === "published" && (
          <a href={`/the-bubble/${post.slug}`} target="_blank" rel="noopener noreferrer" className={`${actionBtn} border-[#1B2D45]/12 text-[#1B2D45]/70 hover:border-[#1B2D45]/25 hover:text-[#1B2D45]`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </a>
        )}

        {post.status === "draft" && (
          <button onClick={() => onStatusChange("published")} className={`${actionBtn} border-[#4ADE80]/30 text-[#239B55] hover:bg-[#4ADE80]/5`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <Send className="w-3.5 h-3.5" /> Publish
          </button>
        )}
        {post.status === "published" && (
          <button onClick={() => onStatusChange("archived")} className={`${actionBtn} border-[#FFB627]/30 text-[#A66A00] hover:bg-[#FFB627]/5`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
        )}
        {post.status === "archived" && (
          <button onClick={() => onStatusChange("published")} className={`${actionBtn} border-[#4ADE80]/30 text-[#239B55] hover:bg-[#4ADE80]/5`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Republish
          </button>
        )}

        <button onClick={() => { if (window.confirm("Delete this post? This can't be undone.")) onDelete(); }} className={`${actionBtn} border-[#E71D36]/20 text-[#E71D36]/80 hover:bg-[#E71D36]/5`} style={{ fontSize: "11px", fontWeight: 600 }}>
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */

function Dashboard() {
  const { writer, updateWriter } = useWriterStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "3months">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.posts.getMyPosts();
      setPosts(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (searchParams.get("profile") === "1") {
      setProfileOpen(true);
    }
  }, [searchParams]);

  // Deep-link: /writer?compose=1 opens a fresh post editor (used by the navbar "New Post" button).
  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setEditingPost(null);
      setEditorOpen(true);
      router.replace("/writer");
    }
  }, [searchParams, router]);

  // Deep-link: /writer?edit={postId} auto-opens the edit modal for that post.
  // Used by the Cribb AI draft review email.
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || loading || posts.length === 0) return;
    const target = posts.find((p) => String(p.id) === editId);
    if (!target) return;
    api.posts.getBySlug(target.slug).then((full) => {
      setEditingPost(full);
      setEditorOpen(true);
      router.replace("/writer");
    }).catch(() => { /* leave the URL — user can retry */ });
  }, [searchParams, posts, loading, router]);

  const closeProfileEditor = useCallback(() => {
    setProfileOpen(false);
    if (searchParams.get("profile") === "1") {
      router.replace("/writer");
    }
  }, [router, searchParams]);

  const statusFiltered = filter === "all" ? posts : posts.filter((p) => p.status === filter);
  const filtered = timeRange === "all" ? statusFiltered : statusFiltered.filter((p) => {
    const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90;
    return new Date(p.created_at).getTime() >= Date.now() - days * 86400000;
  });
  const totalViews = posts.reduce((sum, p) => sum + p.view_count, 0);
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  const handleEdit = async (post: PostListResponse) => {
    try {
      const full = await api.posts.getBySlug(post.slug);
      setEditingPost(full);
      setEditorOpen(true);
    } catch {
      // fallback
    }
  };

  const handleStatusChange = async (postId: number, status: string) => {
    try {
      await api.posts.update(postId, { status: status as any });
      fetchPosts();
    } catch {
      // error
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      await api.posts.delete(postId);
      fetchPosts();
    } catch {
      // error
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>
            Writer Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{writer?.first_name} {writer?.last_name}</span>
            <VerifiedWriterBadge size="md" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Views", value: totalViews, icon: Eye, color: "#6C5CE7" },
            { label: "Published", value: publishedCount, icon: CheckCircle2, color: "#4ADE80" },
            { label: "Drafts", value: draftCount, icon: FileText, color: "#FFB627" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-black/[0.04] bg-white p-4 md:p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
                <div className="mb-3 flex items-center gap-2 text-[#5C6B7A]">
                  <Icon className="h-4 w-4" style={{ color: stat.color }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{stat.label}</span>
                </div>
                <div className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em" }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Status tabs (primary) + time range (secondary) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "published", "draft", "archived"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all ${filter === f ? "bg-[#FF6B35] text-white" : "bg-white border border-black/[0.04] text-[#5C6B7A] hover:text-[#1B2D45]"}`}
                style={{ fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                {f === "all" ? `All (${posts.length})` : `${f} (${posts.filter(p => p.status === f).length})`}
              </button>
            ))}
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="rounded-lg border border-black/[0.06] bg-white px-3 py-1.5 text-[#5C6B7A] focus:border-[#FF6B35]/30 focus:outline-none transition-all"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="3months">Last 3 months</option>
          </select>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-8 h-8 text-[#98A3B0]/40 mx-auto mb-3" />
            <p className="text-[#98A3B0]" style={{ fontSize: "14px", fontWeight: 600 }}>
              {filter === "all" ? "No posts yet — create your first one!" : `No ${filter} posts`}
            </p>
            {filter === "all" && (
              <button onClick={() => { setEditingPost(null); setEditorOpen(true); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white transition-all hover:bg-[#e55e2e]"
                style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
                <Plus className="w-4 h-4" /> New Post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((post) => (
              <PostRow key={post.id} post={post}
                onEdit={() => handleEdit(post)}
                onStatusChange={(status) => handleStatusChange(post.id, status)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {editorOpen && (
          <PostEditor
            post={editingPost}
            onClose={() => { setEditorOpen(false); setEditingPost(null); }}
            onSaved={fetchPosts}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileOpen && writer && (
          <WriterProfileEditor
            writer={writer}
            onClose={closeProfileEditor}
            onSaved={updateWriter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE EXPORT — login gate
   ═══════════════════════════════════════════════════════ */

export default function WriterPage() {
  const router = useRouter();
  const { writer, writerToken, loadWriter } = useWriterStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadWriter();
    setHydrated(true);
  }, [loadWriter]);

  useEffect(() => {
    if (!hydrated) return;
    if (!writerToken || !writer) {
      router.replace("/writers/login?next=/writer");
    }
  }, [hydrated, writerToken, writer, router]);

  if (!hydrated || (!writerToken || !writer)) return null;

  if (writer.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center max-w-[360px]">
          <div className="w-14 h-14 rounded-2xl bg-[#FFB627]/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[#FFB627]" />
          </div>
          <h2 className="text-[#1B2D45] mb-2" style={{ fontSize: "20px", fontWeight: 800 }}>Application Pending</h2>
          <p className="text-[#98A3B0] mb-6" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            Your writer application is still under review. We&apos;ll notify you once it&apos;s approved — usually within 24 hours.
          </p>
          <button onClick={() => useWriterStore.getState().logout()}
            className="px-4 py-2 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.03] transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
