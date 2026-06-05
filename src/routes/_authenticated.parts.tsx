import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { Plus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parts")({
  head: () => ({ meta: [{ title: "Demandes de pièces — SmartAsset" }] }),
  component: PartsPage,
});

const STAGES = [
  "submitted","review","inspection","visual_analysis","engineering_review",
  "manufacturing","quality_control","shipping","delivered","closed",
] as const;

const STAGE_LABEL: Record<string,string> = {
  submitted: "Soumis", review: "Révision", inspection: "Inspection",
  visual_analysis: "Analyse visuelle", engineering_review: "Revue ingénierie",
  manufacturing: "Fabrication", quality_control: "Contrôle qualité",
  shipping: "Expédition", delivered: "Livré", closed: "Clôturé",
};

function PartsPage() {
  const qc = useQueryClient();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);

  const { data: assets } = useQuery({
    queryKey: ["asset-options"],
    queryFn: async () => (await supabase.from("assets").select("id,name")).data ?? [],
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: async () => (await supabase.from("spare_part_requests").select("*, assets(name)").order("created_at", { ascending: false })).data ?? [],
  });

  async function createRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile?.company_id) return toast.error("Associez d'abord votre compte à une entreprise.");
    const fd = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("spare_part_requests").insert({
      company_id: profile.company_id,
      asset_id: String(fd.get("asset_id")),
      part_name: String(fd.get("part_name")),
      description: String(fd.get("description") || ""),
      urgency: String(fd.get("urgency")) as any,
      quantity: Number(fd.get("quantity") || 1),
      requested_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Demande créée.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["parts"] });
  }

  async function advance(id: string, current: string) {
    const idx = STAGES.indexOf(current as any);
    const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
    const { error } = await supabase.from("spare_part_requests").update({ stage: next }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["parts"] });
  }

  return (
    <>
      <PageHeader
        title="Demandes de pièces détachées"
        description="Workflow complet : Soumis → … → Livré → Clôturé."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Nouvelle demande</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Demande de pièce détachée</DialogTitle></DialogHeader>
              <form onSubmit={createRequest} className="space-y-3">
                <div>
                  <Label>Équipement</Label>
                  <Select name="asset_id" required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{assets?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Nom de la pièce</Label><Input name="part_name" required /></div>
                <div><Label>Description du besoin</Label><Textarea name="description" rows={3} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Urgence</Label>
                    <Select name="urgency" defaultValue="normal">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Quantité</Label><Input name="quantity" type="number" min={1} defaultValue={1} /></div>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">Soumettre</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody>
        {isLoading ? <p className="text-muted-foreground">Chargement…</p> :
          requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((r: any) => {
                const idx = STAGES.indexOf(r.stage);
                const progress = ((idx + 1) / STAGES.length) * 100;
                return (
                  <Card key={r.id}>
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-medium">{r.part_name} <span className="text-muted-foreground">×{r.quantity}</span></div>
                          <div className="text-xs text-muted-foreground">{r.assets?.name ?? "—"} · Urgence {r.urgency}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{STAGE_LABEL[r.stage]}</span>
                          {r.stage !== "closed" && (
                            <Button size="sm" variant="outline" onClick={() => advance(r.id, r.stage)}>
                              Avancer <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {STAGES.map((s, i) => (
                          <span key={s} className={`rounded px-1.5 py-0.5 ${i <= idx ? "text-primary" : "text-muted-foreground"}`}>{STAGE_LABEL[s]}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Aucune demande de pièce.
            </div>
          )}
      </PageBody>
    </>
  );
}
