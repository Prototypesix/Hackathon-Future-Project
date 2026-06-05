import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Bell, Boxes, Factory, Gauge, LayoutDashboard, LogOut, Settings, ShieldCheck, Workflow as WorkflowIcon } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/assets", label: "Équipements", icon: Boxes },
  { to: "/faults", label: "Pannes", icon: Activity },
  { to: "/parts", label: "Demandes de pièces", icon: WorkflowIcon },
  { to: "/analytics", label: "Analytics", icon: Gauge },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/admin", label: "Administration", icon: ShieldCheck },
] as const;

function AuthLayout() {
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) nav({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      if (!data.session) nav({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Chargement…</div>;
  }
  if (!session) return null;

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr]">
      <aside className="border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
            <Factory className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-semibold">SmartAsset</span>
        </div>
        <nav className="p-3">
          {NAV.map((item) => {
            const Active = path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  Active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 text-primary" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-sidebar-border p-3">
          <Link to="/onboarding" className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60">
            <Settings className="h-4 w-4" /> Profil & entreprise
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="min-w-0 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
