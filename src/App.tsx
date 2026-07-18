import React, { useState, useEffect } from "react";
import { PodcastProvider, usePodcast, Episode, PodcastInfo } from "./context/PodcastContext";
import { BottomPlayer } from "./components/BottomPlayer";
import { SearchCategoryGrid } from "./components/SearchCategoryGrid";
import { PodcastDetails } from "./components/PodcastDetails";
import * as db from "./utils/db";
import { SyncSettings } from "./components/SyncSettings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { 
  Radio, 
  BookOpen, 
  Search, 
  Cloud, 
  Wifi, 
  WifiOff,
  ChevronRight,
  Plus,
  Play,
  Check,
  Download,
  Trash2,
  FolderDown,
  History,
  Info,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CuratedShow {
  feedUrl: string;
  title: string;
  author: string;
  artwork: string;
  description: string;
}

const AppContent: React.FC = () => {
  const {
    isOnline,
    subscriptions,
    subscribe,
    isSubscribed,
    downloads,
    history,
    playEpisode,
    currentEpisode,
    isPlaying,
    togglePlay,
    playbackProgress,
    removeDownload
  } = usePodcast();

  const [activeTab, setActiveTab] = useState<"listen_now" | "library" | "search" | "sync">("listen_now");
  const [selectedFeedUrl, setSelectedFeedUrl] = useState<string | null>(null);

  // Theme state and system preference syncing
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("theme");
    return (saved as "light" | "dark" | "system") || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "dark" ||
        (theme === "system" && mediaQuery.matches);
      
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<CuratedShow[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(true);

  // Latest episodes from subscribed podcasts
  const [subscribedEpisodes, setSubscribedEpisodes] = useState<any[]>([]);
  const [loadingSubEpisodes, setLoadingSubEpisodes] = useState<boolean>(false);

  // Local downloads metadata
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<Episode[]>([]);

  // Fetch Curated Recommendations from Apple lookup
  useEffect(() => {
    const fetchRecommendations = async () => {
      setRecLoading(true);
      try {
        // Look up top Chinese and overseas podcasts:
        // 1259169493 (故事FM), 1198642398 (声东击西), 1551829399 (知行小酒馆),
        // 1200361736 (The Daily), 1133320066 (TED Talks Daily), 1545953110 (Huberman Lab), 1434243584 (Lex Fridman)
        const response = await fetch("/api/lookup?id=1259169493,1198642398,1551829399,1200361736,1133320066,1545953110,1434243584");
        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          const mapped: CuratedShow[] = results.map((item: any) => ({
            feedUrl: item.feedUrl,
            title: item.collectionName,
            author: item.artistName,
            artwork: item.artworkUrl600 || item.artworkUrl100,
            description: item.genres?.join(" / ") || "Curated Show"
          }));
          setRecommendations(mapped);
        } else {
          throw new Error("Failed to load recommendations");
        }
      } catch (err) {
        console.error("Recommendations lookup failed, falling back to static metadata", err);
        // Robust fallback data with both Chinese and mainstream overseas/English podcasts
        setRecommendations([
          {
            title: "Story FM (故事FM)",
            author: "Story FM",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/a4/be/13/a4be139e-d311-66ca-68e1-5b7fb5570fa5/mza_10385972828458739679.jpg/600x600bb.jpg",
            feedUrl: "https://feed.xyzcdn.net/storyfm",
            description: "Society & Culture"
          },
          {
            title: "声东击西 (ETW)",
            author: "声动活泼",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/58/b5/e0/58b5e003-81b3-6bf2-72e2-95f32b8fa21a/mza_13491456249568779948.jpg/600x600bb.jpg",
            feedUrl: "https://feed.xyzcdn.net/shengdongjixi",
            description: "Tech & Culture"
          },
          {
            title: "The Daily",
            author: "The New York Times",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/91/3c/64/913c640c-39a7-9877-c990-252fc9969efd/mza_10777592473859600100.jpg/600x600bb.jpg",
            feedUrl: "https://feeds.simplecast.com/54nAGgIl",
            description: "News & Politics"
          },
          {
            title: "TED Talks Daily",
            author: "TED",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/ae/16/81/ae168128-d88f-16b7-f0c2-3e28c460d3d5/mza_11679093405798935406.jpg/600x600bb.jpg",
            feedUrl: "https://feeds.feedburner.com/tedtalksdaily",
            description: "Science & Education"
          },
          {
            title: "Huberman Lab",
            author: "Scicomm Media",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/9e/75/d9/9e75d9bd-5b3a-5909-5100-8809a7ca3393/mza_16698940608552309117.jpg/600x600bb.jpg",
            feedUrl: "https://feeds.megaphone.fm/hubermanlab",
            description: "Health & Science"
          },
          {
            title: "Lex Fridman Podcast",
            author: "Lex Fridman",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/b9/3d/8c/b93d8c1e-35ee-a859-9742-124b89f816c1/mza_14533088922370868884.jpg/600x600bb.jpg",
            feedUrl: "https://lexfridman.com/feed/podcast/",
            description: "Tech, Intelligence & Society"
          },
          {
            title: "知行小酒馆",
            author: "有知有行",
            artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/a3/52/65/a352652b-4ba5-728b-6ef9-7681f21172a5/mza_17208753239274294471.jpg/600x600bb.jpg",
            feedUrl: "https://feed.xyzcdn.net/zhixingxiaojiuguan",
            description: "Business & Finance"
          }
        ]);
      } finally {
        setRecLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Fetch latest episodes for all subscribed podcasts
  useEffect(() => {
    let active = true;
    if (activeTab !== "listen_now" || subscriptions.length === 0) {
      return;
    }

    const fetchLatestSubscribedEpisodes = async () => {
      setLoadingSubEpisodes(true);
      try {
        const promises = subscriptions.slice(0, 10).map(async (sub) => {
          try {
            const response = await fetch(`/api/feed?url=${encodeURIComponent(sub.feedUrl)}`);
            if (response.ok) {
              const data = await response.json();
              // Extract the first 2 episodes from each subscription
              const items = data.episodes || [];
              return items.slice(0, 2).map((ep: any) => ({
                ...ep,
                podcastTitle: sub.title,
                podcastArtwork: sub.artwork,
                feedUrl: sub.feedUrl
              }));
            }
          } catch (e) {
            console.error(`Failed to fetch episodes for subscription: ${sub.title}`, e);
          }
          return [];
        });

        const results = await Promise.all(promises);
        if (!active) return;

        // Flatten all episodes, filter out empty ones, and sort by date descending
        const merged = results.flat().filter(Boolean);
        merged.sort((a, b) => {
          const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return timeB - timeA;
        });

        setSubscribedEpisodes(merged.slice(0, 20));
      } catch (err) {
        console.error("Error fetching subscribed episodes:", err);
      } finally {
        if (active) {
          setLoadingSubEpisodes(false);
        }
      }
    };

    fetchLatestSubscribedEpisodes();

    return () => {
      active = false;
    };
  }, [activeTab, subscriptions]);

  // Sync / Load offline downloads metadata
  useEffect(() => {
    const loadDownloads = async () => {
      // Fetch details of downloaded episodes safely from IndexedDB wrapper
      try {
        const results = await db.getAllDownloads();
        const mapped: Episode[] = results.map((item: any) => ({
          guid: item.guid,
          title: item.title,
          audioUrl: item.audioUrl,
          artwork: item.blob ? URL.createObjectURL(item.blob) : "", // blob URL
          pubDate: new Date(item.downloadedAt).toLocaleDateString(),
          description: "Downloaded Episode",
          showNotes: "",
          audioType: "audio/mpeg",
          audioLength: 0,
          duration: 0
        }));
        setDownloadedEpisodes(mapped);
      } catch (e) {
        console.error("Failed to load local downloads list", e);
      }
    };

    if (activeTab === "library") {
      loadDownloads();
    }
  }, [activeTab, downloads]);

  // Handle Search Input Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!response.ok) {
        throw new Error("Search failed. Please try again later.");
      }
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      setSearchError(err.message || "Request failed. Please check your network connection.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Quick subscribe helper
  const handleQuickSubscribe = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const feedUrl = item.feedUrl;
    if (isSubscribed(feedUrl)) return;

    subscribe({
      feedUrl,
      title: item.collectionName,
      author: item.artistName,
      artwork: item.artworkUrl600 || item.artworkUrl100
    });
  };

  // Selected date heading for "Listen Now"
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" };
    return new Date().toLocaleDateString("en-US", options);
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 pb-[calc(144px_+_env(safe-area-inset-bottom))] flex flex-col antialiased transition-colors duration-300">
      {/* Top Bar Status Monitor */}
      <header className="sticky top-0 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 z-30 px-6 py-3 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] animate-pulse" />
          <h1 className="text-sm font-black tracking-wide text-neutral-900 dark:text-neutral-100 select-none">Ives' Podcast</h1>
        </div>

        {/* Action icons and status */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            id="theme-toggle"
            onClick={cycleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all duration-200 active:scale-95"
            title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to cycle)`}
            aria-label={`Change theme, current: ${theme}`}
          >
            {theme === "light" && <Sun className="w-3.5 h-3.5 stroke-[2.25]" />}
            {theme === "dark" && <Moon className="w-3.5 h-3.5 stroke-[2.25]" />}
            {theme === "system" && <Monitor className="w-3.5 h-3.5 stroke-[2.25]" />}
          </button>

          {/* Network status */}
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <div className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40 select-none">
                <Wifi className="w-3 h-3 mr-1" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 rounded-full select-none">
                <WifiOff className="w-3 h-3 mr-1" />
                <span>Offline Mode</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-6">
        <AnimatePresence mode="wait">
          {selectedFeedUrl ? (
            /* Podcast Details Sub-view */
            <motion.div
              key="podcast-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <PodcastDetails
                feedUrl={selectedFeedUrl}
                onBack={() => setSelectedFeedUrl(null)}
              />
            </motion.div>
          ) : (
            /* Standard Tabs */
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* LISTEN NOW TAB */}
              {activeTab === "listen_now" && (
                <div className="space-y-6">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      {getFormattedDate()}
                    </span>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Listen Now</h2>
                  </div>

                  {/* Curated Recommendations or Latest Subscribed Episodes */}
                  <div className="space-y-3.5">
                    {subscriptions.length === 0 ? (
                      <>
                        <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase text-left">
                          Recommended Shows
                        </h3>
                        
                        {recLoading ? (
                          <div className="flex items-center justify-center py-10 space-y-2 flex-col">
                            <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-[#007AFF] animate-spin" />
                            <span className="text-[10px] text-neutral-400">Loading latest recommendations...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {recommendations.map((show, i) => (
                              <div
                                key={show.feedUrl || i}
                                onClick={() => setSelectedFeedUrl(show.feedUrl)}
                                className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex flex-col text-left space-y-2.5 select-none"
                              >
                                <img
                                  src={show.artwork}
                                  alt={show.title}
                                  className="w-full aspect-square rounded-xl object-cover shadow-sm bg-neutral-100 dark:bg-neutral-800"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 leading-normal">
                                    {show.title}
                                  </h4>
                                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                    {show.author}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase text-left">
                          Latest Episodes
                        </h3>
                        
                        {loadingSubEpisodes ? (
                          <div className="flex items-center justify-center py-10 space-y-2 flex-col">
                            <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-[#007AFF] animate-spin" />
                            <span className="text-[10px] text-neutral-400 font-medium">Fetching latest episodes...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                             {subscribedEpisodes.map((ep) => {
                              const isPlayingThis = currentEpisode?.guid === ep.guid;
                              const isPlayingNow = isPlayingThis && isPlaying;
                              
                              const durationMin = ep.duration ? `${Math.round(ep.duration / 60)}m` : "";
                              const pubDateText = (() => {
                                if (!ep.pubDate) return "";
                                try {
                                  const d = new Date(ep.pubDate);
                                  return isNaN(d.getTime()) ? ep.pubDate : d.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric"
                                  });
                                } catch (e) {
                                  return ep.pubDate || "";
                                }
                              })();

                              return (
                                <div
                                  key={ep.guid}
                                  className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-start justify-between space-x-4 hover:shadow-md transition-all select-none"
                                >
                                  {/* Left: Artwork & Details */}
                                  <div 
                                    onClick={() => setSelectedFeedUrl(ep.feedUrl)}
                                    className="flex items-start space-x-3.5 min-w-0 flex-1 cursor-pointer"
                                  >
                                    <img
                                      src={ep.podcastArtwork || ep.artwork}
                                      alt={ep.podcastTitle}
                                      className="w-12 h-12 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800 shadow-sm flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="min-w-0 text-left space-y-1">
                                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 leading-snug">
                                        {ep.title}
                                      </h4>
                                      <div className="flex items-center space-x-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                                        <span className="text-[#007AFF] font-semibold max-w-[120px] truncate">
                                          {ep.podcastTitle}
                                        </span>
                                        <span>•</span>
                                        <span>{pubDateText}</span>
                                        {durationMin && (
                                          <>
                                            <span>•</span>
                                            <span>{durationMin}</span>
                                          </>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 font-light leading-relaxed">
                                        {typeof ep.description === "string" 
                                          ? ep.description.replace(/<[^>]*>/g, "") 
                                          : (ep.description && typeof ep.description === "object" && ep.description["#text"]
                                              ? String(ep.description["#text"]).replace(/<[^>]*>/g, "")
                                              : "")}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Right: Play/Pause action */}
                                  <button
                                    onClick={() => {
                                      if (isPlayingThis) {
                                        togglePlay();
                                      } else {
                                        playEpisode(ep, ep.podcastTitle);
                                      }
                                    }}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                                      isPlayingNow
                                        ? "bg-[#007AFF] text-white shadow-sm shadow-[#007AFF]/10"
                                        : "bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    }`}
                                  >
                                    {isPlayingNow ? (
                                      <div className="flex items-center justify-center space-x-[2.5px] h-3">
                                        <div className="w-[1.5px] h-3 bg-white rounded-full animate-bounce" />
                                        <div className="w-[1.5px] h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-[1.5px] h-3 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                                      </div>
                                    ) : (
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5 stroke-none" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                            
                            {subscribedEpisodes.length === 0 && (
                              <p className="text-center text-[11px] text-neutral-400 py-6">
                                Loading subscribed episodes, please wait...
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Subscriptions Hub Quick-start */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase text-left">
                      My Subscriptions ({subscriptions.length})
                    </h3>

                    {subscriptions.length === 0 ? (
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-3.5">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                          You haven't subscribed to any shows yet. Search for your favourite podcasts or click on recommendations to subscribe and sync.
                        </p>
                        <button
                          onClick={() => setActiveTab("search")}
                          className="text-xs font-bold px-4 py-2 bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 text-white hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all rounded-full"
                        >
                          Go to Search & Explore
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm text-left">
                        {subscriptions.slice(0, 4).map((sub) => (
                          <div
                            key={sub.feedUrl}
                            onClick={() => setSelectedFeedUrl(sub.feedUrl)}
                            className="p-3.5 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors group select-none"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={sub.artwork}
                                alt={sub.title}
                                className="w-10 h-10 rounded-lg object-cover shadow-sm border border-neutral-50 dark:border-neutral-800 bg-neutral-100"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-neutral-900 dark:group-hover:text-white">
                                  {sub.title}
                                </h4>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                  {sub.author}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        ))}
                        {subscriptions.length > 4 && (
                          <button
                            onClick={() => setActiveTab("library")}
                            className="w-full py-3 text-center text-[11px] font-bold text-[#007AFF] hover:text-[#007AFF]/85 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            View all {subscriptions.length} subscribed shows
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LIBRARY TAB */}
              {activeTab === "library" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">My Library</h2>
                  </div>

                  {/* Subscribed grid */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase text-left">
                      Subscribed Shows ({subscriptions.length})
                    </h3>

                    {subscriptions.length === 0 ? (
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">
                        No subscribed podcasts yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {subscriptions.map((sub) => (
                          <div
                            key={sub.feedUrl}
                            onClick={() => setSelectedFeedUrl(sub.feedUrl)}
                            className="flex flex-col text-left space-y-1.5 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all group select-none"
                          >
                            <img
                              src={sub.artwork}
                              alt={sub.title}
                              className="w-full aspect-square rounded-xl object-cover shadow-sm border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800"
                              referrerPolicy="no-referrer"
                            />
                            <h4 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 group-hover:text-neutral-900 dark:group-hover:text-white">
                              {sub.title}
                            </h4>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Offline downloads */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase text-left flex items-center">
                      <FolderDown className="w-4 h-4 mr-1.5 text-neutral-500" />
                      Downloaded Episodes ({downloads.length})
                    </h3>

                    {downloads.length === 0 ? (
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500 leading-normal">
                        No offline episodes downloaded.<br />Tap the download icon in episode details to download and listen offline.
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm text-left">
                        {downloadedEpisodes.map((ep) => (
                          <div
                            key={ep.guid}
                            className="p-3.5 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group select-none"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                {ep.title}
                              </h4>
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">
                                Downloaded on {ep.pubDate}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2.5">
                              <button
                                onClick={() => playEpisode(ep, "Local Offline Episode")}
                                className="w-8 h-8 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] flex items-center justify-center transition-all active:scale-90"
                                title="Play"
                              >
                                <Play className="w-3.5 h-3.5 fill-[#007AFF] stroke-none translate-x-0.5" />
                              </button>
                              <button
                                onClick={() => removeDownload(ep.guid)}
                                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-[#FF3B30]/10 dark:hover:bg-[#FF3B30]/20 text-neutral-400 dark:text-neutral-500 hover:text-[#FF3B30] flex items-center justify-center transition-all active:scale-90"
                                title="Delete download"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Play history */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase text-left flex items-center">
                      <History className="w-4 h-4 mr-1.5 text-neutral-500" />
                      Recently Played ({history.length})
                    </h3>

                    {history.length === 0 ? (
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">
                        No playback history yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm text-left">
                        {history.slice(0, 5).map((hist) => {
                          const tempEp: Episode = {
                             guid: hist.guid,
                             title: hist.title,
                             audioUrl: "", // context retrieves live from database or proxy if needed
                             artwork: hist.artwork,
                             pubDate: hist.pubDate,
                             description: "History Episode",
                             showNotes: "",
                             audioType: "audio/mpeg",
                             audioLength: 0,
                             duration: 0
                          };

                          return (
                            <div
                              key={hist.guid}
                              onClick={() => {
                                // Re-trigger from history (if we click, we need the RSS info or we can play direct if it was downloaded)
                                alert(`Playing "${hist.title}" directly. Please ensure you are connected to the internet or the episode is downloaded.`);
                                playEpisode({
                                  ...tempEp,
                                  audioUrl: `https://itunes.apple.com` // placeholder, will try to fall back or search
                                }, hist.podcastTitle);
                              }}
                              className="p-3 flex items-center space-x-3 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors select-none"
                            >
                              <img
                                src={hist.artwork}
                                alt={hist.title}
                                className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                  {hist.title}
                                </h4>
                                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 truncate">
                                  {hist.podcastTitle} • {(() => {
                                    try {
                                      const d = new Date(hist.playedAt);
                                      return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
                                    } catch (e) {
                                      return "";
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SEARCH TAB */}
              {activeTab === "search" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Search</h2>
                  </div>

                  {/* Search input bar */}
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      placeholder="Search podcasts, episodes, authors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 shadow-sm focus:border-[#007AFF] focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all"
                    />
                    <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-4 top-4" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 absolute right-4 top-4"
                      >
                        Clear
                      </button>
                    )}
                  </form>

                  {/* Results list */}
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-16 space-y-2 flex-col">
                      <div className="w-7 h-7 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
                      <span className="text-xs font-semibold text-neutral-400">Searching iTunes directory...</span>
                    </div>
                  ) : searchError ? (
                    <p className="text-xs text-center text-[#FF3B30] py-10 font-semibold">{searchError}</p>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3.5 text-left">
                      <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase px-1">
                        Found {searchResults.length} podcasts
                      </h3>

                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
                        {searchResults.map((item) => {
                          const subFeedUrl = item.feedUrl;
                          if (!subFeedUrl) return null;
                          const isSub = isSubscribed(subFeedUrl);

                          return (
                            <div
                              key={subFeedUrl}
                              onClick={() => setSelectedFeedUrl(subFeedUrl)}
                              className="p-3.5 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors group select-none"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                                <img
                                  src={item.artworkUrl100 || item.artworkUrl600}
                                  alt={item.collectionName}
                                  className="w-12 h-12 rounded-xl object-cover shadow-sm border border-neutral-50 dark:border-neutral-800 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-[#007AFF] transition-colors">
                                    {item.collectionName}
                                  </h4>
                                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                    {item.artistName}
                                  </p>
                                  {item.genres && (
                                    <span className="inline-block text-[9px] text-[#007AFF] bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-1.5 py-0.2 rounded-md mt-1 scale-90 origin-left font-semibold">
                                      {item.genres[0]}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={(e) => handleQuickSubscribe(e, item)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center flex-shrink-0 ${
                                  isSub
                                    ? "bg-neutral-50 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
                                    : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                                }`}
                              >
                                {isSub ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 mr-1 stroke-[3px]" />
                                    Subbed
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-2.5 h-2.5 mr-1 stroke-[3px]" />
                                    Subscribe
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Search defaults grid */
                    <SearchCategoryGrid
                      onSelectCategory={(catQuery) => {
                        setSearchQuery(catQuery);
                        // Trigger search automatically
                        setSearchLoading(true);
                        setSearchError(null);
                        fetch(`/api/search?q=${encodeURIComponent(catQuery)}`)
                          .then((r) => r.json())
                          .then((data) => {
                            setSearchResults(data.results || []);
                            setSearchLoading(false);
                          })
                          .catch((err) => {
                            setSearchError("Failed to load category content");
                            setSearchLoading(false);
                          });
                      }}
                    />
                  )}
                </div>
              )}

              {/* SYNC/SETTINGS TAB */}
              {activeTab === "sync" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Sync Settings</h2>
                  </div>
                  <SyncSettings />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Audio Player */}
      <BottomPlayer />

      {/* Persistent iOS-style Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[calc(68px_+_env(safe-area-inset-bottom))] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-around z-40 select-none pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
        <button
          id="tab-listen-now"
          onClick={() => {
            setActiveTab("listen_now");
            setSelectedFeedUrl(null);
          }}
          className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all ${
            activeTab === "listen_now" && !selectedFeedUrl
              ? "text-[#007AFF] scale-105"
              : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
          }`}
        >
          <Radio className="w-5 h-5 stroke-[2.25px]" />
          <span className="text-[9px] font-bold">Listen Now</span>
        </button>

        <button
          id="tab-library"
          onClick={() => {
            setActiveTab("library");
            setSelectedFeedUrl(null);
          }}
          className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all ${
            activeTab === "library" && !selectedFeedUrl
              ? "text-[#007AFF] scale-105"
              : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[2.25px]" />
          <span className="text-[9px] font-bold">Library</span>
        </button>

        <button
          id="tab-search"
          onClick={() => {
            setActiveTab("search");
            setSelectedFeedUrl(null);
          }}
          className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all ${
            activeTab === "search" && !selectedFeedUrl
              ? "text-[#007AFF] scale-105"
              : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
          }`}
        >
          <Search className="w-5 h-5 stroke-[2.25px]" />
          <span className="text-[9px] font-bold">Search</span>
        </button>

        <button
          id="tab-sync"
          onClick={() => {
            setActiveTab("sync");
            setSelectedFeedUrl(null);
          }}
          className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all ${
            activeTab === "sync" && !selectedFeedUrl
              ? "text-[#007AFF] scale-105"
              : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
          }`}
        >
          <Cloud className="w-5 h-5 stroke-[2.25px]" />
          <span className="text-[9px] font-bold">Sync</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <PodcastProvider>
        <AppContent />
      </PodcastProvider>
    </ErrorBoundary>
  );
}
