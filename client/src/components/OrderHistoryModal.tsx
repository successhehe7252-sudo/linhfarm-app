import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Printer, Search, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelOrder, supabase } from "@/lib/supabase";

function Badge({ tone, children }: { tone: "green" | "red" | "gray"; children: React.ReactNode }) {
  const cls = tone === "green"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : tone === "red"
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls}`}>
      {children}
    </span>
  );
}

export function OrderHistoryModal({
  storeInfo,
  cashier,
  onClose,
  onReprint,
  onRefreshProducts
}: {
  storeInfo: { address: string; phone: string; bank: string; account: string; accountName: string; fanpageUrl?: string };
  cashier?: string;
  onClose: () => void;
  onReprint: (order: any) => void;
  onRefreshProducts: () => void;
}) {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Default filters: Status = "all", Date = "today"
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState("");

  // Pagination states
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const formatMoney = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${hh}:${mm} · ${dd}/${mo}/${yyyy}`;
  };

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, customDate, searchQuery]);

  // Server-side Supabase query with pagination
  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*, order_items(*)", { count: "exact" });

    // Status filter
    if (statusFilter === "completed") {
      query = query.or("status.eq.completed,status.eq.Hoàn tất");
    } else if (statusFilter === "cancelled") {
      query = query.or("status.eq.cancelled,status.eq.Đã hủy");
    }

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
    } else if (dateFilter === "yesterday") {
      const start = new Date(now.getTime() - 86400000); start.setHours(0, 0, 0, 0);
      const end = new Date(now.getTime() - 86400000); end.setHours(23, 59, 59, 999);
      query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
    } else if (customDate) {
      const d = new Date(customDate);
      if (!isNaN(d.getTime())) {
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      }
    }

    // Search query
    if (searchQuery.trim()) {
      query = query.ilike("order_code", `%${searchQuery.trim()}%`);
    }

    // Pagination range
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Lỗi lấy danh sách đơn:", error);
      try {
        const stored = localStorage.getItem("orders_history");
        if (stored) {
          const all = JSON.parse(stored);
          setOrdersList(all.slice(from, to + 1));
          setTotalCount(all.length);
        } else {
          setOrdersList([]);
          setTotalCount(0);
        }
      } catch (_) {
        setOrdersList([]);
        setTotalCount(0);
      }
      setLoading(false);
      return;
    }

    console.log("Orders loaded from Supabase:", data, "Count:", count);
    setOrdersList(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter, customDate, searchQuery, currentPage]);

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);

    const { error } = await cancelOrder(cancellingOrder.id).catch(e => ({ error: e }));
    setIsCancelling(false);

    if (error) {
      console.warn("Supabase cancel failed", error);
      toast.error(`Lỗi hủy đơn: ${error.message}`);
      return;
    }

    toast.success("Đã hủy đơn hàng thành công và hoàn lại tồn kho.");
    setCancellingOrder(null);
    fetchOrders();
    onRefreshProducts();
  };

  const statusOptions = [
    { key: "all" as const, label: "Tất cả" },
    { key: "completed" as const, label: "Hoàn tất" },
    { key: "cancelled" as const, label: "Đã hủy" }
  ];

  const dateOptions = [
    { key: "all" as const, label: "Tất cả" },
    { key: "today" as const, label: "Hôm nay" },
    { key: "yesterday" as const, label: "Hôm qua" }
  ];

  const fromIndex = totalCount ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const toIndex = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col h-[82vh] max-h-[660px] overflow-hidden">
        {/* Header & Filter (Fixed on top) */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0 space-y-2.5">
          <div className="flex justify-between items-center">
            <div>
              <span className="eyebrow block">Quản lý bán hàng · Supabase</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Lịch sử & Quản lý hóa đơn</h2>
            </div>
            <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
          </div>

          {/* Hàng 1: Ô tìm kiếm mã đơn */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (LF-...)"
              className="w-full h-10 border border-slate-200 rounded-xl bg-slate-50/50 pl-9 pr-3.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Hàng 2: Bộ lọc trạng thái (3 Tab chia đều 1/3) */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {statusOptions.map(st => {
              const isActive = statusFilter === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  className={`w-full py-1.5 text-xs text-center transition-all cursor-pointer rounded-lg ${
                    isActive
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-800 font-medium hover:bg-white/50"
                  }`}
                  onClick={() => setStatusFilter(st.key)}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Hàng 3: Bộ lọc thời gian & Custom Ô chọn ngày */}
          <div className="flex items-center gap-2">
            {/* Nhóm nút nhanh 55% */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 flex-1">
              {dateOptions.map(df => {
                const isActive = dateFilter === df.key && !customDate;
                return (
                  <button
                    key={df.key}
                    type="button"
                    className={`text-[11px] py-1.5 text-center font-medium rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-700 font-semibold shadow-xs"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                    onClick={() => { setDateFilter(df.key); setCustomDate(""); }}
                  >
                    {df.label}
                  </button>
                );
              })}
            </div>

            {/* Ô chọn ngày Custom 45% */}
            <label className={`relative flex items-center justify-between h-9 px-2.5 bg-white border rounded-xl text-[11px] font-medium text-slate-600 hover:border-emerald-500 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 shadow-xs cursor-pointer transition-all ${customDate ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"}`}>
              <input
                type="date"
                value={customDate}
                onChange={e => { setCustomDate(e.target.value); setDateFilter("custom"); }}
                className="w-full bg-transparent text-slate-700 text-[11px] outline-none cursor-pointer font-medium"
              />
            </label>
          </div>
        </div>

        {/* Scrollable Order List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Đang tải lịch sử hóa đơn...</div>
          ) : ordersList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Chưa có đơn hàng nào phù hợp.</div>
          ) : (
            ordersList.map(o => {
              const st = (o.status || "").toLowerCase().trim();
              const isCancelled = st === "cancelled" || st === "đã hủy";
              const itemCount = o.order_items?.length || 0;

              return (
                <div
                  key={o.id || o.order_code}
                  className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2 transition-all ${isCancelled ? "opacity-75" : "hover:border-emerald-200 shadow-xs"}`}
                >
                  {/* Hàng 1: Mã đơn (LF-...) in đậm + Thời gian (Giờ · Ngày) + Badge trạng thái */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <strong className="text-sm font-bold text-slate-800 shrink-0">{o.order_code}</strong>
                      <span className="text-xs text-slate-400 font-normal truncate">
                        {formatDateTime(o.created_at)}
                      </span>
                    </div>
                    <Badge tone={isCancelled ? "red" : "green"}>
                      {isCancelled ? "Đã hủy" : "Hoàn tất"}
                    </Badge>
                  </div>

                  {/* Hàng 2: Chi tiết sản phẩm + Đơn vị tính + PTTT */}
                  <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="truncate font-medium text-slate-700 max-w-xs">
                      {o.order_items && o.order_items.length > 0
                        ? o.order_items.map((it: any) => `${it.product_name || "Sản phẩm"} (${it.quantity} ${it.unit || "Kg"})`).join(", ")
                        : `${itemCount} sản phẩm`}
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0">
                      PTTT: <b className="text-slate-600">{o.payment_method || "Chuyển khoản"}</b>
                    </div>
                  </div>

                  {/* Hàng 3: Tổng tiền + Nút hành động */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] text-slate-400 font-medium">Tổng:</span>
                      <strong className="text-sm sm:text-base font-bold text-emerald-700">
                        {formatMoney(o.total_amount || 0)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="outline-button h-8 text-xs px-2.5 bg-white"
                        onClick={() => onReprint(o)}
                        title="Xem & in lại hóa đơn"
                      >
                        <Printer size={13} /> In lại
                      </button>

                      {!isCancelled && (
                        <button
                          type="button"
                          className="h-8 px-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          onClick={() => setCancellingOrder(o)}
                          title="Hủy đơn hàng này"
                        >
                          <XCircle size={13} /> Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pagination Bar */}
        <div className="border-t border-slate-100 p-3 bg-white flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị {fromIndex}-{toIndex} / {totalCount} đơn
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              disabled={currentPage >= totalPages || totalCount === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Cancel Modal */}
      {cancellingOrder && (
        <div className="modal-overlay z-[10000]">
          <div className="form-modal max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Xác nhận hủy đơn hàng?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có chắc chắn muốn hủy đơn hàng <b className="text-slate-800">{cancellingOrder.order_code}</b>? Hành động này sẽ tự động cộng hoàn trả số lượng tồn kho cho tất cả sản phẩm trong đơn.
            </p>
            <div className="modal-actions flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="outline-button text-xs"
                disabled={isCancelling}
                onClick={() => setCancellingOrder(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="primary-button bg-rose-600 hover:bg-rose-700 text-white text-xs border-0"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
