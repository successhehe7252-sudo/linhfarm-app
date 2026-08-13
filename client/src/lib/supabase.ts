import { createClient } from "@supabase/supabase-js";

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export type SupabaseProduct = {
  id: number;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  status: string;
  image_url: string | null;
  accent: string | null;
};

export const listProducts = async () => supabase.from("products").select("*").order("id", { ascending: true });
export const insertProduct = async (product: Omit<SupabaseProduct, "id">) => supabase.from("products").insert(product).select("*").single();
export const updateProduct = async (id: number, product: Partial<Omit<SupabaseProduct, "id">>) => supabase.from("products").update(product).eq("id", id).select("*").single();
export const deleteProduct = async (id: number) => supabase.from("products").delete().eq("id", id);
export const createOrder = async (paymentMethod: string, items: { product_id: number; quantity: number; unit: string }[]) => supabase.rpc("create_order_with_items", { p_payment_method: paymentMethod, p_items: items });
export const listOrders = async () => supabase.from("orders").select("id, order_code, payment_method, subtotal, total_amount, estimated_profit, status, created_at").eq("status", "completed").order("created_at", { ascending: false });
