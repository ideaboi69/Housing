export type LandlordClaimStatus = "claim_started" | "property_created" | "listing_created";

export interface LandlordClaimState {
  claim_code: string;
  status: LandlordClaimStatus;
  updated_at: string;
  property_id?: number;
  property_title?: string;
  property_address?: string;
  listing_id?: number;
  listing_rent_per_room?: number;
}

const CLAIM_CODE_KEY = "cribb_landlord_claim_code";
const CLAIM_STATE_KEY = "cribb_landlord_claim_state";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getLandlordClaimCode() {
  if (!canUseStorage()) return "";

  try {
    return localStorage.getItem(CLAIM_CODE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setLandlordClaimCode(code: string) {
  if (!canUseStorage()) return;

  try {
    if (code.trim()) localStorage.setItem(CLAIM_CODE_KEY, code.trim());
    else localStorage.removeItem(CLAIM_CODE_KEY);
  } catch {
    /* ignore storage errors */
  }
}

export function getLandlordClaimState() {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(CLAIM_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LandlordClaimState>;
    if (!parsed.claim_code || !parsed.status) return null;
    return parsed as LandlordClaimState;
  } catch {
    return null;
  }
}

export function setLandlordClaimState(state: LandlordClaimState) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(CLAIM_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage errors */
  }
}

export function clearLandlordClaim() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(CLAIM_CODE_KEY);
    localStorage.removeItem(CLAIM_STATE_KEY);
  } catch {
    /* ignore storage errors */
  }
}
