"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, getDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import Header from "@/app/components/ui/Header";
import { Button } from "@/components/ui/button";
import { RideRequest } from "@/lib/types";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function PassengerTripPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [request, setRequest] = useState<RideRequest | null>(null);
  const [stage, setStage] = useState<"complete" | "rating" | "done">("complete");
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // If request is not completed, bounce back to passenger home
  useEffect(() => {
    if (request && request.status !== "completed") router.replace("/passenger");
  }, [request, router]);

  async function handleMarkPaid() {
    if (!requestId) return;
    await updateDoc(doc(db, "rideRequests", requestId), { paymentConfirmed: true });
    showToast("Payment confirmed!", "success");
    setStage("rating");
  }

  async function handleSubmitRating() {
    if (!requestId || !request || stars === 0) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "rideRequests", requestId), {
        rating: stars,
        ratingComment: comment.trim() || null,
      });

      // Update driver's average rating
      if (request.driverId) {
        const driverRef = doc(db, "users", request.driverId);
        const driverSnap = await getDoc(driverRef);
        if (driverSnap.exists()) {
          const { ratingAvg = 0, ratingCount = 0 } = driverSnap.data();
          const newCount = ratingCount + 1;
          const newAvg = (ratingAvg * ratingCount + stars) / newCount;
          await updateDoc(driverRef, { ratingAvg: newAvg, ratingCount: increment(1) });
        }
      }

      showToast("Rating submitted. Thanks!", "success");
      setStage("done");
    } finally {
      setSubmitting(false);
    }
  }

  if (!request) return <LoadingScreen />;

  const pickupName = request.pickupLocation?.name ?? "Pickup";
  const destName = request.destinationLocation?.name ?? "Destination";
  const driverInitials = request.driverName
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  const displayStars = hovered || stars;

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-10">

        {/* ── Payment confirmation ── */}
        {stage === "complete" && (
          <div className="w-[440px] bg-white border border-[#E6EBF1] rounded-[18px] shadow-[0_18px_50px_-22px_rgba(16,40,70,0.3)] overflow-hidden animate-[altms-fade_.4s_ease]">
            <div className="px-7 py-6 border-b border-[#EEF2F7]">
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-full bg-[#E6F6F4] flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#00A896" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[19px] font-bold text-[#16263B]">You&apos;ve arrived</div>
                  <div className="text-[13px] text-[#64748B] mt-0.5">
                    {request.completedAt
                      ? new Date((request.completedAt as { seconds: number }).seconds * 1000).toLocaleString()
                      : "Just now"}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-7 py-6">
              {/* Route summary */}
              <div className="flex items-center gap-2.5 text-[14.5px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E79] flex-shrink-0" />
                <span className="font-semibold text-[#1B2A3D]">{pickupName}</span>
              </div>
              <div className="my-1.5 ml-1 w-px h-4 bg-[#CBD5E1]" />
              <div className="flex items-center gap-2.5 text-[14.5px]">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#00A896] flex-shrink-0" />
                <span className="font-semibold text-[#1B2A3D]">{destName}</span>
              </div>

              {/* Amount due */}
              <div className="mt-5 p-[18px_20px] bg-[#F7F9FC] border border-[#E6EBF1] rounded-[14px] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#94A3B8] font-bold tracking-[0.5px] uppercase">Amount due</div>
                  <div className="text-[13px] text-[#64748B] mt-1">Pay {request.driverName?.split(" ")[0]} directly</div>
                </div>
                <div className="text-[30px] font-extrabold text-[#1F4E79] tabular-nums">₦{request.fare.toLocaleString()}</div>
              </div>

              <div className="mt-4 text-[12.5px] font-semibold text-[#475569]">Confirm how you paid</div>
              <div className="mt-2.5 flex gap-2.5">
                <Button
                  onClick={handleMarkPaid}
                  className="flex-1 h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white font-semibold rounded-[11px]"
                >
                  Paid by cash
                </Button>
                <Button
                  onClick={handleMarkPaid}
                  variant="outline"
                  className="flex-1 h-[50px] text-[#1F4E79] border-[#D6DEE8] hover:border-[#1F4E79] font-semibold rounded-[11px]"
                >
                  Paid by transfer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Rating ── */}
        {stage === "rating" && (
          <div className="w-[430px] bg-white border border-[#E6EBF1] rounded-[18px] shadow-[0_18px_50px_-22px_rgba(16,40,70,0.3)] p-8 text-center animate-[altms-fade_.4s_ease]">
            <div className="w-[60px] h-[60px] rounded-full bg-[#1F4E79] text-white flex items-center justify-center text-[20px] font-bold mx-auto">
              {driverInitials}
            </div>
            <div className="text-[20px] font-bold text-[#16263B] mt-4">Rate your trip with {request.driverName?.split(" ")[0]}</div>
            <div className="text-[13.5px] text-[#64748B] mt-1.5">Your feedback keeps campus rides safe.</div>

            {/* Stars */}
            <div className="flex justify-center gap-2 mt-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 border-none bg-transparent cursor-pointer"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={displayStars >= n ? "#F5A623" : "#E2E8F0"}>
                    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 18.6 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="text-[13px] font-semibold text-[#00A896] h-5 mt-1.5">
              {displayStars > 0 ? RATING_WORDS[displayStars] : ""}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
              className="mt-4 w-full min-h-[80px] resize-none px-3.5 py-3 border-[1.5px] border-[#DCE3EC] rounded-[11px] text-[14px] font-medium text-[#16263B] outline-none focus:border-[#1F4E79]"
            />

            <Button
              onClick={handleSubmitRating}
              disabled={stars === 0 || submitting}
              className="mt-4 w-full h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white font-semibold rounded-[11px] disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit rating"}
            </Button>
          </div>
        )}

        {/* ── Done ── */}
        {stage === "done" && (
          <div className="w-[420px] bg-white border border-[#E6EBF1] rounded-[18px] shadow-[0_18px_50px_-22px_rgba(16,40,70,0.3)] p-9 text-center animate-[altms-fade_.4s_ease]">
            <div className="w-[64px] h-[64px] rounded-full bg-[#E6F6F4] flex items-center justify-center mx-auto">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#00A896" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-[21px] font-bold text-[#16263B] mt-5">Thanks for riding with ALTMS</div>
            <div className="text-[14px] text-[#64748B] mt-2 leading-relaxed">
              Your trip is complete and your rating has been saved. Safe travels around campus.
            </div>
            <Button
              onClick={() => router.replace("/passenger")}
              className="mt-6 w-full h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white font-semibold rounded-[11px]"
            >
              Book another ride
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9]">
      <div className="h-16 bg-white border-b border-[#E6EBF1]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-[#E2E8F0] border-t-[#1F4E79] rounded-full animate-spin" />
      </div>
    </div>
  );
}
