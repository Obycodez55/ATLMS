"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import Header from "@/app/components/ui/Header";
import CampusMap from "@/app/components/map/CampusMap";
import LocationPicker from "@/app/components/ui/LocationPicker";
import RouteCard from "@/app/components/ui/RouteCard";
import { Button } from "@/components/ui/button";
import { getFare, getLocationById } from "@/lib/locations";
import { RideRequest } from "@/lib/types";

export default function PassengerPage() {
  const { user, userDoc, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [pickupId, setPickupId] = useState<string | null>(null);
  const [destId, setDestId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Active ride request for this passenger
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Listen for any active (non-completed, non-cancelled) request by this passenger
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rideRequests"),
      where("passengerId", "==", user.uid),
      where("status", "in", ["pending", "accepted", "in_progress"])
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        prevStatusRef.current = null;
        setActiveRequest(null);
      } else {
        const reqDoc = snap.docs[0];
        const next = { id: reqDoc.id, ...reqDoc.data() } as RideRequest;
        const prevStatus = prevStatusRef.current;
        prevStatusRef.current = next.status;
        setActiveRequest(next);

        // Toast on status changes
        if (prevStatus && prevStatus !== next.status) {
          if (next.status === "accepted") showToast("Driver accepted your request!", "success");
          if (next.status === "in_progress") showToast("Your trip has started!", "success");
        }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fare = pickupId && destId ? getFare(pickupId, destId) : null;
  const pickupLoc = pickupId ? getLocationById(pickupId) : null;
  const destLoc = destId ? getLocationById(destId) : null;

  async function handleRequestRide() {
    if (!user || !userDoc || !pickupId || !destId || fare === null) return;
    setRequesting(true);
    try {
      await addDoc(collection(db, "rideRequests"), {
        passengerId: user.uid,
        passengerName: userDoc.fullName,
        pickupLocationId: pickupId,
        destinationLocationId: destId,
        fare,
        status: "pending",
        driverId: null,
        driverName: null,
        driverVehicleType: null,
        driverRating: null,
        requestedAt: serverTimestamp(),
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        paymentConfirmed: false,
        rating: null,
        ratingComment: null,
        groupId: null,
      });
      showToast("Ride requested! Looking for a driver…", "info");
    } catch {
      showToast("Failed to request ride. Try again.", "error");
    } finally {
      setRequesting(false);
    }
  }

  async function handleCancel() {
    if (!activeRequest) return;
    await updateDoc(doc(db, "rideRequests", activeRequest.id), { status: "cancelled" });
    setActiveRequest(null);
    showToast("Ride request cancelled.", "info");
  }

  if (loading || !userDoc) return <LoadingScreen />;

  // ── If there's an active request, show the trip screen
  if (activeRequest) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#F4F6F9]">
        <Header />
        <main className="flex flex-1 min-h-0">
          <PassengerTripPanel request={activeRequest} onCancel={handleCancel} router={router} />
          <div className="flex-1 relative min-w-0">
            <CampusMap
              pickupId={activeRequest.pickupLocationId}
              destinationId={activeRequest.destinationLocationId}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── Default: request screen
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F6F9]">
      <Header />
      <main className="flex flex-1 min-h-0">
        {/* Left panel */}
        <section className="w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex flex-col overflow-y-auto">
          <div className="p-7">
            <h1 className="text-[22px] font-bold text-[#16263B]">Where are you going?</h1>
            <p className="text-[13.5px] text-[#64748B] mt-1.5">Pick a location on campus — fares are fixed.</p>

            <div className="mt-6 flex flex-col gap-3.5">
              <LocationPicker
                value={pickupId}
                onChange={setPickupId}
                placeholder="Select pickup location"
                dot="pickup"
                exclude={destId}
              />
              <LocationPicker
                value={destId}
                onChange={setDestId}
                placeholder="Select destination"
                dot="destination"
                exclude={pickupId}
              />
            </div>

            {/* Fare card */}
            {fare !== null && pickupLoc && destLoc && (
              <div className="mt-6 bg-[#F7F9FC] border border-[#E6EBF1] rounded-[14px] p-[18px_20px] animate-[altms-fade_.3s_ease]">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase">Fixed fare</div>
                    <div className="text-[34px] font-extrabold text-[#1F4E79] mt-0.5 tabular-nums">₦{fare.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#DCE3EC] flex items-center gap-2 text-[12.5px] text-[#0A7D70] font-semibold">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="#0A7D70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" stroke="#0A7D70" strokeWidth="2" />
                  </svg>
                  No surge pricing • Pay cash or transfer
                </div>
              </div>
            )}

            <Button
              onClick={handleRequestRide}
              disabled={!pickupId || !destId || fare === null || requesting}
              className="mt-6 w-full h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white text-[15px] font-semibold rounded-[11px] disabled:opacity-40"
            >
              {requesting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Requesting…
                </span>
              ) : fare !== null ? `Request ride — ₦${fare.toLocaleString()}` : "Request ride"}
            </Button>
          </div>
        </section>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <CampusMap
            pickupId={pickupId}
            destinationId={destId}
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Trip panel — handles waiting / accepted / in_progress states
// ─────────────────────────────────────────────
function PassengerTripPanel({
  request,
  onCancel,
  router,
}: {
  request: RideRequest;
  onCancel: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const pickupLoc = getLocationById(request.pickupLocationId);
  const destLoc = getLocationById(request.destinationLocationId);
  const pickupName = pickupLoc?.name ?? "Pickup";
  const destName = destLoc?.name ?? "Destination";

  // Completed → redirect to trip completion page
  useEffect(() => {
    if (request.status === "completed") {
      router.push(`/passenger/trip/${request.id}`);
    }
  }, [request.status, request.id, router]);

  const driverInitials = request.driverName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  // ── Waiting state
  if (request.status === "pending") {
    return (
      <section className="w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex flex-col overflow-y-auto">
        <div className="p-7 flex-1 flex flex-col">
          <div className="flex items-center gap-3.5">
            <div className="relative w-[46px] h-[46px] flex-shrink-0">
              <div className="absolute inset-0 border-[3px] border-[#E6F6F4] border-t-[#00A896] rounded-full animate-spin" />
            </div>
            <div>
              <div className="text-[19px] font-bold text-[#16263B]">Looking for a driver…</div>
              <div className="text-[13px] text-[#64748B] mt-0.5">Matching you with the nearest campus driver</div>
            </div>
          </div>

          <RouteCard
            pickup={pickupName}
            destination={destName}
            fare={request.fare}
            className="mt-6"
          />

          <div className="flex-1" />
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full h-[50px] text-red-600 border-[#F0C9C9] hover:bg-red-50 font-semibold text-[15px] rounded-[11px]"
          >
            Cancel request
          </Button>
        </div>
      </section>
    );
  }

  // ── Matched / in progress states
  const isInProgress = request.status === "in_progress";
  const bannerText = isInProgress ? "Trip in progress" : "Driver on the way";
  const bannerDot = isInProgress ? "#00A896" : "#F59E0B";
  const bannerHalo = isInProgress ? "rgba(0,168,150,0.15)" : "rgba(245,158,11,0.15)";
  const bannerBg = isInProgress ? "#E6F6F4" : "#FFFBEB";
  const bannerBorder = isInProgress ? "#B7E6DF" : "#FDE68A";
  const bannerTextColor = isInProgress ? "#0A7D70" : "#92400E";

  return (
    <section className="w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex flex-col overflow-y-auto">
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

        {/* Driver card */}
        <div className="mt-4 border border-[#E6EBF1] rounded-[16px] p-[18px] shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
          <div className="flex items-center gap-3.5">
            <div className="w-[54px] h-[54px] rounded-full bg-[#1F4E79] text-white flex items-center justify-center text-[18px] font-bold flex-shrink-0">
              {driverInitials}
            </div>
            <div className="flex-1">
              <div className="text-[16.5px] font-bold text-[#16263B]">{request.driverName}</div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[13px] text-[#64748B]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5A623">
                  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 18.6 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                </svg>
                <span className="font-semibold text-[#1B2A3D]">{request.driverRating?.toFixed(1) ?? "—"}</span>
                <span>•</span>
                <span className="capitalize">{request.driverVehicleType === "tricycle" ? "Keke NAPEP (Tricycle)" : "Cab"}</span>
              </div>
            </div>
          </div>
        </div>

        <RouteCard
          pickup={pickupName}
          destination={destName}
          fare={request.fare}
          className="mt-4"
        />

        <div className="flex-1" />

        {/* Cancel (only while driver is coming, not in progress) */}
        {!isInProgress && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1 h-[50px] text-[#1F4E79] border-[#D6DEE8] hover:border-[#1F4E79] font-semibold rounded-[11px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 005.5 5.5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 6a2 2 0 012-2z" stroke="#1F4E79" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              Call driver
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-[50px] text-red-600 border-[#F0C9C9] hover:bg-red-50 font-semibold rounded-[11px]"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-screen">
      <div className="h-16 bg-white border-b border-[#E6EBF1]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-[#E2E8F0] border-t-[#1F4E79] rounded-full animate-spin" />
      </div>
    </div>
  );
}
