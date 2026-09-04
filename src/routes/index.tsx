import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import ReactMarkdown from "react-markdown";
import { analyzeCarbon, type CarbonInput } from "@/lib/carbon.functions";
import { saveEntry } from "@/lib/history.functions";
import { useAuth } from "@/lib/useAuth";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Leaf,
  Sparkles,
  TrendingDown,
  Loader2,
  Car,
  Home,
  Salad,
  ShoppingBag,
  Target,
  HeartHandshake,
} from "lucide-react";

const CarbonScene = lazy(() => import("@/components/CarbonScene"));

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
  name: "",
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
    livingSituation: "rented_apartment",
    climate: "temperate",
  },
  diet: { type: "omnivore", foodWasteLevel: "medium", cooksAtHome: "sometimes" },
  shopping: { monthlySpendUSD: 200, fastFashionLevel: "medium" },
  personal: {
    motivation: "climate",
    effortLevel: "moderate",
    budget: "low",
    constraints: "",
    tone: "warm",
  },
  goals: "",
};

function SectionCard({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={`glass grain rise-in relative overflow-hidden border-border/60 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-2xl"
        style={{ background: "var(--gradient-leaf)" }}
      />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl font-normal">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Icon className="h-4.5 w-4.5" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative grid gap-4">{children}</CardContent>
    </Card>
  );
}

function Index() {
  const analyze = useServerFn(analyzeCarbon);
  const [data, setData] = useState<CarbonInput>(initial);
  const firstName = (data.name ?? "").trim().split(" ")[0] ?? "";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeCarbon>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof CarbonInput>(k: K, v: CarbonInput[K]) =>
    setData((d) => ({ ...d, [k]: v }));
  const updateNested = <K extends keyof CarbonInput, N extends keyof CarbonInput[K]>(
    k: K,
    n: N,
    v: CarbonInput[K][N],
  ) =>
    setData(
      (d) => ({ ...d, [k]: { ...(d[k] as Record<string, unknown>), [n]: v } }) as CarbonInput,
    );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyze({ data });
      setResult(r);
      setTimeout(
        () => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <header className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0">
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <CarbonScene />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-36">
          <div className="rise-in inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-primary backdrop-blur">
            <Leaf className="h-3.5 w-3.5" /> AI Carbon Coach
          </div>
          <h1 className="rise-in mt-8 max-w-3xl text-6xl leading-[0.95] md:text-8xl">
            Measure your footprint.
            <br />
            <span className="leaf-text italic">Shrink it with intent.</span>
          </h1>
          <p className="rise-in mt-8 max-w-xl text-lg leading-relaxed text-foreground/70">
            Answer a few questions about how you travel, eat, and power your life. Verdant estimates
            your annual CO₂e and drafts a personalized reduction plan — powered by AI.
          </p>
          <div className="mt-10 flex flex-wrap gap-8 text-sm text-foreground/60">
            {[
              ["4", "lifestyle domains"],
              ["1", "AI-written plan"],
              ["∞", "tracking habits"],
            ].map(([n, l]) => (
              <div key={l} className="float-slow">
                <div className="gold-text font-display text-4xl">{n}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* BENTO FORM */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-6">
          <SectionCard
            icon={Target}
            title={firstName ? `Nice to meet you, ${firstName}` : "Let's start with you"}
            className="md:col-span-6"
          >
            <p className="-mt-2 text-sm text-muted-foreground">
              No account, no judgement — rough answers are fine. Everything here just helps the plan
              fit your real life.
            </p>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label>What should we call you?</Label>
                <Input
                  value={data.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Zahra"
                  maxLength={60}
                />
              </div>
              <div className="grid gap-2">
                <Label>Profile</Label>
                <Select
                  value={data.profile}
                  onValueChange={(v) => update("profile", v as CarbonInput["profile"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Where do you live?</Label>
                <Input
                  value={data.region}
                  onChange={(e) => update("region", e.target.value)}
                  placeholder="e.g. Nairobi, Kenya"
                  maxLength={100}
                />
              </div>
              <div className="grid gap-2">
                <Label>Household / team size</Label>
                <Input
                  type="number"
                  min={1}
                  value={data.home.householdSize}
                  onChange={(e) =>
                    updateNested("home", "householdSize", Math.max(1, +e.target.value || 1))
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={HeartHandshake} title="What matters to you" className="md:col-span-6">
            <p className="-mt-2 text-sm text-muted-foreground">
              This is what makes your plan yours — we'll only suggest things that fit your budget,
              your energy, and your limits.
            </p>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label>Why are you here?</Label>
                <Select
                  value={data.personal.motivation}
                  onValueChange={(v) =>
                    updateNested(
                      "personal",
                      "motivation",
                      v as CarbonInput["personal"]["motivation"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="save_money">Save money</SelectItem>
                    <SelectItem value="health">Health & wellbeing</SelectItem>
                    <SelectItem value="climate">Care about the climate</SelectItem>
                    <SelectItem value="compliance">Reporting / compliance</SelectItem>
                    <SelectItem value="curious">Just curious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>How much change feels right?</Label>
                <Select
                  value={data.personal.effortLevel}
                  onValueChange={(v) =>
                    updateNested(
                      "personal",
                      "effortLevel",
                      v as CarbonInput["personal"]["effortLevel"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small_steps">Small steps only</SelectItem>
                    <SelectItem value="moderate">Open to real changes</SelectItem>
                    <SelectItem value="all_in">All in — challenge me</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Budget for changes</Label>
                <Select
                  value={data.personal.budget}
                  onValueChange={(v) =>
                    updateNested("personal", "budget", v as CarbonInput["personal"]["budget"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Free only</SelectItem>
                    <SelectItem value="low">Under $100</SelectItem>
                    <SelectItem value="moderate">A few hundred</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>How should we talk to you?</Label>
                <Select
                  value={data.personal.tone}
                  onValueChange={(v) =>
                    updateNested("personal", "tone", v as CarbonInput["personal"]["tone"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Warm & encouraging</SelectItem>
                    <SelectItem value="coach">Direct coach</SelectItem>
                    <SelectItem value="data">Just the numbers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Anything that's off the table?</Label>
              <Textarea
                placeholder="e.g. I can't give up my car — no transit where I live. I rent, so no solar or new appliances."
                value={data.personal.constraints}
                maxLength={300}
                onChange={(e) => updateNested("personal", "constraints", e.target.value)}
                className="min-h-20 resize-none bg-background/30"
              />
            </div>
          </SectionCard>

          <SectionCard icon={Car} title="Transport" className="md:col-span-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Car type</Label>
                <Select
                  value={data.transport.carType}
                  onValueChange={(v) =>
                    updateNested("transport", "carType", v as CarbonInput["transport"]["carType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  type="number"
                  min={0}
                  value={data.transport.carKmPerWeek}
                  onChange={(e) => updateNested("transport", "carKmPerWeek", +e.target.value || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Public transit km / week</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.transport.publicTransitKmPerWeek}
                  onChange={(e) =>
                    updateNested("transport", "publicTransitKmPerWeek", +e.target.value || 0)
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Short flights / yr</Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.transport.flightsShortHaulPerYear}
                    onChange={(e) =>
                      updateNested("transport", "flightsShortHaulPerYear", +e.target.value || 0)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Long flights / yr</Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.transport.flightsLongHaulPerYear}
                    onChange={(e) =>
                      updateNested("transport", "flightsLongHaulPerYear", +e.target.value || 0)
                    }
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Home} title="Home energy" className="md:col-span-2">
            <div className="grid gap-2">
              <Label>Electricity (kWh / month)</Label>
              <Input
                type="number"
                min={0}
                value={data.home.electricityKwhPerMonth}
                onChange={(e) => updateNested("home", "electricityKwhPerMonth", +e.target.value || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Grid cleanliness</Label>
              <Select
                value={data.home.gridCleanliness}
                onValueChange={(v) =>
                  updateNested("home", "gridCleanliness", v as CarbonInput["home"]["gridCleanliness"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean (mostly renewables)</SelectItem>
                  <SelectItem value="average">Average mix</SelectItem>
                  <SelectItem value="dirty">Coal / heavy fossil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Natural gas (therms / month)</Label>
              <Input
                type="number"
                min={0}
                value={data.home.naturalGasThermsPerMonth}
                onChange={(e) =>
                  updateNested("home", "naturalGasThermsPerMonth", +e.target.value || 0)
                }
              />
            </div>
          </SectionCard>

          <SectionCard icon={Salad} title="Diet" className="md:col-span-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Diet type</Label>
                <Select
                  value={data.diet.type}
                  onValueChange={(v) =>
                    updateNested("diet", "type", v as CarbonInput["diet"]["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select
                  value={data.diet.foodWasteLevel}
                  onValueChange={(v) =>
                    updateNested("diet", "foodWasteLevel", v as CarbonInput["diet"]["foodWasteLevel"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={ShoppingBag} title="Shopping" className="md:col-span-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Non-essential spend (USD / month)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.shopping.monthlySpendUSD}
                  onChange={(e) =>
                    updateNested("shopping", "monthlySpendUSD", +e.target.value || 0)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Fast fashion habits</Label>
                <Select
                  value={data.shopping.fastFashionLevel}
                  onValueChange={(v) =>
                    updateNested(
                      "shopping",
                      "fastFashionLevel",
                      v as CarbonInput["shopping"]["fastFashionLevel"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Mostly secondhand / durable</SelectItem>
                    <SelectItem value="medium">Mixed</SelectItem>
                    <SelectItem value="high">Frequent fast fashion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Sparkles} title="Your goals (optional)" className="md:col-span-6">
            <Textarea
              placeholder="e.g. Cut my footprint by 25% this year without giving up travel to see family."
              value={data.goals}
              maxLength={500}
              onChange={(e) => update("goals", e.target.value)}
              className="min-h-24 resize-none bg-background/30"
            />
          </SectionCard>

          <div className="md:col-span-6 flex justify-center pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="group gap-2 rounded-full px-10 py-6 text-base font-medium"
              style={{ background: "var(--gradient-leaf)", boxShadow: "var(--shadow-glow)" }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              )}
              {loading ? "Analyzing your footprint…" : "Calculate & get AI plan"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <section id="result" className="mt-20 grid gap-5 md:grid-cols-6">
            <Card
              className="glass grain rise-in relative overflow-hidden md:col-span-6"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div
                className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
                style={{ background: "var(--gradient-leaf)" }}
              />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-xl font-normal">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Your estimated annual footprint
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-10 text-center">
                  <div className="leaf-text font-display text-7xl md:text-8xl">
                    {result.breakdown.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    kg CO₂e / year
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {(["transport", "home", "diet", "shopping"] as const).map((k) => {
                    const v = result.breakdown[k];
                    const pct = Math.round((v / Math.max(1, result.breakdown.total)) * 100);
                    return (
                      <div
                        key={k}
                        className="rounded-2xl border border-border/60 bg-background/30 p-5 transition-transform hover:-translate-y-1"
                      >
                        <div className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                          {k}
                        </div>
                        <div className="mt-2 font-display text-3xl">{v.toLocaleString()}</div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: "var(--gradient-gold)" }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{pct}% of total</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass grain rise-in md:col-span-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-normal">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Your personalized action plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-primary prose-li:text-foreground/80">
                  <ReactMarkdown>{result.recommendations}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60 py-10 text-center text-xs tracking-wide text-muted-foreground">
        Estimates use standard emission factors. Real footprints vary — treat this as a guide, not
        gospel.
      </footer>
    </div>
  );
}
