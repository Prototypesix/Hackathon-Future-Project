import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "./_authenticated.dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assets/$id")({
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();

  const { data: asset } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => (await supabase.from("assets").select("*, asset_categories(name)").eq("id", id).maybeSingle()).data,
  });

  const { data: faults } = useQuery({
    queryKey: ["asset-faults", id],
    queryFn: async () => (await supabase.from("fault_reports").select("*").eq("asset_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: parts } = useQuery({
    queryKey: ["asset-parts", id],
    queryFn: async () => (await supabase.from("spare_part_requests").select("*").eq("asset_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  if (!asset) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <>
      <PageHeader
        title={asset.name}
        description={`${asset.asset_categories?.name ?? "Sans catégorie"} · ${asset.manufacturer ?? "—"} ${asset.model ?? ""}`}
        action={<Link to="/assets"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button></Link>}
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <Row k="Statut" v={asset.status} />
                <Row k="Numéro de série" v={<span className="font-mono">{asset.serial_number || "—"}</span>} />
                <Row k="Emplacement" v={asset.location || "—"} />
                <Row k="Achat" v={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "—"} />
                <Row k="QR" v={<span className="inline-flex items-center gap-1 font-mono text-primary"><QrCode className="h-3 w-3" />{asset.qr_code}</span>} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Pannes</CardTitle><span className="font-mono text-primary">{faults?.length ?? 0}</span></CardHeader>
            <CardContent>
              {faults && faults.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {faults.slice(0, 5).map(f => (
                    <li key={f.id} className="flex items-center justify-between">
                      <span className="truncate">{f.title}</span>
                      <SeverityBadge severity={f.severity} />
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Aucune panne.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Pièces demandées</CardTitle><span className="font-mono text-primary">{parts?.length ?? 0}</span></CardHeader>
            <CardContent>
              {parts && parts.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {parts.slice(0, 5).map(p => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span className="truncate">{p.part_name}</span>
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">{p.stage}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Aucune demande.</p>}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="capitalize">{v}</dd>
    </div>
  );
}
