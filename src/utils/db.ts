// Client-side IndexedDB wrapper for offline capabilities with localStorage fallback for restricted environments (e.g., iOS Safari inside iframes)

const DB_NAME = "MinimalistPodcastDB";
const DB_VERSION = 1;

export interface DownloadedEpisode {
  guid: string;
  title: string;
  audioUrl: string;
  blob?: Blob; // Made optional for JSON serialization compatibility
  downloadedAt: number;
  artwork?: string;
  podcastTitle?: string;
  duration?: number;
  pubDate?: string;
  description?: string;
}

export interface Subscription {
  feedUrl: string;
  title: string;
  author: string;
  artwork: string;
  subscribedAt: number;
  latestEpisodePubDate?: string;
}

export interface PlaybackProgress {
  guid: string;
  title: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
  completed: boolean;
}

export interface PlaybackHistory {
  guid: string;
  title: string;
  podcastTitle: string;
  artwork: string;
  pubDate: string;
  playedAt: number;
}

let dbInstance: IDBDatabase | null = null;
let useFallback = false;

// Fallback in-memory and localStorage storage
const fallbackStore: {
  downloads: Record<string, Omit<DownloadedEpisode, "blob">>;
  subscriptions: Record<string, Subscription>;
  progress: Record<string, PlaybackProgress>;
  history: Record<string, PlaybackHistory>;
} = {
  downloads: {},
  subscriptions: {},
  progress: {},
  history: {}
};

// Load initial fallback from localStorage
try {
  const savedFallback = localStorage.getItem("podcast_db_fallback");
  if (savedFallback) {
    const parsed = JSON.parse(savedFallback);
    if (parsed.downloads) fallbackStore.downloads = parsed.downloads;
    if (parsed.subscriptions) fallbackStore.subscriptions = parsed.subscriptions;
    if (parsed.progress) fallbackStore.progress = parsed.progress;
    if (parsed.history) fallbackStore.history = parsed.history;
  }
} catch (e) {
  console.warn("localStorage fallback load failed", e);
}

function saveFallbackToLocalStorage() {
  try {
    localStorage.setItem("podcast_db_fallback", JSON.stringify(fallbackStore));
  } catch (e) {
    console.warn("localStorage fallback save failed", e);
  }
}

function openDB(): Promise<IDBDatabase | null> {
  if (useFallback) {
    return Promise.resolve(null);
  }
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        console.warn("IndexedDB is undefined. Falling back to memory/localStorage.");
        useFallback = true;
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn("IndexedDB open failed. Falling back to memory/localStorage.", request.error);
        useFallback = true;
        resolve(null);
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("downloads")) {
          db.createObjectStore("downloads", { keyPath: "guid" });
        }
        if (!db.objectStoreNames.contains("subscriptions")) {
          db.createObjectStore("subscriptions", { keyPath: "feedUrl" });
        }
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "guid" });
        }
        if (!db.objectStoreNames.contains("history")) {
          db.createObjectStore("history", { keyPath: "guid" });
        }
      };
    } catch (err) {
      console.warn("IndexedDB threw error during open. Falling back to memory/localStorage.", err);
      useFallback = true;
      resolve(null);
    }
  });
}

// Downloads Operations
export async function saveDownload(
  guid: string,
  title: string,
  audioUrl: string,
  blob: Blob,
  artwork?: string,
  podcastTitle?: string,
  duration?: number,
  pubDate?: string,
  description?: string
): Promise<void> {
  const db = await openDB();
  const download: DownloadedEpisode = {
    guid,
    title,
    audioUrl,
    blob,
    downloadedAt: Date.now(),
    artwork,
    podcastTitle,
    duration,
    pubDate,
    description
  };
  if (!db || useFallback) {
    fallbackStore.downloads[guid] = download;
    saveFallbackToLocalStorage();
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("downloads", "readwrite");
      const store = transaction.objectStore("downloads");
      const request = store.put(download);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      fallbackStore.downloads[guid] = download;
      saveFallbackToLocalStorage();
      resolve();
    }
  });
}

export async function getDownload(guid: string): Promise<DownloadedEpisode | null> {
  const db = await openDB();
  if (!db || useFallback) {
    const fallback = fallbackStore.downloads[guid];
    return fallback ? (fallback as DownloadedEpisode) : null;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("downloads", "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.get(guid);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } catch (e) {
      const fallback = fallbackStore.downloads[guid];
      resolve(fallback ? (fallback as DownloadedEpisode) : null);
    }
  });
}

export async function deleteDownload(guid: string): Promise<void> {
  const db = await openDB();
  if (!db || useFallback) {
    delete fallbackStore.downloads[guid];
    saveFallbackToLocalStorage();
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("downloads", "readwrite");
      const store = transaction.objectStore("downloads");
      const request = store.delete(guid);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      delete fallbackStore.downloads[guid];
      saveFallbackToLocalStorage();
      resolve();
    }
  });
}

export async function getAllDownloads(): Promise<DownloadedEpisode[]> {
  const db = await openDB();
  if (!db || useFallback) {
    return Object.values(fallbackStore.downloads) as DownloadedEpisode[];
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("downloads", "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      resolve(Object.values(fallbackStore.downloads) as DownloadedEpisode[]);
    }
  });
}

// Subscriptions Operations
export async function saveSubscription(sub: Subscription): Promise<void> {
  const db = await openDB();
  if (!db || useFallback) {
    fallbackStore.subscriptions[sub.feedUrl] = sub;
    saveFallbackToLocalStorage();
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("subscriptions", "readwrite");
      const store = transaction.objectStore("subscriptions");
      const request = store.put(sub);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      fallbackStore.subscriptions[sub.feedUrl] = sub;
      saveFallbackToLocalStorage();
      resolve();
    }
  });
}

export async function deleteSubscription(feedUrl: string): Promise<void> {
  const db = await openDB();
  if (!db || useFallback) {
    delete fallbackStore.subscriptions[feedUrl];
    saveFallbackToLocalStorage();
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("subscriptions", "readwrite");
      const store = transaction.objectStore("subscriptions");
      const request = store.delete(feedUrl);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      delete fallbackStore.subscriptions[feedUrl];
      saveFallbackToLocalStorage();
      resolve();
    }
  });
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const db = await openDB();
  if (!db || useFallback) {
    return Object.values(fallbackStore.subscriptions) as Subscription[];
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("subscriptions", "readonly");
      const store = transaction.objectStore("subscriptions");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      resolve(Object.values(fallbackStore.subscriptions) as Subscription[]);
    }
  });
}

// Playback Progress Operations
export async function saveProgress(guid: string, title: string, currentTime: number, duration: number, completed = false): Promise<void> {
  const db = await openDB();
  const progress: PlaybackProgress = {
    guid,
    title,
    currentTime,
    duration,
    updatedAt: Date.now(),
    completed
  };
  if (!db || useFallback) {
    fallbackStore.progress[guid] = progress;
    saveFallbackToLocalStorage();
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("progress", "readwrite");
      const store = transaction.objectStore("progress");
      const request = store.put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      fallbackStore.progress[guid] = progress;
      saveFallbackToLocalStorage();
      resolve();
    }
  });
}

export async function getProgress(guid: string): Promise<PlaybackProgress | null> {
  const db = await openDB();
  if (!db || useFallback) {
    return fallbackStore.progress[guid] || null;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("progress", "readonly");
      const store = transaction.objectStore("progress");
      const request = store.get(guid);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } catch (e) {
      resolve(fallbackStore.progress[guid] || null);
    }
  });
}

export async function getAllProgress(): Promise<PlaybackProgress[]> {
  const db = await openDB();
  if (!db || useFallback) {
    return Object.values(fallbackStore.progress) as PlaybackProgress[];
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("progress", "readonly");
      const store = transaction.objectStore("progress");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      resolve(Object.values(fallbackStore.progress) as PlaybackProgress[]);
    }
  });
}

// Playback History Operations
export async function saveHistory(hist: PlaybackHistory): Promise<void> {
  const db = await openDB();
  if (!db || useFallback) {
    fallbackStore.history[hist.guid] = hist;
    saveFallbackToLocalStorage();
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("history", "readwrite");
      const store = transaction.objectStore("history");
      const request = store.put(hist);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      fallbackStore.history[hist.guid] = hist;
      saveFallbackToLocalStorage();
      resolve();
    }
  });
}

export async function getAllHistory(): Promise<PlaybackHistory[]> {
  const db = await openDB();
  if (!db || useFallback) {
    const historyList = Object.values(fallbackStore.history) as PlaybackHistory[];
    historyList.sort((a, b) => b.playedAt - a.playedAt);
    return historyList;
  }
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("history", "readonly");
      const store = transaction.objectStore("history");
      const request = store.getAll();
      request.onsuccess = () => {
        const historyList = request.result || [];
        historyList.sort((a, b) => b.playedAt - a.playedAt);
        resolve(historyList);
      };
      request.onerror = () => reject(request.error);
    } catch (e) {
      const historyList = Object.values(fallbackStore.history) as PlaybackHistory[];
      historyList.sort((a, b) => b.playedAt - a.playedAt);
      resolve(historyList);
    }
  });
}
