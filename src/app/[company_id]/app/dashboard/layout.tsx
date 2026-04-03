 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "../utils/api"; // use same getSession as CompanyLayout

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure this runs only after first client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const session = getSession();
    console.log("SESSION IN DASHBOARD LAYOUT:", session);

    if (!session?.token) {
      // delay redirect to avoid StrictMode double render issues
      Promise.resolve().then(() => router.replace("/login"));
    } else {
      setCheckingSession(false);
    }
  }, [mounted, router]);

  if (!mounted || checkingSession) {
    return (
      <div className="flex items-center justify-center w-full h-screen text-gray-600 bg-gray-100">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
