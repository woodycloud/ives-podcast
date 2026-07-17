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
        setStatusMsg("成功导入并同步该设备密钥的订阅列表！");
        setInputCode("");
      } else {
        setStatusMsg("密钥无效，请输入正确的格式。");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("同步发生错误，请重试。");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-neutral-800 flex items-center">
          <Key className="w-4 h-4 mr-1.5 text-[#007AFF]" />
          多设备订阅自动同步
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          极简播客支持订阅列表云端同步。您只需要在其他设备（手机、电脑、iPad）上输入当前设备的 **同步密钥**，即可自动融合并实时同步您的所有订阅列表。
        </p>

        {/* Sync Status Badge */}
        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
          <span className="text-xs text-neutral-400">网络与同步状态</span>
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-500">
                ● 离线模式
              </span>
            ) : syncStatus === "syncing" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                同步中...
              </span>
            ) : syncStatus === "error" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                ● 同步失败
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                ● 已自动同步
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Your Sync Key */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-3">
        <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase">当前设备的同步密钥</span>
        
        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100 font-mono text-xs select-all">
          <span className="font-bold text-neutral-700 tracking-wide">{userId}</span>
          <button
            onClick={handleCopy}
            className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
            title="复制密钥"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 leading-normal">
          已包含 <b>{subscriptions.length}</b> 个订阅节目。复制该密钥并保存，可随时在新设备恢复您的全部订阅。
        </p>
      </div>

      {/* Link other device */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-4">
        <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase">关联/合并其他设备</span>
        
        <form onSubmit={handleSyncSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="输入其他设备的同步密钥 (例如: MIN-POD-XXXX)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-800 placeholder-neutral-400 outline-none focus:bg-white focus:border-[#007AFF] transition-all uppercase tracking-wide"
          />
          <button
            type="submit"
            disabled={updating || !inputCode.trim() || !isOnline}
            className="w-full py-3 bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            {updating ? "正在验证并关联..." : "验证并合并订阅"}
          </button>
        </form>

        {statusMsg && (
          <p className="text-[11px] font-medium text-center text-[#007AFF] bg-[#007AFF]/10 p-2.5 rounded-lg border border-[#007AFF]/20 animate-fadeIn">
            {statusMsg}
          </p>
        )}
      </div>

      {/* Offline capability explanation */}
      <div className="bg-neutral-100/60 rounded-2xl p-4 border border-neutral-100 flex items-start space-x-3">
        <HelpCircle className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold text-neutral-600">离线收听是如何工作的？</h4>
          <p className="text-[10px] text-neutral-500 leading-normal">
            当您点击单集旁的下载按钮时，系统会通过服务器代理抓取音频源，并将音频数据完整、安全地缓存在您本机的 <b>IndexedDB</b> 存储空间中。
            处于飞机离线、地铁无网环境时，极简播客将自动切换为播放本地下载文件，提供丝滑不中断的收听体验。
          </p>
        </div>
      </div>
    </div>
  );
};
