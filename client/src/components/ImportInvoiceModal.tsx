import React, { useState } from "react";
import { X, Upload, Sparkles, Check, FileText, AlertCircle, Building2, PackageCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { parseInvoiceWithGemini, ExtractedInvoiceData } from "@/lib/gemini";
import { supabase, createPurchaseOrder } from "@/lib/supabase";

interface ImportInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportInvoiceModal({ onClose, onSuccess }: ImportInvoiceModalProps) {
  const [step, setStep] = useState<"upload" | "parsing" | "preview" | "saving">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Vui lòng chọn file hình ảnh (PNG, JPG, WEBP) hoặc file PDF hóa đơn.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng file không được vượt quá 10MB.");
      return;
    }

    setFile(selectedFile);

    // Create local object URL for preview without uploading anywhere
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    // Process file in-memory using FileReader to Base64
    processFileInBase64(selectedFile);
  };

  const processFileInBase64 = (fileToRead: File) => {
    setStep("parsing");
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const parsed = await parseInvoiceWithGemini(base64Data, fileToRead.type);
        setExtractedData(parsed);
        setStep("preview");
        toast.success("AI Gemini đã bóc tách hóa đơn thành công!");
      } catch (err: any) {
        console.error("[Invoice OCR Error]", err);
        toast.error(err.message || "Không thể phân tích hóa đơn.");
        setStep("upload");
      }
    };

    reader.onerror = () => {
      toast.error("Không thể đọc file từ thiết bị.");
      setStep("upload");
    };

    reader.readAsDataURL(fileToRead);
  };

  const handleConfirmAndSave = async () => {
    if (!extractedData) return;

    setStep("saving");
    try {
      // Step 1: Check or insert Supplier by name
      let supplierId: number | null = null;
      const suppName = (extractedData.supplier.name || "Nhà cung cấp từ Hóa Đơn").trim();
      let supplierName = suppName;

      const { data: existingSup } = await supabase
        .from("suppliers")
        .select("id, name")
        .ilike("name", suppName)
        .maybeSingle();

      if (existingSup) {
        supplierId = existingSup.id;
      } else {
        const { data: newSup, error: suppErr } = await supabase
          .from("suppliers")
          .insert({
            name: suppName,
            phone: extractedData.supplier.phone || "",
            address: extractedData.supplier.address || "",
            note: "Nhập từ Hóa đơn VAT (AI Gemini)",
          })
          .select("id")
          .single();

        if (!suppErr && newSup) {
          supplierId = newSup.id;
        }
      }

      // Step 2: Loop over items, check/insert Products
      const poItems: { productId: number; qty: number; unitCost: number }[] = [];

      for (const item of extractedData.items) {
        let prodId: number | null = null;
        const { data: existingProd } = await supabase
          .from("products")
          .select("id, name, cost_price, selling_price")
          .ilike("name", item.name)
          .maybeSingle();

        if (existingProd) {
          prodId = existingProd.id;
        } else {
          // Insert new product
          const cost = Number(item.price || 0);
          const price = Math.round(cost * 1.3); // 30% markup
          const { data: newProd, error: prodErr } = await supabase
            .from("products")
            .insert({
              name: item.name,
              category: "Trái cây",
              unit: item.unit || "Kg",
              cost_price: cost,
              selling_price: price,
              stock: 0,
              min_stock: 5,
              status: "Hết hàng",
              accent: "#FBE7E4",
            })
            .select("id")
            .single();

          if (!prodErr && newProd) {
            prodId = newProd.id;
          }
        }

        if (prodId) {
          poItems.push({
            productId: prodId,
            qty: Number(item.qty || 1),
            unitCost: Number(item.price || 0),
            unit: item.unit || "Kg",
            name: item.name,
          });
        }
      }

      // Step 3 & 4: Insert purchase order & purchase order items & update product stock
      const result = await createPurchaseOrder(
        supplierName,
        poItems,
        supplierId,
        `Nhập tự động bằng AI Gemini`,
        extractedData.sub_total,
        extractedData.vat_amount,
        extractedData.total_amount
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success("Đã tự động lưu nhà cung cấp, cập nhật tồn kho và tạo phiếu nhập thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Database Save Error]", err);
      toast.error(`Lỗi lưu dữ liệu: ${err.message || "Thao tác thất bại"}`);
      setStep("preview");
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="form-modal max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="modal-head flex items-center justify-between p-4 md:p-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-[10px] font-bold text-emerald-600 uppercase tracking-wider">AI Gemini 1.5 Flash</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Miễn phí · In-Memory</span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-800">Import Hóa Đơn bằng AI</h2>
            </div>
          </div>
          <button type="button" className="icon-button w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 rounded-3xl p-8 md:p-12 text-center bg-emerald-50/30 hover:bg-emerald-50/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/png,image/jpeg,image/webp,application/pdf";
                  input.onchange = (e: any) => {
                    if (e.target?.files?.[0]) handleFileSelect(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Upload size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">Kéo thả file hóa đơn vào đây</h3>
                  <p className="text-xs text-slate-500 mt-1">Hỗ trợ file Hình ảnh (PNG, JPG, WEBP) hoặc PDF (Tối đa 10MB)</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs mt-2">
                  Chọn file từ máy tính
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Bảo mật riêng tư:</strong> File hóa đơn được đọc hoàn toàn trực tiếp trên bộ nhớ trình duyệt (In-Memory Base64) và gửi thẳng đến Google Gemini API để bóc tách. File không bao giờ bị lưu trên Server hay Supabase Storage.
                </div>
              </div>
            </div>
          )}

          {step === "parsing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <Sparkles size={24} className="text-emerald-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">AI Gemini đang phân tích hóa đơn...</h3>
                <p className="text-xs text-slate-500 mt-1">Đang bóc tách tên nhà cung cấp, mã số thuế, danh sách mặt hàng và tổng tiền.</p>
              </div>
            </div>
          )}

          {step === "preview" && extractedData && (
            <div className="space-y-4">
              {/* File preview summary */}
              {filePreviewUrl && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <img src={filePreviewUrl} alt="Hóa đơn" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-bold text-slate-800 truncate">{file?.name}</strong>
                    <span className="text-[11px] text-slate-500">{((file?.size || 0) / 1024).toFixed(1)} KB · Hình ảnh</span>
                  </div>
                </div>
              )}

              {/* Extracted Supplier info */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Building2 size={16} />
                  <span>Thông tin Nhà Cung Cấp (Bóc tách tự động)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Tên NCC:</span> <strong className="text-slate-800">{extractedData.supplier.name}</strong></div>
                  <div><span className="text-slate-500">Mã số thuế:</span> <strong className="text-slate-800">{extractedData.supplier.tax_code || "Không có"}</strong></div>
                  <div><span className="text-slate-500">Điện thoại:</span> <strong className="text-slate-800">{extractedData.supplier.phone || "Không có"}</strong></div>
                  <div><span className="text-slate-500">Địa chỉ:</span> <strong className="text-slate-800 truncate">{extractedData.supplier.address || "Không có"}</strong></div>
                </div>
              </div>

              {/* Extracted Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText size={15} className="text-emerald-600" />
                    Danh sách mặt hàng nhập kho ({extractedData.items.length})
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    Tổng tiền: {formatMoney(extractedData.total_amount || extractedData.items.reduce((s, i) => s + i.qty * i.price, 0))}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Tên sản phẩm</th>
                        <th className="p-3 text-center">ĐVT</th>
                        <th className="p-3 text-right">SL</th>
                        <th className="p-3 text-right">Đơn giá nhập</th>
                        <th className="p-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractedData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="p-3 text-center font-medium text-slate-600">{item.unit || "Kg"}</td>
                          <td className="p-3 text-right font-bold text-emerald-700 font-mono">{item.qty}</td>
                          <td className="p-3 text-right font-mono font-medium text-slate-700">{formatMoney(item.price)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">{formatMoney(item.qty * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === "saving" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">Đang lưu nhà cung cấp & tạo phiếu nhập...</h3>
                <p className="text-xs text-slate-500 mt-1">Đang cập nhật tồn kho vào Supabase Database.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 md:p-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button
            type="button"
            className="outline-button px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            onClick={onClose}
            disabled={step === "parsing" || step === "saving"}
          >
            Hủy
          </button>

          {step === "preview" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="outline-button px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                onClick={() => setStep("upload")}
              >
                <RefreshCw size={15} /> Chọn file khác
              </button>
              <button
                type="button"
                className="primary-button px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                onClick={handleConfirmAndSave}
              >
                <PackageCheck size={16} /> Xác nhận & Nhập kho
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
