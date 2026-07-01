"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, setDoc, deleteDoc, serverTimestamp, collection, query, where, onSnapshot, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import Header from "@/app/components/ui/Header";
import CampusMap from "@/app/components/map/CampusMap";
import RouteCard from "@/app/components/ui/RouteCard";
import { Button } from "@/components/ui/button";
import { getLocationById } from "@/lib/locations";
import { RideRequest } from "@/lib/types";

export default function DriverPage() {
  const { user, userDoc, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [online, setOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Incoming pending request (the first one visible to this driver)
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);

  // Active request this driver is handling
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);

  // Ref tracking the last incoming request id we toasted for — avoids setState-during-render
  const lastIncomingId = useRef<string | null>(null);

  // Throttle ref for GPS writes — avoids flooding Firestore
  const lastLocationWriteRef = useRef(0);

  // Today's stats (simple counts from Firestore)
  const [todayStats, setTodayStats] = useState({ trips: 0, earnings: 0 });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Sync online state from userDoc
  useEffect(() => {
    if (userDoc) setOnline(userDoc.isOnline ?? false);
  }, [userDoc]);

  // Listen for any active request already assigned to this driver
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rideRequests"),
      where("driverId", "==", user.uid),
      where("status", "in", ["accepted", "in_progress"])
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setActiveRequest({ id: d.id, ...d.data() } as RideRequest);
      } else {
        setActiveRequest(null);
      }
    });
    return unsub;
  }, [user]);

  // Listen for incoming pending requests when online (and no active request)
  useEffect(() => {
    if (!online || activeRequest) {
      setIncomingRequest(null);
      return;
    }
    const q = query(
      collection(db, "rideRequests"),
      where("status", "==", "pending"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const req = { id: d.id, ...d.data() } as RideRequest;
        if (lastIncomingId.current !== req.id) {
          lastIncomingId.current = req.id;
          showToast("New ride request!", "success");
        }
        setIncomingRequest(req);
      } else {
        lastIncomingId.current = null;
        setIncomingRequest(null);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, activeRequest]);

  // Live GPS tracking — writes to driverLocations/{uid} while a request is active
  useEffect(() => {
    if (!user || !activeRequest) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastLocationWriteRef.current < 4000) return; // write at most once per 4 s
        lastLocationWriteRef.current = now;
        setDoc(doc(db, "driverLocations", user.uid), {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updatedAt: serverTimestamp(),
        });
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      deleteDoc(doc(db, "driverLocations", user.uid)).catch(() => {});
    };
  }, [user, activeRequest]);

  // Load today's stats
  useEffect(() => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    getDocs(
      query(
        collection(db, "rideRequests"),
        where("driverId", "==", user.uid),
        where("status", "==", "completed")
      )
    ).then((snap) => {
      const todayDocs = snap.docs.filter((d) => {
        const completedAt = d.data().completedAt;
        if (!completedAt) return false;
        const date = completedAt.toDate ? completedAt.toDate() : new Date(completedAt);
        return date >= today;
      });
      const trips = todayDocs.length;
      const earnings = todayDocs.reduce((sum, d) => sum + (d.data().fare ?? 0), 0);
      setTodayStats({ trips, earnings });
    });
  }, [user]);

  async function handleToggleOnline() {
    if (!user) return;
    setTogglingOnline(true);
    const next = !online;
    await updateDoc(doc(db, "users", user.uid), { isOnline: next });
    setOnline(next);
    showToast(next ? "You're now online and visible to passengers." : "You're offline.", next ? "success" : "info");
    setTogglingOnline(false);
  }

  async function handleAccept() {
    if (!user || !userDoc || !incomingRequest) return;
    await updateDoc(doc(db, "rideRequests", incomingRequest.id), {
      status: "accepted",
      driverId: user.uid,
      driverName: userDoc.fullName,
      driverPhone: userDoc.phone ?? null,
      driverVehicleType: userDoc.vehicleType ?? null,
      driverRating: userDoc.ratingAvg ?? null,
      acceptedAt: new Date(),
    });
    showToast("Ride accepted! Head to the pickup point.", "success");
    setIncomingRequest(null);
  }

  async function handleDecline() {
    setIncomingRequest(null);
    showToast("Request declined.", "info");
  }

  async function handleStartTrip() {
    if (!activeRequest) return;
    await updateDoc(doc(db, "rideRequests", activeRequest.id), {
      status: "in_progress",
      startedAt: new Date(),
    });
    showToast("Trip started!", "success");
  }

  async function handleCompleteTrip() {
    if (!activeRequest) return;
    await updateDoc(doc(db, "rideRequests", activeRequest.id), {
      status: "completed",
      completedAt: new Date(),
    });
    showToast("Trip completed! Collect your fare.", "success");
    router.push(`/driver/trip/${activeRequest.id}`);
  }

  if (loading || !userDoc) return <LoadingScreen />;

  const pickupName = activeRequest
    ? getLocationById(activeRequest.pickupLocationId)?.name ?? "Pickup"
    : incomingRequest
    ? getLocationById(incomingRequest.pickupLocationId)?.name ?? "Pickup"
    : null;

  const destName = activeRequest
    ? getLocationById(activeRequest.destinationLocationId)?.name ?? "Destination"
    : incomingRequest
    ? getLocationById(incomingRequest.destinationLocationId)?.name ?? "Destination"
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F6F9]">
      <Header />
      <main className="flex flex-1 min-h-0">
        {/* Left panel */}
        <section className="w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex flex-col overflow-y-auto">

          {/* ── No active request: home + toggle ── */}
          {!activeRequest && !incomingRequest && (
            <div className="p-7 flex-1 flex flex-col">
              <h1 className="text-[22px] font-bold text-[#16263B]">
                {online ? "You're online" : "You're offline"}
              </h1>
              <p className="text-[13.5px] text-[#64748B] mt-1.5">
                {online ? "Waiting for ride requests nearby…" : "Go online to start receiving ride requests."}
              </p>

              {/* Toggle card */}
              <button
                onClick={handleToggleOnline}
                disabled={togglingOnline}
                className={[
                  "mt-6 flex items-center justify-between px-5 py-4 rounded-[14px] border-2 cursor-pointer transition-all",
                  online
                    ? "border-[#00A896] bg-[#E6F6F4]"
                    : "border-[#E2E8F0] bg-[#F7F9FC] hover:border-[#94A3B8]",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background: online ? "#00A896" : "#94A3B8",
                      boxShadow: online ? "0 0 0 4px rgba(0,168,150,0.2)" : "none",
                    }}
                  />
                  <span className={`text-[17px] font-bold ${online ? "text-[#0A7D70]" : "text-[#475569]"}`}>
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
                {/* Toggle switch */}
                <div
                  className="relative w-[52px] h-[28px] rounded-full transition-colors"
                  style={{ background: online ? "#00A896" : "#CBD5E1" }}
                >
                  <div
                    className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all"
                    style={{ left: online ? "27px" : "3px" }}
                  />
                </div>
              </button>

              {/* Today's stats */}
              <div className="mt-5 text-[12px] font-bold tracking-[0.5px] text-[#94A3B8] uppercase">Today</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatCard label="Trips completed" value={String(todayStats.trips)} />
                <StatCard label="Earnings" value={`₦${todayStats.earnings.toLocaleString()}`} valueColor="#1F4E79" />
                <StatCard label="Driver rating" value={userDoc.ratingCount ? `${(userDoc.ratingAvg ?? 0).toFixed(1)} ★` : "No ratings yet"} />
              </div>

              {online && (
                <div className="mt-5 flex items-center gap-2.5 px-4 py-3.5 bg-[#E6F6F4] border border-[#B7E6DF] rounded-[12px] text-[#0A7D70] text-[13.5px] font-semibold">
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <div className="absolute inset-0 border-2 border-[#B7E6DF] border-t-[#0A7D70] rounded-full animate-spin" />
                  </div>
                  Waiting for ride requests nearby…
                </div>
              )}
            </div>
          )}

          {/* ── Incoming request ── */}
          {!activeRequest && incomingRequest && (
            <IncomingRequestPanel
              request={incomingRequest}
              pickupName={pickupName!}
              destName={destName!}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}

          {/* ── Active trip ── */}
          {activeRequest && (
            <ActiveTripPanel
              request={activeRequest}
              pickupName={pickupName!}
              destName={destName!}
              onStart={handleStartTrip}
              onComplete={handleCompleteTrip}
            />
          )}
        </section>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <CampusMap
            pickupId={activeRequest?.pickupLocationId ?? incomingRequest?.pickupLocationId}
            destinationId={activeRequest?.destinationLocationId ?? incomingRequest?.destinationLocationId}
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Incoming request panel
// ─────────────────────────────────────────────
function IncomingRequestPanel({
  request, pickupName, destName, onAccept, onDecline,
}: {
  request: RideRequest;
  pickupName: string;
  destName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const passengerInitials = request.passengerName
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className="p-6 flex-1 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#00A896] uppercase tracking-[0.5px]">
          <span className="w-2 h-2 rounded-full bg-[#00A896]" style={{ boxShadow: "0 0 0 4px #D6F2ED" }} />
          New request
        </div>
        <div className="w-[38px] h-[38px] rounded-full border-[3px] border-[#E6F6F4] border-t-[#00A896] animate-spin" />
      </div>

      <div className="mt-4 border border-[#E6EBF1] rounded-[16px] p-[18px]">
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full bg-[#EEF2F7] text-[#1F4E79] flex items-center justify-center text-[15px] font-bold flex-shrink-0">
            {passengerInitials}
          </div>
          <div className="flex-1">
            <div className="text-[15.5px] font-bold text-[#16263B]">{request.passengerName}</div>
            <div className="text-[12.5px] text-[#64748B] mt-0.5">Passenger</div>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-extrabold text-[#1F4E79] tabular-nums">₦{request.fare.toLocaleString()}</div>
            <div className="text-[11.5px] text-[#94A3B8]">fixed fare</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#EEF2F7]">
          <div className="flex items-center gap-2.5 text-[14px]">
            <span className="w-2 h-2 rounded-full bg-[#1F4E79] flex-shrink-0" />
            <span className="font-semibold text-[#1B2A3D]">{pickupName}</span>
          </div>
          <div className="my-1.5 ml-1 w-px h-4 bg-[#CBD5E1]" />
          <div className="flex items-center gap-2.5 text-[14px]">
            <span className="w-2 h-2 rounded-[2px] bg-[#00A896] flex-shrink-0" />
            <span className="font-semibold text-[#1B2A3D]">{destName}</span>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <div className="flex gap-3">
        <Button
          onClick={onDecline}
          variant="outline"
          className="flex-1 h-[50px] text-red-600 border-[#F0C9C9] hover:bg-red-50 font-semibold rounded-[11px]"
        >
          Decline
        </Button>
        <Button
          onClick={onAccept}
          className="flex-[2] h-[50px] bg-[#00A896] hover:bg-[#00917f] text-white font-semibold rounded-[11px]"
        >
          Accept ride
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Active trip panel
// ─────────────────────────────────────────────
function ActiveTripPanel({
  request, pickupName, destName, onStart, onComplete,
}: {
  request: RideRequest;
  pickupName: string;
  destName: string;
  onStart: () => void;
  onComplete: () => void;
}) {
  const passengerInitials = request.passengerName
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const isInProgress = request.status === "in_progress";
  const bannerText = isInProgress ? "Trip in progress" : "Heading to pickup";
  const bannerBg = isInProgress ? "#E6F6F4" : "#EFF6FF";
  const bannerBorder = isInProgress ? "#B7E6DF" : "#BFDBFE";
  const bannerTextColor = isInProgress ? "#0A7D70" : "#1e40af";
  const bannerDot = isInProgress ? "#00A896" : "#3B82F6";
  const bannerHalo = isInProgress ? "rgba(0,168,150,0.15)" : "rgba(59,130,246,0.15)";

  return (
    <div className="p-6 flex-1 flex flex-col">
      {/* Status banner */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-[11px] text-[13.5px] font-semibold border"
        style={{ background: bannerBg, borderColor: bannerBorder, color: bannerTextColor }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: bannerDot, boxShadow: `0 0 0 4px ${bannerHalo}` }}
        />
        {bannerText}
      </div>

      {/* Passenger card */}
      <div className="mt-4 border border-[#E6EBF1] rounded-[16px] p-[18px]">
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full bg-[#EEF2F7] text-[#1F4E79] flex items-center justify-center text-[15px] font-bold flex-shrink-0">
            {passengerInitials}
          </div>
          <div className="flex-1">
            <div className="text-[15.5px] font-bold text-[#16263B]">{request.passengerName}</div>
            <div className="text-[12.5px] text-[#64748B] mt-0.5">Passenger</div>
          </div>
        </div>
      </div>

      <RouteCard
        pickup={pickupName}
        destination={destName}
        fare={request.fare}
        fareLabel="Collect on arrival"
        className="mt-4"
      />

      <div className="flex-1" />

      {!isInProgress ? (
        <Button
          onClick={onStart}
          className="w-full h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white font-semibold rounded-[11px]"
        >
          Start trip
        </Button>
      ) : (
        <Button
          onClick={onComplete}
          className="w-full h-[50px] bg-[#00A896] hover:bg-[#00917f] text-white font-semibold rounded-[11px]"
        >
          Complete trip
        </Button>
      )}
    </div>
  );
}

function StatCard({ label, value, valueColor = "#16263B" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-[#F7F9FC] border border-[#EEF2F7] rounded-[13px] p-4">
      <div className="text-[24px] font-extrabold tabular-nums" style={{ color: valueColor }}>{value}</div>
      <div className="text-[12.5px] text-[#64748B] mt-0.5">{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-screen">
      <div className="h-16 bg-white border-b border-[#E6EBF1]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-[#E2E8F0] border-t-[#00A896] rounded-full animate-spin" />
      </div>
    </div>
  );
}
