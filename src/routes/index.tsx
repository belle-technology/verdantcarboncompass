import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { analyzeCarbon, type CarbonInput } from "@/lib/carbon.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, Sparkles, TrendingDown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdant — AI Carbon Coach for Individuals & Organizations" },
      {
        name: "description",
        content:
          "Calculate your annual carbon footprint and get an AI-generated plan with the highest-impact actions to cut emissions and stay on track.",
      },
      { property: "og:title", content: "Verdant — AI Carbon Coach" },
      {
        property: "og:description",
        content: "Personalized carbon calculator + AI recommendations to reduce your emissions.",
      },
    ],
  }),
  component: Index,
});

const initial: CarbonInput = {
  profile: "individual",
  region: "",
  transport: {
    carKmPerWeek: 150,
    carType: "gasoline",
    flightsShortHaulPerYear: 2,
    flightsLongHaulPerYear: 1,
    publicTransitKmPerWeek: 20,
  },
  home: {
    electricityKwhPerMonth: 300,
    gridCleanliness: "average",
    naturalGasThermsPerMonth: 20,
    householdSize: 2,
  },
  diet: { type: "omnivore", foodWasteLevel: "medium" },
  shopping: { monthlySpendUSD: 200, fastFashionLevel: "medium" },
  goals: "",
};

function Index() {
  const analyze = useServerFn(analyzeCarbon);
  const [data, setData] = useState<CarbonInput>(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeCarbon>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof CarbonInput>(k: K, v: CarbonInput[K]) =>
    setData((d) => ({ ...d, [k]: v }));
  const updateNested = <K extends keyof CarbonInput, N extends keyof CarbonInput[K]>(
    k: K,
    n: N,
    v: CarbonInput[K][N],
  ) => setData((d) => ({ ...d, [k]: { ...(d[k] as object), [n]: v } as CarbonInput[K] }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyze({ data });
      setResult(r);
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header
        className="border-b border-border/50"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur">
            <Leaf className="h-3.5 w-3.5" /> AI Carbon Coach
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-tight text-foreground">
            Measure your footprint.
            <br />
            <span style={{ color: "var(--leaf)" }}>Shrink it with intent.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground/70">
            Answer a few questions about how you travel, eat, and power your life. Verdant estimates
            your annual CO₂e and drafts a personalized reduction plan — powered by AI.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2" style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader>
              <CardTitle>Who are we calculating for?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Profile</Label>
                <Select value={data.profile} onValueChange={(v) => update("profile", v as CarbonInput["profile"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Region (optional)</Label>
                <Input value={data.region} onChange={(e) => update("region", e.target.value)} placeholder="e.g. Nairobi, Kenya" maxLength={100} />
              </div>
              <div className="grid gap-2">
                <Label>Household / team size</Label>
                <Input type="number" min={1} value={data.home.householdSize}
                  onChange={(e) => updateNested("home", "householdSize", Math.max(1, +e.target.value || 1))} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader><CardTitle>🚗 Transport</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Car type</Label>
                <Select value={data.transport.carType} onValueChange={(v) => updateNested("transport", "carType", v as CarbonInput["transport"]["carType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No car</SelectItem>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Car km / week</Label>
                <Input type="number" min={0} value={data.transport.carKmPerWeek}
                  onChange={(e) => updateNested("transport", "carKmPerWeek", +e.target.value || 0)} />
              </div>
              <div className="grid gap-2">
                <Label>Public transit km / week</Label>
                <Input type="number" min={0} value={data.transport.publicTransitKmPerWeek}
                  onChange={(e) => updateNested("transport", "publicTransitKmPerWeek", +e.target.value || 0)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Short flights / yr</Label>
                  <Input type="number" min={0} value={data.transport.flightsShortHaulPerYear}
                    onChange={(e) => updateNested("transport", "flightsShortHaulPerYear", +e.target.value || 0)} />
                </div>
                <div className="grid gap-2">
                  <Label>Long flights / yr</Label>
                  <Input type="number" min={0} value={data.transport.flightsLongHaulPerYear}
                    onChange={(e) => updateNested("transport", "flightsLongHaulPerYear", +e.target.value || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader><CardTitle>🏠 Home energy</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Electricity (kWh / month)</Label>
                <Input type="number" min={0} value={data.home.electricityKwhPerMonth}
                  onChange={(e) => updateNested("home", "electricityKwhPerMonth", +e.target.value || 0)} />
              </div>
              <div className="grid gap-2">
                <Label>Grid cleanliness</Label>
                <Select value={data.home.gridCleanliness} onValueChange={(v) => updateNested("home", "gridCleanliness", v as CarbonInput["home"]["gridCleanliness"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean (mostly renewables)</SelectItem>
                    <SelectItem value="average">Average mix</SelectItem>
                    <SelectItem value="dirty">Coal / heavy fossil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Natural gas (therms / month)</Label>
                <Input type="number" min={0} value={data.home.naturalGasThermsPerMonth}
                  onChange={(e) => updateNested("home", "naturalGasThermsPerMonth", +e.target.value || 0)} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader><CardTitle>🥗 Diet</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Diet type</Label>
                <Select value={data.diet.type} onValueChange={(v) => updateNested("diet", "type", v as CarbonInput["diet"]["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                    <SelectItem value="omnivore">Omnivore</SelectItem>
                    <SelectItem value="heavy_meat">Heavy meat eater</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Food waste level</Label>
                <Select value={data.diet.foodWasteLevel} onValueChange={(v) => updateNested("diet", "foodWasteLevel", v as CarbonInput["diet"]["foodWasteLevel"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader><CardTitle>🛍️ Shopping</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Non-essential spend (USD / month)</Label>
                <Input type="number" min={0} value={data.shopping.monthlySpendUSD}
                  onChange={(e) => updateNested("shopping", "monthlySpendUSD", +e.target.value || 0)} />
              </div>
              <div className="grid gap-2">
                <Label>Fast fashion habits</Label>
                <Select value={data.shopping.fastFashionLevel} onValueChange={(v) => updateNested("shopping", "fastFashionLevel", v as CarbonInput["shopping"]["fastFashionLevel"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Mostly secondhand / durable</SelectItem>
                    <SelectItem value="medium">Mixed</SelectItem>
                    <SelectItem value="high">Frequent fast fashion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2" style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader><CardTitle>🎯 Your goals (optional)</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. Cut my footprint by 25% this year without giving up travel to see family."
                value={data.goals}
                maxLength={500}
                onChange={(e) => update("goals", e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="md:col-span-2 flex justify-center">
            <Button type="submit" size="lg" disabled={loading} className="gap-2 px-8" style={{ boxShadow: "var(--shadow-glow)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analyzing your footprint…" : "Calculate & get AI plan"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-8 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <section id="result" className="mt-16 grid gap-6">
            <Card style={{ boxShadow: "var(--shadow-soft)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" style={{ color: "var(--leaf)" }} />
                  Your estimated annual footprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 text-center">
                  <div className="text-6xl font-bold" style={{ color: "var(--leaf)" }}>
                    {result.breakdown.total.toLocaleString()}
                  </div>
                  <div className="text-sm uppercase tracking-widest text-muted-foreground">
                    kg CO₂e / year
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(["transport", "home", "diet", "shopping"] as const).map((k) => {
                    const v = result.breakdown[k];
                    const pct = Math.round((v / Math.max(1, result.breakdown.total)) * 100);
                    return (
                      <div key={k} className="rounded-lg bg-muted p-4">
                        <div className="text-xs uppercase text-muted-foreground">{k}</div>
                        <div className="mt-1 text-2xl font-semibold">{v.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{pct}% of total</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card style={{ boxShadow: "var(--shadow-soft)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" style={{ color: "var(--leaf)" }} />
                  Your personalized action plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80">
                  <ReactMarkdown>{result.recommendations}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        Estimates use standard emission factors. Real footprints vary — treat this as a guide, not gospel.
      </footer>
    </div>
  );
}
