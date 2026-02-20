"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileBottomTabsProps {
  onMapTab?: () => void;
  onSavedTab?: () => void;
  picksCount?: number;
}

const tabs = [
  { icon: "🏠", label: "Browse", path: "/browse", key: "browse" },
  { icon: "🗺️", label: "Map", path: "/browse", key: "map" },
  { icon: "☀️", label: "Sublets", path: "/sublets", key: "sublets" },
  { icon: "📌", label: "Saved", path: "/browse", key: "saved" },
  { icon: "👤", label: "Profile", path: "#", key: "profile" },
];

export function MobileBottomTabs({
  onMapTab,
  onSavedTab,
  picksCount = 0,
}: MobileBottomTabsProps) {
  const pathname = usePathname();
  const isBrowse = pathname === "/browse";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-black/[0.06] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-[56px]">
        {tabs.map((tab) => {
          const isActive =
            (tab.key === "browse" && isBrowse) ||
            (tab.key === "sublets" && pathname === "/sublets");

          const handleClick = (e: React.MouseEvent) => {
            if (tab.key === "map" && onMapTab) {
              e.preventDefault();
              onMapTab();
            }
            if (tab.key === "saved" && onSavedTab) {
              e.preventDefault();
              onSavedTab();
            }
          };

          return (
            <Link
              key={tab.key}
              href={tab.path}
              onClick={handleClick}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors ${
                isActive ? "text-[#FF6B35]" : "text-[#1B2D45]/40"
              }`}
            >
              <span style={{ fontSize: "18px", lineHeight: 1 }}>
                {tab.icon}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </span>
              {tab.key === "saved" && picksCount > 0 && (
                <div
                  className="absolute top-1 right-1/2 translate-x-4 bg-[#FF6B35] text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center"
                  style={{ fontSize: "9px", fontWeight: 700, padding: "0 4px" }}
                >
                  {picksCount}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
