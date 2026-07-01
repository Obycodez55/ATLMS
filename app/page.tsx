"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";

export default function RootPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (userDoc?.role) router.replace(`/${userDoc.role}`);
  }, [loading, user, userDoc, router]);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, border: "3px solid #E2E8F0", borderTopColor: "#1F4E79", borderRadius: "50%", animation: "altms-spin .7s linear infinite" }} />
    </div>
  );
}
