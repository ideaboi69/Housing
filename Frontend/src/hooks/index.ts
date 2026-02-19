"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  ListingDetailResponse,
  ListingFilters,
  HealthScoreResponse,
  ReviewResponse,
  SavedListingDetailResponse,
} from "@/types";

// ── useListings ─────────────────────────────────────────

export function useListings(filters?: ListingFilters) {
  const [data, setData] = useState<ListingDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const listings = await api.listings.browse(filters);
      setData(listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// ── useListing ──────────────────────────────────────────

export function useListing(id: number) {
  const [data, setData] = useState<ListingDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        const listing = await api.listings.getById(id);
        setData(listing);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [id]);

  return { data, isLoading, error };
}

// ── useHealthScore ──────────────────────────────────────

export function useHealthScore(listingId: number) {
  const [data, setData] = useState<HealthScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const score = await api.healthScores.get(listingId);
        setData(score);
      } catch {
        // Score may not exist yet — that's ok
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [listingId]);

  return { data, isLoading };
}

// ── useReviews ──────────────────────────────────────────

export function useReviews(params?: { property_id?: number; landlord_id?: number }) {
  const [data, setData] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const reviews = await api.reviews.browse(params);
        setData(reviews);
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [params?.property_id, params?.landlord_id]);

  return { data, isLoading };
}

// ── useSavedListings ────────────────────────────────────

export function useSavedListings() {
  const [data, setData] = useState<SavedListingDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = await api.saved.getAll();
      setData(saved);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

// ── useSaveToggle ───────────────────────────────────────

export function useSaveToggle(listingId: number) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await api.saved.check(listingId);
        setIsSaved(res.saved);
      } catch {
        // Not logged in or error — default to not saved
      }
    }
    check();
  }, [listingId]);

  const toggle = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        await api.saved.unsave(listingId);
        setIsSaved(false);
      } else {
        await api.saved.save(listingId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, isSaved]);

  return { isSaved, isLoading, toggle };
}

// ── useIsMobile ─────────────────────────────────────────

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
