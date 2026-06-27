"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface BubbleShareMenuProps {
  path: string;
  title: string;
  description?: string;
  author?: string;
  categoryLabel?: string;
  timestamp?: string;
  variant?: "icon" | "button";
}

function getAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}...`;
  }

  return lines;
}

async function createStoryCard({
  title,
  author,
  categoryLabel,
  timestamp,
  url,
}: {
  title: string;
  author?: string;
  categoryLabel?: string;
  timestamp?: string;
  url: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  ctx.fillStyle = "#FAF8F4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bubbles = [
    [86, 120, 86], [934, 188, 128], [980, 650, 68], [82, 780, 54],
    [924, 1240, 94], [150, 1500, 126], [854, 1710, 58],
  ];
  bubbles.forEach(([x, y, r]) => {
    const gradient = ctx.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.45, "rgba(255,107,53,0.16)");
    gradient.addColorStop(1, "rgba(255,107,53,0.03)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#FF6B35";
  ctx.font = "800 44px Arial, sans-serif";
  ctx.fillText("cribb", 82, 124);
  ctx.fillStyle = "#1B2D45";
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText("THE BUBBLE", 82, 174);

  const pillText = categoryLabel || "Guelph";
  ctx.font = "800 28px Arial, sans-serif";
  const pillWidth = Math.min(700, ctx.measureText(pillText).width + 56);
  roundRect(ctx, 82, 304, pillWidth, 62, 31);
  ctx.fillStyle = "rgba(255,107,53,0.12)";
  ctx.fill();
  ctx.fillStyle = "#FF6B35";
  ctx.fillText(pillText, 110, 346);

  ctx.fillStyle = "#1B2D45";
  ctx.font = "900 82px Arial, sans-serif";
  const titleLines = wrapText(ctx, title, 916, 8);
  let y = 500;
  titleLines.forEach((line) => {
    ctx.fillText(line, 82, y);
    y += 96;
  });

  ctx.fillStyle = "#5C6B7A";
  ctx.font = "700 32px Arial, sans-serif";
  const byline = [author ? `By ${author}` : null, timestamp].filter(Boolean).join(" · ");
  if (byline) ctx.fillText(byline, 82, Math.min(y + 34, 1330));

  roundRect(ctx, 82, 1460, 916, 250, 44);
  ctx.fillStyle = "#1B2D45";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 44px Arial, sans-serif";
  ctx.fillText("Read the full post on Cribb", 132, 1548);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "600 27px Arial, sans-serif";
  const cleanUrl = url.replace(/^https?:\/\//, "");
  wrapText(ctx, cleanUrl, 800, 2).forEach((line, index) => {
    ctx.fillText(line, 132, 1615 + index * 38);
  });

  ctx.fillStyle = "#FF6B35";
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("findyourcribb.com", 82, 1810);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create story card"));
    }, "image/png");
  });
}

export function BubbleShareMenu({
  path,
  title,
  description,
  author,
  categoryLabel,
  timestamp,
  variant = "icon",
}: BubbleShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);

  const copyLink = useCallback(async () => {
    const url = getAbsoluteUrl(path);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 1800);
  }, [path]);

  const sharePost = useCallback(async () => {
    const url = getAbsoluteUrl(path);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${title} - Cribb`,
          text: description || `Check out this post on The Bubble: ${title}`,
          url,
        });
        setOpen(false);
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  }, [copyLink, description, path, title]);

  const shareStoryCard = useCallback(async () => {
    setWorking(true);
    try {
      const url = getAbsoluteUrl(path);
      const blob = await createStoryCard({ title, author, categoryLabel, timestamp, url });
      const file = new File([blob], "cribb-bubble-story.png", { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }) && typeof navigator.share === "function") {
        await navigator.share({
          title: `${title} - Cribb`,
          text: "Share this Bubble post",
          files: [file],
        });
      } else {
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = "cribb-bubble-story.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      }

      setOpen(false);
    } finally {
      setWorking(false);
    }
  }, [author, categoryLabel, path, timestamp, title]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={variant === "button"
          ? "inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white hover:bg-[#e55e2e] transition-colors"
          : "w-8 h-8 flex items-center justify-center rounded-lg text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors"}
        style={{ fontSize: variant === "button" ? "13px" : undefined, fontWeight: variant === "button" ? 800 : undefined }}
        aria-label="Share this Bubble post"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Share2 className={variant === "button" ? "w-4 h-4" : "w-3.5 h-3.5"} />}
        {variant === "button" && (copied ? "Copied" : "Share")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 bottom-10 z-30 w-[230px] rounded-2xl border border-black/[0.06] bg-white p-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800 }}>Share post</span>
              <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-lg text-[#98A3B0] hover:bg-[#1B2D45]/5 flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={sharePost} className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[#1B2D45] hover:bg-[#1B2D45]/[0.04]" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Share2 className="w-4 h-4 text-[#FF6B35]" /> Share link
            </button>
            <button onClick={copyLink} className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[#1B2D45] hover:bg-[#1B2D45]/[0.04]" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Copy className="w-4 h-4 text-[#FF6B35]" /> Copy link
            </button>
            <button disabled={working} onClick={shareStoryCard} className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] disabled:opacity-60" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Download className="w-4 h-4 text-[#FF6B35]" /> {working ? "Creating story..." : "Story card"}
            </button>
            <p className="px-2.5 pb-1.5 pt-1 text-[#98A3B0]" style={{ fontSize: "10px", lineHeight: 1.4 }}>
              Use the story card for Instagram Stories, Snapchat, or group chats.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
