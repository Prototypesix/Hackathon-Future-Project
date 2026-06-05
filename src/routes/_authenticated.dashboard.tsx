import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Boxes, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-queries";
import {
  LoadingSkeleton,
  ErrorAlert,
  EmptyState as UIEmptyState,
} from "@/lib/ui-helpers";
import {
  formatDateRelative,
  getSeverityColor,
  getSeverityLabel,
} from "@/lib/formatters";
import type { FaultReport } from "@/lib/api/validators";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — SmartAsset" }] }),
  component: Dashboard,
});

function Dashboard() {
  const {
    assets,
    faults,
    parts,
    recentFaults,
    isLoading,
    error,
    isFetching,
  } = useDashboardStats();

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble en temps réel de votre parc industriel."
        />
        <PageBody>
          <LoadingSkeleton count={6} />
        </PageBody>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble en temps réel de votre parc industriel."
        />
        <PageBody>
          <ErrorAlert
            message={error.message || "Impossible de charger les données"}
          />
        </PageBody>
      </>
    );
  }

  // Compter les pannes ouvertes
  const openFaults =
    faults?.byStatus?.open ?? 0;

  const cards = [
    {
      label: "Équipements",
      value: assets?.total ?? 0,
      icon: Boxes,
      href: "/assets",
    },
    {
      label: "Pannes signalées",
      value: faults?.total ?? 0,
      icon: Activity,
      href: "/faults",
    },
    {
      label: "Pannes ouvertes",
      value: openFaults,
      icon: AlertTriangle,
      href: "/faults",
    },
    {
      label: "Demandes pièces",
      value: parts?.total ?? 0,
      icon: Workflow,
      href: "/parts",
    },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble en temps réel de votre parc industriel."
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link to={c.href} key={c.label}>
              <Card
                className={`transition hover:border-primary/40 ${
                  isFetching ? "opacity-50" : ""
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {c.label}
                  </CardTitle>
                  <c.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-3xl font-semibold">
                    {c.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dernières pannes</CardTitle>
            <Link to="/faults">
              <Button size="sm" variant="outline">
                Voir tout
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentFaults && recentFaults.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentFaults.map((f: FaultReport) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateRelative(f.created_at)}
                      </div>
                    </div>
                    <SeverityBadge severity={f.severity} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getSeverityColor(severity)}`}
    >
      {getSeverityLabel(severity)}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      Aucune panne signalée pour le moment.
      <div className="mt-3">
        <Link to="/faults">
          <Button
            size="sm"
            className="bg-gradient-primary text-primary-foreground"
          >
            Signaler une panne
          </Button>
        </Link>
      </div>
    </div>
  );
}
