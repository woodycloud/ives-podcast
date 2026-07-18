import React from "react";
import { AlertCircle, RotateCw, Trash2, ShieldAlert } from "lucide-react";

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
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleHardReload = () => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("v", Date.now().toString());
        window.location.replace(url.toString());
      } catch (e) {
        window.location.reload();
      }
    }
  };

  private handleClearAllData = async () => {
    if (!confirm("Are you sure you want to clear all local data? This will unsubscribe podcasts and delete downloaded offline episodes, resetting the app to a clean state.")) {
      return;
    }

    try {
      localStorage.clear();

      if (typeof indexedDB !== "undefined") {
        const dbs = ["MinimalistPodcastDB"];
        dbs.forEach(dbName => {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (err) {
            console.error("Failed to delete database:", dbName, err);
          }
        });
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      alert("Local data and caches have been fully cleared! The app will now reload.");
      this.handleHardReload();
    } catch (err: any) {
      alert(`Failed to fully clear: ${err.message || err}. Reloading app anyway.`);
      this.handleHardReload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center antialiased select-none font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-neutral-100 shadow-xl shadow-neutral-100/40 space-y-6">
            
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#FF3B30]">
                <ShieldAlert className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-black text-neutral-900 tracking-tight">
                App Encountered an Issue
              </h1>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                An unexpected error occurred during rendering. This is often due to an outdated browser cache.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-neutral-50 rounded-2xl p-4 text-left border border-neutral-100 space-y-2 max-h-40 overflow-y-auto">
                <div className="flex items-center space-x-1.5 text-[#FF3B30]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Error details</span>
                </div>
                <p className="text-[11px] font-mono font-medium text-neutral-700 break-words">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[9px] font-mono text-neutral-400 overflow-x-auto whitespace-pre-wrap leading-tight pt-1 border-t border-neutral-100">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col space-y-2.5">
              <button
                id="err-btn-reload"
                onClick={this.handleHardReload}
                className="w-full py-3 bg-[#007AFF] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-[#007AFF]/15 flex items-center justify-center space-x-2"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Force Update & Reload</span>
              </button>

              <button
                id="err-btn-clear"
                onClick={this.handleClearAllData}
                className="w-full py-3 bg-neutral-100 text-neutral-600 hover:text-[#FF3B30] hover:bg-red-50 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Cache & Reset</span>
              </button>
            </div>

          </div>
          
          <p className="text-[10px] text-neutral-400 mt-6 font-medium">
            Minimalist Podcast • Ives' Custom Client
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
