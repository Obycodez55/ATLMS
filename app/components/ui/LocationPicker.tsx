"use client";

import { useState, useRef, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { CAMPUS_LOCATIONS, CAMPUS_BOUNDS } from "@/lib/locations";
import { PickedLocation } from "@/lib/types";

const LIBRARIES: ("marker" | "places")[] = ["marker", "places"];

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation | null) => void;
  placeholder: string;
  dot: "pickup" | "destination";
  exclude?: PickedLocation | null;
}

export default function LocationPicker({ value, onChange, placeholder, dot, exclude }: LocationPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const attrNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded || typeof google === "undefined") return;
    autocompleteRef.current = new google.maps.places.AutocompleteService();
    attrNodeRef.current = document.createElement("div");
    placesRef.current = new google.maps.places.PlacesService(attrNodeRef.current);
  }, [isLoaded]);

  // Debounced predictions fetch
  useEffect(() => {
    if (!isLoaded || !autocompleteRef.current || !query.trim()) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(() => {
      autocompleteRef.current!.getPlacePredictions(
        {
          input: query,
          locationRestriction: {
            north: CAMPUS_BOUNDS.north,
            south: CAMPUS_BOUNDS.south,
            east: CAMPUS_BOUNDS.east,
            west: CAMPUS_BOUNDS.west,
          },
        },
        (preds, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
            setPredictions(preds.slice(0, 5));
          } else {
            setPredictions([]);
          }
        }
      );
    }, 280);
    return () => clearTimeout(timer);
  }, [query, isLoaded]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleClose() {
    setOpen(false);
    setQuery("");
    setPredictions([]);
  }

  function selectQuickPick(loc: (typeof CAMPUS_LOCATIONS)[0]) {
    onChange({ name: loc.name, lat: loc.lat, lng: loc.lng });
    handleClose();
  }

  function selectPrediction(pred: google.maps.places.AutocompletePrediction) {
    if (!placesRef.current) return;
    placesRef.current.getDetails(
      { placeId: pred.place_id, fields: ["name", "geometry.location"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          onChange({
            name: place.name ?? pred.structured_formatting.main_text,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: pred.place_id,
          });
        }
        handleClose();
      }
    );
  }

  const isPickup = dot === "pickup";
  const dotClassName = isPickup
    ? "w-2 h-2 rounded-full bg-[#1F4E79] flex-shrink-0"
    : "w-2 h-2 rounded-[2px] bg-[#00A896] flex-shrink-0";

  const quickPicks = CAMPUS_LOCATIONS.filter((l) => {
    if (exclude && l.lat === exclude.lat && l.lng === exclude.lng) return false;
    if (query && !l.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const showPredictions = isLoaded && predictions.length > 0;
  const showQuickPicks = quickPicks.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={[
          "w-full flex items-center gap-3 px-4 py-3.5 rounded-[11px] border-[1.5px] text-left transition-colors cursor-pointer",
          open
            ? "border-[#1F4E79] bg-white shadow-sm"
            : "border-[#DCE3EC] bg-white hover:border-[#94A3B8]",
        ].join(" ")}
      >
        <span className={dotClassName} />
        <span
          className={`flex-1 text-[14.5px] ${
            value ? "font-semibold text-[#16263B]" : "font-medium text-[#94A3B8]"
          }`}
        >
          {value ? value.name : placeholder}
        </span>

        {value ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="w-5 h-5 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] flex-shrink-0 border-none bg-transparent cursor-pointer p-0"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-40 flex-shrink-0">
            <path d="M6 9l6 6 6-6" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute w-full mt-2 bg-white border border-[#E6EBF1] rounded-[12px] shadow-[0_10px_24px_-12px_rgba(16,40,70,0.22)] z-30 overflow-hidden">
          {/* Search input */}
          <div className="p-2.5 border-b border-[#EEF2F7]">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campus…"
              className="w-full px-3 py-2.5 border-[1.5px] border-[#DCE3EC] rounded-[9px] text-[14px] font-medium text-[#16263B] outline-none focus:border-[#1F4E79]"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {/* Google Places predictions */}
            {showPredictions && (
              <>
                <div className="px-4 pt-2.5 pb-1 text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">
                  Campus search
                </div>
                {predictions.map((pred) => (
                  <button
                    key={pred.place_id}
                    type="button"
                    onClick={() => selectPrediction(pred)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F7F9FC] transition-colors border-b border-[#F1F4F8] last:border-0 cursor-pointer"
                  >
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[#94A3B8]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                        <path d="M17 17l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-[#1B2A3D] truncate">
                        {pred.structured_formatting.main_text}
                      </div>
                      <div className="text-[11.5px] text-[#94A3B8] truncate">
                        {pred.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </button>
                ))}
                {showQuickPicks && <div className="border-t border-[#EEF2F7]" />}
              </>
            )}

            {/* Quick-pick locations */}
            {showQuickPicks ? (
              <>
                <div className="px-4 pt-2.5 pb-1 text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">
                  {showPredictions ? "Also on campus" : "Campus locations"}
                </div>
                {quickPicks.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => selectQuickPick(loc)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F7F9FC] transition-colors border-b border-[#F1F4F8] last:border-0 cursor-pointer"
                  >
                    <span className={dotClassName} />
                    <span className="text-[14px] font-medium text-[#1B2A3D]">{loc.name}</span>
                  </button>
                ))}
              </>
            ) : !showPredictions ? (
              <div className="px-4 py-6 text-[13.5px] text-[#94A3B8] text-center">
                No locations found
              </div>
            ) : null}

            {/* Tap-to-pick hint at bottom */}
            <div className="px-4 py-2.5 border-t border-[#EEF2F7] text-[11.5px] text-[#94A3B8] flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Or tap any point on the map
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
