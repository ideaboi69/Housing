"use client";

import { useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { PhotoCropper } from "@/components/PhotoCropper";
import AvatarLightbox from "@/components/ui/AvatarLightbox";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  initials: string;
  fullName?: string;
  onUploaded?: (url: string) => void;
  onRemoved?: () => void;
}

export function ProfilePhotoUpload({
  currentPhotoUrl,
  initials,
  fullName,
  onUploaded,
  onRemoved,
}: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null | undefined>(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleCropped = async (file: File) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const res = await api.landlords.uploadProfilePhoto(file);
      setPhotoUrl(res.profile_photo_url);
      onUploaded?.(res.profile_photo_url);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Couldn't upload profile photo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await api.landlords.deleteProfilePhoto();
      setPhotoUrl(null);
      onRemoved?.();
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Couldn't remove profile photo");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative">
        <AvatarLightbox photoUrl={photoUrl || null} alt={fullName}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover border border-black/[0.06]"
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #FFB627)", fontSize: "22px", fontWeight: 700 }}
            >
              {initials}
            </div>
          )}
        </AvatarLightbox>
        <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/[0.08] bg-white shadow-sm transition-colors hover:bg-[#FAF8F4] z-10">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF6B35]" />
          ) : (
            <Camera className="h-3.5 w-3.5 text-[#5C6B7A]" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingFile(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>Profile photo</p>
        <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>Tap the camera badge to upload. JPG, PNG up to 5MB. Shown on your public contact card.</p>
        {photoUrl && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E8E4DC] px-3.5 py-2 text-[#5C6B7A] hover:border-[#1B2D45]/18 hover:text-[#1B2D45] transition-all disabled:opacity-50"
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              {removing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Remove
            </button>
          </div>
        )}
      </div>

      {pendingFile && (
        <PhotoCropper
          file={pendingFile}
          shape="circle"
          onConfirm={handleCropped}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}
