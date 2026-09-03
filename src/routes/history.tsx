import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowDownRight, ArrowUpRight, Loader2, Trash2, TrendingDown } from "lucide-react";
import { deleteEntry, listEntries } from "@/lib/history.functions";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "My footprint history — Verdant" },
      {
        name: "description",
        content:
          "Track every carbon footprint you have calculated, see your trend over time and revisit each AI action plan.",
      },
      { property: "og:title", content: "My footprint history — Verdant" },
      {
        property: "og:description",
        content: "Your saved carbon footprints, trend and AI action plans in one place.",
      },
    ],
  }),
  component: HistoryPage,
});

type Entry = Awaited<ReturnType<typeof listEntries>>[number];

function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchEntries = useServerFn(listEntries);
  const removeEntry = useServerFn(deleteEntry);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchEntries()
      .then((r) => setEntries(r))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load history"));
  }, [user, fetchEntries]);

  async function onDelete(id: string) {
    setEntries((prev) => prev?.filter((e) => e.id !== id) ?? prev);
    await removeEntry({ data: { id } }).catch(() => {});
  }

  const latest = entries?.[0];
  const previous = entries?.[1];
  const delta = latest && previous ? latest.total_kg - previous.total_kg : null;

  return (
    <div className="min-h-screen">
      <section className="border-b border-border/60" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="rise-in font-display text-5xl md:text-6xl">
            Your footprint <span className="leaf-text italic">over time</span>
          </h1>
          <p className="mt-4 max-w-xl text-foreground/70">
            Every calculation you save lives here, so your coach can compare where you were with
            where you are now.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            {latest && (
              <div>
                <div className="gold-text font-display text-4xl">
                  {latest.total_kg.toLocaleString()}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  latest kg CO₂e / year
                </div>
              </div>
            )}
            {delta !== null && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                  delta <= 0
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                }`}
              >
                {delta <= 0 ? (
                  <ArrowDownRight className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
                {Math.abs(delta).toLocaleString()} kg vs your previous check-in
              </div>
            )}
            <Button asChild className="rounded-full" style={{ background: "var(--gradient-leaf)" }}>
              <Link to="/">New calculation</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!entries && !error && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your history…
          </div>
        )}
        {entries && entries.length === 0 && (
          <Card className="glass grain">
            <CardContent className="py-14 text-center">
              <TrendingDown className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-4 text-muted-foreground">
                No saved footprints yet. Run a calculation and it will be stored here automatically.
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link to="/">Calculate my footprint</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4">
          {entries?.map((e) => (
            <Card key={e.id} className="glass grain rise-in">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-display text-2xl font-normal">
                    {e.total_kg.toLocaleString()} kg CO₂e
                  </CardTitle>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setOpen(open === e.id ? null : e.id)}
                  >
                    {open === e.id ? "Hide plan" : "View plan"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete entry"
                    onClick={() => onDelete(e.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(
                    [
                      ["transport", e.transport_kg],
                      ["home", e.home_kg],
                      ["diet", e.diet_kg],
                      ["shopping", e.shopping_kg],
                    ] as const
                  ).map(([label, v]) => (
                    <div key={label} className="rounded-2xl border border-border/60 p-4">
                      <div className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                      </div>
                      <div className="mt-1 font-display text-2xl">{v.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                {open === e.id && e.recommendations && (
                  <div className="prose prose-sm mt-6 max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-primary prose-li:text-foreground/80">
                    <ReactMarkdown>{e.recommendations}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
