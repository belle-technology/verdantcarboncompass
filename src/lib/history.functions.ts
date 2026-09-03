import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveSchema = z.object({
  total_kg: z.number(),
  transport_kg: z.number(),
  home_kg: z.number(),
  diet_kg: z.number(),
  shopping_kg: z.number(),
  inputs: z.unknown(),
  recommendations: z.string().optional().default(""),
});

export const saveEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("carbon_entries").insert({
      user_id: context.userId,
      total_kg: Math.round(data.total_kg),
      transport_kg: Math.round(data.transport_kg),
      home_kg: Math.round(data.home_kg),
      diet_kg: Math.round(data.diet_kg),
      shopping_kg: Math.round(data.shopping_kg),
      inputs: data.inputs as never,
      recommendations: data.recommendations,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("carbon_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("carbon_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
