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
    .default({}),
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

    const prompt = `You are a climate coach helping a ${data.profile} reduce their carbon footprint.

REGION: ${data.region || "unspecified"}
USER GOAL: ${data.goals || "reduce footprint meaningfully"}

ANNUAL EMISSIONS (kg CO2e):
- Transport: ${breakdown.transport}
- Home energy: ${breakdown.home}
- Diet: ${breakdown.diet}
- Shopping: ${breakdown.shopping}
- TOTAL: ${breakdown.total}

INPUT DETAILS:
${JSON.stringify(data, null, 2)}

Produce a friendly, specific action plan in markdown with:
1. **Snapshot** — 2 sentences comparing their total to the global average (~4,700 kg) and a sustainable target (~2,000 kg).
2. **Top 3 highest-impact changes** — each with the approx kg CO2e saved per year and a concrete first step.
3. **Quick wins this week** — 4-5 easy actions.
4. **How to stay on track** — 3 habits, tools, or metrics they can monitor monthly.

Be concrete, kind, and non-preachy. Skip generic filler.`;

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
