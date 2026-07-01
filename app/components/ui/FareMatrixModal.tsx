"use client";

import { CAMPUS_LOCATIONS, getDistanceFare, getDistanceSharedFare, haversineMeters } from "@/lib/locations";

interface RouteSample {
  from: string;
  to: string;
  distM: number;
  solo: number;
  shared: number;
}

function buildSamples(): RouteSample[] {
  const pairs: RouteSample[] = [];
  for (let i = 0; i < CAMPUS_LOCATIONS.length; i++) {
    for (let j = i + 1; j < CAMPUS_LOCATIONS.length; j++) {
      const a = CAMPUS_LOCATIONS[i];
      const b = CAMPUS_LOCATIONS[j];
      const distM = Math.round(haversineMeters(a.lat, a.lng, b.lat, b.lng));
      pairs.push({
        from: a.name,
        to: b.name,
        distM,
        solo: getDistanceFare(a.lat, a.lng, b.lat, b.lng),
        shared: getDistanceSharedFare(a.lat, a.lng, b.lat, b.lng),
      });
    }
  }
  // Sort by distance and keep one entry per unique fare bracket, max 18 rows
  pairs.sort((a, b) => a.distM - b.distM);
  const seen = new Set<number>();
  return pairs.filter((p) => {
    if (seen.has(p.solo)) return false;
    seen.add(p.solo);
    return true;
  }).slice(0, 18);
}

const SAMPLES = buildSamples();

export default function FareMatrixModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(16,38,59,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-[18px] shadow-2xl overflow-hidden max-h-[86vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EBF1]">
          <div>
            <div className="text-[18px] font-bold text-[#16263B]">Pricing guide</div>
            <div className="text-[13px] text-[#64748B] mt-0.5">Distance-based · No surge pricing</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F4F6F9] hover:bg-[#E6EBF1] flex items-center justify-center transition-colors cursor-pointer border-none"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 1l11 11M12 1L1 12" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Formula card */}
        <div className="mx-5 mt-4 bg-[#F0F5FF] border border-[#C7D8F5] rounded-[14px] px-5 py-4 flex gap-5">
          <div className="flex-1 text-center border-r border-[#C7D8F5] pr-5">
            <div className="text-[11px] font-bold text-[#4B6BA9] uppercase tracking-[0.5px]">Rate</div>
            <div className="text-[22px] font-extrabold text-[#1F4E79] mt-0.5">₦150<span className="text-[14px] font-semibold text-[#64748B]">/km</span></div>
          </div>
          <div className="flex-1 text-center border-r border-[#C7D8F5] pr-5">
            <div className="text-[11px] font-bold text-[#4B6BA9] uppercase tracking-[0.5px]">Minimum</div>
            <div className="text-[22px] font-extrabold text-[#1F4E79] mt-0.5">₦100</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-[11px] font-bold text-[#0A7D70] uppercase tracking-[0.5px]">Shared save</div>
            <div className="text-[22px] font-extrabold text-[#0A7D70] mt-0.5">30%<span className="text-[14px] font-semibold text-[#64748B]"> off</span></div>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center px-5 py-2.5 mt-3 bg-[#F7F9FC] border-y border-[#E6EBF1]">
          <span className="flex-1 text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Example route</span>
          <span className="w-[56px] text-right text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Dist</span>
          <span className="w-[64px] text-right text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Solo</span>
          <span className="w-[70px] text-right text-[11px] font-bold text-[#0A7D70] uppercase tracking-[0.5px]">Shared</span>
        </div>

        {/* Sample rows */}
        <div className="overflow-y-auto flex-1">
          {SAMPLES.map((s, i) => (
            <div
              key={i}
              className={`flex items-center px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#16263B] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F4E79] flex-shrink-0" />
                  <span className="truncate">{s.from}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#64748B] mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-[2px] bg-[#00A896] flex-shrink-0" />
                  <span className="truncate">{s.to}</span>
                </div>
              </div>
              <div className="w-[56px] text-right text-[12px] text-[#94A3B8] tabular-nums">
                {s.distM < 1000 ? `${s.distM}m` : `${(s.distM / 1000).toFixed(1)}km`}
              </div>
              <div className="w-[64px] text-right font-bold text-[#16263B] tabular-nums text-[13.5px]">
                ₦{s.solo}
              </div>
              <div className="w-[70px] text-right font-bold text-[#0A7D70] tabular-nums text-[13.5px]">
                ₦{s.shared}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E6EBF1] bg-[#F7F9FC] text-[11.5px] text-[#94A3B8] text-center">
          Fares are calculated at pickup · Shared fares split equally among co-riders
        </div>
      </div>
    </div>
  );
}
