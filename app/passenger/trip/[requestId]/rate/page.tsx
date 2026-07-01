"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RatePage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/passenger/trip/${requestId}`);
  }, [requestId, router]);

  return null;
}
