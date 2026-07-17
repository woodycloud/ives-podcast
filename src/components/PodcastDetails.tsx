import React, { useEffect, useState } from "react";
import { usePodcast, Episode } from "../context/PodcastContext";
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PodcastDetailsProps {
  feedUrl: string;
  onBack: () => void;
}

interface PodcastDetailData {
  title: string;
  author: string;
  description: string;
  artwork: string;
  link: string;
  category: string;
  episodes: Episode[];
}

export const PodcastDetails: React.FC<PodcastDetailsProps> = ({ feedUrl, onBack }) => {
  const {
    subscribe,
    unsubscribe,
    isSubscribed,
    playEpisode,
    currentEpisode,
    isPlaying,
    togglePlay,
    downloadEpisode,
    removeDownload,
    isDownloaded,
    downloadingProgress,
    playbackProgress
  } = usePodcast();

  const [podcast, setPodcast] = useState<PodcastDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<boolean>(false);
  const [showConfirmUnsub, setShowConfirmUnsub] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const fetchFeed = async () => {
      try {
        const response = await fetch(`/api/feed?url=${encodeURIComponent(feedUrl)}`);
        if (!response.ok) {
          throw new Error("Failed to parse podcast feed");
        }
        const data = await response.json();
        if (active) {
          setPodcast(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(err.message || "Failed to load podcast. Please check your network or feed URL.");
          setLoading(false);
        }
      }
    };

    fetchFeed();

    return () => {
      active = false;
    };
  }, [feedUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
        <p className="text-xs font-medium text-neutral-400">Parsing podcast feed & loading episodes...</p>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 py-20">
        <p className="text-sm font-semibold text-[#FF3B30]">{error || "Failed to load"}</p>
        <button
          onClick={onBack}
          className="text-xs font-semibold px-4 py-2 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all active:scale-95"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const isSub = isSubscribed(feedUrl);

  const handleSubscribeToggle = () => {
    if (isSub) {
      setShowConfirmUnsub(true);
    } else {
      subscribe({
        feedUrl,
        title: podcast.title,
        author: podcast.author,
        artwork: podcast.artwork,
      });
    }
  };

  // Formatting helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const playAllEpisodes = () => {
    if (podcast.episodes.length > 0) {
      playEpisode(podcast.episodes[0], podcast.title);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Back navigation */}
      <button
        id="detail-back-button"
        onClick={onBack}
        className="flex items-center text-neutral-500 hover:text-neutral-900 text-sm font-semibold transition-colors py-2 group select-none"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 pb-6 border-b border-neutral-100">
        <img
          src={podcast.artwork}
          alt={podcast.title}
          className="w-36 h-36 md:w-40 md:h-40 rounded-2xl object-cover shadow-md bg-neutral-100 border border-neutral-100"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 space-y-3 pt-1">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-neutral-900 leading-tight tracking-tight">
              {podcast.title}
            </h2>
            <p className="text-xs font-semibold text-[#007AFF] tracking-wide">
              {podcast.author}
            </p>
          </div>

          {podcast.category && (
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-md">
              {podcast.category}
            </span>
          )}

          {/* Action Pills */}
          <div className="flex items-center justify-center sm:justify-start space-x-2.5 pt-2">
            <button
              id="btn-subscribe-toggle"
              onClick={handleSubscribeToggle}
              className={`text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-95 flex items-center ${
                isSub 
                  ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" 
                  : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm shadow-neutral-900/10"
              }`}
            >
              {isSub ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 stroke-[3px]" />
                  Subscribed
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[3px]" />
                  Subscribe
                </>
              )}
            </button>

            <button
              id="btn-play-all"
              onClick={playAllEpisodes}
              className="text-xs font-bold px-5 py-2.5 bg-[#007AFF]/10 text-[#007AFF] rounded-full hover:bg-[#007AFF]/20 transition-all active:scale-95 flex items-center"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-[#007AFF] stroke-none" />
              Play Latest
            </button>
          </div>
        </div>
      </div>

      {/* Podcast Description */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">About</h3>
        <div className="bg-white rounded-2xl p-4 border border-neutral-100 text-left">
          <p className={`text-xs text-neutral-600 leading-relaxed ${!expandedDesc && "line-clamp-3"}`}>
            {stripHtml(podcast.description)}
          </p>
          <button
            onClick={() => setExpandedDesc(!expandedDesc)}
            className="text-[11px] font-bold text-neutral-400 mt-2 hover:text-neutral-900 transition-colors flex items-center select-none"
          >
            {expandedDesc ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Collapse Description
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Read More Description
              </>
            )}
          </button>
        </div>
      </div>

      {/* Episode List */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
            All Episodes ({podcast.episodes.length})
          </h3>
          {podcast.link && (
            <a
              href={podcast.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-neutral-400 hover:text-neutral-900 flex items-center transition-colors"
            >
              Visit Homepage <ExternalLink className="w-2.5 h-2.5 ml-1" />
            </a>
          )}
        </div>

        <div className="divide-y divide-neutral-100 bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
          {podcast.episodes.map((ep) => {
            const isPlayingThis = currentEpisode?.guid === ep.guid;
            const isDownloadedThis = isDownloaded(ep.guid);
            const dlProgress = downloadingProgress[ep.guid];
            const listenedProgress = playbackProgress[ep.guid]; // current time

            return (
              <div 
                key={ep.guid} 
                className="p-4 flex gap-4 hover:bg-neutral-50/50 transition-colors group"
              >
                {/* Visual listen indicator or artwork thumbnail */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-neutral-100 shadow-sm bg-neutral-100 hidden sm:block">
                  <img
                    src={ep.artwork || podcast.artwork}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isPlayingThis && isPlaying && (
                    <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-[1px] flex items-center justify-center text-white">
                      <Play className="w-4 h-4 animate-ping fill-white stroke-none" />
                    </div>
                  )}
                </div>

                {/* Info and text */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-neutral-400 tracking-wide font-sans">
                    <span>{formatDate(ep.pubDate)}</span>
                    {ep.duration > 0 && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(ep.duration)}</span>
                      </>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-neutral-800 line-clamp-1 group-hover:text-neutral-900 transition-colors">
                    {ep.title}
                  </h4>

                  <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                    {stripHtml(ep.description || ep.showNotes)}
                  </p>

                  {/* Playback Progress Indicator if partially listened */}
                  {listenedProgress && ep.duration > 0 && (
                    <div className="pt-2 w-28">
                      <div className="h-[2px] w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#007AFF] rounded-full"
                          style={{ width: `${(listenedProgress / ep.duration) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-semibold text-neutral-400 mt-0.5 inline-block">
                        Listened {Math.round((listenedProgress / ep.duration) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Play and Download Actions */}
                <div className="flex flex-col justify-between items-center space-y-3 flex-shrink-0">
                  {/* Play Button */}
                  <button
                    onClick={() => {
                      if (isPlayingThis) {
                        togglePlay();
                      } else {
                        playEpisode(ep, podcast.title);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                      isPlayingThis && isPlaying
                        ? "bg-[#007AFF] text-white shadow-sm shadow-[#007AFF]/10"
                        : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                    }`}
                  >
                    {isPlayingThis && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-white stroke-none" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current stroke-none translate-x-0.5" />
                    )}
                  </button>

                  {/* Download Button */}
                  <div>
                    {dlProgress !== undefined ? (
                      /* Downloading spinner */
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <svg className="w-6 h-6 transform -rotate-90">
                          <circle cx="12" cy="12" r="9" stroke="#e4e4e7" strokeWidth="2" fill="transparent" />
                          <circle cx="12" cy="12" r="9" stroke="#007AFF" strokeWidth="2" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 9}
                            strokeDashoffset={2 * Math.PI * 9 * (1 - dlProgress / 100)}
                          />
                        </svg>
                        <span className="absolute text-[6px] font-bold text-neutral-600">{dlProgress}%</span>
                      </div>
                    ) : isDownloadedThis ? (
                      /* Delete Download */
                      <button
                        onClick={() => removeDownload(ep.guid)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#FF3B30] hover:text-[#FF3B30]/90 hover:bg-[#FF3B30]/10 transition-colors"
                        title="Delete download"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      /* Download */
                      <button
                        onClick={() => downloadEpisode(ep, podcast.title)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* iOS-Style Custom Unsubscribe Confirm Sheet */}
      <AnimatePresence>
        {showConfirmUnsub && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmUnsub(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Content Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-100/50 p-5 text-center flex flex-col space-y-4 mb-[env(safe-area-inset-bottom)] sm:mb-0 z-10"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-800">Unsubscribe Podcast</h3>
                <p className="text-[11px] text-neutral-500 leading-relaxed px-2">
                  Are you sure you want to unsubscribe from "{podcast.title}"?
                </p>
              </div>

              <div className="flex flex-col space-y-2 pt-1">
                <button
                  onClick={() => {
                    unsubscribe(feedUrl);
                    setShowConfirmUnsub(false);
                  }}
                  className="w-full py-2.5 bg-[#FF3B30] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm shadow-[#FF3B30]/10"
                >
                  Unsubscribe
                </button>
                <button
                  onClick={() => setShowConfirmUnsub(false)}
                  className="w-full py-2.5 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Keep Subscription
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
