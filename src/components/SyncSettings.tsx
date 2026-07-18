import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { Copy, RefreshCw, Key, Check, HelpCircle } from "lucide-react";

export const SyncSettings: React.FC = () => {
  const {
    userId,
    setCustomUserId,
    isOnline,
    syncStatus,
    triggerSync,
    subscriptions
  } = usePodcast();

  const [inputCode, setInputCode] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setUpdating(true);
    setStatusMsg("");
    try {
      const success = await setCustomUserId(inputCode.trim());
      if (success) {
        setStatusMsg("Subscriptions successfully merged and synced!");
        setInputCode("");
      } else {
        setStatusMsg("Invalid sync key. Please check the format.");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("An error occurred during sync. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Introduction Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100 flex items-center">
          <Key className="w-4 h-4 mr-1.5 text-[#007AFF]" />
          Multi-Device Cloud Sync
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Minimalist Podcast supports automatic cloud synchronization of your subscription list. Simply enter your sync key on any other device (phone, computer, tablet) to instantly merge and sync your subscriptions.
        </p>

        {/* Sync Status Badge */}
        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Network & Sync Status</span>
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                ● Offline Mode
              </span>
            ) : syncStatus === "syncing" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                Syncing...
              </span>
            ) : syncStatus === "error" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                ● Sync Failed
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                ● Synced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Your Sync Key */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-3">
        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Your Sync Key</span>
        
        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 font-mono text-xs select-all">
          <span className="font-bold text-neutral-700 dark:text-neutral-300 tracking-wide">{userId}</span>
          <button
            onClick={handleCopy}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors p-1"
            title="Copy Sync Key"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
          Contains <b>{subscriptions.length}</b> subscribed shows. Copy and save this key to restore or merge your subscriptions on other devices at any time.
        </p>
      </div>

      {/* Link other device */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-4">
        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Link / Merge Other Device</span>
        
        <form onSubmit={handleSyncSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Enter another device's sync key (e.g. MIN-POD-XXXX)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#007AFF] dark:focus:border-[#007AFF] transition-all uppercase tracking-wide"
          />
          <button
            type="submit"
            disabled={updating || !inputCode.trim() || !isOnline}
            className="w-full py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-500 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            {updating ? "Verifying & linking..." : "Verify & Merge Subscriptions"}
          </button>
        </form>

        {statusMsg && (
          <p className="text-[11px] font-medium text-center text-[#007AFF] bg-[#007AFF]/10 p-2.5 rounded-lg border border-[#007AFF]/20 animate-fadeIn">
            {statusMsg}
          </p>
        )}
      </div>

      {/* Offline capability explanation */}
      <div className="bg-neutral-100/60 dark:bg-neutral-900/40 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 flex items-start space-x-3">
        <HelpCircle className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">How does offline listening work?</h4>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal">
            When you click the download icon next to an episode, the app fetches the audio file through our secure proxy and caches it locally using <b>IndexedDB</b> storage.
            When you're offline (on a flight or in the subway), Minimalist Podcast seamlessly plays the local cached file so your listening is never interrupted.
          </p>
        </div>
      </div>
    </div>
  );
};
