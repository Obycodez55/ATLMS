"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import UICrest from "@/app/components/ui/UICrest";

export default function LandingPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && userDoc?.role) router.replace(`/${userDoc.role}`);
  }, [loading, user, userDoc, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F6F9]">
        <div className="w-6 h-6 border-[3px] border-[#E2E8F0] border-t-[#1F4E79] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── Left panel ── */}
      <div className="relative hidden lg:flex w-[46%] min-w-[520px] flex-col overflow-hidden bg-[#0F2A45]">
        <div className="absolute inset-0 bg-[#1F4E79] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,42,69,0.72)] to-[rgba(15,42,69,0.92)]" />

        <div className="relative z-10 flex items-start justify-between px-14 pt-14 text-white">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-[11px] bg-white flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="#1F4E79" />
                <circle cx="12" cy="9" r="2.6" fill="#fff" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-wide">ALTMS</div>
              <div className="text-xs opacity-70 mt-0.5">University of Ibadan</div>
            </div>
          </div>
          <UICrest className="w-14 h-auto drop-shadow-lg" />
        </div>

        <div className="relative z-10 mt-auto px-14 pb-14 text-white">
          <div className="text-[30px] font-bold leading-tight max-w-[420px]">
            Campus rides, on demand.
          </div>
          <div className="text-[15px] opacity-80 mt-4 max-w-[380px] leading-relaxed">
            Fixed fares, real drivers, live tracking — anywhere across the University of Ibadan campus.
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {["Fixed fares", "Live GPS tracking", "Campus drivers", "Instant matching"].map((f) => (
              <span key={f} className="text-[12px] font-semibold bg-white/10 border border-white/20 text-white/90 rounded-full px-3 py-1">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: portal selection ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-8 overflow-y-auto">
        <div className="w-full max-w-[420px] py-4">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <UICrest className="w-[46px] h-auto lg:hidden" />
            <div className="text-[12.5px] font-semibold text-[#64748B] leading-snug lg:hidden">
              University of Ibadan
              <br />
              <span className="text-[#94A3B8] font-medium">Official campus transport</span>
            </div>
          </div>

          <h1 className="text-[26px] font-bold text-[#16263B]">Welcome to ALTMS</h1>
          <p className="text-[14.5px] text-[#64748B] mt-2">Select your portal to sign in or create an account.</p>

          {/* Portal cards */}
          <div className="mt-8 flex flex-col gap-4">

            {/* Passenger */}
            <Link
              href="/login?role=passenger"
              className="group flex items-center gap-5 bg-white border-2 border-[#E6EBF1] hover:border-[#1F4E79] rounded-[16px] p-5 transition-all shadow-[0_1px_4px_rgba(16,40,70,0.06)] hover:shadow-[0_4px_16px_rgba(31,78,121,0.12)]"
            >
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#EEF4FB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1F4E79] transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[#1F4E79] group-hover:text-white transition-colors">
                  <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[15.5px] font-bold text-[#16263B]">Passenger Portal</div>
                <div className="text-[13px] text-[#64748B] mt-0.5">Book rides around campus with fixed fares</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#CBD5E1] group-hover:text-[#1F4E79] transition-colors flex-shrink-0">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* Driver */}
            <Link
              href="/login?role=driver"
              className="group flex items-center gap-5 bg-white border-2 border-[#E6EBF1] hover:border-[#00A896] rounded-[16px] p-5 transition-all shadow-[0_1px_4px_rgba(16,40,70,0.06)] hover:shadow-[0_4px_16px_rgba(0,168,150,0.12)]"
            >
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#E6F7F5] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A896] transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[#00A896] group-hover:text-white transition-colors">
                  <path d="M3 13l2-5a2 2 0 012-1.4h10A2 2 0 0119 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="7.5" cy="14.5" r="1.2" fill="currentColor" />
                  <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[15.5px] font-bold text-[#16263B]">Driver Portal</div>
                <div className="text-[13px] text-[#64748B] mt-0.5">Accept ride requests and manage your trips</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#CBD5E1] group-hover:text-[#00A896] transition-colors flex-shrink-0">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

          </div>

          {/* Admin — subtle link */}
          <div className="mt-6 text-center">
            <Link
              href="/login?role=admin"
              className="text-[13px] text-[#94A3B8] hover:text-[#475569] font-medium transition-colors"
            >
              Admin access →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
