import React from "react";
import { BarChart3, Boxes, ChevronDown, Lock, Settings, ShoppingBasket, Sparkles, Store, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NavItem {
  id: string;
  label: string;
  short: string;
  icon: any;
  requiresOwner?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "pos", label: "Bán hàng", short: "POS", icon: ShoppingBasket, requiresOwner: false },
  { id: "products", label: "Kho hàng", short: "Kho", icon: Boxes, requiresOwner: false },
  { id: "suppliers", label: "Nhập hàng", short: "Nhập", icon: Truck, requiresOwner: true },
  { id: "dashboard", label: "Báo cáo", short: "Báo cáo", icon: BarChart3, requiresOwner: true },
  { id: "settings", label: "Cài đặt", short: "Cài đặt", icon: Settings, requiresOwner: true },
];

export function SidebarNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const { isOwner, isStaff, roleLabel, fullName } = useAuth();

  const handleItemClick = (item: NavItem) => {
    if (item.requiresOwner && isStaff) {
      toast.error("Bạn cần quyền Quản lý để truy cập mục này");
      return;
    }
    onTabChange(item.id);
  };

  const initials = fullName
    .split(" ")
    .map(n => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "LT";

  return (
    <aside className="sidebar hidden lg:flex shrink-0">
      <div className="brand flex items-center gap-3">
        <img
          src="/logo.webp"
          alt="LinhFarm Logo"
          className="w-10 h-10 rounded-full object-cover border border-slate-200/80 shadow-xs overflow-hidden flex-shrink-0"
          onError={e => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div>
          <strong>
            Linh<span>Farm</span>
          </strong>
          <small>Đà Lạt · POS</small>
        </div>
      </div>

      <div className="shop-switch flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Store size={16} className="text-emerald-600 shrink-0" />
          <span className="truncate font-semibold text-xs text-slate-800">Cửa hàng trung tâm</span>
        </div>
        <ChevronDown size={15} className="text-slate-400 shrink-0" />
      </div>

      <nav className="flex flex-col gap-1 my-3">
        {NAV_ITEMS.map(item => {
          const isRestricted = item.requiresOwner && isStaff;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`nav-item flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "nav-active bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600 shadow-sm"
                  : isRestricted
                  ? "text-slate-400 hover:bg-slate-100/50 opacity-70"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <item.icon size={19} className={isActive ? "text-emerald-700" : isRestricted ? "text-slate-400" : "text-slate-500"} />
                <span className="truncate">{item.label}</span>
              </div>
              {isRestricted ? (
                <Lock size={13} className="text-slate-400 shrink-0 ml-1" />
              ) : isActive ? (
                <i className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 ml-1" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="side-note mt-auto mb-3">
        <Sparkles size={16} />
        <div>
          <b>Mùa dâu Đà Lạt</b>
          <span>Doanh thu đang tăng 18%</span>
        </div>
      </div>

      <div className="profile flex items-center gap-2.5 p-2 bg-slate-100/70 rounded-xl">
        <div className="avatar w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <b className="block text-xs font-bold text-slate-800 truncate">{fullName}</b>
          <span className="block text-[10px] text-slate-500 font-medium truncate">{roleLabel}</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const { isStaff } = useAuth();

  const handleItemClick = (item: NavItem) => {
    if (item.requiresOwner && isStaff) {
      toast.error("Bạn cần quyền Quản lý để truy cập mục này");
      return;
    }
    onTabChange(item.id);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 lg:hidden flex items-center justify-around py-2 px-1 shadow-lg">
      {NAV_ITEMS.map(item => {
        const isRestricted = item.requiresOwner && isStaff;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item)}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? "text-emerald-700 font-bold bg-emerald-50"
                : isRestricted
                ? "text-slate-400 opacity-60"
                : "text-slate-500 font-medium hover:text-slate-800"
            }`}
          >
            <div className="relative">
              <item.icon size={20} />
              {isRestricted && (
                <Lock size={10} className="absolute -top-1 -right-1 text-slate-500 bg-white rounded-full p-0.5" />
              )}
            </div>
            <span className="text-[10px]">{item.short || item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
