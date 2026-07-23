import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import * as db from "../utils/db";

export interface Episode {
  guid: string;
  title: string;
  description: string;
  showNotes: string;
  pubDate: string;
  audioUrl: string;
  audioType: string;
  audioLength: number;
  duration: number; // in seconds
  artwork: string;
  podcastTitle?: string;
  feedUrl?: string;
}

export interface PodcastInfo {
  feedUrl: string;
  title: string;
  author: string;
  artwork: string;
  subscribedAt: number;
  latestEpisodePubDate?: string;
}

interface PodcastContextType {
  // Sync & User info
  userId: string;
  generateNewUserId: () => void;
  setCustomUserId: (id: string) => Promise<boolean>;
  isOnline: boolean;
  syncStatus: "idle" | "syncing" | "success" | "error";
  triggerSync: (customId?: string, forceOverwriteServer?: boolean) => Promise<void>;
  isActivated: boolean;
  validateAndActivateKey: (key: string) => Promise<{ success: boolean; message: string }>;

  // Subscriptions
  subscriptions: PodcastInfo[];
  subscribe: (podcast: { feedUrl: string; title: string; author: string; artwork: string }) => Promise<void>;
  unsubscribe: (feedUrl: string) => Promise<void>;
  isSubscribed: (feedUrl: string) => boolean;

  // Downloads
  downloads: string[]; // List of downloaded guids
  downloadingProgress: Record<string, number>; // guid -> progress percentage
  downloadEpisode: (episode: Episode, podcastTitle: string) => Promise<void>;
  removeDownload: (guid: string) => Promise<void>;
  isDownloaded: (guid: string) => boolean;
  clearAllDownloads: () => Promise<void>;

  // Playback Progress
  playbackProgress: Record<string, number>; // guid -> last played time (seconds)
  saveProgressState: (guid: string, time: number, duration: number) => void;

  // Active Player
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  playEpisode: (episode: Episode, podcastTitle?: string) => void;
  pauseEpisode: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  setRate: (rate: number) => void;
  queue: Episode[];
  addToQueue: (episode: Episode) => void;
  removeFromQueue: (guid: string) => void;
  playNext: () => void;

  // Local History
  history: db.PlaybackHistory[];
  addToHistory: (episode: Episode, podcastTitle: string) => Promise<void>;
  clearHistory: () => void;

  // Feed Caching
  getCachedFeed: (url: string) => any;
  setCachedFeed: (url: string, data: any) => void;

  // Sleep Timer
  sleepTimer: number | null;
  setSleepTimer: (minutes: number | null) => void;
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

export const usePodcast = () => {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error("usePodcast must be used within a PodcastProvider");
  }
  return context;
};

export const PodcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync
  const [userId, setUserId] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [isActivated, setIsActivated] = useState<boolean>(false);

  // State
  const [subscriptions, setSubscriptions] = useState<PodcastInfo[]>([]);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [downloadingProgress, setDownloadingProgress] = useState<Record<string, number>>({});
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<db.PlaybackHistory[]>([]);

  // Player State
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [queue, setQueue] = useState<Episode[]>([]);
  const [sleepTimer, setSleepTimerState] = useState<number | null>(null);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentEpisodeRef = useRef<Episode | null>(null);
  const playNextRef = useRef<() => Promise<void>>(async () => {});
  const loadedFeedsRef = useRef<Record<string, { data: any; timestamp: number }>>({});

  const getCachedFeed = (url: string) => {
    const entry = loadedFeedsRef.current[url];
    if (entry && Date.now() - entry.timestamp < 10 * 60 * 1000) { // 10 minutes client cache
      return entry.data;
    }
    return null;
  };

  const setCachedFeed = (url: string, data: any) => {
    loadedFeedsRef.current[url] = {
      data,
      timestamp: Date.now()
    };
  };

  // Sync ref with state
  useEffect(() => {
    currentEpisodeRef.current = currentEpisode;
  }, [currentEpisode]);

  // Online / Offline monitors
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize data
  useEffect(() => {
    // Initialize User ID and Activation state
    const savedId = localStorage.getItem("min_podcast_user_id") || "";
    const activated = localStorage.getItem("min_podcast_activated") === "true";
    
    if (savedId) {
      setUserId(savedId);
    }
    setIsActivated(activated);

    // Create Audio Element
    const audio = new Audio();
    audioRef.current = audio;

    // Audio Listeners
    let lastSavedTime = 0;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const ep = currentEpisodeRef.current;
      if (ep && audio.currentTime > 0) {
        // Save to DB and state only if 5+ seconds have elapsed since last save
        if (Math.abs(audio.currentTime - lastSavedTime) >= 5) {
          lastSavedTime = audio.currentTime;
          db.saveProgress(ep.guid, ep.title, audio.currentTime, audio.duration || ep.duration, false);
          setPlaybackProgress(prev => ({ ...prev, [ep.guid]: audio.currentTime }));
        }
      }
    };

    const onDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      const ep = currentEpisodeRef.current;
      if (ep) {
        db.saveProgress(ep.guid, ep.title, audio.currentTime, audio.duration || ep.duration, true)
          .then(() => {
            refreshProgressList();
            // Check if automatic cache cleanup is enabled
            const autoDelete = localStorage.getItem("auto_delete_completed") === "true";
            if (autoDelete) {
              return db.deleteDownload(ep.guid).then(() => {
                setDownloads(prev => prev.filter(g => g !== ep.guid));
                console.log(`Auto-deleted completed offline download for: ${ep.title}`);
              });
            }
          })
          .catch(err => console.error("Error saving progress at end of play:", err))
          .finally(() => {
            playNextRef.current();
          });
      } else {
        playNextRef.current();
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      const ep = currentEpisodeRef.current;
      if (ep && audio.currentTime > 0) {
        db.saveProgress(ep.guid, ep.title, audio.currentTime, audio.duration || ep.duration, false);
        setPlaybackProgress(prev => ({ ...prev, [ep.guid]: audio.currentTime }));
      }
    };

    const onError = (e: Event) => {
      console.warn("Audio element encountered error:", e);
      const ep = currentEpisodeRef.current;
      if (ep && audio.src && !audio.src.includes("/api/proxy-media") && ep.audioUrl) {
        console.log("Attempting proxy fallback after audio element error...");
        const proxySrc = `/api/proxy-media?url=${encodeURIComponent(ep.audioUrl)}`;
        const currentTimeBeforeError = audio.currentTime || 0;
        audio.src = proxySrc;
        if (currentTimeBeforeError > 0) {
          try { audio.currentTime = currentTimeBeforeError; } catch (_) {}
        }
        audio.play().then(() => setIsPlaying(true)).catch(err => {
          console.error("Proxy fallback play failed:", err);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    // Load initial DB data
    const initData = async () => {
      const subs = await db.getAllSubscriptions();
      setSubscriptions(subs);

      const dls = await db.getAllDownloads();
      setDownloads(dls.map(d => d.guid));

      const hist = await db.getAllHistory();
      setHistory(hist);

      const prog = await db.getAllProgress();
      const progMap: Record<string, number> = {};
      prog.forEach(p => {
        if (!p.completed) {
          progMap[p.guid] = p.currentTime;
        }
      });
      setPlaybackProgress(progMap);
    };

    initData();

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Auto-sync subscriptions when user goes online or changes ID
  useEffect(() => {
    if (isActivated && userId && isOnline) {
      triggerSync(userId);
    }
  }, [userId, isOnline, isActivated]);

  const refreshProgressList = async () => {
    const prog = await db.getAllProgress();
    const progMap: Record<string, number> = {};
    prog.forEach(p => {
      if (!p.completed) {
        progMap[p.guid] = p.currentTime;
      }
    });
    setPlaybackProgress(progMap);
  };

  const generateNewUserId = () => {
    const newId = `MIN-POD-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem("min_podcast_user_id", newId);
    setUserId(newId);
  };

  const setCustomUserId = async (id: string): Promise<boolean> => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return false;
    
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanId })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        return false;
      }
    } catch (e) {
      console.error("Failed to validate new key:", e);
      return false;
    }
    
    localStorage.setItem("min_podcast_user_id", cleanId);
    localStorage.setItem("min_podcast_activated", "true");
    setUserId(cleanId);
    setIsActivated(true);
    
    // Attempt sync immediately
    if (isOnline) {
      await triggerSync(cleanId);
    }
    return true;
  };

  const validateAndActivateKey = async (key: string): Promise<{ success: boolean; message: string }> => {
    const cleanKey = key.trim().toUpperCase();
    if (!cleanKey) {
      return { success: false, message: "密钥不能为空。" };
    }
    
    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: cleanKey }),
      });
      
      const data = await response.json();
      if (response.ok && data.valid) {
        localStorage.setItem("min_podcast_user_id", cleanKey);
        localStorage.setItem("min_podcast_activated", "true");
        setUserId(cleanKey);
        setIsActivated(true);
        
        // Initial subscription sync upon activation
        if (navigator.onLine) {
          try {
            const syncRes = await fetch(`/api/sync?userId=${encodeURIComponent(cleanKey)}`);
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.subscriptions && syncData.subscriptions.length > 0) {
                for (const sub of syncData.subscriptions) {
                  await db.saveSubscription(sub);
                }
                const localSubs = await db.getAllSubscriptions();
                setSubscriptions(localSubs);
              }
            }
          } catch (syncErr) {
            console.error("Initial sync error upon activation:", syncErr);
          }
        }
        
        return { success: true, message: data.message || "激活成功！" };
      } else {
        return { success: false, message: data.error || data.message || "无效的激活密钥，请联系管理员。" };
      }
    } catch (err) {
      console.error("Activation request error:", err);
      return { success: false, message: "激活请求失败，请检查网络连接。" };
    }
  };

  // Sync with Server (Auto-sync)
  const triggerSync = async (customId?: string, forceOverwriteServer: boolean = false) => {
    const targetId = customId || userId;
    if (!targetId || !isOnline) return;

    setSyncStatus("syncing");
    try {
      // 1. Fetch current subscriptions from DB
      const localSubs = await db.getAllSubscriptions();
      let mergedList = localSubs;

      if (!forceOverwriteServer) {
        // 2. Fetch remote subscriptions from server
        const response = await fetch(`/api/sync?userId=${encodeURIComponent(targetId)}`);
        if (!response.ok) throw new Error("Sync failed");
        const data = await response.json();
        const remoteSubs: PodcastInfo[] = data.subscriptions || [];

        // 3. Merge: If differences, we merge them (taking latest/union)
        const mergedMap = new Map<string, PodcastInfo>();
        
        // Load remote first
        remoteSubs.forEach(s => mergedMap.set(s.feedUrl, s));
        // Load local (local overwrites/adds since user interacts here)
        localSubs.forEach(s => {
          const existing = mergedMap.get(s.feedUrl);
          if (!existing || s.subscribedAt > existing.subscribedAt) {
            mergedMap.set(s.feedUrl, s);
          }
        });

        mergedList = Array.from(mergedMap.values());

        // 4. Save merged back to DB and State
        for (const sub of mergedList) {
          await db.saveSubscription(sub);
        }
      }

      setSubscriptions(mergedList);

      // 5. Send updated list to Server
      const saveResponse = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetId,
          subscriptions: mergedList
        })
      });

      if (!saveResponse.ok) throw new Error("Failed to save remote sync");
      setSyncStatus("success");
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus("error");
    }
  };

  // Subscriptions Actions
  const subscribe = async (podcast: { feedUrl: string; title: string; author: string; artwork: string }) => {
    const newSub: PodcastInfo = {
      ...podcast,
      subscribedAt: Date.now()
    };
    await db.saveSubscription(newSub);
    setSubscriptions(prev => {
      const exists = prev.some(s => s.feedUrl === podcast.feedUrl);
      if (exists) return prev;
      return [...prev, newSub];
    });

    if (isOnline) {
      // Push changes to server asynchronously, forcing overwrite
      setTimeout(() => triggerSync(userId, true), 500);
    }
  };

  const unsubscribe = async (feedUrl: string) => {
    await db.deleteSubscription(feedUrl);
    setSubscriptions(prev => prev.filter(s => s.feedUrl !== feedUrl));

    if (isOnline) {
      // Push changes to server asynchronously, forcing overwrite
      setTimeout(() => triggerSync(userId, true), 500);
    }
  };

  const isSubscribed = (feedUrl: string) => {
    return subscriptions.some(s => s.feedUrl === feedUrl);
  };

  // Downloads Actions
  const downloadEpisode = async (episode: Episode, podcastTitle: string) => {
    const guid = episode.guid;
    if (downloads.includes(guid) || downloadingProgress[guid] !== undefined) return;

    setDownloadingProgress(prev => ({ ...prev, [guid]: 0 }));

    try {
      // Fetch media using the server-side CORS-bypassing proxy
      const proxiedUrl = `/api/proxy-media?url=${encodeURIComponent(episode.audioUrl)}`;
      const response = await fetch(proxiedUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy media fetch failed: ${response.statusText}`);
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Unable to read stream body");

      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total > 0) {
            const pct = Math.round((loaded / total) * 100);
            setDownloadingProgress(prev => ({ ...prev, [guid]: pct }));
          }
        }
      }

      const blob = new Blob(chunks, { type: "audio/mpeg" });
      await db.saveDownload(guid, episode.title, episode.audioUrl, blob);
      
      setDownloads(prev => [...prev, guid]);
      setDownloadingProgress(prev => {
        const next = { ...prev };
        delete next[guid];
        return next;
      });
    } catch (error) {
      console.error("Failed to download episode:", episode.title, error);
      setDownloadingProgress(prev => {
        const next = { ...prev };
        delete next[guid];
        return next;
      });
      alert(`Download failed: Unable to download "${episode.title}". The podcast source may have restricted proxy downloads.`);
    }
  };

  const removeDownload = async (guid: string) => {
    await db.deleteDownload(guid);
    setDownloads(prev => prev.filter(g => g !== guid));
  };

  const isDownloaded = (guid: string) => {
    return downloads.includes(guid);
  };

  const clearAllDownloads = async () => {
    await db.clearAllDownloads();
    setDownloads([]);
  };

  // Playback Progress Actions
  const saveProgressState = (guid: string, time: number, duration: number) => {
    db.saveProgress(guid, currentEpisode?.title || "未知单集", time, duration, false);
    setPlaybackProgress(prev => ({ ...prev, [guid]: time }));
  };

  // Player Actions
  const playEpisode = async (episode: Episode, podcastTitle?: string) => {
    if (!audioRef.current) return;

    // Save previous progress if playing
    if (currentEpisode) {
      saveProgressState(currentEpisode.guid, audioRef.current.currentTime, audioRef.current.duration || currentEpisode.duration);
    }

    const titleOfPodcast = podcastTitle || episode.podcastTitle || "未知节目";
    const fullEpisode = { ...episode, podcastTitle: titleOfPodcast };
    
    setCurrentEpisode(fullEpisode);
    setCurrentTime(0);
    setDuration(episode.duration || 0);

    // Add to history
    addToHistory(fullEpisode, titleOfPodcast);

    try {
      // 1. Check if downloaded
      const localDownload = await db.getDownload(episode.guid);
      let audioSrc = "";

      if (localDownload && localDownload.blob) {
        // Play downloaded local file from Blob URL
        audioSrc = URL.createObjectURL(localDownload.blob);
        console.log("Playing from local offline cache");
      } else {
        // Prefer direct CDN URL for zero latency and native range/hardware support
        audioSrc = episode.audioUrl;
        console.log("Playing directly from podcast source:", audioSrc);
      }

      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackRate;

      // Check if we have progress saved
      const savedProg = await db.getProgress(episode.guid);
      if (savedProg && !savedProg.completed && savedProg.currentTime > 5) {
        try {
          audioRef.current.currentTime = savedProg.currentTime;
          setCurrentTime(savedProg.currentTime);
        } catch (_) {}
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (directPlayErr) {
        console.warn("Direct play failed, trying proxy fallback...", directPlayErr);
        if (!audioSrc.includes("/api/proxy-media") && episode.audioUrl) {
          const proxySrc = `/api/proxy-media?url=${encodeURIComponent(episode.audioUrl)}`;
          audioRef.current.src = proxySrc;
          await audioRef.current.play();
          setIsPlaying(true);
        } else {
          throw directPlayErr;
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
    }
  };

  const pauseEpisode = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentEpisode) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Play failed", err));
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + 15, audioRef.current.duration || 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 15, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const setRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerState(null);
    } else {
      setSleepTimerState(minutes * 60);
    }
  };

  useEffect(() => {
    if (sleepTimer === null || !isPlaying) return;

    const interval = setInterval(() => {
      setSleepTimerState(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          pauseEpisode();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying]);

  const addToQueue = (episode: Episode) => {
    setQueue(prev => {
      if (prev.some(e => e.guid === episode.guid)) return prev;
      return [...prev, episode];
    });
  };

  const removeFromQueue = (guid: string) => {
    setQueue(prev => prev.filter(e => e.guid !== guid));
  };

  const playNext = async () => {
    if (queue.length > 0) {
      const nextEp = queue[0];
      setQueue(prev => prev.slice(1));
      playEpisode(nextEp);
      return;
    }

    // Auto-play next unplayed episode of this podcast
    const currentEp = currentEpisodeRef.current;
    if (!currentEp) return;

    try {
      // 1. Determine the feed URL for this podcast
      let feedUrl = currentEp.feedUrl;
      if (!feedUrl) {
        // Fallback: lookup in subscriptions by title
        const titleOfPodcast = currentEp.podcastTitle;
        if (titleOfPodcast) {
          const subs = await db.getAllSubscriptions();
          const match = subs.find(s => s.title === titleOfPodcast);
          if (match) {
            feedUrl = match.feedUrl;
          }
        }
      }

      if (!feedUrl) {
        console.log("Could not find feedUrl for current episode, autoplay next skipped.");
        return;
      }

      // 2. Fetch the feed episodes (try client-side memory cache first, else API)
      let feedData = getCachedFeed(feedUrl);
      if (!feedData) {
        const response = await fetch(`/api/feed?url=${encodeURIComponent(feedUrl)}`);
        if (response.ok) {
          feedData = await response.json();
          setCachedFeed(feedUrl, feedData);
        }
      }

      if (!feedData || !Array.isArray(feedData.episodes) || feedData.episodes.length === 0) {
        console.log("Could not load episodes for autoplay next.");
        return;
      }

      const episodes: Episode[] = feedData.episodes;

      // 3. Find all completed episode GUIDs in IndexedDB
      const allProgress = await db.getAllProgress();
      const completedGuids = new Set(
        allProgress.filter(p => p.completed).map(p => p.guid)
      );

      // 4. Find current episode index in the feed list
      const currentIndex = episodes.findIndex(e => e.guid === currentEp.guid);
      
      let nextEpisodeToPlay: Episode | null = null;

      if (currentIndex !== -1) {
        // Check following episodes in list (older ones)
        for (let i = currentIndex + 1; i < episodes.length; i++) {
          if (!completedGuids.has(episodes[i].guid) && episodes[i].guid !== currentEp.guid) {
            nextEpisodeToPlay = episodes[i];
            break;
          }
        }
        
        // If not found, check preceding episodes (newer ones)
        if (!nextEpisodeToPlay) {
          for (let i = 0; i < currentIndex; i++) {
            if (!completedGuids.has(episodes[i].guid) && episodes[i].guid !== currentEp.guid) {
              nextEpisodeToPlay = episodes[i];
              break;
            }
          }
        }
      } else {
        // If current episode is not found in the feed, just find the first unplayed one
        nextEpisodeToPlay = episodes.find(e => !completedGuids.has(e.guid)) || null;
      }

      if (nextEpisodeToPlay) {
        console.log(`Auto-playing next unplayed episode: ${nextEpisodeToPlay.title}`);
        playEpisode({ ...nextEpisodeToPlay, feedUrl }, feedData.title);
      } else {
        console.log("No other unplayed episodes found in this podcast.");
      }
    } catch (err) {
      console.error("Autoplay next episode error:", err);
    }
  };

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  // History Actions
  const addToHistory = async (episode: Episode, podcastTitle: string) => {
    const histItem: db.PlaybackHistory = {
      guid: episode.guid,
      title: episode.title,
      podcastTitle,
      artwork: episode.artwork,
      pubDate: episode.pubDate,
      playedAt: Date.now()
    };
    await db.saveHistory(histItem);
    const hist = await db.getAllHistory();
    setHistory(hist);
  };

  const clearHistory = async () => {
    try {
      await db.clearAllHistory();
    } catch (e) {
      console.error("Failed to clear playback history", e);
    }
    setHistory([]);
  };

  return (
    <PodcastContext.Provider
      value={{
        userId,
        generateNewUserId,
        setCustomUserId,
        isOnline,
        syncStatus,
        triggerSync,
        isActivated,
        validateAndActivateKey,

        subscriptions,
        subscribe,
        unsubscribe,
        isSubscribed,

        downloads,
        downloadingProgress,
        downloadEpisode,
        removeDownload,
        isDownloaded,
        clearAllDownloads,

        playbackProgress,
        saveProgressState,

        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        playEpisode,
        pauseEpisode,
        togglePlay,
        seekTo,
        skipForward,
        skipBackward,
        setRate,
        queue,
        addToQueue,
        removeFromQueue,
        playNext,

        history,
        addToHistory,
        clearHistory,

        getCachedFeed,
        setCachedFeed,

        sleepTimer,
        setSleepTimer,
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
};
