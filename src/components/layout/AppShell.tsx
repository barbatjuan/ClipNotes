"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import { getUserJobs } from "@/lib/supabase/jobs";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showShell = useMemo(() => {
    return pathname?.startsWith("/dashboard") || pathname?.startsWith("/jobs");
  }, [pathname]);

  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<"dashboard" | "history" | "stats">("dashboard");

  // Load user + jobs once
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        const list = await getUserJobs(u.id);
        setJobs(list);
      }
    };
    if (showShell) load();
  }, [showShell]);

  // Keep activeSection in sync with query param
  useEffect(() => {
    if (!showShell) return;
    const section = searchParams?.get("section");
    if (section === "history" || section === "stats" || section === "dashboard") {
      setActiveSection(section);
    } else {
      setActiveSection("dashboard");
    }
  }, [showShell, searchParams]);

  if (!showShell) return <>{children}</>;

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-secondary-50 dark:bg-secondary-950">
      <Sidebar
        jobs={jobs}
        onSelectJob={(jid: string) => router.push(`/jobs/${jid}`)}
        onSettings={() => router.push("/dashboard")}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
        onNavigate={(section) => {
          if (section === "stats") return router.push("/dashboard?section=stats");
          if (section === "history") return router.push("/dashboard?section=history");
          return router.push("/dashboard");
        }}
        user={user}
        activeSection={activeSection}
      />
      <main className="relative z-10 flex-1 ml-80 py-8 px-10">{children}</main>
    </div>
  );
}
