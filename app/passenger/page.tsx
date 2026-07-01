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
import { getDistanceFare, getDistanceSharedFare, haversineMeters } from "@/lib/locations";
import FareMatrixModal from "@/app/components/ui/FareMatrixModal";
import { RideRequest, PickedLocation } from "@/lib/types";

export default function PassengerPage() {
  const { user, userDoc, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [pickup, setPickup] = useState<PickedLocation | null>(null);
  const [dest, setDest] = useState<PickedLocation | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [showFareMatrix, setShowFareMatrix] = useState(false);

  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const hasAlertedArrivalRef = useRef(false);

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
        if (prevStatus && prevStatus !== next.status) {
          if (next.status === "accepted") showToast("Driver accepted your request!", "success");
          if (next.status === "in_progress") showToast("Your trip has started!", "success");
        }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const driverId = activeRequest?.driverId;
    const status = activeRequest?.status;
    if (!driverId || (status !== "accepted" && status !== "in_progress")) {
      setDriverLocation(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "driverLocations", driverId), (snap) => {
      if (snap.exists()) {
        const { lat, lng } = snap.data();
        if (lat != null && lng != null) setDriverLocation({ lat, lng });
        else setDriverLocation(null);
      } else {
        setDriverLocation(null);
      }
    });
    return unsub;
  }, [activeRequest?.driverId, activeRequest?.status]);

  useEffect(() => {
    hasAlertedArrivalRef.current = false;
  }, [activeRequest?.id]);

  useEffect(() => {
    if (!driverLocation || activeRequest?.status !== "accepted" || hasAlertedArrivalRef.current) return;
    const pickupLoc = activeRequest.pickupLocation;
    const dist = haversineMeters(driverLocation.lat, driverLocation.lng, pickupLoc.lat, pickupLoc.lng);
    if (dist <= 150) {
      showToast("Your driver is almost here!", "success");
      hasAlertedArrivalRef.current = true;
    }
  }, [driverLocation, activeRequest?.status, activeRequest?.pickupLocation, showToast]);

  const fare = pickup && dest ? getDistanceFare(pickup.lat, pickup.lng, dest.lat, dest.lng) : null;
  const sharedFare = pickup && dest ? getDistanceSharedFare(pickup.lat, pickup.lng, dest.lat, dest.lng) : null;

  function handleMapClick(loc: PickedLocation) {
    if (!pickup) setPickup(loc);
    else setDest(loc);
  }

  async function handleRequestRide() {
    if (!user || !userDoc || !pickup || !dest || fare === null) return;
    setRequesting(true);
    try {
      await addDoc(collection(db, "rideRequests"), {
        passengerId: user.uid,
        passengerName: userDoc.fullName,
        pickupLocation: pickup,
        destinationLocation: dest,
        fare,
        status: "pending",
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverVehicleType: null,
        driverRating: null,
        requestedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 8 * 60 * 1000),
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        paymentConfirmed: false,
        cancelledBy: null,
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

  async function handleRequestSharedRide() {
    if (!user || !userDoc || !pickup || !dest || sharedFare === null) return;
    setRequesting(true);
    const windowSlot = Math.floor(Date.now() / (10 * 60 * 1000));
    const pickupKey = `${pickup.lat.toFixed(3)},${pickup.lng.toFixed(3)}`;
    const destKey = `${dest.lat.toFixed(3)},${dest.lng.toFixed(3)}`;
    const groupId = `${pickupKey}__${destKey}__${windowSlot}`;
    try {
      await addDoc(collection(db, "rideRequests"), {
        passengerId: user.uid,
        passengerName: userDoc.fullName,
        pickupLocation: pickup,
        destinationLocation: dest,
        fare: sharedFare,
        status: "pending",
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverVehicleType: null,
        driverRating: null,
        requestedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 8 * 60 * 1000),
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        paymentConfirmed: false,
        cancelledBy: null,
        rating: null,
        ratingComment: null,
        groupId,
      });
      showToast("Shared ride requested! Grouping you with nearby passengers…", "info");
    } catch {
      showToast("Failed to request shared ride. Try again.", "error");
    } finally {
      setRequesting(false);
    }
  }

  async function handleCancel() {
    if (!activeRequest) return;
    await updateDoc(doc(db, "rideRequests", activeRequest.id), { status: "cancelled", cancelledBy: "passenger" });
    setActiveRequest(null);
    showToast("Ride request cancelled.", "info");
  }

  async function handleExpire() {
    if (!activeRequest) return;
    await updateDoc(doc(db, "rideRequests", activeRequest.id), { status: "cancelled", cancelledBy: "system" });
    setActiveRequest(null);
    showToast("No driver was available. Please try again.", "error");
  }

  if (loading || !userDoc) return <LoadingScreen />;

  if (activeRequest) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#F4F6F9]">
        <Header />
        <main className="flex flex-1 min-h-0">
          <PassengerTripPanel request={activeRequest} onCancel={handleCancel} onExpire={handleExpire} router={router} />
          <div className="flex-1 relative min-w-0">
            <CampusMap
              pickup={activeRequest.pickupLocation}
              destination={activeRequest.destinationLocation}
              driverLocation={driverLocation}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F6F9]">
      <Header />
      <main className="flex flex-1 min-h-0">
        {/* Left panel */}
        <section className="w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex flex-col overflow-y-auto">
          <div className="p-7">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-[22px] font-bold text-[#16263B]">Where are you going?</h1>
              <button
                onClick={() => setShowFareMatrix(true)}
                className="flex-shrink-0 mt-1 text-[12.5px] text-[#1F4E79] font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                View fares →
              </button>
            </div>
            <p className="text-[13.5px] text-[#64748B] mt-1.5">Search, pick from the list, or tap the map.</p>

            <div className="mt-6 flex flex-col gap-3.5">
              <LocationPicker
                value={pickup}
                onChange={setPickup}
                placeholder="Select pickup location"
                dot="pickup"
                exclude={dest}
              />
              <LocationPicker
                value={dest}
                onChange={setDest}
                placeholder="Select destination"
                dot="destination"
                exclude={pickup}
              />
            </div>

            {/* Fare card */}
            {fare !== null && pickup && dest && (
              <div className="mt-6 bg-[#F7F9FC] border border-[#E6EBF1] rounded-[14px] p-[18px_20px] animate-[altms-fade_.3s_ease]">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase">Solo fare</div>
                    <div className="text-[34px] font-extrabold text-[#1F4E79] mt-0.5 tabular-nums">₦{fare.toLocaleString()}</div>
                  </div>
                  {sharedFare !== null && (
                    <div className="text-right">
                      <div className="text-[11px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase">Shared fare</div>
                      <div className="text-[22px] font-bold text-[#0A7D70] mt-0.5 tabular-nums">₦{sharedFare.toLocaleString()}</div>
                      <div className="text-[11px] text-[#64748B]">per person</div>
                    </div>
                  )}
                </div>
                <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#DCE3EC] flex items-center gap-2 text-[12.5px] text-[#0A7D70] font-semibold">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="#0A7D70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" stroke="#0A7D70" strokeWidth="2" />
                  </svg>
                  No surge pricing · Pay cash or transfer
                </div>
              </div>
            )}

            <Button
              onClick={handleRequestRide}
              disabled={!pickup || !dest || fare === null || requesting}
              className="mt-6 w-full h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white text-[15px] font-semibold rounded-[11px] disabled:opacity-40"
            >
              {requesting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Requesting…
                </span>
              ) : fare !== null ? `Request ride — ₦${fare.toLocaleString()}` : "Request ride"}
            </Button>

            {pickup && dest && sharedFare !== null && (
              <Button
                onClick={handleRequestSharedRide}
                disabled={requesting}
                variant="outline"
                className="mt-2.5 w-full h-[46px] text-[#0A7D70] border-[#B7E6DF] hover:bg-[#E6F6F4] text-[14px] font-semibold rounded-[11px] disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2 flex-shrink-0">
                  <circle cx="9" cy="7" r="3" stroke="#0A7D70" strokeWidth="1.8" />
                  <circle cx="15" cy="7" r="3" stroke="#0A7D70" strokeWidth="1.8" />
                  <path d="M3 19c0-3.314 2.686-6 6-6h6c3.314 0 6 2.686 6 6" stroke="#0A7D70" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Share a keke — ₦{sharedFare.toLocaleString()} each
              </Button>
            )}
          </div>
        </section>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <CampusMap
            pickup={pickup}
            destination={dest}
            onMapClick={handleMapClick}
            style={{ position: "absolute", inset: 0 }}
          />
          {!pickup && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm border border-[#E6EBF1] rounded-full px-4 py-2 text-[12.5px] font-semibold text-[#64748B] shadow-md">
                Tap map to pin pickup location
              </div>
            </div>
          )}
          {pickup && !dest && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm border border-[#E6EBF1] rounded-full px-4 py-2 text-[12.5px] font-semibold text-[#64748B] shadow-md">
                Tap map to pin destination
              </div>
            </div>
          )}
        </div>
      </main>

      {showFareMatrix && <FareMatrixModal onClose={() => setShowFareMatrix(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Trip panel
// ─────────────────────────────────────────────
function PassengerTripPanel({
  request,
  onCancel,
  onExpire,
  router,
}: {
  request: RideRequest;
  onCancel: () => void;
  onExpire: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const pickupName = request.pickupLocation?.name ?? "Pickup";
  const destName = request.destinationLocation?.name ?? "Destination";

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (request.status !== "pending" || !request.expiresAt) return;
    const expiryMs = request.expiresAt.toMillis
      ? request.expiresAt.toMillis()
      : (request.expiresAt as unknown as { seconds: number }).seconds * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.round((expiryMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) onExpireRef.current();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [request.status, request.expiresAt]);

  useEffect(() => {
    if (request.status === "completed") {
      router.push(`/passenger/trip/${request.id}`);
    }
  }, [request.status, request.id, router]);

  const driverInitials =
    request.driverName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (request.status === "pending") {
    return (
      <section className="w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex flex-col overflow-y-auto">
        <div className="p-7 flex-1 flex flex-col">
          {request.groupId && (
            <div className="inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-1 rounded-full bg-[#E6F6F4] border border-[#B7E6DF] text-[#0A7D70] text-[11.5px] font-bold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" stroke="#0A7D70" strokeWidth="2" />
                <circle cx="15" cy="7" r="3" stroke="#0A7D70" strokeWidth="2" />
                <path d="M3 19c0-3.314 2.686-6 6-6h6c3.314 0 6 2.686 6 6" stroke="#0A7D70" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Shared ride · ₦{request.fare.toLocaleString()} per person
            </div>
          )}
          <div className="flex items-center gap-3.5">
            <div className="relative w-[46px] h-[46px] flex-shrink-0">
              <div className="absolute inset-0 border-[3px] border-[#E6F6F4] border-t-[#00A896] rounded-full animate-spin" />
            </div>
            <div>
              <div className="text-[19px] font-bold text-[#16263B]">Looking for a driver…</div>
              <div className="text-[13px] text-[#64748B] mt-0.5">Matching you with the nearest campus driver</div>
            </div>
          </div>

          <RouteCard pickup={pickupName} destination={destName} fare={request.fare} className="mt-6" />

          {secondsLeft !== null && (
            <div
              className={[
                "mt-4 flex items-center justify-between px-4 py-3 rounded-[10px] border text-[13px] font-semibold",
                secondsLeft <= 60
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
              ].join(" ")}
            >
              <span>Auto-cancels if no driver found</span>
              <span className="tabular-nums font-bold">{formatCountdown(secondsLeft)}</span>
            </div>
          )}

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
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-[11px] text-[13.5px] font-semibold border"
          style={{ background: bannerBg, borderColor: bannerBorder, color: bannerTextColor }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: bannerDot, boxShadow: `0 0 0 4px ${bannerHalo}` }}
          />
          {bannerText}
          {request.groupId && (
            <span className="ml-auto flex items-center gap-1 text-[11.5px] font-bold opacity-80">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                <path d="M3 19c0-3.314 2.686-6 6-6h6c3.314 0 6 2.686 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Shared
            </span>
          )}
        </div>

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

        <RouteCard pickup={pickupName} destination={destName} fare={request.fare} className="mt-4" />

        <div className="flex-1" />

        {!isInProgress && (
          <div className="flex gap-2.5">
            {request.driverPhone && (
              <a
                href={`tel:${request.driverPhone}`}
                className="flex-1 h-[50px] flex items-center justify-center gap-2 text-[#1F4E79] border-[1.5px] border-[#D6DEE8] hover:border-[#1F4E79] font-semibold rounded-[11px] text-[14.5px] transition-colors bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 005.5 5.5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 6a2 2 0 012-2z" stroke="#1F4E79" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                Call driver
              </a>
            )}
            <Button
              onClick={onCancel}
              variant="outline"
              className={`${request.driverPhone ? "flex-1" : "w-full"} h-[50px] text-red-600 border-[#F0C9C9] hover:bg-red-50 font-semibold rounded-[11px]`}
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
