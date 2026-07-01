"use client";

import { CAMPUS_LOCATIONS, getFare, getSharedFare } from "@/lib/locations";

const SHORT_NAME: Record<string, string> = {
  "main-gate":          "Main Gate",
  "faculty-science":    "Sci / Tech Faculty",
  "faculty-arts":       "Arts / Law Faculty",
  "faculty-education":  "Education Faculty",
  "college-medicine":   "College of Medicine",
  "postgraduate":       "Postgraduate School",
  "student-union":      "Student Union",
  "residential-halls":  "Residential Halls",
};

interface FarePair {
  key: string;
  fromName: string;
  toName: string;
  solo: number;
  shared: number;
}

function buildPairs(): FarePair[] {
  const pairs: FarePair[] = [];
  for (let i = 0; i < CAMPUS_LOCATIONS.length; i++) {
    for (let j = i + 1; j < CAMPUS_LOCATIONS.length; j++) {
      const from = CAMPUS_LOCATIONS[i];
      const to = CAMPUS_LOCATIONS[j];
      const solo = getFare(from.id, to.id);
      const shared = getSharedFare(from.id, to.id);
      if (solo !== null && shared !== null) {
        pairs.push({
          key: `${from.id}__${to.id}`,
          fromName: SHORT_NAME[from.id] ?? from.name,
          toName: SHORT_NAME[to.id] ?? to.name,
          solo,
          shared,
        });
      }
    }
  }
  return pairs.sort((a, b) => a.solo - b.solo);
}

const FARE_PAIRS = buildPairs();

export default function FareMatrixModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(16,38,59,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-[18px] shadow-2xl overflow-hidden max-h-[82vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EBF1]">
          <div>
            <div className="text-[18px] font-bold text-[#16263B]">Fare guide</div>
            <div className="text-[13px] text-[#64748B] mt-0.5">All routes · Fixed fares · No surge pricing</div>
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

        {/* Column headers */}
        <div className="flex items-center px-6 py-2.5 bg-[#F7F9FC] border-b border-[#E6EBF1]">
          <span className="flex-1 text-[11.5px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Route</span>
          <span className="w-[70px] text-right text-[11.5px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Solo</span>
          <span className="w-[80px] text-right text-[11.5px] font-bold text-[#0A7D70] uppercase tracking-[0.5px]">Shared</span>
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1">
          {FARE_PAIRS.map((p, i) => (
            <div
              key={p.key}
              className={`flex items-center gap-4 px-6 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-[#16263B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F4E79] flex-shrink-0" />
                  <span className="truncate">{p.fromName}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#64748B] mt-1">
                  <span className="w-1.5 h-1.5 rounded-[2px] bg-[#00A896] flex-shrink-0" />
                  <span className="truncate">{p.toName}</span>
                </div>
              </div>
              <div className="w-[70px] text-right font-bold text-[#16263B] tabular-nums text-[14px]">
                ₦{p.solo}
              </div>
              <div className="w-[80px] text-right font-bold text-[#0A7D70] tabular-nums text-[14px]">
                ₦{p.shared}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E6EBF1] bg-[#F7F9FC] text-[12px] text-[#94A3B8] text-center">
          Shared fare applies when 2+ passengers ride the same route within the same time window.
        </div>
      </div>
    </div>
  );
}
