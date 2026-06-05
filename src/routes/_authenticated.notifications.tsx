import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  async function markRead(id: string) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <>
      <PageHeader title="Notifications" description="Tous vos évènements en un seul endroit." />
      <PageBody>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Activité récente</CardTitle></CardHeader>
          <CardContent>
            {notifs && notifs.length > 0 ? (
              <ul className="divide-y divide-border">
                {notifs.map((n: any) => (
                  <li key={n.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className={`font-medium ${n.read ? "text-muted-foreground" : ""}`}>{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.body} · {new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.read && <Button size="sm" variant="outline" onClick={() => markRead(n.id)}><Check className="h-3 w-3" /></Button>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
