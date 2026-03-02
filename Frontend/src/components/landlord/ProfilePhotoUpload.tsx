"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2, Check, Trash2 } from "lucide-react";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  initials: string;
  onUploaded?: (url: string) => void;
  onRemoved?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ProfilePhotoUpload({ currentPhotoUrl, initials, onUploaded, onRemoved }: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const token = localStorage.getItem("cribb_token");
      const formData = new FormData();
      formData.append("file", file);

      // TODO: OJ needs to create POST /api/landlords/me/photo
      const res = await fetch(`${API_URL}/api/landlords/me/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setPhotoUrl(data.photo_url);
      setPreview(null);
      onUploaded?.(data.photo_url);
    } catch {
      // API not available yet — keep the preview as the "photo"
      // This lets the UI work before OJ builds the endpoint
      if (preview) {
        setPhotoUrl(preview);
        setPreview(null);
        onUploaded?.(preview);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const token = localStorage.getItem("cribb_token");
      // TODO: OJ needs to create DELETE /api/landlords/me/photo
      await fetch(`${API_URL}/api/landlords/me/photo`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* API not ready yet */ }
    setPhotoUrl(null);
    setPreview(null);
    onRemoved?.();
  };

  const displayUrl = preview || photoUrl;

  return (
    <div className="flex items-center gap-4">
      {/* Avatar with overlay */}
      <div className="relative group">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center">
          {displayUrl ? (
            <img src={displayUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#FF6B35]" style={{ fontSize: "20px", fontWeight: 800 }}>{initials}</span>
          )}
        </div>

        {/* Camera overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Actions */}
      <div>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-[#1B2D45] hover:text-[#1B2D45]/70 transition-colors"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          {displayUrl ? "Change photo" : "Upload photo"}
        </button>
        {displayUrl && (
          <button
            onClick={handleRemove}
            className="text-[#E71D36]/50 hover:text-[#E71D36] transition-colors ml-3"
            style={{ fontSize: "12px", fontWeight: 500 }}
          >
            Remove
          </button>
        )}
        <p className="text-[#1B2D45]/20 mt-0.5" style={{ fontSize: "10px" }}>
          Shown on your contact card. JPG or PNG, max 2MB.
        </p>
      </div>
    </div>
  );
}