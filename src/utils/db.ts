// Client-side IndexedDB wrapper for offline capabilities

const DB_NAME = "MinimalistPodcastDB";
const DB_VERSION = 1;

export interface DownloadedEpisode {
  guid: string;
  title: string;
  audioUrl: string;
  blob: Blob;
  downloadedAt: number;
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

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
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
  });
}

// Downloads Operations
export async function saveDownload(guid: string, title: string, audioUrl: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("downloads", "readwrite");
    const store = transaction.objectStore("downloads");
    
    const download: DownloadedEpisode = {
      guid,
      title,
      audioUrl,
      blob,
      downloadedAt: Date.now()
    };

    const request = store.put(download);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getDownload(guid: string): Promise<DownloadedEpisode | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("downloads", "readonly");
    const store = transaction.objectStore("downloads");
    const request = store.get(guid);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDownload(guid: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("downloads", "readwrite");
    const store = transaction.objectStore("downloads");
    const request = store.delete(guid);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllDownloads(): Promise<DownloadedEpisode[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("downloads", "readonly");
    const store = transaction.objectStore("downloads");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Subscriptions Operations
export async function saveSubscription(sub: Subscription): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("subscriptions", "readwrite");
    const store = transaction.objectStore("subscriptions");
    const request = store.put(sub);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSubscription(feedUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("subscriptions", "readwrite");
    const store = transaction.objectStore("subscriptions");
    const request = store.delete(feedUrl);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("subscriptions", "readonly");
    const store = transaction.objectStore("subscriptions");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Playback Progress Operations
export async function saveProgress(guid: string, title: string, currentTime: number, duration: number, completed = false): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("progress", "readwrite");
    const store = transaction.objectStore("progress");
    
    const progress: PlaybackProgress = {
      guid,
      title,
      currentTime,
      duration,
      updatedAt: Date.now(),
      completed
    };

    const request = store.put(progress);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProgress(guid: string): Promise<PlaybackProgress | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("progress", "readonly");
    const store = transaction.objectStore("progress");
    const request = store.get(guid);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProgress(): Promise<PlaybackProgress[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("progress", "readonly");
    const store = transaction.objectStore("progress");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Playback History Operations
export async function saveHistory(hist: PlaybackHistory): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("history", "readwrite");
    const store = transaction.objectStore("history");
    const request = store.put(hist);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllHistory(): Promise<PlaybackHistory[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("history", "readonly");
    const store = transaction.objectStore("history");
    const request = store.getAll();
    request.onsuccess = () => {
      const historyList = request.result || [];
      // Sort by playedAt descending
      historyList.sort((a, b) => b.playedAt - a.playedAt);
      resolve(historyList);
    };
    request.onerror = () => reject(request.error);
  });
}
