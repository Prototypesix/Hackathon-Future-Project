import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { Plus, QrCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({ meta: [{ title: "Équipements — SmartAsset" }] }),
  component: AssetsPage,
});

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  maintenance: "bg-warning/15 text-warning border-warning/30",
  down: "bg-destructive/15 text-destructive border-destructive/30",
  critical: "bg-destructive/30 text-destructive border-destructive/40",
};

function AssetsPage() {
  const qc = useQueryClient();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("asset_categories").select("*").order("name")).data ?? [],
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => (await supabase.from("assets").select("*, asset_categories(name)").order("created_at", { ascending: false })).data ?? [],
  });

  async function createAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile?.company_id) return toast.error("Associez d'abord votre compte à une entreprise.");
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("assets").insert({
      company_id: profile.company_id,
      category_id: String(fd.get("category_id")) || null,
      name: String(fd.get("name")),
      serial_number: String(fd.get("serial_number") || ""),
      model: String(fd.get("model") || ""),
      manufacturer: String(fd.get("manufacturer") || ""),
      location: String(fd.get("location") || ""),
      qr_code: `AST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    });
    if (error) return toast.error(error.message);
    toast.success("Équipement ajouté.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["assets"] });
  }

  return (
    <>
      <PageHeader
        title="Équipements"
        description="Tous vos actifs industriels en un seul endroit."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Nouvel équipement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ajouter un équipement</DialogTitle></DialogHeader>
              <form onSubmit={createAsset} className="space-y-3">
                <div><Label htmlFor="name">Nom</Label><Input id="name" name="name" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Catégorie</Label>
                    <Select name="category_id">
                      <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label htmlFor="location">Emplacement</Label><Input id="location" name="location" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="manufacturer">Fabricant</Label><Input id="manufacturer" name="manufacturer" /></div>
                  <div><Label htmlFor="model">Modèle</Label><Input id="model" name="model" /></div>
                </div>
                <div><Label htmlFor="serial_number">Numéro de série</Label><Input id="serial_number" name="serial_number" /></div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">Créer</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody>
        {isLoading ? <p className="text-muted-foreground">Chargement…</p> :
          assets && assets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((a: any) => (
                <Link key={a.id} to="/assets/$id" params={{ id: a.id }}>
                  <Card className="h-full transition hover:border-primary/40">
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold">{a.name}</h3>
                          <p className="text-xs text-muted-foreground">{a.asset_categories?.name ?? "Sans catégorie"}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <dt>Fabricant</dt><dd className="text-foreground">{a.manufacturer || "—"}</dd>
                        <dt>Modèle</dt><dd className="text-foreground">{a.model || "—"}</dd>
                        <dt>Série</dt><dd className="font-mono text-foreground">{a.serial_number || "—"}</dd>
                        <dt>Lieu</dt><dd className="text-foreground">{a.location || "—"}</dd>
                      </dl>
                      <div className="flex items-center gap-1 text-xs font-mono text-primary"><QrCode className="h-3 w-3" /> {a.qr_code}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">Aucun équipement enregistré.</p>
              <p className="mt-1 text-xs text-muted-foreground">{profile?.company_id ? "Cliquez sur « Nouvel équipement »" : "Associez d'abord votre compte à une entreprise."}</p>
              {!profile?.company_id && <Link to="/onboarding" className="mt-3 inline-block"><Button size="sm">Configurer</Button></Link>}
            </div>
          )
        }
      </PageBody>
    </>
  );
}
