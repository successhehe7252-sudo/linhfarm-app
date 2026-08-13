import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

describe("LinhFarm Supabase schema", () => {
  it("contains the required tables, seed data, RLS policies and order RPC", () => {
    for (const table of ["products", "orders", "order_items", "purchase_orders", "purchase_order_items", "store_settings"]) {
      expect(schema).toContain(`create table if not exists public.${table}`);
    }
    expect(schema).toContain("name text not null unique");
    expect(schema).toContain("create or replace function public.create_order_with_items");
    expect(schema).toContain("alter table public.products enable row level security");
    expect(schema).toContain("on conflict (name) do update");
    expect(schema).toContain("Dâu tây Giống Nhật");
    expect(schema).toContain("linhfarm-images");
    expect(schema).toContain("linhfarm_images_public_read");
    expect(schema).toContain("create policy linhfarm_images_public_upload");
  });
});
