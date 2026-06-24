/**
 * Local cache for private landlord notes, keyed per conversation.
 *
 * The source of truth is the backend (landlord-only endpoints below). This localStorage
 * layer is an instant cache + offline fallback so a note is never lost on a network
 * hiccup, and so the "has notes" dot can render without a fetch. Still strictly private —
 * notes are never shown to the student.
 *
 *   GET /api/messages/conversations/{id}/notes  -> { notes: string }
 *   PUT /api/messages/conversations/{id}/notes   body { notes }
 */
const key = (conversationId: number) => `cribb_landlord_notes_${conversationId}`;

export function loadNote(conversationId: number): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key(conversationId)) ?? "";
  } catch {
    return "";
  }
}

export function saveNote(conversationId: number, text: string): void {
  if (typeof window === "undefined") return;
  try {
    if (text.trim()) localStorage.setItem(key(conversationId), text);
    else localStorage.removeItem(key(conversationId));
  } catch {
    /* ignore storage quota / availability errors */
  }
}

export function hasNote(conversationId: number): boolean {
  return loadNote(conversationId).trim().length > 0;
}
