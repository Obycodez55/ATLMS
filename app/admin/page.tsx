"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import Header from "@/app/components/ui/Header";
import { RideRequest, UserDoc } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting",
  accepted: "Matched",
  in_progress: "In transit",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:     { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  accepted:    { bg: "#EFF6FF", text: "#1e40af", dot: "#3B82F6" },
  in_progress: { bg: "#E6F6F4", text: "#0A7D70", dot: "#00A896" },
};

export default function AdminPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  const [activeRides, setActiveRides] = useState<RideRequest[]>([]);
  const [completedToday, setCompletedToday] = useState<RideRequest[]>([]);
  const [drivers, setDrivers] = useState<UserDoc[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (userDoc && userDoc.role !== "admin") router.replace(`/${userDoc.role}`);
  }, [loading, user, userDoc, router]);

  // Live active rides
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "rideRequests"), where("status", "in", ["pending", "accepted", "in_progress"])),
      (snap) => setActiveRides(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RideRequest)))
    );
    return unsub;
  }, []);

  // Completed rides — filtered to today client-side
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unsub = onSnapshot(
      query(collection(db, "rideRequests"), where("status", "==", "completed")),
      (snap) => {
        const todayRides = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as RideRequest))
          .filter((r) => {
            if (!r.completedAt) return false;
            const ts = r.completedAt as unknown as { toDate?: () => Date };
            const date = ts.toDate ? ts.toDate() : new Date(r.completedAt as unknown as string);
            return date >= today;
          });
        setCompletedToday(todayRides);
      }
    );
    return unsub;
  }, []);

  // All drivers
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users"), where("role", "==", "driver")),
      (snap) => setDrivers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)))
    );
    return unsub;
  }, []);

  if (loading || !userDoc) return <LoadingScreen />;

  const onlineDrivers = drivers.filter((d) => d.isOnline);
  const revenueToday = completedToday.reduce((sum, r) => sum + (r.fare ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9]">
      <Header />
      <main className="flex-1 p-8 max-w-[1280px] mx-auto w-full">

        {/* Page title */}
        <div className="mb-7">
          <h1 className="text-[22px] font-bold text-[#16263B]">System Overview</h1>
          <p className="text-[13.5px] text-[#64748B] mt-1">Live campus ride activity — updates in real time</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Active rides"
            value={String(activeRides.length)}
            accent="#F59E0B"
            sub="pending / matched / in transit"
          />
          <StatCard
            label="Online drivers"
            value={String(onlineDrivers.length)}
            accent="#00A896"
            sub={`${drivers.length} driver${drivers.length !== 1 ? "s" : ""} total`}
          />
          <StatCard
            label="Completed today"
            value={String(completedToday.length)}
            accent="#3B82F6"
            sub="trips finished"
          />
          <StatCard
            label="Revenue today"
            value={`₦${revenueToday.toLocaleString()}`}
            accent="#1F4E79"
            sub="across all completed trips"
          />
        </div>

        {/* Main content */}
        <div className="mt-8 grid grid-cols-[1fr_320px] gap-6 items-start">

          {/* Active rides */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[16px] font-bold text-[#16263B]">Active rides</h2>
              {activeRides.length > 0 && (
                <span className="text-[11.5px] font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full tabular-nums">
                  {activeRides.length} live
                </span>
              )}
            </div>

            {activeRides.length === 0 ? (
              <div className="bg-white border border-[#E6EBF1] rounded-[16px] py-14 flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-[#EEF2F7] flex items-center justify-center mb-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 17v4m-3-2h6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-[#64748B]">No active rides</p>
                <p className="text-[12.5px] text-[#94A3B8]">New requests will appear here instantly</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeRides.map((ride) => (
                  <RideRow key={ride.id} ride={ride} />
                ))}
              </div>
            )}
          </section>

          {/* Driver roster */}
          <section>
            <h2 className="text-[16px] font-bold text-[#16263B] mb-4">Drivers</h2>
            {drivers.length === 0 ? (
              <div className="bg-white border border-[#E6EBF1] rounded-[16px] py-10 text-center text-[14px] text-[#94A3B8]">
                No drivers registered
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Online first */}
                {[...drivers].sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0)).map((driver) => (
                  <DriverRow key={driver.uid} driver={driver} />
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Completed today */}
        {completedToday.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[16px] font-bold text-[#16263B] mb-4">
              Completed today
              <span className="ml-2 text-[12px] font-semibold text-[#64748B]">({completedToday.length})</span>
            </h2>
            <div className="bg-white border border-[#E6EBF1] rounded-[16px] overflow-hidden">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-[#EEF2F7] text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">
                    <th className="text-left px-5 py-3">Route</th>
                    <th className="text-left px-5 py-3">Passenger</th>
                    <th className="text-left px-5 py-3">Driver</th>
                    <th className="text-right px-5 py-3">Fare</th>
                    <th className="text-right px-5 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {completedToday.map((ride, i) => {
                    const pickup = ride.pickupLocation?.name ?? "—";
                    const dest = ride.destinationLocation?.name ?? "—";
                    return (
                      <tr
                        key={ride.id}
                        className={`border-b border-[#F7F9FC] last:border-0 ${i % 2 === 0 ? "" : "bg-[#FAFBFC]"}`}
                      >
                        <td className="px-5 py-3 font-medium text-[#1B2A3D]">
                          <span className="text-[#64748B]">{pickup}</span>
                          <span className="mx-1.5 text-[#CBD5E1]">→</span>
                          {dest}
                        </td>
                        <td className="px-5 py-3 text-[#475569]">{ride.passengerName}</td>
                        <td className="px-5 py-3 text-[#475569]">{ride.driverName ?? "—"}</td>
                        <td className="px-5 py-3 text-right font-bold text-[#1F4E79] tabular-nums">
                          ₦{ride.fare.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          {ride.rating ? (
                            <span className="font-semibold text-[#1B2A3D]">{ride.rating} ★</span>
                          ) : (
                            <span className="text-[#CBD5E1]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────

function StatCard({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#E6EBF1] rounded-[16px] p-5" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="text-[28px] font-extrabold tabular-nums" style={{ color: accent }}>{value}</div>
      <div className="text-[13px] font-semibold text-[#16263B] mt-1">{label}</div>
      {sub && <div className="text-[11.5px] text-[#94A3B8] mt-0.5">{sub}</div>}
    </div>
  );
}

function RideRow({ ride }: { ride: RideRequest }) {
  const pickup = ride.pickupLocation?.name ?? "—";
  const dest = ride.destinationLocation?.name ?? "—";
  const colors = STATUS_COLORS[ride.status] ?? STATUS_COLORS.pending;

  return (
    <div className="bg-white border border-[#E6EBF1] rounded-[14px] p-4 flex items-center gap-4">
      {/* Status badge */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold flex-shrink-0"
        style={{ background: colors.bg, color: colors.text }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
        {STATUS_LABEL[ride.status]}
      </div>

      {/* Route */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1B2A3D] truncate">
          <span className="w-2 h-2 rounded-full bg-[#1F4E79] flex-shrink-0" />
          <span className="truncate">{pickup}</span>
          <span className="text-[#CBD5E1] flex-shrink-0">→</span>
          <span className="w-2 h-2 rounded-[2px] bg-[#00A896] flex-shrink-0" />
          <span className="truncate">{dest}</span>
        </div>
        <div className="text-[12px] text-[#64748B] mt-0.5">
          {ride.passengerName}
          {ride.driverName && (
            <span className="text-[#94A3B8]"> · {ride.driverName}</span>
          )}
        </div>
      </div>

      {/* Fare */}
      <div className="text-[15px] font-extrabold text-[#1F4E79] tabular-nums flex-shrink-0">
        ₦{ride.fare.toLocaleString()}
      </div>
    </div>
  );
}

function DriverRow({ driver }: { driver: UserDoc }) {
  const initials = driver.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const vehicle = driver.vehicleType === "tricycle" ? "Keke" : driver.vehicleType === "cab" ? "Cab" : "—";

  return (
    <div className="bg-white border border-[#E6EBF1] rounded-[12px] px-4 py-3 flex items-center gap-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#EEF2F7] text-[#1F4E79] text-[13px] font-bold flex items-center justify-center flex-shrink-0">
        {initials}
      </div>

      {/* Name + vehicle */}
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-[#16263B] truncate">{driver.fullName}</div>
        <div className="text-[11.5px] text-[#94A3B8] mt-0.5">
          {vehicle}
          {driver.ratingCount ? ` · ${(driver.ratingAvg ?? 0).toFixed(1)} ★` : ""}
        </div>
      </div>

      {/* Online indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: driver.isOnline ? "#00A896" : "#CBD5E1",
            boxShadow: driver.isOnline ? "0 0 0 3px rgba(0,168,150,0.2)" : "none",
          }}
        />
        <span className={`text-[11.5px] font-semibold ${driver.isOnline ? "text-[#0A7D70]" : "text-[#94A3B8]"}`}>
          {driver.isOnline ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9]">
      <div className="h-16 bg-white border-b border-[#E6EBF1]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-[#E2E8F0] border-t-[#475569] rounded-full animate-spin" />
      </div>
    </div>
  );
}
