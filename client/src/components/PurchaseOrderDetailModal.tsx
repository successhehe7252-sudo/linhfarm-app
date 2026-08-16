import React, { useEffect, useState } from "react";
import { X, Receipt, Calendar, FileText, Truck } from "lucide-react";
import { supabase, type SupabasePurchaseOrder, type SupabaseSupplier } from "@/lib/supabase";

interface PurchaseOrderDetailModalProps {
  order: SupabasePurchaseOrder;
  onClose: () => void;
}

export function PurchaseOrderDetailModal({ order, onClose }: PurchaseOrderDetailModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [supplier, setSupplier] = useState<SupabaseSupplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      setLoading(true);
      try {
        // Pre-fill supplier if joined in order prop
        if ((order as any).supplier) {
          setSupplier((order as any).supplier);
        } else if (order.supplier_id) {
          const { data: suppData } = await supabase
            .from("suppliers")
            .select("*")
            .eq("id", order.supplier_id)
            .maybeSingle();
          if (!cancelled && suppData) setSupplier(suppData);
        }

        // Pre-fill items if joined in order prop
        const preItems = (order as any).items || (order as any).purchase_order_items;
        if (preItems && Array.isArray(preItems) && preItems.length > 0) {
          const formatted = preItems.map((item: any) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.import_price || item.unit_cost || 0);
            const lineTot = Number(item.total_price || (qty * price) || 0);
            return {
              id: item.id,
              productName: item.product?.name || item.products?.name || item.product_name || `Sản phẩm #${item.product_id}`,
              unit: item.product?.unit || item.products?.unit || item.unit || "Kg",
              quantity: qty,
              unitPrice: price,
              lineTotal: lineTot,
              image: item.product?.image_url || item.products?.image_url || "/logo.webp",
            };
          });
          if (!cancelled) setItems(formatted);
        } else {
          // Fetch purchase order items with product details
          const { data: poItemsData } = await supabase
            .from("purchase_order_items")
            .select("id, product_id, quantity, import_price, total_price, unit_cost, created_at, products(name, unit, image_url)")
            .eq("purchase_order_id", order.id);

          if (!cancelled && poItemsData) {
            const formatted = poItemsData.map((item: any) => {
              const qty = Number(item.quantity || 0);
              const price = Number(item.import_price || item.unit_cost || 0);
              const lineTot = Number(item.total_price || (qty * price) || 0);
              return {
                id: item.id,
                productName: item.products?.name || item.product_name || `Sản phẩm #${item.product_id}`,
                unit: item.products?.unit || item.unit || "Kg",
                quantity: qty,
                unitPrice: price,
                lineTotal: lineTot,
                image: item.products?.image_url || "/logo.webp",
              };
            });
            setItems(formatted);
          }
        }
      } catch (err) {
        console.error("Failed to load PO details", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [order]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const rawSubTotal = (order as any).sub_total;
  const rawVat = (order as any).vat_amount;
  const rawTotal = (order as any).total_amount;

  const totalAmount = Number(rawTotal || 0);
  const subTotalAmount = rawSubTotal != null && !isNaN(Number(rawSubTotal)) ? Number(rawSubTotal) : totalAmount;
  const vatAmount = rawVat != null && !isNaN(Number(rawVat)) ? Number(rawVat) : 0;

  return (
    <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="form-modal max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="modal-head flex items-center justify-between p-4 md:p-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Phiếu nhập kho</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {order.status === "received" || order.status === "Hoàn thành" ? "Đã nhập kho" : order.status}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-800">{order.purchase_code || `PO-#${order.id}`}</h2>
            </div>
          </div>
          <button
            type="button"
            className="icon-button w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Order & Supplier Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <Calendar size={15} className="text-emerald-600" /> Thông tin đơn nhập
              </div>
              <div><span className="text-slate-500">Mã phiếu:</span> <strong className="text-slate-800 font-mono">{order.purchase_code}</strong></div>
              <div><span className="text-slate-500">Thời gian nhập:</span> <strong className="text-slate-800">{formatDate(order.created_at || order.received_at)}</strong></div>
              {order.note && <div><span className="text-slate-500">Ghi chú:</span> <span className="text-slate-700">{order.note}</span></div>}
            </div>

            <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                <Truck size={15} className="text-emerald-600" /> Nhà cung cấp
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 shrink-0 whitespace-nowrap">Tên NCC:</span>
                <strong className="text-emerald-900 font-semibold break-words whitespace-normal">
                  {supplier?.name || order.supplier_name || "Nhà cung cấp"}
                </strong>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 shrink-0 whitespace-nowrap">Mã số thuế:</span>
                <strong className="text-slate-800 font-mono font-medium">
                  {supplier?.tax_code || (order as any).supplier?.tax_code || "Không có"}
                </strong>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 shrink-0 whitespace-nowrap">Số điện thoại:</span>
                <strong className="text-slate-800 font-medium">
                  {supplier?.phone || "Không có"}
                </strong>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 shrink-0 whitespace-nowrap">Địa chỉ:</span>
                <span className="text-slate-800 font-medium break-words whitespace-normal">
                  {supplier?.address || "Không có"}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText size={15} className="text-emerald-600" />
                Danh sách mặt hàng nhập ({items.length})
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách sản phẩm...</div>
            ) : items.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                Không có thông tin chi tiết sản phẩm.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Tên sản phẩm</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3 text-right">Số lượng</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                          <img src={item.image} alt={item.productName} className="w-7 h-7 object-cover rounded-md border border-slate-200" onError={e => { e.currentTarget.src = "/logo.webp"; }} />
                          <span>{item.productName}</span>
                        </td>
                        <td className="p-3 text-center font-medium text-slate-600">{item.unit}</td>
                        <td className="p-3 text-right font-bold text-emerald-700 font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-700">{formatMoney(item.unitPrice)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">{formatMoney(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3-Line Summary Section */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Tạm tính (Tiền hàng):</span>
              <span className="font-mono font-semibold text-slate-800">{formatMoney(subTotalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Thuế GTGT (VAT):</span>
              <span className="font-mono font-semibold text-slate-800">{formatMoney(vatAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200/80 pt-2 text-emerald-800">
              <span>Tổng thanh toán:</span>
              <span className="font-mono text-base text-emerald-700">{formatMoney(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="text-xs">
            <span className="text-slate-500">Mã phiếu nhập: </span>
            <strong className="font-mono font-bold text-slate-800">{order.purchase_code}</strong>
          </div>
          <button
            type="button"
            className="outline-button px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
