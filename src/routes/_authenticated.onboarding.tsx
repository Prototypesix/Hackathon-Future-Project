import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/page-shell";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      const { data: c } = await supabase.from("companies").select("id,name").order("name");
      setCompanies(c ?? []);
      setLoading(false);
    })();
  }, []);

  async function createCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { data, error } = await supabase
      .from("companies")
      .insert({ name: String(fd.get("name")), industry: String(fd.get("industry") || ""), country: String(fd.get("country") || "") })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await selectCompany(data.id);
  }

  async function selectCompany(company_id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ company_id }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Entreprise associée à votre compte.");
    nav({ to: "/dashboard" });
  }

  if (loading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <>
      <PageHeader title="Profil & entreprise" description="Reliez votre compte à une entreprise existante ou créez-en une nouvelle." />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Rejoindre une entreprise</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select onValueChange={selectCompany} defaultValue={profile?.company_id ?? undefined}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une entreprise" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Vos données seront cloisonnées à cette entreprise.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Créer une entreprise</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createCompany} className="space-y-3">
                <div><Label htmlFor="name">Nom</Label><Input id="name" name="name" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="industry">Secteur</Label><Input id="industry" name="industry" placeholder="Manufacturing" /></div>
                  <div><Label htmlFor="country">Pays</Label><Input id="country" name="country" /></div>
                </div>
                <Button type="submit" className="bg-gradient-primary text-primary-foreground">Créer & associer</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
