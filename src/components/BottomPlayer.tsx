import React, { useState } from "react";
import { usePodcast, Episode } from "../context/PodcastContext";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  ChevronDown, 
  Activity, 
  Share2, 
  Download, 
  Check, 
  Clock, 
  FileText, 
  CornerDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const BottomPlayer: React.FC = () => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    togglePlay,
    seekTo,
    skipForward,
    skipBackward,
    setRate,
    downloadEpisode,
    isDownloaded,
    downloadingProgress
  } = usePodcast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  if (!currentEpisode) return null;

  // Formatting helper: seconds -> hh:mm:ss or mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const sStr = s < 10 ? `0${s}` : s;
    if (h > 0) {
      const mStr = m < 10 ? `0${m}` : m;
      return `${h}:${mStr}:${sStr}`;
    }
    return `${m}:${sStr}`;
  };

  const progressPercent = duration > 0 ? ((isScrubbing ? scrubValue : currentTime) / duration) * 100 : 0;

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (isScrubbing) {
      setScrubValue(newTime);
    } else {
      seekTo(newTime);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: currentEpisode.title,
        text: `I am listening to "${currentEpisode.title}" on Minimalist Podcast, highly recommended!`,
        url: window.location.href,
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(currentEpisode.audioUrl);
      alert("Podcast audio link copied to clipboard");
    }
  };

  const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
  const nextRate = () => {
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setRate(rates[nextIndex]);
  };

  const isEpDl = isDownloaded(currentEpisode.guid);
  const dlProgress = downloadingProgress[currentEpisode.guid];

  return (
    <>
      {/* Minimized Bottom Player */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            id="minimized-player"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-[calc(72px_+_env(safe-area-inset-bottom))] left-4 right-4 h-16 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-lg shadow-neutral-100/40 dark:shadow-none px-3 flex items-center justify-between cursor-pointer z-40 select-none transition-all duration-300"
          >
            {/* Visual audio progress bar along the very bottom of min player */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 dark:bg-neutral-800 rounded-b-2xl overflow-hidden">
              <div 
                className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-100 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <img
                src={currentEpisode.artwork}
                alt={currentEpisode.title}
                className="w-10 h-10 rounded-lg object-cover shadow-sm bg-neutral-100 dark:bg-neutral-800"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                  {currentEpisode.title}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate flex items-center">
                  <span>{currentEpisode.podcastTitle || "Unknown Podcast"}</span>
                  {isEpDl && (
                    <span className="ml-1.5 px-1 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-[3px] scale-90 origin-left">
                      Downloaded
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 pr-1">
              {/* Play / Pause */}
              <button
                id="min-play-pause"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-800 active:scale-95 transition-all text-neutral-900 dark:text-neutral-100"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-neutral-900 dark:fill-neutral-100 stroke-none" />
                ) : (
                  <Play className="w-4 h-4 fill-neutral-900 dark:fill-neutral-100 stroke-none translate-x-0.5" />
                )}
              </button>
              
              {/* Skip Forward 15s */}
              <button
                id="min-skip-forward"
                onClick={(e) => {
                  e.stopPropagation();
                  skipForward();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-800 active:scale-95 transition-all text-neutral-600 dark:text-neutral-300"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Player Slide-up Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="fullscreen-player"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-0 bg-white dark:bg-neutral-950 z-50 flex flex-col focus:outline-none transition-colors duration-300"
          >
            {/* Header: drag down handler */}
            <div className="flex items-center justify-between px-6 pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-2 border-b border-neutral-50 dark:border-neutral-900">
              <button
                id="player-dismiss"
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                Now Playing
              </span>
              <button
                id="player-share"
                onClick={handleShare}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Immersive Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col justify-between max-w-xl mx-auto w-full">
              
              <AnimatePresence mode="wait">
                {!showNotes ? (
                  /* Music/Artwork View */
                  <motion.div
                    key="artwork-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-8 py-4"
                  >
                    {/* Big Artwork */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-neutral-300 dark:shadow-none">
                      <img
                        src={currentEpisode.artwork}
                        alt={currentEpisode.title}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                      {isPlaying && (
                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white rounded-full p-1.5 flex items-center justify-center">
                          <Activity className="w-4 h-4 animate-pulse text-[#007AFF]" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-center w-full px-4">
                      <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug tracking-tight">
                        {currentEpisode.title}
                      </h2>
                      <p className="text-sm font-medium text-[#007AFF] mt-2 truncate">
                        {currentEpisode.podcastTitle}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* Episode Show Notes View */
                  <motion.div
                    key="notes-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-5 my-4 border border-neutral-100 dark:border-neutral-850 text-left"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                      <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm flex items-center">
                        <FileText className="w-4 h-4 mr-1.5 text-neutral-500" />
                        Episode Details / Show Notes
                      </h3>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">EPISODE NOTES</span>
                    </div>
                    {currentEpisode.showNotes ? (
                      <div 
                        className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-3 prose prose-sm dark:prose-invert max-w-none break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: typeof currentEpisode.showNotes === "string" 
                            ? currentEpisode.showNotes 
                            : (currentEpisode.showNotes && typeof currentEpisode.showNotes === "object" && (currentEpisode.showNotes as any)["#text"]
                                ? String((currentEpisode.showNotes as any)["#text"])
                                : "")
                        }}
                      />
                    ) : (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No notes available for this episode.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player Controls Panel */}
              <div className="space-y-6 pt-4 border-t border-neutral-50 dark:border-neutral-900">
                {/* Scrubbing Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={isScrubbing ? scrubValue : currentTime}
                    onMouseDown={() => {
                      setIsScrubbing(true);
                      setScrubValue(currentTime);
                    }}
                    onTouchStart={() => {
                      setIsScrubbing(true);
                      setScrubValue(currentTime);
                    }}
                    onChange={handleProgressChange}
                    onMouseUp={() => {
                      if (isScrubbing) {
                        seekTo(scrubValue);
                        setIsScrubbing(false);
                      }
                    }}
                    onTouchEnd={() => {
                      if (isScrubbing) {
                        seekTo(scrubValue);
                        setIsScrubbing(false);
                      }
                    }}
                    className="w-full h-[5px] bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-neutral-100 outline-none hover:accent-[#007AFF] transition-all"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-neutral-400 dark:text-neutral-500 px-1 font-mono">
                    <span>{formatTime(isScrubbing ? scrubValue : currentTime)}</span>
                    <span>-{formatTime(duration - (isScrubbing ? scrubValue : currentTime))}</span>
                  </div>
                </div>

                {/* Big Controls */}
                <div className="flex items-center justify-between px-4">
                  {/* Download Status */}
                  <div className="w-12 flex justify-start">
                    {dlProgress !== undefined ? (
                      <div className="relative w-9 h-9 flex items-center justify-center">
                        <svg className="w-8 h-8 transform -rotate-90">
                          <circle cx="16" cy="16" r="14" className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="2.5" fill="transparent" />
                          <circle cx="16" cy="16" r="14" stroke="#007AFF" strokeWidth="2.5" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 14}
                            strokeDashoffset={2 * Math.PI * 14 * (1 - dlProgress / 100)}
                          />
                        </svg>
                        <span className="absolute text-[8px] font-bold text-neutral-700 dark:text-neutral-300">{dlProgress}%</span>
                      </div>
                    ) : isEpDl ? (
                      <div className="w-9 h-9 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-[#007AFF]">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={() => downloadEpisode(currentEpisode, currentEpisode.podcastTitle || "")}
                        className="w-9 h-9 rounded-full bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 active:scale-95 transition-all"
                        title="Download episode"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center space-x-6">
                    {/* Skip Back 15s */}
                    <button
                      onClick={skipBackward}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-90 transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    {/* Central Play/Pause button */}
                    <button
                      onClick={togglePlay}
                      className="w-18 h-18 rounded-full flex items-center justify-center bg-neutral-950 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 shadow-xl shadow-neutral-950/20 dark:shadow-none active:scale-95 transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-white dark:fill-neutral-950 stroke-none" />
                      ) : (
                        <Play className="w-6 h-6 fill-white dark:fill-neutral-950 stroke-none translate-x-0.5" />
                      )}
                    </button>

                    {/* Skip Forward 15s */}
                    <button
                      onClick={skipForward}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-90 transition-all"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Playback Rate Selector */}
                  <div className="w-12 flex justify-end">
                    <button
                      onClick={nextRate}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all font-mono"
                    >
                      {playbackRate}x
                    </button>
                  </div>
                </div>

                {/* Bottom Row Buttons (Toggle View) */}
                <div className="flex items-center justify-center space-x-4 pt-1">
                  <button
                    onClick={() => setShowNotes(false)}
                    className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center space-x-1.5 ${
                      !showNotes 
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm" 
                        : "bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Player</span>
                  </button>
                  <button
                    onClick={() => setShowNotes(true)}
                    className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center space-x-1.5 ${
                      showNotes 
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm" 
                        : "bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Show Notes</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
