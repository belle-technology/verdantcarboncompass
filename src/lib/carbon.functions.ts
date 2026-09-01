import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  profile: z.enum(["individual", "organization"]),
  name: z.string().max(60).optional().default(""),
  region: z.string().max(100).optional().default(""),
  transport: z.object({
    carKmPerWeek: z.number().min(0).max(10000),
    carType: z.enum(["gasoline", "diesel", "hybrid", "electric", "none"]),
    flightsShortHaulPerYear: z.number().min(0).max(500),
    flightsLongHaulPerYear: z.number().min(0).max(500),
    publicTransitKmPerWeek: z.number().min(0).max(10000),
  }),
  home: z.object({
    electricityKwhPerMonth: z.number().min(0).max(1000000),
    gridCleanliness: z.enum(["dirty", "average", "clean"]),
    naturalGasThermsPerMonth: z.number().min(0).max(100000),
    householdSize: z.number().min(1).max(1000),
    livingSituation: z
      .enum(["rented_apartment", "owned_apartment", "rented_house", "owned_house", "shared", "office"])
      .optional()
      .default("rented_apartment"),
    climate: z.enum(["cold", "temperate", "hot", "tropical"]).optional().default("temperate"),
  }),
  diet: z.object({
    type: z.enum(["vegan", "vegetarian", "pescatarian", "omnivore", "heavy_meat"]),
    foodWasteLevel: z.enum(["low", "medium", "high"]),
    cooksAtHome: z.enum(["rarely", "sometimes", "mostly"]).optional().default("sometimes"),
  }),
  shopping: z.object({
    monthlySpendUSD: z.number().min(0).max(1000000),
    fastFashionLevel: z.enum(["low", "medium", "high"]),
  }),
  personal: z
    .object({
      motivation: z
        .enum(["save_money", "health", "climate", "compliance", "curious"])
        .optional()
        .default("climate"),
      effortLevel: z.enum(["small_steps", "moderate", "all_in"]).optional().default("moderate"),
      budget: z.enum(["none", "low", "moderate", "flexible"]).optional().default("low"),
      constraints: z.string().max(300).optional().default(""),
      tone: z.enum(["warm", "coach", "data"]).optional().default("warm"),
    })
    .optional()
    .default(() => ({
      motivation: "climate" as const,
      effortLevel: "moderate" as const,
      budget: "low" as const,
      constraints: "",
      tone: "warm" as const,
    })),
  goals: z.string().max(500).optional().default(""),
});

export type CarbonInput = z.infer<typeof InputSchema>;

// Rough emission factors (kg CO2e)
const CAR_FACTORS = { gasoline: 0.192, diesel: 0.171, hybrid: 0.11, electric: 0.05, none: 0 };
const GRID_FACTORS = { dirty: 0.7, average: 0.4, clean: 0.15 }; // kg/kWh
const DIET_ANNUAL = { vegan: 1500, vegetarian: 1700, pescatarian: 1900, omnivore: 2500, heavy_meat: 3300 };
const WASTE_MULT = { low: 1, medium: 1.15, high: 1.35 };
const FASHION_MULT = { low: 0.3, medium: 0.5, high: 0.9 }; // kg per USD
const TRANSIT = 0.04; // kg/km bus/rail avg

function computeBreakdown(d: CarbonInput) {
  const weeksPerYear = 52;
  const car = d.transport.carKmPerWeek * weeksPerYear * CAR_FACTORS[d.transport.carType];
  const transit = d.transport.publicTransitKmPerWeek * weeksPerYear * TRANSIT;
  const flights = d.transport.flightsShortHaulPerYear * 250 + d.transport.flightsLongHaulPerYear * 1600;
  const transport = car + transit + flights;

  const electricity = d.home.electricityKwhPerMonth * 12 * GRID_FACTORS[d.home.gridCleanliness];
  const gas = d.home.naturalGasThermsPerMonth * 12 * 5.3;
  const homeTotal = (electricity + gas) / Math.max(1, d.home.householdSize);

  const diet = DIET_ANNUAL[d.diet.type] * WASTE_MULT[d.diet.foodWasteLevel];
  const shopping = d.shopping.monthlySpendUSD * 12 * FASHION_MULT[d.shopping.fastFashionLevel];

  const total = transport + homeTotal + diet + shopping;
  return {
    transport: Math.round(transport),
    home: Math.round(homeTotal),
    diet: Math.round(diet),
    shopping: Math.round(shopping),
    total: Math.round(total),
  };
}

export const analyzeCarbon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const breakdown = computeBreakdown(data);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const p = data.personal;
    const name = (data.name || "").trim();
    const largest = (["transport", "home", "diet", "shopping"] as const).reduce((a, b) =>
      breakdown[a] >= breakdown[b] ? a : b,
    );
    const toneGuide = {
      warm: "Warm, encouraging, first-name friendly. Celebrate what they already do well before suggesting changes.",
      coach: "Direct accountability-coach voice: crisp, motivating, target-driven, no fluff.",
      data: "Analytical and precise: lead with numbers, percentages, and payback periods; minimal emotional language.",
    }[p.tone];
    const effortGuide = {
      small_steps:
        "They only want small, low-friction steps. Never propose moving house, buying a vehicle, or major renovations.",
      moderate:
        "They accept moderate change: habit shifts, appliance swaps, some upfront spending if the payback is clear.",
      all_in:
        "They are ready for ambitious change, including big purchases, relocation of habits, and hard trade-offs.",
    }[p.effortLevel];
    const budgetGuide = {
      none: "Budget is zero — every recommendation must be free or immediately cash-positive.",
      low: "Budget is tight (under ~$100 upfront). Prioritise free and cheap actions; flag anything costlier as 'later'.",
      moderate: "Moderate budget (a few hundred dollars). Note payback time for anything paid.",
      flexible: "Budget is flexible — larger investments are fine if you justify cost per kg CO2e saved.",
    }[p.budget];

    const prompt = `You are Verdant, a personal climate coach writing DIRECTLY to ${name || `this ${data.profile}`}.

WHO THEY ARE
- Profile: ${data.profile}
- Name: ${name || "not given (address them as 'you', never invent a name)"}
- Location: ${data.region || "unspecified — avoid location-specific programs, incentives, or utilities you cannot verify"}
- Household / team size: ${data.home.householdSize}
- Living situation: ${data.home.livingSituation} (respect what a renter or shared household can actually change)
- Climate zone: ${data.home.climate}
- Cooks at home: ${data.diet.cooksAtHome}
- Main motivation: ${p.motivation}
- Their own goal: ${data.goals || "not stated"}
- Hard constraints they told us: ${p.constraints || "none stated"}

HOW TO WRITE
- Voice: ${toneGuide}
- Ambition level: ${effortGuide}
- Money: ${budgetGuide}
- Frame every benefit around their motivation (${p.motivation}) — e.g. money saved, health, climate impact, or reporting requirements.
- NEVER recommend anything that contradicts their hard constraints. If a high-impact lever is blocked, say so briefly and give the best alternative.
- Use "you"/"your". Use ${name ? `their name (${name}) once or twice, naturally` : "no name"}. No lectures, no guilt, no generic filler, no emoji spam.

THEIR ANNUAL EMISSIONS (kg CO2e)
- Transport: ${breakdown.transport}
- Home energy: ${breakdown.home}
- Diet: ${breakdown.diet}
- Shopping: ${breakdown.shopping}
- TOTAL: ${breakdown.total}
- Biggest single category: ${largest}

FULL INPUT DATA (use the actual numbers in your reasoning; recompute savings from them)
${JSON.stringify(data, null, 2)}

Write the plan in markdown, in this exact structure:

## Where you stand
2-3 sentences: compare their total to the global average (~4,700 kg/person) and a 1.5°C-aligned target (~2,000 kg/person), say clearly whether they're above or below, and name one thing they're already doing well (pick it from the real data).

## Your 3 biggest levers
Three items, ordered by kg CO₂e saved. Each one:
**<Action>** — ~X kg CO₂e/year (Y% of your total)
- Why it's your lever: reference their actual numbers.
- First step this week: one concrete, specific action.
- Cost / effort: honest note fitting their budget and ambition level.
Derive X from their inputs — never quote a generic figure, and never exceed what their own category totals allow.

## Quick wins this week
4-5 bullets, each free or near-free and doable given their living situation and constraints.

## Staying on track
Three monthly habits or metrics, each with a number to watch and a realistic target for the next 3, 6, and 12 months that adds up to their stated goal (or ~10-20%/year if they gave none).

## One thing to not worry about
Name a low-impact thing they can stop stressing about, with the tiny number that proves it.

Sanity-check: your recommended savings must be internally consistent with their category totals and must not double-count.`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        prompt,
      });
      return { breakdown, recommendations: text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { breakdown, recommendations: `_AI recommendations unavailable: ${msg}_` };
    }
  });
