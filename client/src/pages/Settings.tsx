import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bell, Check, Copy, CreditCard, FileText, Receipt, Search, Settings, X } from "lucide-react";
import { DEFAULT_VIETQR_BANKS, fetchVietQrBanks, findBankByQuery, type VietQrBank } from "@/lib/vietqr";
import { toast } from "sonner";

export interface StoreSettingsData {
  address: string;
  phone: string;
  bank_bin: string;
  bank_short_name: string;
  bank_name: string;
  bank_account: string; // also alias account_number
  account_name: string;
  fanpageUrl?: string;

  // Backwards compatibility properties
  bank: string;
  account: string;
  accountName: string;
}

export function BankSelectCombobox({
  selectedBin,
  selectedShortName,
  onSelect,
  className = "",
}: {
  selectedBin?: string;
  selectedShortName?: string;
  onSelect: (bank: VietQrBank) => void;
  className?: string;
}) {
  const [banks, setBanks] = useState<VietQrBank[]>(DEFAULT_VIETQR_BANKS);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchVietQrBanks().then(list => {
      if (active && list.length > 0) {
        setBanks(list);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBank = banks.find(
    b => (selectedBin && b.bin === selectedBin) || (selectedShortName && (b.shortName === selectedShortName || b.code === selectedShortName))
  ) || findBankByQuery(selectedBin || selectedShortName, banks);

  const filteredBanks = banks.filter(b => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      b.shortName.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.bin.includes(q)
    );
  });

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-left flex items-center justify-between shadow-none hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
      >
        {currentBank ? (
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {currentBank.logo ? (
              <img
                src={currentBank.logo}
                alt={currentBank.shortName}
                className="w-6 h-6 object-contain shrink-0 rounded bg-slate-50 p-0.5 border border-slate-100"
                onError={e => { (e.target as HTMLElement).style.display = "none"; }}
              />
            ) : null}
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-800 text-xs">{currentBank.shortName}</span>
              <span className="text-[11px] text-slate-400 font-mono">({currentBank.bin})</span>
              <span className="text-xs text-slate-500 truncate max-w-[180px] hidden sm:inline">- {currentBank.name}</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Chọn ngân hàng VietQR chuẩn...</span>
        )}
        <span className="text-slate-400 text-xs font-mono ml-auto pl-1">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] p-2 max-h-72 flex flex-col gap-1.5 animate-in fade-in-50 zoom-in-95">
          <div className="relative flex items-center shrink-0">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo MB, Vietcombank, Techcombank, BIN 970422..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-56 space-y-0.5 divide-y divide-slate-100">
            {filteredBanks.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy ngân hàng khớp với "{query}"
              </div>
            ) : (
              filteredBanks.map(b => {
                const isSelected = currentBank?.bin === b.bin;
                return (
                  <button
                    key={b.bin}
                    type="button"
                    onClick={() => {
                      onSelect(b);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`w-full p-2 rounded-lg text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-emerald-50 text-emerald-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <img
                      src={b.logo}
                      alt={b.shortName}
                      className="w-6 h-6 object-contain shrink-0 rounded bg-white p-0.5 border border-slate-100"
                      onError={e => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">{b.shortName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">BIN: {b.bin}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate">{b.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsModal({
  kind,
  info,
  onClose,
  onSave,
}: {
  kind: "shop" | "invoice" | "payment";
  info: StoreSettingsData;
  onClose: () => void;
  onSave: (updated: StoreSettingsData) => void;
}) {
  const [form, setForm] = useState<StoreSettingsData>({ ...info });

  const title =
    kind === "payment"
      ? "Cài Đặt VietQR & Thanh Toán"
      : kind === "invoice"
      ? "Thông tin hóa đơn"
      : "Thông tin cửa hàng";

  const handleBankSelect = (bank: VietQrBank) => {
    setForm(prev => ({
      ...prev,
      bank_bin: bank.bin,
      bank_short_name: bank.shortName,
      bank_name: bank.name,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "payment") {
      if (!form.bank_bin) {
        toast.error("Vui lòng chọn một ngân hàng từ danh sách VietQR");
        return;
      }
      if (!form.bank_account.trim()) {
        toast.error("Vui lòng nhập số tài khoản ngân hàng");
        return;
      }
      if (!form.account_name.trim()) {
        toast.error("Vui lòng nhập tên chủ tài khoản");
        return;
      }
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <form className="form-modal max-w-lg" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow text-emerald-600 font-bold uppercase text-[10px]">Cài đặt LinhFarm</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="form-grid">
          {kind !== "payment" && (
            <>
              <label className="full-field">
                Địa chỉ cửa hàng
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50"
                />
              </label>
              <label>
                Số điện thoại
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50"
                />
              </label>
            </>
          )}

          {kind === "payment" && (
            <>
              <div className="full-field">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngân hàng thụ hưởng (VietQR Chuẩn) <span className="text-red-500">*</span>
                </label>
                <BankSelectCombobox
                  selectedBin={form.bank_bin}
                  selectedShortName={form.bank_short_name}
                  onSelect={handleBankSelect}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Chọn ngân hàng từ danh sách chuẩn VietQR để tự động tạo mã QR chính xác.
                </p>
              </div>

              <label>
                Số tài khoản <span className="text-red-500">*</span>
                <input
                  type="text"
                  required
                  value={form.bank_account}
                  onChange={e => setForm({ ...form, bank_account: e.target.value })}
                  placeholder="Ví dụ: 3633366568686"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 font-mono font-bold text-slate-800"
                />
              </label>

              <label className="full-field">
                Tên chủ tài khoản (Viết hoa không dấu) <span className="text-red-500">*</span>
                <input
                  type="text"
                  required
                  value={form.account_name}
                  onChange={e => setForm({ ...form, account_name: e.target.value.toUpperCase() })}
                  placeholder="LINH FARM"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 font-bold uppercase text-slate-800"
                />
              </label>

              <label className="full-field">
                Link Fanpage / Facebook Cửa Hàng
                <input
                  value={form.fanpageUrl || ""}
                  onChange={e => setForm({ ...form, fanpageUrl: e.target.value })}
                  placeholder="https://facebook.com/linhfarm.dalat"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50"
                />
              </label>
            </>
          )}

          {kind === "invoice" && (
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Khổ giấy máy in
              <select className="h-10 border border-slate-200 rounded-lg px-3 bg-slate-50 text-xs font-medium">
                <option value="80mm">80mm (K80 - Phổ biến)</option>
                <option value="58mm">58mm (K58 - Nhỏ gọn)</option>
              </select>
            </label>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="outline-button" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="primary-button">
            <Check size={16} /> Lưu cài đặt
          </button>
        </div>
      </form>
    </div>
  );
}

export function SettingsPage({
  storeInfo,
  onEdit,
}: {
  storeInfo: StoreSettingsData;
  onEdit: (kind: "shop" | "invoice" | "payment" | "orders") => void;
}) {
  const bankLabel = storeInfo.bank_short_name || storeInfo.bank_name || "MB Bank";

  const items = [
    { icon: Receipt, title: "Lịch sử & Quản lý hóa đơn", detail: "Tra cứu, in lại hoặc hủy đơn hàng xuất nhầm", kind: "orders" as const },
    { icon: FileText, title: "Thông tin hóa đơn", detail: `${storeInfo.address} · ${storeInfo.phone}`, kind: "invoice" as const },
    { icon: CreditCard, title: "Thanh toán & Mã VietQR Chuẩn", detail: `${bankLabel} · STK: ${storeInfo.bank_account} · ${storeInfo.account_name}`, kind: "payment" as const },
    { icon: Bell, title: "Thông báo tồn kho", detail: "Cảnh báo khi sản phẩm dưới mức tối thiểu" },
    { icon: Settings, title: "Giao diện & thiết bị", detail: "Máy in nhiệt · 80mm · Tiếng Việt" },
  ];

  return (
    <section className="page-section settings-page">
      <div className="settings-card shop-profile-card">
        <div className="big-logo">
          <img src="/logo.webp" alt="LinhFarm Logo" onError={e => { e.currentTarget.src = "/logo.webp"; }} />
        </div>
        <div>
          <h3>LinhFarm · Đà Lạt</h3>
          <p>{storeInfo.address}</p>
          <span>Đang hoạt động · {storeInfo.phone}</span>
        </div>
        <button className="outline-button" onClick={() => onEdit("shop")}>Chỉnh sửa</button>
      </div>

      <div className="settings-list">
        {items.map(x => (
          <button className="settings-row" key={x.title} onClick={() => x.kind && onEdit(x.kind)}>
            <span className="settings-icon"><x.icon size={18} /></span>
            <span>
              <strong>{x.title}</strong>
              <small>{x.detail}</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}
