import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { data: companies } = useQuery({ queryKey: ["admin-companies"], queryFn: async () => (await supabase.from("companies").select("*")).data ?? [] });
  const { data: assets } = useQuery({ queryKey: ["admin-assets"], queryFn: async () => (await supabase.from("assets").select("id,name,status,company_id")).data ?? [] });
  const { data: faults } = useQuery({ queryKey: ["admin-faults"], queryFn: async () => (await supabase.from("fault_reports").select("id,title,status,company_id")).data ?? [] });

  return (
    <>
      <PageHeader title="Administration" description="Vue cross-entreprises pour les administrateurs." />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Entreprises ({companies?.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {companies?.map(c => <div key={c.id} className="rounded border border-border px-2 py-1">{c.name}</div>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Équipements ({assets?.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="max-h-80 space-y-1 overflow-auto text-sm">
              {assets?.map(a => <div key={a.id} className="flex justify-between rounded border border-border px-2 py-1"><span>{a.name}</span><span className="text-xs text-muted-foreground">{a.status}</span></div>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Rapports de panne ({faults?.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="max-h-80 space-y-1 overflow-auto text-sm">
              {faults?.map(f => <div key={f.id} className="flex justify-between rounded border border-border px-2 py-1"><span className="truncate">{f.title}</span><span className="text-xs text-muted-foreground">{f.status}</span></div>)}
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground">Note : l'accès complet requiert le rôle <code className="font-mono">admin</code>. Les politiques de sécurité cloisonnent les données par entreprise pour les autres rôles.</p>
      </PageBody>
    </>
  );
}
