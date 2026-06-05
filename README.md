# SmartAsset — Smart Industrial Asset Intelligence & Spare Parts

Plateforme web (PWA-ready) de gestion intelligente d'équipements industriels,
de signalement de pannes avec preuves visuelles, de demandes de pièces détachées
et d'analyse de données pour la maintenance prédictive.

> Projet conçu dans le cadre du **Smart Industrial Asset Intelligence & Spare Parts Innovation Hackathon**.

---

## ✨ Fonctionnalités

| Module | Description |
| --- | --- |
| **Gestion des actifs** | Enregistrement, catégorisation, photos, QR code unique, fiche dédiée |
| **Profil équipement** | Historique pannes & demandes, statut (actif/maintenance/down/critique) |
| **Signalement de pannes** | Sévérité, statut, description, **preuves visuelles obligatoires** (multi-angles) |
| **Capture visuelle** | Upload guidé multi-photos depuis mobile (`capture="environment"`) |
| **Demande de pièces** | Liée à un actif, urgence, quantité, description |
| **Workflow 10 étapes** | Soumis → Révision → Inspection → Analyse visuelle → Ingénierie → Fabrication → QC → Expédition → Livré → Clôturé |
| **Dashboard admin** | Vue cross-entreprises, gestion globale |
| **Analytics** | Équipements les plus en panne, pièces les plus demandées, distribution par sévérité |
| **Notifications** | Alertes générées automatiquement à chaque changement de statut workflow |
| **Innovations** | QR codes par équipement, données structurées prêtes pour la maintenance prédictive |

---

## 🏗️ Stack technique

- **Frontend** : React 19, TanStack Start v1 (file-based routing), TanStack Query, Tailwind CSS v4, shadcn/ui, Recharts, Lucide
- **Backend** : Lovable Cloud (PostgreSQL + Auth + Storage managé)
- **Auth** : Email/mot de passe + Google OAuth
- **Sécurité** : Row-Level Security (RLS) par entreprise, rôles `admin` / `manager` / `technician`
- **Storage** : buckets privés `fault-evidence` et `asset-photos` (cloisonnés par `company_id`)
- **PWA** : `manifest.webmanifest` + meta `theme-color`

---

## 🗄️ Modèle de données

```
companies ─┬─< profiles >── auth.users >── user_roles
           ├─< assets >─< fault_reports >─< fault_images
           └─< spare_part_requests >─< workflow_events
                 │
                 └── notifications
```

Tables principales :

- `companies`, `profiles`, `user_roles` (rôles dans une table séparée — antidote à l'élévation de privilèges)
- `asset_categories` (référentiel partagé, seedé : Generator, Pump, Printer, Compressor, …)
- `assets` (avec `qr_code` unique, `status` enum, photo)
- `fault_reports` + `fault_images` (preuves obligatoires côté UI)
- `spare_part_requests` + `workflow_events` (audit automatique via trigger)
- `notifications` (créées automatiquement à chaque changement d'étape)

Fonctions SQL : `has_role()`, `current_company()`, `handle_new_user()`, `log_workflow_change()`.

---

## 🚀 Installation locale

### Prérequis
- [Bun](https://bun.sh) ≥ 1.0 (ou Node 20 + npm/pnpm)
- Un projet Supabase (ou utiliser Lovable Cloud qui le provisionne automatiquement)

### Étapes

```bash
git clone <repo-url>
cd smartasset
bun install
cp .env.example .env   # puis renseigner vos variables
bun dev
```

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (anon) |
| `VITE_SUPABASE_PROJECT_ID` | ID du projet |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Versions serveur (SSR) |

### Migrations de base

Les migrations SQL sont appliquées automatiquement via Lovable Cloud.
Pour un Supabase manuel, exécuter dans l'ordre :

1. Schéma initial (enums, tables, RLS, triggers, seed des catégories)
2. Politiques de stockage pour les buckets `fault-evidence` et `asset-photos`

---

## 🔐 Sécurité & rôles

- **technician** (par défaut au signup) : peut créer/voir les actifs et pannes de son entreprise.
- **manager** : peut faire avancer le workflow des demandes de pièces.
- **admin** : accès complet cross-entreprises.

Les RLS garantissent qu'un utilisateur ne voit que les données de son entreprise
(`profiles.company_id`). Les rôles sont stockés dans `user_roles` (jamais dans `profiles`).

---

## 🧭 Routes

| URL | Description |
| --- | --- |
| `/` | Landing publique |
| `/auth` | Connexion / inscription (email + Google) |
| `/dashboard` | KPIs et activité récente |
| `/assets` | Liste des équipements + création |
| `/assets/$id` | Fiche détaillée d'un équipement |
| `/faults` | Pannes et signalement avec preuves visuelles |
| `/parts` | Demandes de pièces et avancement workflow |
| `/analytics` | Insights et graphes |
| `/notifications` | Alertes |
| `/admin` | Vue admin globale |
| `/onboarding` | Associer / créer une entreprise |

---

## 📦 Déploiement

- **Lovable** : cliquer sur **Publish** dans l'éditeur — le projet est livré avec son backend.
- **Self-hosting** : `bun run build` + déployer la sortie Worker (Cloudflare-compatible). Voir [docs.lovable.dev/self-hosting](https://docs.lovable.dev/tips-tricks/self-hosting).

---

## 🤝 Contribuer

1. Fork → branche → PR.
2. Respecter la convention : utilitaires Tailwind via tokens sémantiques (`bg-primary`, `text-foreground`…), pas de couleurs en dur.
3. `bun run lint` et `bun run format` avant commit.

---

## 📄 Licence

MIT — libre d'usage pour la démonstration et l'apprentissage.

**Vision** : construire l'avenir de l'intelligence industrielle dans les économies émergentes 🌍
