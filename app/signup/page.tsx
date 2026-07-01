"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole, VehicleType } from "@/lib/types";
import UICrest from "@/app/components/ui/UICrest";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("passenger");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("tricycle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        role,
        fullName: fullName.trim(),
        email,
        phone: phone.trim(),
        createdAt: serverTimestamp(),
        ...(role === "driver" && {
          vehicleType,
          isOnline: false,
          ratingAvg: 0,
          ratingCount: 0,
        }),
      });
      router.replace(`/${role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left panel ── */}
      <div className="relative hidden lg:flex w-[46%] min-w-[520px] flex-col overflow-hidden bg-[#0F2A45]">
        <div className="absolute inset-0 opacity-50 bg-[#1F4E79]" />
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
        </div>
      </div>

      {/* ── Right panel: signup form ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-10 overflow-y-auto">
        <div className="w-full max-w-[400px] py-6">
          <div className="flex items-center gap-3 mb-6">
            <UICrest className="w-[46px] h-auto" />
            <div className="text-[12.5px] font-semibold text-[#64748B] leading-snug">
              University of Ibadan
              <br />
              <span className="text-[#94A3B8] font-medium">Official campus transport</span>
            </div>
          </div>

          <h1 className="text-[26px] font-bold text-[#16263B]">Create account</h1>
          <p className="text-[14.5px] text-[#64748B] mt-2">Join ALTMS — it only takes a minute.</p>

          {/* Role selector */}
          <div className="mt-7">
            <p className="text-[12px] font-semibold text-[#475569] mb-2.5">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              <RoleButton
                active={role === "passenger"}
                onClick={() => setRole("passenger")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2" />
                    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                }
                label="Passenger"
              />
              <RoleButton
                active={role === "driver"}
                onClick={() => setRole("driver")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 13l2-5a2 2 0 012-1.4h10A2 2 0 0119 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="7.5" cy="14.5" r="1.2" fill="currentColor" />
                    <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" />
                  </svg>
                }
                label="Driver"
              />
            </div>
          </div>

          <form onSubmit={handleSignup} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#475569]">Full name</Label>
              <Input
                placeholder="Adebola Ogunleye"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 border-[#DCE3EC] text-[15px] font-medium focus-visible:ring-[#00A896]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#475569]">Email address</Label>
              <Input
                type="email"
                placeholder="you@stu.ui.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-[#DCE3EC] text-[15px] font-medium focus-visible:ring-[#00A896]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#475569]">Phone number</Label>
              <Input
                type="tel"
                placeholder="080XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-12 border-[#DCE3EC] text-[15px] font-medium focus-visible:ring-[#00A896]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#475569]">Password</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 border-[#DCE3EC] text-[15px] font-medium focus-visible:ring-[#00A896]"
              />
            </div>

            {/* Vehicle type — only for drivers */}
            {role === "driver" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-semibold text-[#475569]">Vehicle type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <VehicleButton
                    active={vehicleType === "tricycle"}
                    onClick={() => setVehicleType("tricycle")}
                    label="Tricycle (Keke)"
                  />
                  <VehicleButton
                    active={vehicleType === "cab"}
                    onClick={() => setVehicleType("cab")}
                    label="Cab (Car)"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white text-[15px] font-semibold rounded-[11px] w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </Button>
          </form>

          <p className="text-center mt-5 text-[14px] text-[#64748B]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1F4E79] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2.5 px-4 py-3.5 rounded-[11px] border-2 text-[14px] font-semibold transition-colors cursor-pointer",
        active
          ? "border-[#1F4E79] bg-[#EEF4FB] text-[#1F4E79]"
          : "border-[#DCE3EC] bg-white text-[#64748B] hover:border-[#94A3B8]",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function VehicleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-3 rounded-[10px] border-2 text-[13.5px] font-semibold transition-colors cursor-pointer",
        active
          ? "border-[#1F4E79] bg-[#EEF4FB] text-[#1F4E79]"
          : "border-[#DCE3EC] bg-white text-[#64748B] hover:border-[#94A3B8]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("email-already-in-use")) return "An account with this email already exists.";
  if (msg.includes("weak-password")) return "Password must be at least 6 characters.";
  if (msg.includes("invalid-email")) return "Please enter a valid email address.";
  if (msg.includes("network")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}
