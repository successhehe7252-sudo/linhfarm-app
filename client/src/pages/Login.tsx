import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, Leaf, Lock, LogIn, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatAuthError = (msg?: string) => {
    if (!msg) return "Email hoặc mật khẩu không chính xác.";
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "Email hoặc mật khẩu không chính xác.";
    }
    if (lower.includes("email not confirmed")) {
      return "Địa chỉ Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn.";
    }
    if (lower.includes("user not found")) {
      return "Tài khoản không tồn tại trong hệ thống.";
    }
    if (lower.includes("too many requests") || lower.includes("rate limit")) {
      return "Bạn đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.";
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ Email");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.error) {
        const friendlyError = formatAuthError(res.error.message);
        setErrorMsg(friendlyError);
        toast.error(friendlyError);
      } else {
        toast.success(`Đăng nhập thành công với ${email.trim()}`);
      }
    } catch (err: any) {
      const friendlyError = formatAuthError(err?.message);
      setErrorMsg(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Pattern */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/5 relative z-10 animate-in fade-in-50 zoom-in-95 duration-300">
        
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 p-2.5 border border-emerald-100 shadow-md shadow-emerald-600/10 flex items-center justify-center mb-3 group hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.webp"
              alt="LinhFarm Logo"
              className="w-full h-full object-contain rounded-xl"
              onError={e => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <Leaf size={32} className="text-emerald-600 hidden group-has-[:hidden]:block" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Sparkles size={12} className="text-emerald-600" /> Vận Hành Cửa Hàng Nông Sản
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Đăng Nhập LinhFarm
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Nhập tài khoản & mật khẩu nội bộ để truy cập hệ thống POS
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-in fade-in-50">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ten-ban@email.com"
                className="w-full h-11 pl-10 pr-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all"
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-10 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all"
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              Ghi nhớ đăng nhập
            </label>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-2xl w-full shadow-lg shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
          >
            {loading || authLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang kết nối Supabase Auth...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Đăng Nhập Hệ Thống</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
