import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Boxes, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — SmartAsset" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [assets, faults, parts, openFaults] = await Promise.all([
        supabase.from("assets").select("*", { count: "exact", head: true }),
        supabase.from("fault_reports").select("*", { count: "exact", head: true }),
        supabase.from("spare_part_requests").select("*", { count: "exact", head: true }),
        supabase.from("fault_reports").select("*", { count: "exact", head: true }).neq("status", "closed"),
      ]);
      return {
        assets: assets.count ?? 0,
        faults: faults.count ?? 0,
        parts: parts.count ?? 0,
        openFaults: openFaults.count ?? 0,
      };
    },
  });

  const { data: recentFaults } = useQuery({
    queryKey: ["recent-faults"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fault_reports")
        .select("id,title,severity,status,created_at,assets(name)")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Équipements", value: data?.assets ?? 0, icon: Boxes, href: "/assets" },
    { label: "Pannes signalées", value: data?.faults ?? 0, icon: Activity, href: "/faults" },
    { label: "Pannes ouvertes", value: data?.openFaults ?? 0, icon: AlertTriangle, href: "/faults" },
    { label: "Demandes pièces", value: data?.parts ?? 0, icon: Workflow, href: "/parts" },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble en temps réel de votre parc industriel."
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link to={c.href} key={c.label}>
              <Card className="transition hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                  <c.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-3xl font-semibold">{c.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dernières pannes</CardTitle>
            <Link to="/faults"><Button size="sm" variant="outline">Voir tout</Button></Link>
          </CardHeader>
          <CardContent>
            {recentFaults && recentFaults.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentFaults.map((f: any) => (
                  <li key={f.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">{f.assets?.name ?? "—"} · {new Date(f.created_at).toLocaleString()}</div>
                    </div>
                    <SeverityBadge severity={f.severity} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: "bg-success/15 text-success border-success/30",
    medium: "bg-warning/15 text-warning border-warning/30",
    high: "bg-primary/15 text-primary border-primary/30",
    critical: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[severity] ?? ""}`}>{severity}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      Aucune panne signalée pour le moment.
      <div className="mt-3"><Link to="/faults"><Button size="sm" className="bg-gradient-primary text-primary-foreground">Signaler une panne</Button></Link></div>
    </div>
  );
}
