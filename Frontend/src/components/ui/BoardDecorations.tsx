"use client";

export function Pushpin() {
  return (
    <svg
      width="16"
      height="22"
      viewBox="0 0 16 22"
      fill="none"
      className="drop-shadow-sm"
    >
      <circle cx="8" cy="8" r="6" fill="#E71D36" />
      <circle cx="8" cy="8" r="3.5" fill="#FF4D6A" />
      <ellipse cx="8" cy="7" rx="2" ry="1.5" fill="rgba(255,255,255,0.35)" />
      <rect x="7.2" y="13" width="1.6" height="8" rx="0.8" fill="#B0B0B0" />
    </svg>
  );
}

export function TapeStrip({
  side,
  rotation,
}: {
  side: "left" | "right";
  rotation: number;
}) {
  return (
    <div
      className="absolute top-0 w-10 h-3"
      style={{
        [side]: "12px",
        transform: `rotate(${rotation}deg) translateY(-40%)`,
        background:
          "linear-gradient(135deg, rgba(255,220,150,0.55) 0%, rgba(255,200,100,0.35) 100%)",
        borderRadius: "1px",
        zIndex: 3,
      }}
    />
  );
}
