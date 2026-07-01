"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UICrest from "@/app/components/ui/UICrest";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.data()?.role ?? "passenger";
      router.replace(`/${role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left panel: campus map + branding ── */}
      <div className="relative hidden lg:flex w-[46%] min-w-[520px] flex-col overflow-hidden bg-[#0F2A45]">
        {/* Map backdrop */}
        <div className="absolute inset-0 opacity-50 bg-[#1F4E79]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,42,69,0.72)] to-[rgba(15,42,69,0.92)]" />

        {/* Top: logo + crest */}
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

        {/* Bottom: tagline */}
        <div className="relative z-10 mt-auto px-14 pb-14 text-white">
          <div className="text-[30px] font-bold leading-tight max-w-[420px]">
            Campus rides, on demand.
          </div>
          <div className="text-[15px] opacity-80 mt-4 max-w-[380px] leading-relaxed">
            Fixed fares, real drivers, live tracking — anywhere across the University of Ibadan campus.
          </div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-10">
        <div className="w-full max-w-[400px]">
          {/* Mini header */}
          <div className="flex items-center gap-3 mb-6">
            <UICrest className="w-[46px] h-auto" />
            <div className="text-[12.5px] font-semibold text-[#64748B] leading-snug">
              University of Ibadan
              <br />
              <span className="text-[#94A3B8] font-medium">Official campus transport</span>
            </div>
          </div>

          <h1 className="text-[26px] font-bold text-[#16263B]">Welcome back</h1>
          <p className="text-[14.5px] text-[#64748B] mt-2">Sign in to your ALTMS account.</p>

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
              className="mt-2 h-[50px] bg-[#1F4E79] hover:bg-[#1a4369] text-white text-[15px] font-semibold rounded-[11px] w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </Button>
          </form>

          <p className="text-center mt-5 text-[14px] text-[#64748B]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#1F4E79] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found"))
    return "Incorrect email or password.";
  if (msg.includes("too-many-requests")) return "Too many attempts. Try again later.";
  if (msg.includes("network")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}
