"use client";

import { useState, useRef, useEffect } from "react";
import { CAMPUS_LOCATIONS } from "@/lib/locations";
import { Location } from "@/lib/types";

interface LocationPickerProps {
  value: string | null;
  onChange: (locationId: string) => void;
  placeholder: string;
  dot: "pickup" | "destination";
  exclude?: string | null;
}

export default function LocationPicker({ value, onChange, placeholder, dot, exclude }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = CAMPUS_LOCATIONS.find((l) => l.id === value);

  const filtered = CAMPUS_LOCATIONS.filter(
    (l) => l.id !== exclude && l.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(loc: Location) {
    onChange(loc.id);
    setOpen(false);
    setQuery("");
  }

  const isPickup = dot === "pickup";

  return (
    <div ref={containerRef} className="relative">
      {/* Field trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={[
          "w-full flex items-center gap-3 px-4 py-3.5 rounded-[11px] border-[1.5px] text-left transition-colors cursor-pointer",
          open
            ? "border-[#1F4E79] bg-white shadow-sm"
            : "border-[#DCE3EC] bg-white hover:border-[#94A3B8]",
        ].join(" ")}
      >
        <span
          className={`w-2.5 h-2.5 flex-shrink-0 ${isPickup ? "rounded-full bg-[#1F4E79]" : "rounded-[2px] bg-[#00A896]"}`}
        />
        <span
          className={`flex-1 text-[14.5px] ${selected ? "font-semibold text-[#16263B]" : "font-medium text-[#94A3B8]"}`}
        >
          {selected ? selected.name : placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-40 flex-shrink-0">
          <path d="M6 9l6 6 6-6" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 border border-[#E6EBF1] rounded-[12px] overflow-hidden shadow-[0_10px_24px_-12px_rgba(16,40,70,0.2)] bg-white z-30 absolute w-full">
          <div className="p-2.5 border-b border-[#EEF2F7]">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campus locations…"
              className="w-full px-3 py-2.5 border-[1.5px] border-[#DCE3EC] rounded-[9px] text-[14px] font-medium text-[#16263B] outline-none focus:border-[#1F4E79]"
            />
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-[13.5px] text-[#94A3B8] text-center">No locations found</div>
            ) : (
              filtered.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F7F9FC] transition-colors cursor-pointer border-b border-[#F1F4F8] last:border-0"
                >
                  <span
                    className={`w-2 h-2 flex-shrink-0 ${isPickup ? "rounded-full bg-[#1F4E79]" : "rounded-[2px] bg-[#00A896]"}`}
                  />
                  <span className="text-[14px] font-medium text-[#1B2A3D]">{loc.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
