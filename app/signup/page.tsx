"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleType } from "@/lib/types";
import UICrest from "@/app/components/ui/UICrest";

const PORTAL_META = {
  passenger: {
    label: "Passenger Portal",
    accent: "#1F4E79",
    tagline: "Create your account",
    sub: "Join ALTMS and book campus rides in seconds.",
  },
  driver: {
    label: "Driver Portal",
    accent: "#00A896",
    tagline: "Register as a driver",
    sub: "Join the ALTMS driver network and start earning.",
  },
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("tricycle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Only passenger and driver can sign up; anything else → landing
  useEffect(() => {
    if (!roleParam || !["passenger", "driver"].includes(roleParam)) {
      router.replace("/");
    }
  }, [roleParam, router]);

  if (!roleParam || !["passenger", "driver"].includes(roleParam)) return null;

  const isDriver = roleParam === "driver";
  const meta = PORTAL_META[roleParam as keyof typeof PORTAL_META];

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        role: roleParam,
        fullName: fullName.trim(),
        email,
        phone: phone.trim(),
        createdAt: serverTimestamp(),
        ...(isDriver && {
          vehicleType,
          isOnline: false,
          ratingAvg: 0,
          ratingCount: 0,
        }),
      });
      router.replace(`/${roleParam}`);
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
          <div
            className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.5px] uppercase mb-4 px-3 py-1.5 rounded-full border border-white/20"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            {meta.label}
          </div>
          <div className="text-[30px] font-bold leading-tight max-w-[420px]">
            {isDriver ? "Drive. Earn. Repeat." : "Campus rides, on demand."}
          </div>
          <div className="text-[15px] opacity-80 mt-4 max-w-[380px] leading-relaxed">
            {isDriver
              ? "Accept ride requests from students and staff across the University of Ibadan campus. Fixed fares, no haggling."
              : "Fixed fares, real drivers, live tracking — anywhere across the University of Ibadan campus."}
          </div>
        </div>
      </div>

      {/* ── Right panel: signup form ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-10 overflow-y-auto">
        <div className="w-full max-w-[400px] py-6">

          {/* Portal badge + back */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UICrest className="w-[46px] h-auto" />
              <div className="text-[12.5px] font-semibold text-[#64748B] leading-snug">
                University of Ibadan
                <br />
                <span style={{ color: meta.accent }} className="font-bold">{meta.label}</span>
              </div>
            </div>
            <Link
              href="/"
              className="text-[12px] text-[#94A3B8] hover:text-[#475569] font-medium transition-colors"
            >
              ← All portals
            </Link>
          </div>

          <h1 className="text-[26px] font-bold text-[#16263B]">{meta.tagline}</h1>
          <p className="text-[14.5px] text-[#64748B] mt-2">{meta.sub}</p>

          <form onSubmit={handleSignup} className="mt-7 flex flex-col gap-4">
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

            {/* Vehicle type — driver only */}
            {isDriver && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-semibold text-[#475569]">Vehicle type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <VehicleButton
                    active={vehicleType === "tricycle"}
                    accent={meta.accent}
                    onClick={() => setVehicleType("tricycle")}
                    label="Tricycle (Keke)"
                  />
                  <VehicleButton
                    active={vehicleType === "cab"}
                    accent={meta.accent}
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
              className="mt-2 h-[50px] text-white text-[15px] font-semibold rounded-[11px] w-full"
              style={{ background: meta.accent }}
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
            <Link
              href={`/login?role=${roleParam}`}
              className="font-semibold hover:underline"
              style={{ color: meta.accent }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function VehicleButton({
  active, accent, onClick, label,
}: {
  active: boolean;
  accent: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-3 rounded-[10px] border-2 text-[13.5px] font-semibold transition-colors cursor-pointer",
        active ? "bg-[#EEF4FB] text-[#1F4E79]" : "border-[#DCE3EC] bg-white text-[#64748B] hover:border-[#94A3B8]",
      ].join(" ")}
      style={active ? { borderColor: accent, color: accent, background: `${accent}14` } : {}}
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
