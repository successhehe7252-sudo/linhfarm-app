import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
/* Vườn Sáng: mobile-first editorial rhythm, leaf-green actions, warm paper surfaces, and tactile operational feedback. */
import { useAuth } from "@/contexts/AuthContext";
import { getMenuDirection, type MenuDirection } from "@/lib/menu-position";
import { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";
import { OrderHistoryModal } from "@/components/OrderHistoryModal";
import { buildVietQrUrl } from "@/lib/vietqr";
import { SettingsPage, SettingsModal, type StoreSettingsData } from "./Settings";
import { SidebarNavigation, MobileNavigation, NAV_ITEMS } from "@/components/Navigation";
import { cancelOrder, createOrder, createPurchaseOrder, deleteProduct as deleteSupabaseProduct, getStoreSettings, insertProduct, insertSupplier, listOrders, listProducts, listPurchaseOrders, listSuppliers, removeProductImage, storagePathFromPublicUrl, updateProduct, uploadProductImage, updateStoreSettings, type SupabasePurchaseOrder, type SupabaseSupplier } from "@/lib/supabase";
import {
  AlertTriangle, ArrowDownToLine, ArrowUpRight, BarChart3, Bell, Boxes, Check, ChevronDown,
  CircleDollarSign, ClipboardList, Copy, CreditCard, FileText, History, LayoutGrid, Leaf, List,
  Lock, Menu, Minus, MoreHorizontal, PackagePlus, Plus, Printer, Receipt, RotateCcw, ScanLine, Search, Settings,
  ShoppingBasket, ShoppingCart, Sparkles, Store, Trash2, TrendingUp, Truck,
  WalletCards, X, XCircle
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const assets = {
  logo: "/logo.webp",
  strawberry: "/manus-storage/linhfarm-strawberry_2d520d42.jpg",
  tomato: "/manus-storage/linhfarm-cherry-tomato_b162fddc.jpg",
  cabbage: "/manus-storage/linhfarm-cabbage_84c4bca3.jpg",
  potato: "/manus-storage/linhfarm-sweet-potato_7970a415.jpg",
};

type Product = { id: number; name: string; category: string; price: number; cost: number; stock: number; unit: string; status: string; image: string; accent: string };
type CartItem = Product & { qty: number; selectedUnit: string };

const revenueData: { day: string; value: number }[] = [];
const orders: any[] = [];
const formatMoney = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
const formatShortDate = (dateString?: string | Date | null) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.getMonth() + 1;
  return `${day}/${month}`;
};
const toUiProduct = (row: any): Product => ({ id: Number(row.id), name: row.name, category: row.category, price: Number(row.selling_price), cost: Number(row.cost_price), stock: Number(row.stock), unit: row.unit, status: row.status, image: row.image_url || "/logo.webp", accent: row.accent || "#E6F3E9" });

function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "Chọn...",
  className = ""
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`w-full h-11 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 shadow-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-xl p-1 z-[9999] max-h-60">
        {options.map(opt => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer transition-colors"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "orange" | "red" | "slate" }) {
  const cls = { green: "badge-green", orange: "badge-orange", red: "badge-red", slate: "badge-slate" }[tone];
  return <span className={`badge ${cls}`}>{children}</span>;
}

function StatCard({ label, value, detail, icon: Icon, trend, accent }: any) {
  return <div className={`stat-card ${accent || ""}`}><div className="stat-top"><span className="eyebrow">{label}</span><span className="icon-disc"><Icon size={17} /></span></div><strong>{value}</strong><div className="stat-detail"><span className="trend"><ArrowUpRight size={13} /> {trend}</span> {detail}</div></div>;
}



const getInitialTab = () => {
  if (typeof window === "undefined") return "pos";
  const params = new URLSearchParams(window.location.search);
  const urlTab = params.get("tab");
  const validTabs = ["pos", "products", "suppliers", "dashboard", "settings"];
  const aliasMap: Record<string, string> = {
    inventory: "products",
    kho: "products",
    import: "suppliers",
    nhap: "suppliers",
    reports: "dashboard",
    baocao: "dashboard",
    caidat: "settings",
  };

  if (urlTab) {
    const normalized = aliasMap[urlTab.toLowerCase()] || urlTab.toLowerCase();
    if (validTabs.includes(normalized)) {
      return normalized;
    }
  }

  const stored = localStorage.getItem("linhfarm_active_tab");
  if (stored && validTabs.includes(stored)) {
    return stored;
  }

  return "pos";
};

function CartItemQtyInput({
  item,
  productStock,
  onChangeQty,
  onChangeUnit
}: {
  item: CartItem;
  productStock: number;
  onChangeQty: (newQty: number) => void;
  onChangeUnit: (newUnit: string) => void;
}) {
  const [inputText, setInputText] = useState<string>(String(item.qty));

  useEffect(() => {
    const currentNum = parseFloat(inputText.replace(",", "."));
    if (isNaN(currentNum) || Math.abs(currentNum - item.qty) > 0.001) {
      setInputText(String(item.qty));
    }
  }, [item.qty]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(",", ".");
    if (!/^[0-9]*\.?[0-9]*$/.test(raw)) {
      return;
    }
    setInputText(raw);

    if (raw !== "" && raw !== ".") {
      let num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        if (num > productStock) {
          num = productStock;
          setInputText(String(productStock));
          toast.warning(`Số lượng vượt quá tồn kho hiện có (Tối đa: ${productStock} ${item.selectedUnit})`);
        }
        const rounded = Math.round(num * 100) / 100;
        onChangeQty(rounded);
      }
    }
  };

  const handleBlur = () => {
    let raw = inputText.replace(",", ".").trim();
    let num = parseFloat(raw);
    if (isNaN(num) || num <= 0) {
      num = ["Kg", "Gram"].includes(item.selectedUnit) ? 0.1 : 1;
    }
    if (num > productStock) {
      num = productStock;
      toast.warning(`Số lượng vượt quá tồn kho hiện có (Tối đa: ${productStock} ${item.selectedUnit})`);
    }
    const finalVal = Math.round(num * 100) / 100;
    setInputText(String(finalVal));
    onChangeQty(finalVal);
  };

  const handleStep = (diff: number) => {
    const step = ["Kg", "Gram"].includes(item.selectedUnit) ? 0.5 : 1;
    let nextVal = item.qty + (diff > 0 ? step : -step);
    nextVal = Math.round(nextVal * 100) / 100;
    if (nextVal < 0.1) nextVal = 0.1;
    if (nextVal > productStock) {
      nextVal = productStock;
      toast.warning(`Số lượng vượt quá tồn kho hiện có (Tối đa: ${productStock} ${item.selectedUnit})`);
    }
    setInputText(String(nextVal));
    onChangeQty(nextVal);
  };

  return (
    <div className="qty flex items-center gap-1 mt-2">
      <button
        type="button"
        onClick={() => handleStep(-1)}
        className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 cursor-pointer shrink-0"
        title="Giảm số lượng"
      >
        <Minus size={12} />
      </button>

      <input
        type="text"
        inputMode="decimal"
        value={inputText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className="w-16 h-5 text-center border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-slate-50/50"
      />

      <button
        type="button"
        onClick={() => handleStep(1)}
        disabled={item.qty >= productStock}
        className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        title="Tăng số lượng"
      >
        <Plus size={12} />
      </button>

      <select
        value={item.selectedUnit}
        onChange={e => onChangeUnit(e.target.value)}
        className="h-5 border-0 bg-slate-100 rounded px-1 text-[10px] text-slate-600 font-medium ml-0.5 focus:outline-none cursor-pointer"
      >
        <option>Kg</option>
        <option>Gram</option>
        <option>Hộp</option>
        <option>Túi</option>
        <option>Khay</option>
        <option>Giỏ</option>
      </select>
    </div>
  );
}

export default function Home() {
  const { user, signOut, role, roleLabel, isOwner, isStaff, fullName } = useAuth();

  const userInitials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "LT";

  const [active, setActive] = useState<string>(() => {
    const initial = getInitialTab();
    if (isStaff && (initial === "suppliers" || initial === "dashboard" || initial === "settings")) {
      return "pos";
    }
    return initial;
  });

  const handleTabChange = (nextTab: string) => {
    if (isStaff && (nextTab === "suppliers" || nextTab === "dashboard" || nextTab === "settings")) {
      toast.error("Bạn cần quyền Quản lý để truy cập mục này");
      return;
    }
    setActive(nextTab);
    try {
      localStorage.setItem("linhfarm_active_tab", nextTab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", nextTab);
      window.history.replaceState({}, "", url.toString());
    } catch (err) {
      console.warn("Failed to update tab URL or localStorage", err);
    }
  };

  useEffect(() => {
    if (isStaff && (active === "suppliers" || active === "dashboard" || active === "settings")) {
      toast.error("Bạn cần quyền Quản lý để truy cập mục này");
      setActive("pos");
    }
  }, [isStaff, active]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const validTabs = ["pos", "products", "suppliers", "dashboard", "settings"];
      if (urlTab && validTabs.includes(urlTab)) {
        setActive(urlTab);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [productModal, setProductModal] = useState<{ mode: "add" | "edit"; product?: Product } | null>(null);
  const [productMenu, setProductMenu] = useState<number | null>(null);
  const [headerPanel, setHeaderPanel] = useState<"notifications" | "profile" | null>(null);
  const [supplierModal, setSupplierModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState<"shop" | "invoice" | "payment" | null>(null);
  const [ordersModal, setOrdersModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreSettingsData>({
    address: "158/22/36 đường Nguyễn Việt Hồng, P. Ninh Kiều, TP. Cần Thơ",
    phone: "0907 697 036",
    bank_bin: "970422",
    bank_short_name: "MBBank",
    bank_name: "Ngân hàng TMCP Quân đội",
    bank_account: "3633366568686",
    account_name: "LINH FARM",
    fanpageUrl: "https://www.facebook.com/traicaymientayngonre/",
    bank: "MBBank",
    account: "3633366568686",
    accountName: "LINH FARM"
  });
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    try {
      const saved = localStorage.getItem("linhfarm_pos_view_mode");
      return saved === "grid" || saved === "list" ? saved : "list";
    } catch {
      return "list";
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("Chuyển khoản");
  const [showBill, setShowBill] = useState(false);
  const [period, setPeriod] = useState("7 ngày qua");
  const [suppliers, setSuppliers] = useState<SupabaseSupplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<SupabasePurchaseOrder[]>([]);
  const [newSupplierModal, setNewSupplierModal] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProducts().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) {
        setProducts(data.map(toUiProduct));
        setSupabaseReady(true);
      } else {
        setProducts([]);
      }
    });
    listSuppliers().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) setSuppliers(data);
      else setSuppliers([]);
    });
    listPurchaseOrders().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) setPurchaseOrders(data);
      else setPurchaseOrders([]);
    });
    getStoreSettings().then(({ data }) => {
      if (cancelled) return;
      const loaded: StoreSettingsData = {
        address: data?.address || "158/22/36 đường Nguyễn Việt Hồng, P. Ninh Kiều, TP. Cần Thơ",
        phone: data?.phone || "0907 697 036",
        bank_bin: data?.bank_bin || "970422",
        bank_short_name: data?.bank_short_name || data?.bank_name || "MBBank",
        bank_name: data?.bank_name || "Ngân hàng TMCP Quân đội",
        bank_account: data?.bank_account || data?.account_number || "3633366568686",
        account_name: data?.account_name || "LINH FARM",
        fanpageUrl: data?.fanpage_url || "https://www.facebook.com/traicaymientayngonre/",
        bank: data?.bank_short_name || data?.bank_name || "MBBank",
        account: data?.bank_account || data?.account_number || "3633366568686",
        accountName: data?.account_name || "LINH FARM"
      };
      try {
        const local = localStorage.getItem("linhfarm_store_settings");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.bank_bin) loaded.bank_bin = parsed.bank_bin;
          if (parsed.bank_short_name) {
            loaded.bank_short_name = parsed.bank_short_name;
            loaded.bank = parsed.bank_short_name;
          }
          if (parsed.bank_name) loaded.bank_name = parsed.bank_name;
          if (parsed.bank_account) {
            loaded.bank_account = parsed.bank_account;
            loaded.account = parsed.bank_account;
          }
          if (parsed.account_name) {
            loaded.account_name = parsed.account_name;
            loaded.accountName = parsed.account_name;
          }
        }
      } catch {}
      setStoreInfo(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSaveStoreSettings = async (next: StoreSettingsData) => {
    const updatedWithAliases: StoreSettingsData = {
      ...next,
      bank: next.bank_short_name || next.bank_name || "MBBank",
      account: next.bank_account,
      accountName: next.account_name
    };
    setStoreInfo(updatedWithAliases);
    try {
      localStorage.setItem("linhfarm_store_settings", JSON.stringify(updatedWithAliases));
    } catch (err) {
      console.warn("Failed to update localStorage", err);
    }

    const supabasePayload: Record<string, any> = {
      address: next.address,
      phone: next.phone,
      bank_bin: next.bank_bin,
      bank_short_name: next.bank_short_name,
      bank_name: next.bank_name,
      bank_account: next.bank_account,
      account_name: next.account_name,
      fanpage_url: next.fanpageUrl || ""
    };

    const { error } = await updateStoreSettings(supabasePayload);
    if (error && (error as any).code === "PGRST204") {
      await updateStoreSettings({
        address: next.address,
        phone: next.phone,
        bank_name: next.bank_name || next.bank_short_name,
        bank_account: next.bank_account,
        account_name: next.account_name,
        fanpage_url: next.fanpageUrl || ""
      });
    }

    setSettingsModal(null);
    toast.success("Đã lưu thông tin cài đặt ngân hàng VietQR!");
  };

  const handleAddSupplier = async (supplierData: { name: string; phone?: string; address?: string; note?: string }) => {
    const { data, error } = await insertSupplier(supplierData);
    if (error) {
      toast.error(`Không thể thêm nhà cung cấp: ${error.message}`);
      return null;
    }
    setSuppliers(curr => [...curr, data]);
    setNewSupplierModal(false);
    toast.success(`Đã thêm nhà cung cấp "${data.name}"`);
    return data;
  };

  const handleSavePurchaseOrder = async (
    supplierName: string,
    items: { productId: number; qty: number; unitCost: number }[],
    supplierId?: number | null,
    note?: string
  ) => {
    const { data, error } = await createPurchaseOrder(supplierName, items, supplierId, note);
    if (error) {
      toast.error(`Không thể tạo phiếu nhập: ${error.message}`);
      return;
    }
    const { data: updatedProducts } = await listProducts();
    if (updatedProducts?.length) {
      setProducts(updatedProducts.map(toUiProduct));
    }
    const { data: updatedPOs } = await listPurchaseOrders();
    if (updatedPOs?.length) {
      setPurchaseOrders(updatedPOs);
    }
    setSupplierModal(false);
    toast.success("Đã hoàn tất phiếu nhập & tự động cộng dồn tồn kho!");
  };

  const latestImportDates = useMemo(() => {
    const map: Record<number, string> = {};
    for (const po of purchaseOrders) {
      const poDate = po.created_at || po.received_at;
      const items = (po as any).purchase_order_items || (po as any).items || [];
      for (const item of items) {
        const pid = Number(item.product_id ?? item.productId);
        if (!pid) continue;
        const itemDate = item.created_at || poDate;
        if (!map[pid] && itemDate) {
          map[pid] = itemDate;
        }
      }
    }
    return map;
  }, [purchaseOrders]);

  const filtered = useMemo(() => {
    return products.filter(product => {
      const matchCategory =
        category === "all" ||
        category === "Tất cả" ||
        !category ||
        product.category?.toLowerCase() === category.toLowerCase();

      const matchSearch =
        !query ||
        product.name?.toLowerCase().includes(query.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, category, query]);
  const [billCart, setBillCart] = useState<CartItem[]>([]);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const addProduct = (p: Product) => {
    if (p.stock <= 0) {
      toast.error(`Sản phẩm "${p.name}" đã hết hàng trong kho!`);
      return;
    }
    setCart(c => {
      const found = c.find(x => x.id === p.id);
      if (found) {
        const step = ["Kg", "Gram"].includes(p.unit) ? 0.5 : 1;
        let newQty = +(found.qty + step).toFixed(2);
        if (newQty > p.stock) {
          newQty = p.stock;
          toast.warning(`Số lượng vượt quá tồn kho hiện có (Tối đa: ${p.stock} ${p.unit})`);
        }
        return c.map(x => x.id === p.id ? { ...x, qty: newQty } : x);
      }
      const initialQty = Math.min(p.stock, ["Kg", "Gram"].includes(p.unit) ? 0.5 : 1);
      return [...c, { ...p, qty: initialQty, selectedUnit: p.unit }];
    });
    toast.success(`${p.name} đã thêm vào giỏ`);
  };

  const changeQty = (id: number, diff: number) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    setCart(c => c.map(x => {
      if (x.id !== id) return x;
      const step = ["Kg", "Gram"].includes(x.selectedUnit) ? 0.1 : 1;
      const change = diff > 0 ? step : -step;
      let nextQty = +(x.qty + change).toFixed(2);
      if (nextQty > prod.stock) {
        nextQty = prod.stock;
        toast.warning(`Số lượng vượt quá tồn kho hiện có (Tối đa: ${prod.stock} ${x.selectedUnit})`);
      }
      return { ...x, qty: Math.max(0.1, nextQty) };
    }));
  };

  const handleInputQtyChange = (id: number, rawVal: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const cleanVal = rawVal.replace(",", ".");
    if (cleanVal === "") {
      setCart(c => c.map(x => x.id === id ? { ...x, qty: 0 } : x));
      return;
    }
    let parsed = parseFloat(cleanVal);
    if (isNaN(parsed)) return;
    if (parsed > prod.stock) {
      parsed = prod.stock;
      toast.warning(`Số lượng vượt quá tồn kho hiện có (Tối đa: ${prod.stock} ${prod.unit})`);
    }
    setCart(c => c.map(x => x.id === id ? { ...x, qty: +(parsed.toFixed(2)) } : x));
  };

  const handleInputQtyBlur = (id: number, rawVal: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    setCart(c => c.map(x => {
      if (x.id !== id) return x;
      let q = x.qty;
      if (isNaN(q) || q <= 0) q = 0.1;
      if (q > prod.stock) q = prod.stock;
      return { ...x, qty: +(q.toFixed(2)) };
    }));
  };

  const removeItem = (id: number) => setCart(c => c.filter(x => x.id !== id));
  const saveProduct = async (product: Product, imageFile?: File | null) => { let imageUrl = product.image; let newPath: string | null = null; if (imageFile) { const upload = await uploadProductImage(imageFile); if (upload.error || !upload.data) return toast.error(`Không thể upload ảnh: ${upload.error?.message || "Lỗi không xác định"}`); imageUrl = upload.data.publicUrl; newPath = upload.data.path; } const payload = { name: product.name, category: product.category, unit: product.unit, cost_price: product.cost, selling_price: product.price, stock: product.stock, min_stock: 5, status: product.status, image_url: imageUrl, accent: product.accent }; const result = product.id === 0 ? await insertProduct(payload) : await updateProduct(product.id, payload); if (result.error) { if (newPath) await removeProductImage(newPath); return toast.error(`Không thể lưu sản phẩm: ${result.error.message}`); } if (product.id !== 0 && imageFile) { const cleanup = await removeProductImage(storagePathFromPublicUrl(product.image)); if (cleanup.error) toast.error(`Đã lưu ảnh mới nhưng chưa xóa được ảnh cũ: ${cleanup.error.message}`); } const { data: freshProducts } = await listProducts(); if (freshProducts) setProducts(freshProducts.map(toUiProduct)); setProductModal(null); toast.success(product.id === 0 ? "Đã thêm sản phẩm vào Supabase" : "Đã cập nhật sản phẩm"); };
  const removeProduct = async (id: number) => { const product = products.find(item => item.id === id); const cleanup = await removeProductImage(storagePathFromPublicUrl(product?.image)); if (cleanup.error) return toast.error(`Chưa xóa sản phẩm vì không dọn được ảnh Storage: ${cleanup.error.message}`); const { error } = await deleteSupabaseProduct(id); if (error) return toast.error(`Không thể xóa sản phẩm: ${error.message}`); setProducts(items => items.filter(item => item.id !== id)); toast.success("Đã xóa sản phẩm và ảnh trên Storage"); };
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentOrderCode, setCurrentOrderCode] = useState("");

  const handleCheckoutClick = async () => {
    if (!cart.length) return;
    for (const item of cart) {
      const prod = products.find(p => p.id === item.id);
      if (prod && item.qty > prod.stock) {
        toast.warning(`Sản phẩm "${item.name}" vượt quá tồn kho (Tối đa: ${prod.stock} ${prod.unit})`);
        setCart(c => c.map(x => x.id === item.id ? { ...x, qty: prod.stock } : x));
        return;
      }
    }

    const newCode = "LF-" + new Date().getDate().toString().padStart(2, "0") + (new Date().getMonth() + 1).toString().padStart(2, "0") + "-" + Math.floor(100 + Math.random() * 900);
    setCurrentOrderCode(newCode);

    const result = await createOrder(payment, cart.map(item => ({ product_id: item.id, quantity: item.qty, unit: item.selectedUnit })));
    if (result.error) return toast.error(`Không thể tạo đơn: ${result.error.message}`);

    const { data: freshProducts } = await listProducts();
    if (freshProducts) setProducts(freshProducts.map(toUiProduct));

    setBillCart([...cart]);
    setCart([]);
    setShowQrModal(false);
    setShowBill(true);
    toast.success("Đã hoàn tất tạo đơn hàng & tự động trừ tồn kho!");
  };

  const navItems = [
    { id: "pos", label: "Bán hàng", short: "POS", icon: ShoppingBasket },
    { id: "products", label: "Kho hàng", short: "Kho", icon: Boxes },
    { id: "suppliers", label: "Nhập hàng", short: "Nhập", icon: Truck },
    { id: "dashboard", label: "Báo cáo", short: "Báo cáo", icon: BarChart3 },
    { id: "settings", label: "Cài đặt", short: "Cài đặt", icon: Settings },
  ];
  return <div className="app-shell flex h-screen w-screen overflow-hidden bg-slate-50">
    <SidebarNavigation activeTab={active} onTabChange={handleTabChange} />
    <main className="main-area flex-1 min-w-0 flex flex-col h-full overflow-hidden relative"><header className="topbar w-full max-w-full flex items-center justify-between p-3 md:p-4 bg-white/60 border-b border-slate-100 flex-shrink-0 gap-3"><div className="flex items-center gap-2 lg:hidden shrink-0"><img src={assets.logo} alt="LinhFarm" className="w-8 h-8 rounded-full object-cover border border-slate-200/80 shadow-xs" onError={e => { e.currentTarget.src = "/logo.webp"; }} /><span className="font-bold text-slate-800 text-sm">LinhFarm</span></div><div className="header-title min-w-0 flex-1"><span className="eyebrow text-[11px] md:text-xs text-emerald-700 font-medium flex items-center gap-1">🍃 THỨ TƯ, 13 THÁNG 8, 2026</span><h1 className="text-base md:text-lg lg:text-xl font-bold text-slate-800 truncate mt-0.5">{active === "pos" ? "Sáng nay bán gì tươi nhất?" : NAV_ITEMS.find(x => x.id === active)?.label}</h1></div><div className="top-actions flex items-center gap-2 flex-shrink-0"><div className="header-popover-wrap relative"><button type="button" className={`w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors relative cursor-pointer ${headerPanel === "notifications" ? "ring-2 ring-emerald-500/20 border-emerald-500" : ""}`} aria-label="Thông báo cửa hàng" onClick={() => setHeaderPanel(headerPanel === "notifications" ? null : "notifications")}><Bell size={18} /><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" /></button>{headerPanel === "notifications" && <NotificationPopover onClose={() => setHeaderPanel(null)} />}</div><div className="header-popover-wrap relative"><button type="button" className={`flex items-center gap-2 cursor-pointer p-0.5 pr-2 rounded-full hover:bg-slate-100/80 transition-all ${headerPanel === "profile" ? "bg-slate-100" : ""}`} onClick={() => setHeaderPanel(headerPanel === "profile" ? null : "profile")}><span className="w-9 h-9 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center shadow-sm flex-shrink-0">{userInitials}</span><span className="hidden xl:inline text-xs font-semibold text-slate-700">{fullName}</span><ChevronDown size={14} className="text-slate-400" /></button>{headerPanel === "profile" && <ProfileMenu user={user} onLogout={async () => { setHeaderPanel(null); await signOut(); }} />}</div></div></header>
      {active === "pos" && (
        <section className="workspace pos-workspace flex flex-col lg:flex-row gap-4 p-3 md:p-4 w-full min-h-screen lg:h-[calc(100vh-70px)] overflow-y-auto lg:overflow-hidden pb-28 lg:pb-4 flex-1">
          <div className="products-panel w-full lg:flex-1 flex flex-col gap-3 min-w-0">
            <div className="search-row flex items-center gap-2.5 mb-1 shrink-0">
              <button className="outline-button h-11 text-xs shrink-0"><ScanLine size={16} /> Quét mã</button>
              <div className="search-box flex-1 h-11 bg-white border border-emerald-100 rounded-xl px-3.5 flex items-center gap-2.5 shadow-sm text-slate-400 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full bg-transparent border-0 outline-none text-slate-700 text-xs font-medium placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setViewMode(v => {
                  const next = v === "grid" ? "list" : "grid";
                  try { localStorage.setItem("linhfarm_pos_view_mode", next); } catch (_) {}
                  return next;
                })}
                className="w-11 h-11 aspect-square rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                title={viewMode === "list" ? "Chuyển sang chế độ Lưới" : "Chuyển sang chế độ Danh sách"}
                aria-label={viewMode === "list" ? "Chuyển sang chế độ Lưới" : "Chuyển sang chế độ Danh sách"}
              >
                {viewMode === "list" ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
            </div>
            <div className="category-tabs flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-1 max-w-full shrink-0 mb-1">
              {["Tất cả", "Trái cây", "Rau củ", "Đồ khô", "Giỏ quà"].map(c => (
                <button className={category === c ? "tab-active" : ""} onClick={() => setCategory(c)} key={c}>{c}</button>
              ))}
            </div>
            {products.length === 0 ? (
              <div className="empty-state-card bg-white border border-slate-100 rounded-2xl p-10 text-center flex flex-col items-center justify-center my-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Boxes size={28} />
                </div>
                <h3 className="font-semibold text-slate-800 text-base mb-1">Chưa có sản phẩm nào trong kho</h3>
                <p className="text-slate-400 text-xs max-w-sm mb-4">Kho hàng của bạn hiện đang trống. Vui lòng thêm sản phẩm mới để bắt đầu bán hàng tại POS.</p>
                <button className="primary-button" onClick={() => setProductModal({ mode: "add" })}>
                  <Plus size={16} /> Thêm sản phẩm mới
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="product-grid flex-1 overflow-y-auto">
                {filtered.map((p, i) => (
                  <button className="product-card" key={p.id} onClick={() => addProduct(p)} style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="product-img" style={{ background: p.accent }}>
                      <img src={p.image || "/logo.webp"} alt={p.name} onError={e => { e.currentTarget.src = "/logo.webp"; }} />
                      <span className={`status-dot ${p.status === "Cần bán gấp" ? "orange" : p.status === "Hết hàng" ? "red" : ""}`} aria-label={p.status} />
                    </div>
                    <div className="product-meta">
                      <strong>{p.name}</strong>
                      <span>{formatMoney(p.price)} / {p.unit}</span>
                      <small className={p.stock < 5 ? "low-stock" : ""}>{p.stock ? `Còn ${p.stock} ${p.unit.toLowerCase()}` : "Hết hàng"}</small>
                    </div>
                    <span className="add-product"><Plus size={17} /></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="product-list flex-1 overflow-y-auto flex flex-col gap-2.5 w-full">
                {filtered.map((p, i) => (
                  <button
                    className="product-list-item w-full bg-white rounded-2xl p-3 flex items-center justify-between gap-2 border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-xs group cursor-pointer"
                    key={p.id}
                    onClick={() => addProduct(p)}
                    style={{ animationDelay: `${i * 25}ms` }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative w-11 h-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center p-1 bg-slate-50 border border-slate-100" style={{ background: p.accent }}>
                        <img src={p.image || "/logo.webp"} alt={p.name} className="w-full h-full object-cover rounded-lg" onError={e => { e.currentTarget.src = "/logo.webp"; }} />
                        <span className={`status-dot ${p.status === "Cần bán gấp" ? "orange" : p.status === "Hết hàng" ? "red" : ""}`} aria-label={p.status} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <strong className="block text-xs md:text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{p.name}</strong>
                        <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                          <span className="text-[11px] font-bold text-emerald-600 whitespace-nowrap">{formatMoney(p.price)} / {p.unit}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <small className={`text-[10px] whitespace-nowrap ${p.stock < 5 ? "text-amber-500 font-medium" : "text-slate-400"}`}>
                            {p.stock ? `Còn ${p.stock} ${p.unit.toLowerCase()}` : "Hết hàng"}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        <Plus size={16} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <aside className="cart-panel w-full xl:w-[400px] flex flex-col bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex-shrink-0">
            <div className="cart-title">
              <div>
                <span className="eyebrow">Đơn đang mở · Bàn 01</span>
                <h2>Giỏ hàng <b>{cart.length}</b></h2>
              </div>
              <button className="clear-button" onClick={() => setCart([])}>Xóa tất cả</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart"><ShoppingCart size={30} /><p>Chưa có sản phẩm</p><span>Chạm vào sản phẩm để thêm vào đơn</span></div>
            ) : (
              <div className="cart-list">
                {cart.map(item => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image || "/logo.webp"} alt={item.name} onError={e => { e.currentTarget.src = "/logo.webp"; }} />
                    <div className="cart-item-main">
                      <strong>{item.name}</strong>
                      <span>{formatMoney(item.price)} / {item.selectedUnit}</span>
                      <CartItemQtyInput
                        item={item}
                        productStock={products.find(p => p.id === item.id)?.stock || 0}
                        onChangeQty={newQty => setCart(c => c.map(x => x.id === item.id ? { ...x, qty: newQty } : x))}
                        onChangeUnit={newUnit => setCart(c => c.map(x => x.id === item.id ? { ...x, selectedUnit: newUnit } : x))}
                      />
                    </div>
                    <div className="cart-item-right">
                      <b>{formatMoney(item.price * item.qty)}</b>
                      <button onClick={() => removeItem(item.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="cart-summary">
              <div><span>Tạm tính</span><b>{formatMoney(total)}</b></div>
              <div><span>Giảm giá</span><b>0đ</b></div>
              <div className="total-line"><span>Tổng cộng</span><strong>{formatMoney(total)}</strong></div>
              <div className="payment-switch">
                <button className={payment === "Tiền mặt" ? "selected" : ""} onClick={() => setPayment("Tiền mặt")}><WalletCards size={15} /> Tiền mặt</button>
                <button className={payment === "Chuyển khoản" ? "selected" : ""} onClick={() => setPayment("Chuyển khoản")}><CreditCard size={15} /> Chuyển khoản</button>
              </div>
              {payment === "Chuyển khoản" && (
                <div className="qr-preview flex items-center gap-2.5 p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                  <img
                    src={buildVietQrUrl(storeInfo.bank_bin || storeInfo.bank_short_name, storeInfo.bank_account, storeInfo.account_name, total, currentOrderCode || "LF-PREVIEW")}
                    alt="VietQR Quick"
                    className="w-12 h-12 object-contain rounded bg-white p-0.5 border border-emerald-100 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <b className="text-[11px] font-bold text-emerald-800">VietQR Tự Động · {formatMoney(total)}</b>
                    <span className="text-[10px] text-slate-600 font-medium truncate">{storeInfo.bank_short_name || storeInfo.bank_name} · {storeInfo.bank_account} · {storeInfo.account_name}</span>
                  </div>
                </div>
              )}
              <button className="checkout-button" disabled={!cart.length} onClick={handleCheckoutClick}>Tạo đơn & In hóa đơn <Printer size={17} /></button>
            </div>
          </aside>
        </section>
      )}
      {active === "dashboard" && <Dashboard period={period} setPeriod={setPeriod} />}
      {active === "products" && <Inventory products={products} latestImportDates={latestImportDates} onAdd={() => setProductModal({ mode: "add" })} onEdit={product => setProductModal({ mode: "edit", product })} onDelete={removeProduct} onMenu={setProductMenu} productMenu={productMenu} />}
      {active === "suppliers" && <Suppliers products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} onAdd={() => setSupplierModal(true)} onAddSupplier={() => setNewSupplierModal(true)} />}
      {active === "settings" && <SettingsPage storeInfo={storeInfo} onEdit={kind => { if (kind === "orders") setOrdersModal(true); else setSettingsModal(kind); }} />}
      {productModal && <ProductModal mode={productModal.mode} product={productModal.product} onClose={() => setProductModal(null)} onSave={saveProduct} />}
      {supplierModal && <SupplierModal products={products} suppliers={suppliers} onClose={() => setSupplierModal(false)} onSave={(supplierName, items, supplierId, note) => handleSavePurchaseOrder(supplierName, items, supplierId, note)} onAddSupplier={() => setNewSupplierModal(true)} />}
      {newSupplierModal && <NewSupplierModal onClose={() => setNewSupplierModal(false)} onSave={handleAddSupplier} />}
      {settingsModal && <SettingsModal kind={settingsModal} info={storeInfo} onClose={() => setSettingsModal(null)} onSave={handleSaveStoreSettings} />}
      {ordersModal && <OrderHistoryModal storeInfo={storeInfo} cashier={isStaff ? "Nhân viên POS" : `Quản lý (${fullName})`} onClose={() => setOrdersModal(false)} onReprint={reOrder => { setCurrentOrderCode(reOrder.order_code); setPayment(reOrder.payment_method || "Chuyển khoản"); setBillCart((reOrder.order_items || []).map((item: any) => ({ id: item.product_id, name: item.product_name, price: Number(item.unit_price || 0), qty: Number(item.quantity || 1), selectedUnit: item.unit || "Kg" }))); setShowBill(true); }} onRefreshProducts={() => listProducts().then(({ data }) => data && setProducts(data.map(toUiProduct)))} />}
    </main><MobileNavigation activeTab={active} onTabChange={handleTabChange} />
    {showBill && <BillModal total={billCart.reduce((sum, item) => sum + item.price * item.qty, 0)} cart={billCart} payment={payment} orderCode={currentOrderCode} storeInfo={storeInfo} cashier={isStaff ? "Nhân viên POS" : `Quản lý (${fullName})`} onClose={() => setShowBill(false)} />}
  </div>;
}

function Dashboard({ period, setPeriod }: { period: string; setPeriod: (p: string) => void }) {
  const [liveOrders, setLiveOrders] = useState<any[]>([]);

  useEffect(() => {
    listOrders().then(({ data, error }) => {
      if (error) {
        console.warn("[Supabase] orders query failed", error.message);
        return;
      }
      setLiveOrders(data || []);
    }).catch(error => console.warn("[Supabase] orders query failed", error));
  }, []);

  const allOrders = liveOrders.length ? liveOrders : orders;

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return allOrders.filter(order => {
      if (order.status === "cancelled" || order.status === "Đã hủy") return false;
      const orderDate = new Date(order.created_at || Date.now());
      if (isNaN(orderDate.getTime())) return true;

      if (period === "Hôm nay") {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === "7 ngày qua") {
        const diffMs = now.getTime() - orderDate.getTime();
        return diffMs <= 7 * 24 * 60 * 60 * 1000;
      }
      if (period === "Tháng này") {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === "Năm nay") {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [allOrders, period]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.total_amount ?? o.total ?? 0), 0);
  }, [filteredOrders]);

  const { totalProfit, marginPercent, totalQtySold } = useMemo(() => {
    let profit = 0;
    let qtySold = 0;

    filteredOrders.forEach(o => {
      const items = o.order_items || [];
      if (items.length > 0) {
        let orderCogs = 0;
        items.forEach((item: any) => {
          const q = Number(item.quantity || 0);
          const cost = Number(item.unit_cost || 0);
          orderCogs += q * cost;
          qtySold += q;
        });
        const rev = Number(o.total_amount || 0);
        profit += (rev - orderCogs);
      } else {
        const estProfit = Number(o.estimated_profit ?? (Number(o.total_amount ?? o.total ?? 0) * 0.35));
        profit += estProfit;
        qtySold += (o.items ? o.items.split(',').length : 1);
      }
    });

    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : "0.0";
    return { totalProfit: profit, marginPercent: margin, totalQtySold: qtySold };
  }, [filteredOrders, totalRevenue]);

  const topBestSellers = useMemo(() => {
    const map: Record<string, { name: string; totalQty: number; totalRevenue: number; unit: string }> = {};

    filteredOrders.forEach(o => {
      const items = o.order_items || [];
      if (items.length > 0) {
        items.forEach((item: any) => {
          const name = item.product_name || "Sản phẩm";
          const qty = Number(item.quantity || 0);
          const price = Number(item.unit_price || 0);
          const rev = Number(item.line_total || qty * price);
          const unit = item.unit || "Kg";

          if (!map[name]) {
            map[name] = { name, totalQty: 0, totalRevenue: 0, unit };
          }
          map[name].totalQty += qty;
          map[name].totalRevenue += rev;
        });
      } else if (o.items && typeof o.items === "string") {
        const names = o.items.split(", ");
        names.forEach((name: string) => {
          if (!map[name]) {
            map[name] = { name, totalQty: 0, totalRevenue: 0, unit: "Kg" };
          }
          map[name].totalQty += 1;
          map[name].totalRevenue += Number(o.total || 0) / names.length;
        });
      }
    });

    return Object.values(map)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [filteredOrders]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const items = o.order_items || [];
      items.forEach((item: any) => {
        const cat = item.category || "Nông sản";
        const rev = Number(item.line_total || item.quantity * item.unit_price || 0);
        map[cat] = (map[cat] || 0) + rev;
      });
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    const palette = ["#1E9E68", "#89C65A", "#F0A35A", "#47A56E", "#9470BD"];
    if (total === 0) {
      return [
        { name: "Trái cây", value: 45, color: "#1E9E68" },
        { name: "Rau củ", value: 35, color: "#89C65A" },
        { name: "Đồ khô", value: 20, color: "#F0A35A" }
      ];
    }
    return Object.entries(map).map(([name, val], idx) => ({
      name,
      value: Math.round((val / total) * 100),
      color: palette[idx % palette.length]
    }));
  }, [filteredOrders]);

  const revenuePoints = useMemo(() => {
    if (!filteredOrders.length) {
      return revenueData;
    }
    const dateMap: Record<string, number> = {};
    filteredOrders.slice().reverse().forEach(o => {
      const dayStr = new Date(o.created_at || Date.now()).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      dateMap[dayStr] = (dateMap[dayStr] || 0) + Number(o.total_amount ?? o.total ?? 0);
    });

    const entries = Object.entries(dateMap);
    if (entries.length === 1) {
      return [{ day: entries[0][0], value: Number((entries[0][1] / 1000000).toFixed(2)) }];
    }
    return entries.map(([day, val]) => ({
      day,
      value: Number((val / 1000000).toFixed(2)),
    }));
  }, [filteredOrders]);

  return (
    <section className="page-section dashboard-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Tổng quan vận hành · Supabase</span>
          <h2>Báo cáo doanh thu</h2>
        </div>
        <div className="period-select">
          <span>Hiển thị:</span>
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option>Hôm nay</option>
            <option>7 ngày qua</option>
            <option>Tháng này</option>
            <option>Năm nay</option>
          </select>
          <ChevronDown size={15} />
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Tổng doanh thu"
          value={totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1).replace(".", ",")} triệu` : formatMoney(totalRevenue)}
          detail="Doanh thu các đơn hoàn thành"
          trend={`${filteredOrders.length} đơn`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Lợi nhuận gộp"
          value={totalProfit >= 1000000 ? `${(totalProfit / 1000000).toFixed(1).replace(".", ",")} triệu` : formatMoney(totalProfit)}
          detail={`Tỷ suất lợi nhuận: ${marginPercent}%`}
          trend={`${marginPercent}%`}
          icon={TrendingUp}
          accent="mint"
        />
        <StatCard
          label="Đơn hàng thành công"
          value={`${filteredOrders.length}`}
          detail={`Kỳ ${period.toLowerCase()}`}
          trend="Đã hoàn tất"
          icon={ClipboardList}
          accent="peach"
        />
        <StatCard
          label="Sản phẩm đã bán"
          value={totalQtySold > 0 ? `${totalQtySold % 1 === 0 ? totalQtySold : totalQtySold.toFixed(1)} món / Kg` : "0 sản phẩm"}
          detail="Tổng sản phẩm đã giao"
          trend="Live order_items"
          icon={PackagePlus}
          accent="lilac"
        />
      </div>

      <div className="chart-layout">
        <div className="chart-card revenue-chart">
          <div className="chart-card-head">
            <div>
              <span className="eyebrow">Hiệu suất bán hàng</span>
              <h3>Xu hướng doanh thu (${period})</h3>
            </div>
            <span className="chart-total">{(totalRevenue / 1000000).toFixed(1)}tr <small>VNĐ</small></span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenuePoints} margin={{ left: -20, right: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe3" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8c9a91" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8c9a91" }} tickFormatter={v => `${v}tr`} />
              <Tooltip contentStyle={{ border: "0", borderRadius: 12, boxShadow: "0 12px 30px #19352b18", fontFamily: "Plus Jakarta Sans" }} formatter={(v: any) => [`${v} triệu`, "Doanh thu"]} />
              <Line type="monotone" dataKey="value" stroke="#1E9E68" strokeWidth={3} dot={{ r: 4, fill: "#1E9E68", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card category-chart">
          <div className="chart-card-head">
            <div>
              <span className="eyebrow">Cơ cấu bán hàng</span>
              <h3>Theo danh mục</h3>
            </div>
            <button className="icon-button"><MoreHorizontal size={18} /></button>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="52%" height={160}>
              <PieChart>
                <Pie data={categoryData} innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value" stroke="none">
                  {categoryData.map(c => <Cell key={c.name} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-total"><strong>100%</strong><span>doanh thu</span></div>
          </div>
          <div className="legend-list">
            {categoryData.map(c => <div key={c.name}><span style={{ background: c.color }} />{c.name}<b>{c.value}%</b></div>)}
          </div>
        </div>
      </div>

      <div className="dashboard-lower">
        <div className="table-card">
          <div className="chart-card-head">
            <div>
              <span className="eyebrow">Dữ liệu đơn hàng</span>
              <h3>Đơn hàng gần đây ({filteredOrders.length})</h3>
            </div>
            <button className="text-button">Đã đồng bộ <Check size={14} /></button>
          </div>
          <div className="top-products">
            {filteredOrders.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">Chưa có đơn hàng trong khoảng thời gian này.</p>
            ) : (
              filteredOrders.slice(0, 5).map((o: any, i: number) => (
                <div className="top-product" key={o.id || o.order_code}>
                  <span className="rank">0{i + 1}</span>
                  <span className="mini-product" style={{ background: "#E6F3E9" }}><Leaf size={15} /></span>
                  <div>
                    <strong>{o.order_code || `LF-${o.id}`}</strong>
                    <span>
                      {new Date(o.created_at || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {o.payment_method || o.method || "Tiền mặt"}
                    </span>
                  </div>
                  <b>{formatMoney(Number(o.total_amount ?? o.total))}</b>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="orders-card">
          <div className="chart-card-head">
            <div>
              <span className="eyebrow">Bán chạy nhất</span>
              <h3>Top sản phẩm bán chạy</h3>
            </div>
            <span className="badge badge-green">Order Items</span>
          </div>
          <div className="top-products">
            {topBestSellers.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">Chưa có dữ liệu bán hàng.</p>
            ) : (
              topBestSellers.map((item, i) => (
                <div className="top-product" key={item.name}>
                  <span className="rank">0{i + 1}</span>
                  <span className="mini-product bg-emerald-50 text-emerald-700"><PackagePlus size={15} /></span>
                  <div>
                    <strong>{item.name}</strong>
                    <span className="text-slate-500 font-medium">
                      Đã bán: {item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)} {item.unit}
                    </span>
                  </div>
                  <b className="text-emerald-700">{formatMoney(item.totalRevenue)}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Inventory({
  products,
  latestImportDates = {},
  onAdd,
  onEdit,
  onDelete
}: {
  products: Product[];
  latestImportDates?: Record<number, string>;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onMenu?: (id: number | null) => void;
  productMenu?: number | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return products.filter(product => {
      const matchCategory =
        category === "all" ||
        category === "Tất cả" ||
        !category ||
        product.category?.toLowerCase() === category.toLowerCase();

      const matchSearch =
        !query ||
        product.name?.toLowerCase().includes(query.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, category, query]);

  return (
    <section className="page-section min-h-screen w-full max-w-full px-4 md:px-6 bg-[#F7F8F2] flex flex-col justify-between pb-28 md:pb-8 box-border">
      <div className="inventory-summary">
        <div><b>{products.length}</b><span>Tổng mặt hàng</span></div>
        <div><b className="green-text">{products.filter(p => p.status === "Tươi mới").length}</b><span>Đang bán tốt</span></div>
        <div><b className="orange-text">{products.filter(p => p.status === "Cần bán gấp").length}</b><span>Cần bán gấp</span></div>
        <div><b className="red-text">{products.filter(p => p.status === "Hết hàng").length}</b><span>Hết hàng</span></div>
      </div>

      <div className="inventory-toolbar flex flex-wrap items-center justify-between gap-3 my-4">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="search-box flex-1">
            <Search size={17} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trong kho..." />
          </div>
          <button className="primary-button shrink-0 text-xs py-2.5" onClick={onAdd}>
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
        <div className="category-tabs inventory-filters flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-1 shrink-0">
          {["Tất cả", "Trái cây", "Rau củ", "Đồ khô", "Giỏ quà"].map(c => (
            <button className={category === c ? "tab-active" : ""} onClick={() => setCategory(c)} key={c}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-inventory bg-white border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center my-4 shadow-sm w-full max-w-full">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Boxes size={28} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Chưa có sản phẩm nào trong kho</h3>
          <p className="text-slate-400 text-xs max-w-xs mb-4">Vui lòng bấm nút thêm sản phẩm để bổ sung mặt hàng mới vào hệ thống.</p>
          <button className="primary-button" onClick={onAdd}>
            <Plus size={16} /> Thêm sản phẩm mới
          </button>
        </div>
      ) : (
        <div className="inventory-table w-full max-w-full space-y-3">
          {filtered.map(p => {
            const dateStr = latestImportDates[p.id];
            const formattedDate = formatShortDate(dateStr);
            const isOpen = activeMenuId === p.id;

            return (
              <div 
                key={p.id} 
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4 hover:border-emerald-200 transition-all box-border"
              >
                {/* Cột Trái: Ảnh + Tên sản phẩm + Thông tin chi tiết */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img 
                    src={p.image || "/logo.webp"} 
                    alt={p.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0 bg-slate-50"
                    onError={e => { e.currentTarget.src = "/logo.webp"; }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-800 text-sm md:text-base truncate">
                      {p.name}
                    </span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">
                      Giá: {Number(p.cost || 0).toLocaleString('vi-VN')}đ {formattedDate ? `| ${formattedDate}` : ''}
                    </span>
                  </div>
                </div>

                {/* Cột Phải: Tồn kho + Badge trạng thái + Nút 3 chấm */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm md:text-base font-bold text-slate-800">
                      {p.stock ?? 0} <span className="text-xs font-normal text-slate-500">{p.unit || 'Kg'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">tồn kho</div>
                  </div>

                  {Number(p.stock) > 0 ? (
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      Tươi mới
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                      Hết hàng
                    </span>
                  )}

                  <div className="row-actions relative flex-shrink-0">
                    <DropdownMenu
                      open={isOpen}
                      onOpenChange={open => setActiveMenuId(open ? p.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button 
                          type="button"
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          aria-label={`Mở menu ${p.name}`}
                        >
                          <span className="text-lg leading-none font-bold mb-1">•••</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side="bottom"
                        sideOffset={4}
                        className="w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-60 animate-in fade-in-80 zoom-in-95"
                      >
                        <DropdownMenuItem
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg cursor-pointer transition-colors outline-none"
                          onClick={() => {
                            setActiveMenuId(null);
                            onEdit(p);
                          }}
                        >
                          <FileText size={14} className="text-slate-400" />
                          Chỉnh sửa thông tin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors outline-none"
                          onClick={() => {
                            setActiveMenuId(null);
                            onDelete(p.id);
                          }}
                        >
                          <Trash2 size={14} className="text-rose-500" />
                          Xóa sản phẩm
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ProductModal({ mode, product, onClose, onSave }: { mode: "add" | "edit"; product?: Product; onClose: () => void; onSave: (product: Product, imageFile?: File | null) => void }) {
  const [form, setForm] = useState<Product>(product || { id: 0, name: "", category: "Trái cây", price: 0, cost: 0, stock: 0, unit: "Kg", status: "Tươi mới", image: assets.strawberry, accent: "#FBE7E4" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(product?.image || assets.strawberry);
  const update = (key: keyof Product, value: string | number) => setForm(current => ({ ...current, [key]: value }));
  useEffect(() => { return () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);
  const pickImage = (file?: File) => { if (!file) return; if (!file.type.startsWith("image/")) return toast.error("Vui lòng chọn file hình ảnh"); if (file.size > 5 * 1024 * 1024) return toast.error("Ảnh không được vượt quá 5MB"); if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); const nextUrl = URL.createObjectURL(file); setImageFile(file); setPreviewUrl(nextUrl); setForm(current => ({ ...current, image: nextUrl })); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.name.trim() || form.price <= 0 || form.cost < 0) return toast.error("Vui lòng nhập tên và giá hợp lệ"); onSave({ ...form, stock: Number(form.stock), price: Number(form.price), cost: Number(form.cost), status: Number(form.stock) === 0 ? "Hết hàng" : Number(form.stock) < 5 ? "Cần bán gấp" : "Tươi mới" }, imageFile); };
  return (
    <div className="modal-overlay">
      <form className="form-modal" onSubmit={submit}>
        <div className="modal-head">
          <div><span className="eyebrow">Kho hàng</span><h2>{mode === "add" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="form-grid">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">Tên sản phẩm
            <input required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ví dụ: Dâu tây Giống Nhật" className="w-full h-11 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">Danh mục
            <FormSelect
              value={form.category}
              onValueChange={val => update("category", val)}
              options={[
                { value: "Trái cây", label: "Trái cây" },
                { value: "Rau củ", label: "Rau củ" },
                { value: "Đồ khô", label: "Đồ khô" },
                { value: "Giỏ quà", label: "Giỏ quà" }
              ]}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">Giá nhập
            <input type="number" min="0" value={form.cost} onChange={e => update("cost", Number(e.target.value))} placeholder="0" className="w-full h-11 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">Giá bán
            <input required type="number" min="1" value={form.price} onChange={e => update("price", Number(e.target.value))} placeholder="0" className="w-full h-11 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">Đơn vị tính
            <FormSelect
              value={form.unit}
              onValueChange={val => update("unit", val)}
              options={[
                { value: "Kg", label: "Kg" },
                { value: "Gram", label: "Gram" },
                { value: "Hộp", label: "Hộp" },
                { value: "Túi", label: "Túi" },
                { value: "Khay", label: "Khay" },
                { value: "Giỏ", label: "Giỏ" }
              ]}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">Tồn kho ban đầu
            <input type="number" min="0" step="0.1" value={form.stock} onChange={e => update("stock", Number(e.target.value))} placeholder="0" className="w-full h-11 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>
          <div className="image-upload-field full-field">
            <span>Ảnh sản phẩm</span>
            <label className="image-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pickImage(e.dataTransfer.files[0]); }}>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => pickImage(e.target.files?.[0])} />
              <img src={previewUrl || "/logo.webp"} alt="Xem trước sản phẩm" onError={e => { e.currentTarget.src = "/logo.webp"; }} />
              <div><strong>{imageFile ? imageFile.name : "Chọn hoặc kéo thả ảnh vào đây"}</strong><small>PNG, JPG hoặc WEBP · tối đa 5MB</small></div>
              <span className="upload-browse">Chọn ảnh</span>
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="outline-button" onClick={onClose}>Hủy</button>
          <button type="submit" className="primary-button"><Check size={16} /> Lưu sản phẩm</button>
        </div>
      </form>
    </div>
  );
}

function Suppliers({ products, suppliers, purchaseOrders, onAdd, onAddSupplier }: { products: Product[]; suppliers: SupabaseSupplier[]; purchaseOrders: SupabasePurchaseOrder[]; onAdd: () => void; onAddSupplier: () => void }) {
  const totalCost = purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);
  const totalCostText = totalCost > 0 ? (totalCost / 1000000).toFixed(1).replace(".", ",") + " triệu" : "0đ";

  return (
    <section className="page-section">
      
      <div className="supplier-hero mb-6 flex justify-between items-center">
        <div>
          <span className="eyebrow">Chi phí nhập kho</span>
          <strong>{totalCostText} <small>VNĐ</small></strong>
          <p>{purchaseOrders.length} phiếu nhập · {suppliers.length} nhà cung cấp</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="primary-button shadow-md" onClick={onAdd}><Plus size={17} /> Tạo phiếu nhập</button>
          <div className="supplier-sprout hidden sm:flex"><Leaf size={34} /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="supplier-list mt-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Danh sách Nhà cung cấp ({suppliers.length})</h3>
            <button className="text-button text-xs" onClick={onAddSupplier}><Plus size={14} /> Thêm mới</button>
          </div>
          {suppliers.length === 0 ? (
            <p className="text-slate-400 text-xs py-4">Chưa có nhà cung cấp nào.</p>
          ) : (
            suppliers.map(s => (
              <div className="supplier-row" key={s.id || s.name}>
                <div className="supplier-avatar"><Truck size={18} /></div>
                <div>
                  <strong>{s.name}</strong>
                  <span>{s.phone ? `SĐT: ${s.phone}` : s.address || "Đà Lạt"}</span>
                </div>
                <div className="supplier-amount"><Badge tone="green">Đang hợp tác</Badge></div>
              </div>
            ))
          )}
        </div>
        <div className="purchase-orders-list">
          <h3 className="font-semibold text-lg mb-3">Phiếu nhập kho gần đây ({purchaseOrders.length})</h3>
          {purchaseOrders.length === 0 ? (
            <p className="text-slate-400 text-xs py-4">Chưa có phiếu nhập nào.</p>
          ) : (
            purchaseOrders.slice(0, 6).map(po => (
              <div className="supplier-row" key={po.id || po.purchase_code}>
                <div className="supplier-avatar bg-emerald-50 text-emerald-600"><ClipboardList size={18} /></div>
                <div>
                  <strong>{po.purchase_code || `PO-${po.id}`} · {po.supplier_name}</strong>
                  <span>{new Date(po.created_at || Date.now()).toLocaleString("vi-VN")}</span>
                </div>
                <div className="supplier-amount">
                  <b className="text-emerald-700">{formatMoney(Number(po.total_amount))}</b>
                  <Badge tone="green">Đã hoàn tất</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function SupplierModal({
  products,
  suppliers,
  onClose,
  onSave,
  onAddSupplier
}: {
  products: Product[];
  suppliers: SupabaseSupplier[];
  onClose: () => void;
  onSave: (supplierName: string, items: { productId: number; qty: number; unitCost: number }[], supplierId?: number | null, note?: string) => void;
  onAddSupplier: () => void;
}) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(suppliers[0]?.id || null);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>(suppliers[0]?.name || "Nông trại Dâu Nhật Hưng Phát");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([{ productId: products[0]?.id || 0, qty: 1, unitCost: products[0]?.cost || 0 }]);
  const total = lines.reduce((sum, line) => sum + line.qty * line.unitCost, 0);

  const handleSelectSupplier = (val: string) => {
    if (val === "__new__") {
      onAddSupplier();
      return;
    }
    const found = suppliers.find(s => s.id === Number(val) || s.name === val);
    if (found) {
      setSelectedSupplierId(found.id);
      setSelectedSupplierName(found.name);
    } else {
      setSelectedSupplierName(val);
    }
  };

  const updateLine = (index: number, key: "productId" | "qty" | "unitCost", value: number) => {
    setLines(current => current.map((line, i) => {
      if (i === index) {
        if (key === "productId") {
          const prod = products.find(p => p.id === value);
          return { ...line, productId: value, unitCost: prod ? prod.cost : line.unitCost };
        }
        return { ...line, [key]: value };
      }
      return line;
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="form-modal">
        <div className="modal-head">
          <div><span className="eyebrow">Phiếu nhập hàng · Supabase</span><h2>Tạo phiếu nhập từ NCC</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Nhà cung cấp</label>
            <button type="button" className="text-button text-xs py-0" onClick={onAddSupplier}>+ Thêm nhà cung cấp mới</button>
          </div>
          <FormSelect
            value={String(selectedSupplierId ?? selectedSupplierName)}
            onValueChange={val => handleSelectSupplier(val)}
            options={[
              ...suppliers.map(s => ({ value: String(s.id), label: s.name })),
              { value: "__new__", label: "+ Thêm nhà cung cấp mới..." }
            ]}
          />
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú phiếu nhập</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ví dụ: Nhập dâu đợt 1 tháng 8..."
            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50"
          />
        </div>
        <div className="import-lines">
          {lines.map((line, index) => (
            <div className="import-line" key={index}>
              <FormSelect
                value={String(line.productId)}
                onValueChange={val => updateLine(index, "productId", Number(val))}
                options={products.map(p => ({ value: String(p.id), label: `${p.name} (${p.unit})` }))}
                className="w-48 shrink-0"
              />
              <input type="number" min="0.1" step="0.1" value={line.qty} onChange={e => updateLine(index, "qty", Number(e.target.value))} placeholder="SL" />
              <input type="number" min="0" value={line.unitCost} onChange={e => updateLine(index, "unitCost", Number(e.target.value))} placeholder="Đơn giá" />
              {lines.length > 1 && (
                <button className="icon-button" onClick={() => setLines(current => [...current.filter((_, i) => i !== index)])}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
        <button className="text-button mt-2" onClick={() => setLines(current => [...current, { productId: products[0]?.id || 0, qty: 1, unitCost: products[0]?.cost || 0 }])}>
          <Plus size={14} /> Thêm sản phẩm nhập
        </button>
        <div className="import-total"><span>Tổng tiền nhập (Tự động cộng tồn kho)</span><strong>{formatMoney(total)}</strong></div>
        <div className="modal-actions">
          <button type="button" className="outline-button" onClick={onClose}>Hủy</button>
          <button type="button" className="primary-button" onClick={() => lines.length && onSave(selectedSupplierName, lines, selectedSupplierId, note)}>
            <Check size={16} /> Hoàn tất phiếu nhập
          </button>
        </div>
      </div>
    </div>
  );
}

function NewSupplierModal({ onClose, onSave }: { onClose: () => void; onSave: (supplier: { name: string; phone?: string; address?: string; note?: string }) => void }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên nhà cung cấp");
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <form className="form-modal" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div><span className="eyebrow">Quản lý NCC · Supabase</span><h2>Thêm Nhà Cung Cấp Mới</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="form-grid">
          <label className="full-field">Tên nhà cung cấp *
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Nông trại Dâu Nhật Hưng Phát" />
          </label>
          <label>Số điện thoại
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" />
          </label>
          <label>Địa chỉ
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Phường 11, TP. Đà Lạt" />
          </label>
          <label className="full-field">Ghi chú
            <textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Loại nông sản chính, thông tin làm việc..." />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="outline-button" onClick={onClose}>Hủy</button>
          <button type="submit" className="primary-button"><Check size={16} /> Lưu nhà cung cấp</button>
        </div>
      </form>
    </div>
  );
}



function QrPaymentModal({
  total,
  orderCode,
  storeInfo,
  onConfirm,
  onClose
}: {
  total: number;
  orderCode: string;
  storeInfo: StoreSettingsData;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const bankBin = storeInfo.bank_bin || "970422";
  const accountNumber = storeInfo.bank_account;
  const bankLabel = storeInfo.bank_short_name || storeInfo.bank_name || "MBBank";
  const qrUrl = buildVietQrUrl(bankBin, accountNumber, storeInfo.account_name, total, orderCode);

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  return (
    <div className="modal-overlay">
      <div className="form-modal max-w-md bg-white rounded-2xl p-6 shadow-2xl">
        <div className="modal-head mb-3">
          <div>
            <span className="eyebrow text-emerald-600 font-bold uppercase text-[10px]">Thanh toán VietQR Tự Động</span>
            <h2 className="text-xl font-bold text-slate-800">Mã Chuyển Khoản QR</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col items-center justify-center mb-3">
          <div className="w-56 h-56 bg-white p-2 border border-slate-200 rounded-xl shadow-sm flex items-center justify-center mb-2">
            <img
              src={qrUrl}
              alt="VietQR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-emerald-800 text-center mt-1">
            {bankLabel} · {accountNumber} · {storeInfo.account_name}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5">Mở app Ngân hàng quét mã QR để chuyển khoản</span>
        </div>

        <div className="space-y-2 text-xs text-slate-700 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Ngân hàng:</span>
            <strong className="text-slate-800 font-semibold">{bankLabel} ({bankBin})</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Số tài khoản:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-emerald-700 font-mono text-sm font-bold">{accountNumber}</strong>
              <button
                type="button"
                onClick={() => copyText(accountNumber, "Số tài khoản")}
                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Copy STK"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
            <strong className="text-slate-800 uppercase font-semibold">{storeInfo.account_name}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Số tiền:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-emerald-600 font-bold text-sm">{formatMoney(total)}</strong>
              <button
                type="button"
                onClick={() => copyText(Math.round(total).toString(), "Số tiền")}
                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Copy Số tiền"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-emerald-200/60">
            <span className="text-slate-500 font-medium">Nội dung CK:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-emerald-800 font-mono font-bold text-sm">{orderCode}</strong>
              <button
                type="button"
                onClick={() => copyText(orderCode, "Nội dung chuyển khoản")}
                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Copy Nội dung"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions flex justify-end gap-2 pt-1">
          <button type="button" className="outline-button text-xs" onClick={onClose}>Hủy / Đóng</button>
          <button type="button" className="primary-button text-xs py-2.5 px-4" onClick={onConfirm}>
            <Check size={16} /> Xác nhận đã nhận tiền
          </button>
        </div>
      </div>
    </div>
  );
}

function BillModal({ total, cart, payment, orderCode, storeInfo, cashier, onClose }: { total: number; cart: CartItem[]; payment: string; orderCode: string; storeInfo: StoreSettingsData; cashier?: string; onClose: () => void }) {
  const billRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const displayCode = orderCode || "LF-1308-043";

  const bankBin = storeInfo.bank_bin || "970422";
  const accountNumber = storeInfo.bank_account;
  const bankLabel = storeInfo.bank_short_name || storeInfo.bank_name || "MBBank";
  const qrUrl = buildVietQrUrl(bankBin, accountNumber, storeInfo.account_name, total, displayCode);

  const downloadBillImage = async () => {
    if (!billRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(billRef.current, { cacheBust: true, pixelRatio: 2, style: { transform: 'none', margin: '0' } });
      const link = document.createElement("a");
      link.download = `hoa-don-${displayCode}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Đã tải ảnh hóa đơn về máy!");
    } catch (err: any) {
      toast.error(`Không thể tạo ảnh hóa đơn: ${err?.message || "Lỗi thiết bị"}`);
    } finally {
      setDownloading(false);
    }
  };

  const copyBillImage = async () => {
    if (!billRef.current) return;
    setCopying(true);
    try {
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        try {
          const blobPromise = toBlob(billRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            style: { transform: 'none', margin: '0' }
          }).then(blob => {
            if (!blob) throw new Error("Không thể tạo dữ liệu ảnh");
            return blob;
          });

          await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
          toast.success("Đã copy ảnh hóa đơn! Bạn có thể dán (Ctrl+V) vào Zalo / Messenger.");
          return;
        } catch (clipboardErr: any) {
          console.warn("Direct clipboard write failed, attempting fallback:", clipboardErr);
          
          const blob = await toBlob(billRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            style: { transform: 'none', margin: '0' }
          });
          if (!blob) throw new Error("Không thể tạo dữ liệu ảnh");

          const file = new File([blob], `hoa-don-${displayCode}.png`, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Hóa đơn ${displayCode}`,
            });
            toast.info("Đã mở menu chia sẻ/lưu ảnh hóa đơn.");
            return;
          }

          await downloadBillImage();
          toast.info("Trình duyệt không hỗ trợ copy ảnh trực tiếp, đã tự động tải ảnh về máy.");
          return;
        }
      } else {
        await downloadBillImage();
        toast.info("Trình duyệt không hỗ trợ copy ảnh trực tiếp, đã tự động tải ảnh về máy.");
      }
    } catch (err: any) {
      toast.error(`Lỗi copy ảnh hóa đơn: ${err?.message || "Không thể copy ảnh"}`);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="bill-modal">
        <div className="modal-head">
          <div><span className="eyebrow">Đơn hàng đã hoàn tất</span><h2>Hóa đơn thanh toán</h2></div>
          <button className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>

        <div
          className="thermal-bill"
          id="thermal-bill"
          ref={billRef}
          style={{ width: "350px", backgroundColor: "#ffffff", padding: "20px", margin: "0 auto", boxSizing: "border-box" }}
        >
          <div className="bill-brand flex flex-col items-center text-center pb-1">
            <img
              src={assets.logo}
              alt="LinhFarm Logo"
              crossOrigin="anonymous"
              className="w-14 h-14 rounded-full object-cover overflow-hidden border border-slate-200 mx-auto mb-2"
              onError={e => { e.currentTarget.src = "/logo.webp"; }}
            />
            <strong className="text-lg font-bold text-slate-800 tracking-tight leading-tight">LinhFarm</strong>
            <span className="text-xs text-slate-500 font-normal tracking-wide mt-1">Trái cây & Rau củ Đà Lạt · Khay quà, Giỏ quà tươi</span>
          </div>
          <div className="bill-meta leading-tight space-y-0.5 my-3 py-2 border-y border-dashed border-slate-200 text-[10px]">
            <div>Mã đơn: <b className="text-slate-800">{displayCode}</b></div>
            <div>Thời gian: <span>{new Date().toLocaleDateString("vi-VN")} · {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span></div>
            <div>Thu ngân: <b className="text-slate-700">{cashier || "Quản lý (Linh Trần)"}</b></div>
            <div>Thanh toán: <b className="text-emerald-700 font-semibold">{payment}</b></div>
          </div>
          <div className="bill-items">
            {cart.map((x: CartItem) => (
              <div key={x.id}>
                <span>{x.name}<small>{x.qty} {x.selectedUnit} × {formatMoney(x.price)}</small></span>
                <b>{formatMoney(x.qty * x.price)}</b>
              </div>
            ))}
          </div>
          <div className="bill-total">
            <span>TỔNG CỘNG</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <div className="bill-footer text-center mt-3 pt-3 border-t border-dashed border-slate-200 text-[10px] text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700 mb-1">Cảm ơn bạn đã ủng hộ Linh Farm.</p>
            <div>{storeInfo.address || "158/22/36 đường Nguyễn Việt Hồng, P. Ninh Kiều, TP. Cần Thơ"}</div>
            <div>Hotline: {storeInfo.phone || "0907 697 036"}</div>

            {payment === "Chuyển khoản" ? (
              <div className="flex flex-col items-center justify-center mt-3">
                <div className="w-36 h-36 rounded-lg border border-slate-200 p-1 bg-white flex items-center justify-center">
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] text-slate-700 font-semibold mt-1">
                  {bankLabel} · {accountNumber} · {storeInfo.account_name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Quét mã để thanh toán nhanh</span>
              </div>
            ) : (
              <div className="mt-3 flex justify-center">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-lg px-3 py-1 flex items-center gap-1">
                  <Check size={14} className="text-emerald-600" /> Đã thanh toán bằng tiền mặt
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bill-actions flex flex-wrap justify-end gap-2 mt-4">
          <button
            className="outline-button text-xs"
            disabled={copying}
            onClick={copyBillImage}
          >
            <Copy size={15} /> {copying ? "Đang copy..." : "Copy ảnh hóa đơn"}
          </button>
          <button
            className="outline-button text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            disabled={downloading}
            onClick={downloadBillImage}
          >
            <ArrowDownToLine size={15} /> {downloading ? "Đang tạo..." : "Tải ảnh hóa đơn"}
          </button>
          <button className="primary-button text-xs" onClick={() => window.print()}>
            <Printer size={15} /> In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationPopover({ onClose }: { onClose: () => void }) {
  const notifications = [
    { icon: PackagePlus, tone: "orange", title: "Cà chua Cherry sắp hết", detail: "Chỉ còn 8.2 kg trong kho", time: "5 phút trước" },
    { icon: ClipboardList, tone: "green", title: "Đơn hàng mới vừa tạo", detail: "Đơn LF-1308-043 · 181.500đ", time: "18 phút trước" },
    { icon: Bell, tone: "slate", title: "Đã đồng bộ báo cáo", detail: "Doanh thu tuần này tăng 18.4%", time: "1 giờ trước" },
  ];
  return <div className="header-popover notification-popover"><div className="popover-heading"><div><span className="eyebrow">Trung tâm vận hành</span><h3>Thông báo cửa hàng</h3></div><button className="text-button" onClick={onClose}>Đóng</button></div><div className="notification-list">{notifications.map(n => <div className="notification-item" key={n.title}><span className={`notification-icon ${n.tone}`}><n.icon size={15} /></span><div><strong>{n.title}</strong><span>{n.detail}</span><small>{n.time}</small></div></div>)}</div><button className="notification-footer" onClick={() => { toast.success("Đã đánh dấu tất cả là đã đọc"); onClose(); }}>Đánh dấu tất cả đã đọc <Check size={14} /></button></div>;
}

function ProfileMenu({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { isOwner, isStaff, roleLabel, fullName } = useAuth();
  const email = user?.email || "admin@linhfarm.vn";
  const initials = fullName.split(" ").map((n: string) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "LT";

  return (
    <div className="header-popover profile-popover shadow-xl rounded-2xl border border-slate-200 p-3.5 bg-white w-72 animate-in fade-in-50 zoom-in-95">
      <div className="profile-summary flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl mb-2 border border-slate-100">
        <div className="avatar profile-avatar w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-xs font-bold text-slate-800 truncate">{fullName}</strong>
          <span className="text-[11px] text-slate-500 truncate block font-medium">{email}</span>
        </div>
      </div>
      <div className="profile-divider my-2 border-t border-slate-100" />
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="profile-label text-[10px] uppercase font-bold text-slate-400">
          Vai trò hiện tại
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isOwner ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
        }`}>
          {roleLabel}
        </span>
      </div>

      <div className="role-options space-y-1">
        <div
          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
            isOwner
              ? "bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 font-bold"
              : "opacity-50 bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Store size={16} className={isOwner ? "text-emerald-700" : "text-slate-400"} />
            <div>
              <strong className="block text-xs">Chủ cửa hàng</strong>
              <small className="block text-[10px] text-slate-500 font-normal">Toàn quyền vận hành hệ thống</small>
            </div>
          </div>
          {isOwner ? (
            <Check size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <Lock size={13} className="text-slate-400 shrink-0" />
          )}
        </div>

        <div
          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
            isStaff
              ? "bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 font-bold"
              : "opacity-50 bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ShoppingBasket size={16} className={isStaff ? "text-emerald-700" : "text-slate-400"} />
            <div>
              <strong className="block text-xs">Nhân viên bán hàng</strong>
              <small className="block text-[10px] text-slate-500 font-normal">Chỉ thao tác Bán hàng (POS)</small>
            </div>
          </div>
          {isStaff ? (
            <Check size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <Lock size={13} className="text-slate-400 shrink-0" />
          )}
        </div>
      </div>

      <div className="my-2.5 border-t border-slate-100" />
      <button
        type="button"
        onClick={onLogout}
        className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <ArrowDownToLine size={15} /> Đăng xuất khỏi LinhFarm
      </button>
    </div>
  );
}


