"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UICrest from "@/app/components/ui/UICrest";
import { UserRole } from "@/lib/types";

const PORTAL_META: Record<UserRole, { label: string; accent: string; tagline: string; sub: string }> = {
  passenger: {
    label: "Passenger Portal",
    accent: "#1F4E79",
    tagline: "Welcome back",
    sub: "Sign in to book your campus ride.",
  },
  driver:  {
    label: "Driver Portal",
    accent: "#00A896",
    tagline: "Driver sign in",
    sub: "Sign in to start accepting ride requests.",
  },
  admin: {
    label: "Admin Access",
    accent: "#475569",
    tagline: "Admin sign in",
    sub: "Restricted to system administrators.",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as UserRole | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Unknown role → back to landing
  useEffect(() => {
    if (roleParam && !["passenger", "driver", "admin"].includes(roleParam)) {
      router.replace("/");
    }
  }, [roleParam, router]);

  if (!roleParam || !["passenger", "driver", "admin"].includes(roleParam)) {
    return null;
  }

  const meta = PORTAL_META[roleParam];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const actualRole = snap.data()?.role as UserRole | undefined;

      if (!actualRole) {
        await signOut(auth);
        setError("Account not found. Please sign up first.");
        return;
      }

      if (actualRole !== roleParam) {
        await signOut(auth);
        const correctPortal = PORTAL_META[actualRole]?.label ?? actualRole;
        setError(`This account is a ${actualRole} account. Please sign in via the ${correctPortal}.`);
        return;
      }

      router.replace(`/${actualRole}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
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
          {/* Portal badge */}
          <div
            className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.5px] uppercase mb-4 px-3 py-1.5 rounded-full border border-white/20"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            {meta.label}
          </div>
          <div className="text-[30px] font-bold leading-tight max-w-[420px]">
            Campus rides, on demand.
          </div>
          <div className="text-[15px] opacity-80 mt-4 max-w-[380px] leading-relaxed">
            Fixed fares, real drivers, live tracking — anywhere across the University of Ibadan campus.
          </div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-5 md:p-10">
        <div className="w-full max-w-[400px]">

          {/* Portal badge + back link */}
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

          <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
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
              <Label className="text-[13px] font-semibold text-[#475569]">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-[#DCE3EC] text-[15px] font-medium focus-visible:ring-[#00A896]"
              />
            </div>

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
                  Signing in…
                </span>
              ) : "Sign in"}
            </Button>
          </form>

          {/* Sign-up link — not shown for admin */}
          {roleParam !== "admin" && (
            <p className="text-center mt-5 text-[14px] text-[#64748B]">
              Don&apos;t have an account?{" "}
              <Link
                href={`/signup?role=${roleParam}`}
                className="font-semibold hover:underline"
                style={{ color: meta.accent }}
              >
                Create one
              </Link>
            </p>
          )}

          {roleParam === "admin" && (
            <p className="text-center mt-5 text-[13px] text-[#94A3B8]">
              Admin accounts are created by the system administrator.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found"))
    return "Incorrect email or password.";
  if (msg.includes("too-many-requests")) return "Too many attempts. Try again later.";
  if (msg.includes("network")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}
