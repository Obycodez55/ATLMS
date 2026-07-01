"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import Header from "@/app/components/ui/Header";
import { RideRequest } from "@/lib/types";

export default function RidesPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login?role=passenger"); return; }
    if (userDoc && userDoc.role !== "passenger") router.replace(`/${userDoc.role}`);
  }, [loading, user, userDoc, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rideRequests"),
      where("passengerId", "==", user.uid),
      where("status", "in", ["completed", "cancelled"]),
      orderBy("requestedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRides(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RideRequest));
      setFetching(false);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !userDoc) {
    return (
      <div className="flex flex-col h-screen bg-[#F4F6F9]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-[#E6EBF1] border-t-[#1F4E79] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9]">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 py-8">
          <h1 className="text-[22px] font-bold text-[#16263B]">My rides</h1>
          <p className="text-[13.5px] text-[#64748B] mt-1">All your completed and cancelled rides.</p>

          {fetching ? (
            <div className="flex justify-center mt-16">
              <div className="w-8 h-8 border-[3px] border-[#E6EBF1] border-t-[#1F4E79] rounded-full animate-spin" />
            </div>
          ) : rides.length === 0 ? (
            <div className="mt-16 text-center text-[#94A3B8]">
              <div className="text-[42px] mb-3">🚗</div>
              <div className="text-[16px] font-semibold text-[#64748B]">No rides yet</div>
              <div className="text-[13.5px] mt-1">Your completed rides will appear here.</div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {rides.map((ride) => (
                <RideRow key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RideRow({ ride }: { ride: RideRequest }) {
  const pickup = ride.pickupLocation;
  const dest = ride.destinationLocation;
  const date = ride.requestedAt?.toDate?.() ?? null;

  const isCompleted = ride.status === "completed";
  const isCancelledBySystem = ride.cancelledBy === "system";

  const statusLabel = isCompleted
    ? "Completed"
    : isCancelledBySystem
    ? "No driver found"
    : "Cancelled";

  const statusColor = isCompleted
    ? { text: "#0A7D70", bg: "#E6F6F4", border: "#B7E6DF" }
    : { text: "#92400E", bg: "#FFFBEB", border: "#FDE68A" };

  return (
    <div className="bg-white rounded-[14px] border border-[#E6EBF1] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        {/* Route */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-[#16263B]">
            <span className="w-2 h-2 rounded-full bg-[#1F4E79] flex-shrink-0" />
            <span className="truncate">{pickup?.name ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-[13.5px] text-[#64748B] mt-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00A896] flex-shrink-0" />
            <span className="truncate">{dest?.name ?? "—"}</span>

          </div>
        </div>

        {/* Status pill */}
        <div
          className="flex-shrink-0 text-[11.5px] font-bold px-2.5 py-1 rounded-full border"
          style={{ color: statusColor.text, background: statusColor.bg, borderColor: statusColor.border }}
        >
          {statusLabel}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-dashed border-[#E6EBF1] flex items-center gap-5 text-[12.5px] text-[#64748B]">
        {/* Fare */}
        <span className="font-bold text-[#16263B]">₦{ride.fare.toLocaleString()}</span>

        {/* Driver */}
        {ride.driverName && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
            {ride.driverName}
          </span>
        )}

        {/* Rating */}
        {isCompleted && ride.rating != null && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
            {"★".repeat(ride.rating)}{"☆".repeat(5 - ride.rating)} ({ride.rating}/5)
          </span>
        )}

        {/* Date */}
        {date && (
          <span className="ml-auto">
            {date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}
