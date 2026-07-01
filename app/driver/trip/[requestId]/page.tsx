"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import Header from "@/app/components/ui/Header";
import { Button } from "@/components/ui/button";
import { getLocationById } from "@/lib/locations";
import { RideRequest } from "@/lib/types";

export default function DriverTripPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [request, setRequest] = useState<RideRequest | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!requestId) return;
    const unsub = onSnapshot(doc(db, "rideRequests", requestId), (snap) => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() } as RideRequest);
    });
    return unsub;
  }, [requestId]);

  if (!request) return <LoadingScreen />;

  const pickupName = getLocationById(request.pickupLocationId)?.name ?? "Pickup";
  const destName = getLocationById(request.destinationLocationId)?.name ?? "Destination";
  const passengerFirstName = request.passengerName?.split(" ")[0] ?? "passenger";

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-10">
        <div className="w-[430px] bg-white border border-[#E6EBF1] rounded-[18px] shadow-[0_18px_50px_-22px_rgba(16,40,70,0.3)] p-8 text-center animate-[altms-fade_.4s_ease]">
          <div className="w-[60px] h-[60px] rounded-full bg-[#E6F6F4] flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#00A896" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="text-[20px] font-bold text-[#16263B] mt-4">Trip complete</div>
          <div className="text-[13.5px] text-[#64748B] mt-1.5">
            {pickupName} → {destName}
          </div>

          <div className="mt-5 p-[18px_20px] bg-[#F7F9FC] border border-[#E6EBF1] rounded-[14px] flex items-center justify-between text-left">
            <div>
              <div className="text-[12px] text-[#94A3B8] font-bold tracking-[0.5px] uppercase">
                Collect from {passengerFirstName}
              </div>
              <div className="text-[13px] text-[#64748B] mt-1">Cash or transfer</div>
            </div>
            <div className="text-[30px] font-extrabold text-[#1F4E79] tabular-nums">
              ₦{request.fare.toLocaleString()}
            </div>
          </div>

          {request.paymentConfirmed ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-[14px] font-semibold text-[#0A7D70] bg-[#E6F6F4] border border-[#B7E6DF] rounded-[11px] py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#0A7D70" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Payment confirmed by passenger
            </div>
          ) : (
            <div className="mt-4 text-[13px] text-[#94A3B8] py-2">
              Waiting for passenger to confirm payment…
            </div>
          )}

          <Button
            onClick={() => router.replace("/driver")}
            className="mt-5 w-full h-[50px] bg-[#00A896] hover:bg-[#00917f] text-white font-semibold rounded-[11px]"
          >
            Back to dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9]">
      <div className="h-16 bg-white border-b border-[#E6EBF1]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-[#E2E8F0] border-t-[#00A896] rounded-full animate-spin" />
      </div>
    </div>
  );
}
