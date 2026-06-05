import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SmartAsset" }] }),
  component: AnalyticsPage,
});

const COLORS = ["hsl(28 95% 60%)", "hsl(210 80% 60%)", "hsl(150 60% 55%)", "hsl(0 75% 60%)", "hsl(280 65% 65%)"];

function AnalyticsPage() {
  const { data: topAssets } = useQuery({
    queryKey: ["analytics-top-assets"],
    queryFn: async () => {
      const { data } = await supabase.from("fault_reports").select("asset_id, assets(name)");
      const counts: Record<string, { name: string; count: number }> = {};
      (data ?? []).forEach((r: any) => {
        const k = r.asset_id;
        const n = r.assets?.name ?? "—";
        counts[k] = counts[k] || { name: n, count: 0 };
        counts[k].count++;
      });
      return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 6);
    },
  });

  const { data: topParts } = useQuery({
    queryKey: ["analytics-top-parts"],
    queryFn: async () => {
      const { data } = await supabase.from("spare_part_requests").select("part_name");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { counts[r.part_name] = (counts[r.part_name] ?? 0) + 1; });
      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    },
  });

  const { data: severity } = useQuery({
    queryKey: ["analytics-severity"],
    queryFn: async () => {
      const { data } = await supabase.from("fault_reports").select("severity");
      const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      (data ?? []).forEach((r: any) => { counts[r.severity] = (counts[r.severity] ?? 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  return (
    <>
      <PageHeader title="Analytics" description="Insights pour la maintenance prédictive." />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Équipements les plus en panne</CardTitle></CardHeader>
            <CardContent style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAssets ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="oklch(0.72 0.18 50)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pièces les plus demandées</CardTitle></CardHeader>
            <CardContent style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topParts ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="oklch(0.70 0.14 230)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Distribution par sévérité</CardTitle></CardHeader>
            <CardContent style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severity ?? []} dataKey="value" nameKey="name" outerRadius={100} label>
                    {(severity ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
