"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ConversationResponse } from "@/types";

interface ListingMessagesCardProps {
  /** Conversations already scoped to the relevant listing(s) by the caller. */
  conversations: ConversationResponse[];
  /** Heading — defaults to the standard label. */
  title?: string;
  subtitle?: string;
  emptyHint?: string;
  /** Where "View all" links to. Defaults to the landlord messages tab. */
  viewAllHref?: string;
  limit?: number;
}

/**
 * Inline "Messages & Inquiries" section card. Shared by the property detail page
 * (scoped to all of a property's listings) and the per-listing manage page
 * (scoped to one listing) so the inquiry surface is consistent everywhere.
 */
export function ListingMessagesCard({
  conversations,
  title = "Messages & Inquiries",
  subtitle = "Student questions about this property's listings.",
  emptyHint = "Messages from students appear here once they reach out from one of your listings.",
  viewAllHref = "/landlord?tab=messages",
  limit = 3,
}: ListingMessagesCardProps) {
  const unread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>
            {title}
            {unread > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#E71D36]" />}
          </h2>
          <p className="mt-0.5 text-[#1B2D45]/50" style={{ fontSize: "12px" }}>{subtitle}</p>
        </div>
        <Link href={viewAllHref} className="shrink-0 text-[#1B2D45]/55 transition-colors hover:text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>
          View all →
        </Link>
      </div>

      {conversations.length === 0 ? (
        <p className="text-[#1B2D45]/45" style={{ fontSize: "13px" }}>{emptyHint}</p>
      ) : (
        <div className="divide-y divide-[#1B2D45]/[0.06] border-t border-[#1B2D45]/[0.08]">
          {conversations.slice(0, limit).map((c) => (
            <Link
              key={c.id}
              href={viewAllHref}
              className="flex items-center gap-3 py-3 transition-colors hover:bg-[#1B2D45]/[0.02]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2D45]/[0.07] text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 500 }}>
                {(c.user_name ?? "S")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{c.user_name ?? "Student"}</span>
                  {c.unread_count > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E71D36]" />}
                </div>
                <p className="mt-0.5 truncate text-[#1B2D45]/50" style={{ fontSize: "12px" }}>
                  {c.last_message?.content ?? c.listing_title}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#1B2D45]/30" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
