import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Boxes, ClipboardList, Factory, LineChart, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartAsset — Intelligence industrielle pour vos actifs" },
      { name: "description", content: "Enregistrez vos équipements, déclarez les pannes avec preuves visuelles, suivez vos demandes de pièces et anticipez les défaillances." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" aria-hidden />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Factory className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">SmartAsset</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Modules</a>
          <a href="#intelligence" className="hover:text-foreground">Intelligence</a>
          <a href="#workflow" className="hover:text-foreground">Workflow</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Se connecter</Button></Link>
          <Link to="/auth"><Button variant="default" className="bg-gradient-primary text-primary-foreground shadow-glow">Démarrer</Button></Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Smart Industrial Asset Intelligence
          </div>
          <h1 className="mt-6 text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            L'intelligence industrielle <span className="bg-gradient-primary bg-clip-text text-transparent">au cœur de vos opérations</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Centralisez vos équipements, déclarez les pannes avec preuves visuelles,
            suivez vos demandes de pièces détachées et anticipez les défaillances grâce à la donnée.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">Lancer la plateforme</Button></Link>
            <a href="#features"><Button size="lg" variant="outline">Voir les modules</Button></a>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { k: "9", v: "Modules métier" },
            { k: "10", v: "Étapes de workflow" },
            { k: "100%", v: "PWA-ready" },
            { k: "∞", v: "Données structurées" },
          ].map((s) => (
            <div key={s.v} className="rounded-xl border border-border bg-card/60 p-4 shadow-card backdrop-blur">
              <div className="font-mono text-3xl font-semibold text-primary">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold md:text-4xl">Tous vos modules industriels</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Tout ce qu'il faut pour gérer le cycle de vie d'un parc d'équipements.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Boxes, t: "Gestion des actifs", d: "Catégorisation, numéro de série, photos, fiche dédiée par équipement." },
            { icon: Activity, t: "Signalement de pannes", d: "Sévérité, statut, preuves visuelles obligatoires multi-angles." },
            { icon: ClipboardList, t: "Demande de pièces", d: "Liée à l'actif, urgence, suivi de bout en bout." },
            { icon: Workflow, t: "Workflow 10 étapes", d: "Soumis → Inspection → Validation → Fabrication → Livraison → Clôturé." },
            { icon: LineChart, t: "Analytics", d: "Pannes fréquentes, pièces les plus demandées, tendances par site." },
            { icon: ShieldCheck, t: "Rôles & sécurité", d: "Admin, Manager, Technicien — données cloisonnées par entreprise." },
          ].map((f) => (
            <div key={f.t} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/40">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent/50 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="intelligence" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl border border-border bg-gradient-industrial p-10 shadow-card md:p-16">
          <h2 className="max-w-2xl font-display text-3xl font-semibold md:text-5xl">
            Construit pour la <span className="text-primary">maintenance prédictive</span>.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Chaque panne est liée à une machine, une entreprise, une catégorie et des preuves visuelles —
            la donnée structurée alimente l'anticipation des besoins futurs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth"><Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">Créer un compte</Button></Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl border-t border-border px-6 py-10 text-sm text-muted-foreground">
        © {new Date().getFullYear()} SmartAsset — Industrial Asset Intelligence
      </footer>
    </main>
  );
}
