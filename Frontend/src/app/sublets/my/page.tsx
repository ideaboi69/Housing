"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Clock,
  Eye,
  FileText,
  Home,
  ImageIcon,
  MapPin,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { SubletStatus, type SubletListResponse } from "@/types";

type SubletTab = "active" | "drafts" | "other";

function formatDateRange(sublet: SubletListResponse) {
  const start = new Date(sublet.sublet_start_date).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
  const end = new Date(sublet.sublet_end_date).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
  return `${start} - ${end}`;
}

function getStatusCopy(status: SubletStatus) {
  switch (status) {
    case SubletStatus.ACTIVE:
      return { label: "Active", tone: "bg-[#2EC4B6]/10 text-[#2EC4B6]" };
    case SubletStatus.DRAFT:
      return { label: "Draft", tone: "bg-[#FFB627]/10 text-[#FFB627]" };
    case SubletStatus.RENTED:
      return { label: "Rented", tone: "bg-[#1B2D45]/10 text-[#1B2D45]/70" };
    case SubletStatus.EXPIRED:
      return { label: "Expired", tone: "bg-[#1B2D45]/10 text-[#1B2D45]/55" };
    default:
      return { label: "Removed", tone: "bg-[#E71D36]/10 text-[#E71D36]" };
  }
}

function SubletRow({
  item,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  item: SubletListResponse;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const status = getStatusCopy(item.status);
  const price = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(item.rent_per_month));
  const image = item.primary_image || item.images?.[0]?.image_url;

  return (
    <div
      className="rounded-2xl border border-black/[0.06] bg-white p-4 md:p-5"
      style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Link href={`/sublets/${item.id}`} className="shrink-0">
          {image ? (
            <img
              src={image}
              alt={item.title}
              className="h-24 w-full rounded-xl object-cover md:h-24 md:w-32"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center rounded-xl bg-[#FAF8F4] md:w-32">
              <ImageIcon className="h-6 w-6 text-[#1B2D45]/10" />
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 800 }}>
              {item.title}
            </h3>
            <span className={`rounded-full px-2 py-0.5 ${status.tone}`} style={{ fontSize: "10px", fontWeight: 700 }}>
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 600 }}>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {item.address.split(",")[0]?.trim() || item.address}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDateRange(item)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {item.status === SubletStatus.ACTIVE ? "Live" : "Not live"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#FAF8F4] px-2.5 py-1 text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>
              {price}/mo
            </span>
            <span className="rounded-full bg-[#FAF8F4] px-2.5 py-1 text-[#1B2D45]/55" style={{ fontSize: "11px", fontWeight: 700 }}>
              {item.room_type === "private" ? "Private room" : "Shared room"}
            </span>
            {item.is_furnished && (
              <span className="rounded-full bg-[#FAF8F4] px-2.5 py-1 text-[#1B2D45]/55" style={{ fontSize: "11px", fontWeight: 700 }}>
                Furnished
              </span>
            )}
            {item.utilities_included && (
              <span className="rounded-full bg-[#FAF8F4] px-2.5 py-1 text-[#1B2D45]/55" style={{ fontSize: "11px", fontWeight: 700 }}>
                Utilities incl.
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:max-w-[220px] md:justify-end">
          <Link
            href={`/sublets/${item.id}`}
            className="rounded-xl border border-black/[0.06] px-3 py-2 text-[#1B2D45]/60 hover:border-[#1B2D45]/15 hover:text-[#1B2D45] transition-all"
            style={{ fontSize: "12px", fontWeight: 700 }}
          >
            View
          </Link>
          {item.status === SubletStatus.DRAFT && (
            <button
              onClick={onPublish}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[#FF6B35] hover:bg-[#FF6B35]/[0.06] transition-all"
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              <Upload className="h-3.5 w-3.5" />
              Publish
            </button>
          )}
          {item.status === SubletStatus.ACTIVE && (
            <button
              onClick={onUnpublish}
              className="rounded-xl px-3 py-2 text-[#FFB627] hover:bg-[#FFB627]/[0.08] transition-all"
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              Move to drafts
            </button>
          )}
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[#E71D36]/65 hover:bg-[#E71D36]/[0.06] hover:text-[#E71D36] transition-all"
            style={{ fontSize: "12px", fontWeight: 700 }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MySubletsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SubletListResponse[]>([]);
  const [tab, setTab] = useState<SubletTab>("active");

  const fetchSublets = useCallback(async () => {
    setLoading(true);
    try {
      const mine = await api.sublets.getMine();
      setItems(mine);
    } catch {
      toast.error("Couldn't load your sublets right now.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSublets();
  }, [fetchSublets]);

  const activeItems = useMemo(
    () => items.filter((item) => item.status === SubletStatus.ACTIVE),
    [items]
  );
  const draftItems = useMemo(
    () => items.filter((item) => item.status === SubletStatus.DRAFT),
    [items]
  );
  const otherItems = useMemo(
    () => items.filter((item) => ![SubletStatus.ACTIVE, SubletStatus.DRAFT].includes(item.status)),
    [items]
  );

  const displayItems = tab === "active" ? activeItems : tab === "drafts" ? draftItems : otherItems;

  const tabs: { key: SubletTab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeItems.length },
    { key: "drafts", label: "Drafts", count: draftItems.length },
    { key: "other", label: "Past", count: otherItems.length },
  ];

  const handlePublish = async (id: number) => {
    try {
      const updated = await api.sublets.publish(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: updated.status } : item)));
      toast.success("Sublet published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't publish this sublet.");
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      const updated = await api.sublets.unpublish(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: updated.status } : item)));
      toast.success("Moved to drafts");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't move this sublet right now.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this sublet? This can't be undone.")) return;
    try {
      await api.sublets.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Sublet deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this sublet.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center">
          <Home className="mx-auto mb-3 h-10 w-10 text-[#1B2D45]/10" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>
            Log in to manage your sublets
          </h2>
          <p className="mt-1 mb-4 text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
            You need a student account to post and manage sublets.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-[#FF6B35] px-5 py-2.5 text-white"
            style={{ fontSize: "13px", fontWeight: 700 }}
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "landlord") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="max-w-[420px] text-center">
          <Home className="mx-auto mb-3 h-10 w-10 text-[#1B2D45]/10" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>
            Sublet posting is only available for student accounts
          </h2>
          <p className="mt-1 mb-5 text-[#1B2D45]/40" style={{ fontSize: "13px", lineHeight: 1.6 }}>
            Landlord accounts can browse sublets, but student posters manage their own sublet listings separately.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link
              href="/sublets"
              className="rounded-xl border border-black/[0.06] px-5 py-2.5 text-[#1B2D45]/60 hover:border-[#1B2D45]/15 hover:text-[#1B2D45] transition-all"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Browse Sublets
            </Link>
            <Link
              href="/landlord"
              className="rounded-xl bg-[#1B2D45] px-5 py-2.5 text-white hover:bg-[#142235] transition-all"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Landlord Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/sublets" className="text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>
              My Sublets
            </h1>
            <p className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "13px" }}>
              Manage the student sublets you've posted on cribb.
            </p>
          </div>
          <Link
            href="/sublets/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white hover:bg-[#e55e2e] transition-all"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
          >
            <Plus className="h-4 w-4" />
            Post a Sublet
          </Link>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.04] bg-white p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <div className="text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Active
            </div>
            <div className="mt-2 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900 }}>
              {activeItems.length}
            </div>
          </div>
          <div className="rounded-2xl border border-black/[0.04] bg-white p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <div className="text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Drafts
            </div>
            <div className="mt-2 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900 }}>
              {draftItems.length}
            </div>
          </div>
          <div className="rounded-2xl border border-black/[0.04] bg-white p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <div className="text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Total
            </div>
            <div className="mt-2 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900 }}>
              {items.length}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-full px-4 py-2 transition-all ${
                tab === item.key
                  ? "bg-[#FF6B35] text-white"
                  : "border border-black/[0.06] bg-white text-[#1B2D45]/50 hover:border-[#1B2D45]/15 hover:text-[#1B2D45]"
              }`}
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-white"
                style={{ border: "1px solid rgba(27,45,69,0.04)" }}
              />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.04] bg-white px-6 py-10 text-center" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#1B2D45]/10" />
            <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
              {tab === "active"
                ? "No active sublets yet"
                : tab === "drafts"
                  ? "No draft sublets"
                  : "No past sublets"}
            </h2>
            <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              {tab === "active"
                ? "Once you publish a sublet, it'll show up here alongside its current status."
                : tab === "drafts"
                  ? "Draft sublets are great for saving work before you publish."
                  : "Expired, rented, or removed sublets will show up here when they exist."}
            </p>
            <Link
              href="/sublets/create"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-5 py-2.5 text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              <Plus className="h-4 w-4" />
              Post a Sublet
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <SubletRow
                  item={item}
                  onPublish={() => handlePublish(item.id)}
                  onUnpublish={() => handleUnpublish(item.id)}
                  onDelete={() => handleDelete(item.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
