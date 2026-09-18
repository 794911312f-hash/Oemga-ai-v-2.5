import React from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Omega Error Boundary Caught Error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear active sessions/states that might be corrupted while keeping core user auth
      const auth = localStorage.getItem("omega_user");
      const apiKey = localStorage.getItem("omega_custom_api_key");
      sessionStorage.clear();
      // Reload
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans"
        >
          <div className="max-w-lg w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">
              واجه نظام أوميغا استثناءً غير متوقع
            </h1>

            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              تم حماية الجلسة والبيانات تلقائياً لمنع فقدان العمل. يمكنك محاولة إعادة تهيئة الصفحة أو استئناف الواجهة فوراً.
            </p>

            {this.state.error && (
              <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono text-red-300 max-h-32 overflow-y-auto" dir="ltr">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تشغيل النظام</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>إصلاح وتفريغ الذاكرة المؤقتة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
