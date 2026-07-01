"use client";

import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

const ROLE_COLOR: Record<string, string> = {
  passenger: "#1F4E79",
  driver: "#00A896",
  admin: "#64748B",
};

export default function Header() {
  const { userDoc } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  const roleColor = ROLE_COLOR[userDoc?.role ?? "passenger"];

  const initials = userDoc?.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const activeTab = (["passenger", "driver", "admin"] as const).find((r) =>
    pathname.startsWith(`/${r}`)
  );

  return (
    <header className="relative flex-none h-16 bg-white border-b border-[#E6EBF1] flex items-center px-6 gap-5 z-20 shadow-[0_1px_0_rgba(16,40,70,0.02)]">
      {/* Role accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: roleColor }} />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 rounded-[10px] bg-[#1F4E79] flex items-center justify-center flex-shrink-0">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="#fff" />
            <circle cx="12" cy="9" r="2.6" fill="#1F4E79" />
          </svg>
        </div>
        <div>
          <div className="text-[17px] font-extrabold tracking-[0.4px] text-[#16263B] leading-none">ALTMS</div>
          <div className="text-[10.5px] text-[#94A3B8] mt-0.5">University of Ibadan</div>
        </div>
      </Link>

      <div className="flex-1" />

      {/* Role tabs */}
      {userDoc && (
        <nav className="flex bg-[#EEF2F7] rounded-[11px] p-1 gap-0.5">
          {(["passenger", "driver", "admin"] as const).map((r) => {
            const isActive = activeTab === r;
            return (
              <Link
                key={r}
                href={`/${r}`}
                className={[
                  "px-4 py-[7px] rounded-[8px] text-[13px] font-medium no-underline transition-colors",
                  isActive
                    ? "bg-white text-[#1F4E79] shadow-sm font-semibold"
                    : "text-[#64748B] hover:text-[#1F4E79]",
                ].join(" ")}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Divider */}
      {userDoc && <div className="w-px h-7 bg-[#E6EBF1]" />}

      {/* User */}
      {userDoc && (
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-[13.5px] font-semibold text-[#16263B] leading-tight">{userDoc.fullName}</div>
            <div className="text-[11px] font-semibold capitalize" style={{ color: roleColor }}>
              {userDoc.role}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-9 h-9 rounded-full text-white text-[13px] font-bold border-none cursor-pointer flex items-center justify-center"
            style={{ background: roleColor }}
          >
            {initials}
          </button>
        </div>
      )}
    </header>
  );
}
