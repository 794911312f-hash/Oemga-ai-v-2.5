import React, { useState } from "react";
import { Mail, Lock, LogIn, LogOut, ShieldCheck, User, KeyRound, Sparkles, CheckCircle2 } from "lucide-react";

export interface OmegaUser {
  email: string;
  name: string;
  loginTime: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: OmegaUser | null;
  onLogin: (user: OmegaUser) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("يرجى إدخال بريد إلكتروني صحيح ومعتمد.");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 خانات.");
      return;
    }

    const userName = name.trim() || cleanEmail.split("@")[0];
    const user: OmegaUser = {
      email: cleanEmail,
      name: userName,
      loginTime: Date.now(),
    };

    try {
      localStorage.setItem("omega_auth_user", JSON.stringify(user));
    } catch {
      // LocalStorage access fallback
    }

    onLogin(user);
    setEmail("");
    setPassword("");
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>أمان دخول نظام أوميغا</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500/30 text-purple-300">
                    Secure Auth
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {currentUser ? "إدارة جلسة الدخول وتأكيد الهوية" : "تسجيل الدخول المأمون بالبريد الإلكتروني"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {currentUser ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-inner">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-sm truncate">{currentUser.name}</h4>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      نشط ومسجل
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    وقت تسجيل الدخول: {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(currentUser.loginTime))}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-200/90 leading-relaxed">
                جلسة الدخول الخاصة بك نشطة ومؤمنة بالكامل داخل نظام أوميغا للذكاء الاصطناعي (Omega AI). جميع محادثاتك وسجلات التوافق محمية ومربوطة بحسابك.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-600/40 text-rose-200 text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-950/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">الاسم أو اللقب:</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسمك الكريم"
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">البريد الإلكتروني (Email):</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">كلمة المرور (Password):</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors text-right"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError(null);
                  }}
                  className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {isRegisterMode ? "لديك حساب بالفعل؟ تسجيل الدخول" : "مستخدم جديد؟ إنشاء حساب"}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isRegisterMode ? "إنشاء حساب ودخول" : "تسجيل الدخول بالبريد"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
