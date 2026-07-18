import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { Key, Radio, ShieldAlert, Loader2, ArrowRight } from "lucide-react";

export const ActivationPage: React.FC = () => {
  const { validateAndActivateKey } = usePodcast();
  const [keyInput, setKeyInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await validateAndActivateKey(keyInput);
      if (result.success) {
        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg("请求失败，请检查网络是否正常。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-neutral-950/50 space-y-8 animate-fadeIn text-center">
        
        {/* Brand & Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shadow-inner relative">
            <Radio className="w-8 h-8 text-[#007AFF] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900"></div>
          </div>
          <div className="space-y-1">
            <h1 className="font-sans font-black text-2xl tracking-tight text-neutral-900 dark:text-neutral-50">
              IVES Podcast
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold">
              Minimalist Listening Space
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 text-left space-y-1.5">
          <div className="flex items-center text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Private Access Verification</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            This is a private-curated podcast platform. To ensure exclusive bandwidth and sync capabilities, please activate using your Sync / Activation Key.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pl-1">
              Sync / Activation Key
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-4 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                autoFocus
                disabled={loading}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="IVES-POD-ACTIVE-XXX"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 hover:bg-neutral-100/50 dark:bg-neutral-950 dark:hover:bg-neutral-900/50 focus:bg-white dark:focus:bg-neutral-900 text-sm font-semibold rounded-2xl border border-neutral-200/60 dark:border-neutral-800 focus:border-[#007AFF] dark:focus:border-[#007AFF] text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 text-left animate-shake">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-left">
              {successMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !keyInput.trim()}
            className="w-full py-4 bg-[#007AFF] hover:bg-[#007AFF]/95 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Key...</span>
              </>
            ) : (
              <>
                <span>Activate Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
          Powered by IVES Audio Engine &bull; Private PWA Distribution
        </p>
      </div>
    </div>
  );
};
