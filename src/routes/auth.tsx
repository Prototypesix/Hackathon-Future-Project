import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — SmartAsset" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bienvenue !");
    nav({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: String(fd.get("name") || "") },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé. Vous pouvez maintenant vous connecter.");
  }

  async function google() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Connexion Google impossible");
      return;
    }
    if (result.redirected) return;
    nav({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-industrial lg:block">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary"><Factory className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-display text-lg font-semibold">SmartAsset</span>
          </a>
          <div>
            <h1 className="max-w-md font-display text-4xl font-semibold leading-tight">
              L'intelligence industrielle <span className="text-primary">au quotidien</span>.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">Centralisez les actifs, suivez les pannes, accélérez les demandes de pièces.</p>
          </div>
          <p className="text-xs text-muted-foreground">© SmartAsset</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-semibold">Accéder à la plateforme</h2>
          <p className="mt-1 text-sm text-muted-foreground">Email + mot de passe, ou Google.</p>

          <Button onClick={google} disabled={loading} variant="outline" className="mt-6 w-full">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1.2-1.6 3.5-4.5 3.5-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.7 3.2 1.2l2.2-2.1C16 5.5 14.2 4.7 12 4.7 7.9 4.7 4.6 8 4.6 12.1S7.9 19.5 12 19.5c6.9 0 7.7-6.4 7.1-9.5H12z"/></svg>
            Continuer avec Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3">
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
                <div><Label htmlFor="password">Mot de passe</Label><Input id="password" name="password" type="password" required /></div>
                <Button disabled={loading} type="submit" className="w-full bg-gradient-primary text-primary-foreground">Se connecter</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3">
                <div><Label htmlFor="name">Nom complet</Label><Input id="name" name="name" required /></div>
                <div><Label htmlFor="email2">Email</Label><Input id="email2" name="email" type="email" required /></div>
                <div><Label htmlFor="password2">Mot de passe</Label><Input id="password2" name="password" type="password" minLength={8} required /></div>
                <Button disabled={loading} type="submit" className="w-full bg-gradient-primary text-primary-foreground">Créer mon compte</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
