 "use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Sidebar from "../app/sidebar";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, getSession } from "../app/utils/api";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mounted, setMounted] = useState(false);

  // ✅ Ensure this runs only after first client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const session = getSession();
    console.log("SESSION IN LAYOUT:", session);

    // ✅ Redirect only if no valid token
    if (!session?.token) {
      // Delay redirect to avoid Fast Refresh double render issues
      Promise.resolve().then(() => router.replace("/login"));
    } else {
      setCheckingSession(false);
    }
  }, [mounted, router]);

  useEffect(() => {
    if (checkingSession) return;
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [pathname, checkingSession]);

  if (!mounted || checkingSession) {
    return (
      <div className="flex items-center justify-center w-full h-screen text-gray-600 bg-gray-100">
        Checking session...
      </div>
    );
  }

  return (
   <div className="flex min-h-screen overflow-hidden">
  <Sidebar onMenuChange={setCurrentPage} />
  <main className="flex-1 flex flex-col max-h-screen relative">
        {loading && (
          <div className="z-530 fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-[#103BB5] rounded-full animate-spin"></div>
          </div>
        )}
        <header className="flex items-center justify-between px-6 py-3 bg-gray-50">
          <h1 className="text-[20px] font-semibold text-[#103BB5]">{currentPage}</h1>
          <div className="flex items-center gap-4">
            <button
              title="Reminders"
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex items-center gap-2  bg-[#103BB5] text-white hover:bg-[#2A51C0]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-white">{children}</div>
        <Toaster position="top-right" />
      </main>
    </div>
  );
}
