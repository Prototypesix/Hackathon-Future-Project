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
import { SeverityBadge } from "./_authenticated.dashboard";
import { toast } from "sonner";
import { Camera, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/faults")({
  head: () => ({ meta: [{ title: "Pannes — SmartAsset" }] }),
  component: FaultsPage,
});

function FaultsPage() {
  const qc = useQueryClient();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { data: assets } = useQuery({
    queryKey: ["asset-options"],
    queryFn: async () => (await supabase.from("assets").select("id,name")).data ?? [],
  });

  const { data: faults, isLoading } = useQuery({
    queryKey: ["faults"],
    queryFn: async () => (await supabase.from("fault_reports").select("*, assets(name)").order("created_at", { ascending: false })).data ?? [],
  });

  async function createFault(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile?.company_id) return toast.error("Associez d'abord votre compte à une entreprise.");
    if (files.length === 0) return toast.error("Au moins une preuve visuelle est obligatoire.");
    const fd = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: fault, error } = await supabase.from("fault_reports").insert({
      company_id: profile.company_id,
      asset_id: String(fd.get("asset_id")),
      title: String(fd.get("title")),
      description: String(fd.get("description")),
      severity: String(fd.get("severity")) as any,
      fault_category: String(fd.get("fault_category") || ""),
      reported_by: user?.id,
    }).select().single();
    if (error || !fault) return toast.error(error?.message ?? "Erreur");

    for (const [i, file] of files.entries()) {
      const path = `${profile.company_id}/${fault.id}/${Date.now()}-${i}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("fault-evidence").upload(path, file);
      if (upErr) { toast.error(`Upload échoué: ${upErr.message}`); continue; }
      await supabase.from("fault_images").insert({ fault_id: fault.id, storage_path: path, angle: `view-${i + 1}` });
    }

    toast.success("Panne signalée avec preuves visuelles.");
    setOpen(false);
    setFiles([]);
    qc.invalidateQueries({ queryKey: ["faults"] });
  }

  return (
    <>
      <PageHeader
        title="Pannes"
        description="Signalements documentés avec preuves visuelles obligatoires."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Signaler une panne</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nouvelle panne</DialogTitle></DialogHeader>
              <form onSubmit={createFault} className="space-y-3">
                <div>
                  <Label>Équipement</Label>
                  <Select name="asset_id" required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{assets?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Titre</Label><Input name="title" required /></div>
                <div><Label>Description</Label><Textarea name="description" rows={3} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sévérité</Label>
                    <Select name="severity" defaultValue="medium">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Catégorie</Label><Input name="fault_category" placeholder="électrique, mécanique…" /></div>
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Preuves visuelles (obligatoire)</Label>
                  <Input type="file" accept="image/*" multiple capture="environment"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                  <p className="mt-1 text-xs text-muted-foreground">{files.length} fichier(s) sélectionné(s). Pensez à prendre plusieurs angles.</p>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">Signaler</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody>
        {isLoading ? <p className="text-muted-foreground">Chargement…</p> :
          faults && faults.length > 0 ? (
            <div className="space-y-3">
              {faults.map((f: any) => (
                <Card key={f.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <div className="font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">{f.assets?.name ?? "—"} · {f.fault_category || "Non catégorisé"} · {new Date(f.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs capitalize">{f.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Aucune panne signalée.
            </div>
          )}
      </PageBody>
    </>
  );
}
