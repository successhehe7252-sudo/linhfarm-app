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

export type SupabaseSupplier = {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  created_at?: string;
};

export type SupabasePurchaseOrder = {
  id: number;
  purchase_code: string;
  supplier_id?: number | null;
  supplier_name: string;
  total_amount: number;
  note?: string | null;
  status: string;
  received_at?: string;
  created_at?: string;
};

export const listProducts = async () => supabase.from("products").select("*").order("id", { ascending: true });
export const insertProduct = async (product: Omit<SupabaseProduct, "id">) => supabase.from("products").insert(product).select("*").single();
export const updateProduct = async (id: number, product: Partial<Omit<SupabaseProduct, "id">>) => supabase.from("products").update(product).eq("id", id).select("*").single();
export const deleteProduct = async (id: number) => supabase.from("products").delete().eq("id", id);
export const createOrder = async (paymentMethod: string, items: { product_id: number; quantity: number; unit: string }[]) => {
  const rpcRes = await supabase.rpc("create_order_with_items", { p_payment_method: paymentMethod, p_items: items });
  if (!rpcRes.error) {
    return rpcRes;
  }
  console.warn("[Supabase] create_order_with_items RPC unavailable or failed, executing client-side fallback:", rpcRes.error.message);

  let subtotal = 0;
  let estimatedProfit = 0;
  const orderCode = "LF-" + new Date().getDate().toString().padStart(2, "0") + (new Date().getMonth() + 1).toString().padStart(2, "0") + "-" + Math.floor(100 + Math.random() * 900);
  const orderItemsData: any[] = [];

  for (const item of items) {
    const { data: prod } = await supabase.from("products").select("*").eq("id", item.product_id).single();
    if (prod) {
      const price = Number(prod.selling_price || 0);
      const cost = Number(prod.cost_price || 0);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      estimatedProfit += (price - cost) * item.quantity;

      orderItemsData.push({
        product_id: item.product_id,
        product_name: prod.name,
        quantity: item.quantity,
        unit: item.unit || prod.unit,
        unit_price: price,
        unit_cost: cost,
        line_total: lineTotal
      });

      const newStock = Math.max(0, Number(prod.stock) - item.quantity);
      const newStatus = newStock <= 0 ? "Hết hàng" : newStock <= prod.min_stock ? "Cần bán gấp" : "Tươi mới";
      await supabase.from("products").update({
        stock: newStock,
        status: newStatus
      }).eq("id", item.product_id);
    }
  }

  const { data: order, error: orderErr } = await supabase.from("orders").insert({
    order_code: orderCode,
    payment_method: paymentMethod,
    subtotal: subtotal,
    total_amount: subtotal,
    estimated_profit: estimatedProfit,
    status: "completed"
  }).select("*").single();

  if (orderErr || !order) return { data: null, error: orderErr };

  const finalItems = orderItemsData.map(line => ({ ...line, order_id: order.id }));
  await supabase.from("order_items").insert(finalItems);

  try {
    const backupOrder = {
      id: order.id,
      order_code: orderCode,
      payment_method: paymentMethod,
      subtotal: subtotal,
      total_amount: subtotal,
      status: "completed",
      created_at: new Date().toISOString(),
      cashier: "Quản lý (Linh Trần)",
      order_items: finalItems
    };
    const stored = JSON.parse(localStorage.getItem("orders_history") || "[]");
    localStorage.setItem("orders_history", JSON.stringify([backupOrder, ...stored.filter((x: any) => x.id !== order.id && x.order_code !== orderCode)]));
  } catch (err) {
    console.warn("Failed to update orders_history in localStorage", err);
  }

  return { data: order, error: null };
};
export const listOrders = async () =>
  supabase
    .from("orders")
    .select("id, order_code, payment_method, subtotal, total_amount, estimated_profit, status, created_at, order_items(product_id, product_name, quantity, unit, unit_price, unit_cost, line_total)")
    .order("created_at", { ascending: false });

export const cancelOrder = async (orderId: number) => {
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, order_code, status, order_items(product_id, quantity)")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    return { data: null, error: fetchErr || new Error("Không tìm thấy đơn hàng") };
  }

  if (order.status === "cancelled" || order.status === "Đã hủy") {
    return { data: null, error: new Error("Đơn hàng này đã bị hủy trước đó") };
  }

  const { data: updatedOrder, error: updateErr } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .select()
    .single();

  if (updateErr) {
    return { data: null, error: updateErr };
  }

  if (order.order_items && order.order_items.length > 0) {
    for (const item of order.order_items) {
      if (!item.product_id || !item.quantity) continue;
      const { data: prod } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();
      if (prod) {
        const newStock = Math.round((Number(prod.stock || 0) + Number(item.quantity)) * 100) / 100;
        const newStatus = newStock === 0 ? "Hết hàng" : newStock < 5 ? "Cần bán gấp" : "Tươi mới";
        await supabase.from("products").update({ stock: newStock, status: newStatus }).eq("id", item.product_id);
      }
    }
  }

  return { data: updatedOrder, error: null };
};

export const listSuppliers = async () => supabase.from("suppliers").select("*").order("id", { ascending: true });
export const insertSupplier = async (supplier: Omit<SupabaseSupplier, "id">) => supabase.from("suppliers").insert(supplier).select("*").single();
export const getStoreSettings = async () => supabase.from("store_settings").select("*").eq("id", 1).single();
export const updateStoreSettings = async (settings: Record<string, any>) => supabase.from("store_settings").update(settings).eq("id", 1).select("*").single();
export const listPurchaseOrders = async () => supabase.from("purchase_orders").select("*, purchase_order_items(product_id, quantity, import_price, created_at)").order("created_at", { ascending: false });
export const createPurchaseOrder = async (
  supplierName: string,
  items: { productId: number; qty: number; unitCost: number }[],
  supplierId?: number | null,
  note?: string
) => {
  const rpcRes = await supabase.rpc("create_purchase_order_with_items", {
    p_supplier_name: supplierName,
    p_items: items,
    p_supplier_id: supplierId ?? null,
    p_note: note ?? "",
  });

  if (!rpcRes.error) {
    return rpcRes;
  }

  console.warn("[Supabase] create_purchase_order_with_items RPC unavailable or failed, executing client-side transaction:", rpcRes.error.message);

  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
  const code = "PO-" + new Date().getDate().toString().padStart(2, "0") + (new Date().getMonth() + 1).toString().padStart(2, "0") + "-" + Math.floor(100 + Math.random() * 900);

  const { data: po, error: poErr } = await supabase.from("purchase_orders").insert({
    purchase_code: code,
    supplier_id: supplierId ?? null,
    supplier_name: supplierName,
    total_amount: totalAmount,
    note: note ?? "",
    status: "received",
  }).select("*").single();

  if (poErr || !po) {
    return { data: null, error: poErr };
  }

  const lineItems = items.map(item => ({
    purchase_order_id: po.id,
    product_id: item.productId,
    quantity: item.qty,
    import_price: item.unitCost,
  }));
  await supabase.from("purchase_order_items").insert(lineItems);

  for (const item of items) {
    const { data: prod } = await supabase.from("products").select("*").eq("id", item.productId).single();
    if (prod) {
      const newStock = Number(prod.stock) + item.qty;
      const newStatus = newStock <= 0 ? "Hết hàng" : newStock <= prod.min_stock ? "Cần bán gấp" : "Tươi mới";
      await supabase.from("products").update({
        stock: newStock,
        cost_price: item.unitCost > 0 ? item.unitCost : prod.cost_price,
        status: newStatus,
      }).eq("id", item.productId);
    }
  }

  return { data: po, error: null };
};

export const PRODUCT_IMAGE_BUCKET = "linhfarm-images";
export const buildProductImagePath = (fileName: string, id = crypto.randomUUID()) => {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return `products/${id}-${safeName}`;
};
export const uploadProductImage = async (file: File) => {
  const path = buildProductImagePath(file.name);
  const upload = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { upsert: false, contentType: file.type || "image/*" });
  if (upload.error) return { data: null, error: upload.error };
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return { data: { path, publicUrl: data.publicUrl }, error: null };
};
export const removeProductImage = async (path: string | null | undefined) => path ? supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]) : { data: [], error: null };
export const storagePathFromPublicUrl = (url: string | null | undefined) => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
};
