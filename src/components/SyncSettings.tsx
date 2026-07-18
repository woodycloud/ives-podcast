import React, { useState, useEffect } from "react";
import { usePodcast } from "../context/PodcastContext";
import { Copy, RefreshCw, Key, Check, HelpCircle, HardDrive, Trash2, ShieldCheck } from "lucide-react";
import * as db from "../utils/db";

export const SyncSettings: React.FC = () => {
  const {
    userId,
    setCustomUserId,
    isOnline,
    syncStatus,
    triggerSync,
    subscriptions,
    downloads,
    clearAllDownloads
  } = usePodcast();

  const [inputCode, setInputCode] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [cacheSize, setCacheSize] = useState<string>("Calculating...");
  const [autoDelete, setAutoDelete] = useState<boolean>(() => {
    return localStorage.getItem("auto_delete_completed") === "true";
  });
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

  useEffect(() => {
    const fetchSize = async () => {
      try {
        const bytes = await db.getDownloadsSize();
        const mb = (bytes / (1024 * 1024)).toFixed(1);
        setCacheSize(`${mb} MB`);
      } catch (e) {
        setCacheSize("0.0 MB");
      }
    };
    fetchSize();
  }, [downloads]);

  const handleClearCache = async () => {
    try {
      await clearAllDownloads();
      setCacheSize("0.0 MB");
    } catch (e) {
      console.error(e);
    } finally {
      setIsConfirmingClear(false);
    }
  };

  const handleToggleAutoDelete = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoDelete(val);
    localStorage.setItem("auto_delete_completed", val ? "true" : "false");
  };

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

      {/* 自动离线空间管理 */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-4 animate-fadeIn">
        <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100 flex items-center">
          <HardDrive className="w-4 h-4 mr-1.5 text-[#007AFF]" />
          Automatic Cache Management (自动离线空间管理)
        </h3>
        
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed text-left">
          Manage local storage used by downloaded offline episodes. Clear cache or configure automatic cleanup rules to save disk space.
        </p>

        {/* Storage Stats */}
        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3.5 border border-neutral-100 dark:border-neutral-800">
          <div className="space-y-0.5 text-left">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Storage Used</span>
            <div className="text-base font-black text-neutral-800 dark:text-neutral-100">{cacheSize}</div>
          </div>
          
          {downloads.length > 0 ? (
            isConfirmingClear ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-3 py-1.5 bg-[#FF3B30] text-white text-[11px] font-bold rounded-lg active:scale-95 transition-all shadow-sm shadow-red-500/10 cursor-pointer"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2.5 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-red-50 dark:bg-neutral-800 dark:hover:bg-red-950/20 text-neutral-600 dark:text-neutral-300 hover:text-[#FF3B30] dark:hover:text-[#FF3B30] text-[11px] font-bold rounded-xl active:scale-95 transition-all flex items-center space-x-1.5 border border-neutral-200/50 dark:border-neutral-700/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>一键清理缓存 (Clear Cache)</span>
              </button>
            )
          ) : (
            <div className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 flex items-center bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-lg select-none">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Cache Clean
            </div>
          )}
        </div>

        {/* Auto Cleanup Rules */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Cache Rules</span>
          
          <label className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors">
            <div className="space-y-0.5 text-left pr-4">
              <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">Auto-Delete Completed Episodes</span>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
                Automatically remove downloaded audio files once you finish listening to them.
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoDelete}
                onChange={handleToggleAutoDelete}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#007AFF]"></div>
            </div>
          </label>
        </div>
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
