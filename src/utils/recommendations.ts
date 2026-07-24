export interface RecommendationShow {
  feedUrl: string;
  title: string;
  author: string;
  artwork: string;
  description: string;
  tags: string[];
  genres?: string[];
}

export const RECOMMENDATION_POOL: RecommendationShow[] = [
  {
    title: "The Daily",
    author: "The New York Times",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/91/3c/64/913c640c-39a7-9877-c990-252fc9969efd/mza_10777592473859600100.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.simplecast.com/54nAGgIl",
    description: "Daily news podcast hosted by Michael Barbaro, powered by New York Times journalism.",
    tags: ["news", "politics", "world", "journalism", "current-events", "nyt"],
    genres: ["News", "Politics"]
  },
  {
    title: "TED Talks Daily",
    author: "TED",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/ae/16/81/ae168128-d88f-16b7-f0c2-3e28c460d3d5/mza_11679093405798935406.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.feedburner.com/tedtalksdaily",
    description: "Every weekday, TED Talks Daily brings you the latest talks in audio on every subject imaginable.",
    tags: ["science", "education", "tech", "ideas", "innovation", "inspiration"],
    genres: ["Science", "Education", "Technology"]
  },
  {
    title: "Huberman Lab",
    author: "Scicomm Media",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/9e/75/d9/9e75d9bd-5b3a-5909-5100-8809a7ca3393/mza_16698940608552309117.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.megaphone.fm/hubermanlab",
    description: "Dr. Andrew Huberman discusses neuroscience, health, brain function, and actionable protocols.",
    tags: ["health", "science", "neuroscience", "brain", "fitness", "sleep", "mindset"],
    genres: ["Health & Fitness", "Science"]
  },
  {
    title: "Lex Fridman Podcast",
    author: "Lex Fridman",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/b9/3d/8c/b93d8c1e-35ee-a859-9742-124b89f816c1/mza_14533088922370868884.jpg/600x600bb.jpg",
    feedUrl: "https://lexfridman.com/feed/podcast/",
    description: "Conversations about AI, science, technology, history, philosophy, and the nature of intelligence.",
    tags: ["tech", "ai", "science", "philosophy", "intelligence", "engineering", "interviews"],
    genres: ["Technology", "Science"]
  },
  {
    title: "Planet Money",
    author: "NPR",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/db/4b/56/db4b56f8-4127-ec17-3bf7-2da304896e00/mza_8314983050017122822.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.npr.org/510289/podcast.xml",
    description: "The economy explained through entertaining stories and sharp investigative reporting.",
    tags: ["business", "economics", "finance", "money", "npr", "storytelling"],
    genres: ["Business", "Economics"]
  },
  {
    title: "Waveform: The MKBHD Podcast",
    author: "Vox Media Podcast Network",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/be/81/2a/be812a20-a292-6f2c-e145-2f96e2e0fb56/mza_15190989397683416049.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.megaphone.fm/VMPN1745917899",
    description: "A tech podcast for gadget lovers and tech enthusiasts hosted by Marques Brownlee & Andrew Manganelli.",
    tags: ["tech", "gadgets", "reviews", "hardware", "mkbhd", "smartphones"],
    genres: ["Technology"]
  },
  {
    title: "Philosophize This!",
    author: "Stephen West",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/df/e0/75/dfe075fb-68df-4da3-aa55-2fffa66c303f/mza_16373756858273618146.jpg/600x600bb.jpg",
    feedUrl: "https://philosophizethis.libsyn.com/rss",
    description: "An educational podcast dedicated to sharing the ideas that shaped our world in an accessible way.",
    tags: ["philosophy", "history", "ideas", "education", "thinkers"],
    genres: ["Philosophy", "History"]
  },
  {
    title: "Stuff You Should Know",
    author: "iHeartPodcasts",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/1e/8c/6f/1e8c6f1c-7201-1ee7-7fb4-0fa735079860/mza_1012970591572973752.jpg/600x600bb.jpg",
    feedUrl: "https://www.omnycontent.com/d/playlist/e73c991e-2401-4990-b14a-9e1100e44c22/a3348612-4217-48f8-80f0-a9b00028a306/6620ca62-3fc4-475a-b6df-a9b00028a314/podcast.rss",
    description: "If you've ever wanted to know about champagne, satanism, the Stonewall Uprising, or chaos theory.",
    tags: ["science", "history", "culture", "trivia", "encyclopedic", "general"],
    genres: ["Society & Culture", "Education"]
  },
  {
    title: "99% Invisible",
    author: "Roman Mars",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/0c/33/c0/0c33c0be-45e0-47bf-e737-0808b8b3bc1d/mza_16035071728282928509.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.simplecast.com/BqLp3m3B",
    description: "A tiny exploration of the process and power of design and architecture in everyday life.",
    tags: ["design", "architecture", "culture", "history", "storytelling"],
    genres: ["Arts & Design", "Culture"]
  },
  {
    title: "How I Built This with Guy Raz",
    author: "NPR",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts122/v4/d5/4b/36/d54b36d0-40e8-0b29-7977-f2736b76313f/mza_10915655760822608779.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.npr.org/510313/podcast.xml",
    description: "Guy Raz weaves narrative journeys about innovators, entrepreneurs, and idealists.",
    tags: ["business", "entrepreneurship", "startups", "success", "interviews", "innovation"],
    genres: ["Business", "Society & Culture"]
  },
  {
    title: "Freakonomics Radio",
    author: "Freakonomics Radio Network",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/92/df/80/92df80a5-8667-bb78-08aa-18ed9b31f7c5/mza_16238612711818228330.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.simplecast.com/39A_1P5M",
    description: "Discover the hidden side of everything with Stephen J. Dubner, co-author of the Freakonomics books.",
    tags: ["economics", "society", "psychology", "behavior", "business", "data"],
    genres: ["Economics", "Social Sciences"]
  },
  {
    title: "Radiolab",
    author: "WNYC Studios",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/f2/07/74/f2077461-80a5-fdfd-[#007AFF]/mza_1720880128912389100.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.feedburner.com/radiolab",
    description: "Investigating strange science, philosophy, and human experiences through immersive sound design.",
    tags: ["science", "philosophy", "storytelling", "humanity", "sound", "investigative"],
    genres: ["Science", "Society & Culture"]
  }
];

/**
 * Intelligent recommendation algorithm that analyzes user's subscribed podcasts
 * and playback history to calculate topic/tag/genre vectors and recommend related podcasts.
 */
export function getLocalRecommendations(
  subscriptions: { feedUrl: string; title: string; author: string }[],
  history: { podcastTitle: string; title: string }[]
): RecommendationShow[] {
  const subFeedUrls = new Set(subscriptions.map(s => s.feedUrl.toLowerCase()));

  // Extract interest keywords and weighted topic vectors
  const interestWeights: Record<string, number> = {};

  const addWeight = (term: string, weight: number) => {
    if (!term) return;
    const clean = term.toLowerCase().trim();
    if (clean.length < 2) return;
    interestWeights[clean] = (interestWeights[clean] || 0) + weight;
  };

  // 1. Analyze Subscriptions (High Weight: +3.0)
  subscriptions.forEach(sub => {
    const text = `${sub.title} ${sub.author}`.toLowerCase();
    const words = text.split(/[\s,./()|&+-]+/);
    words.forEach(w => addWeight(w, 3.0));
  });

  // 2. Analyze Listening History (Medium Weight: +1.5)
  history.forEach(hist => {
    const text = `${hist.podcastTitle || ""} ${hist.title || ""}`.toLowerCase();
    const words = text.split(/[\s,./()|&+-]+/);
    words.forEach(w => addWeight(w, 1.5));
  });

  // Score candidate podcasts in the pool
  const scored = RECOMMENDATION_POOL.map(cand => {
    // If user is already subscribed, penalize heavily so it gets filtered out
    if (subFeedUrls.has(cand.feedUrl.toLowerCase())) {
      return { candidate: cand, score: -1000 };
    }

    // Base score with subtle freshness entropy
    let score = 1.0 + Math.random() * 0.25;

    // Direct tag & genre alignment
    cand.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (interestWeights[tagLower]) {
        score += interestWeights[tagLower] * 1.5;
      }

      // Check if tag is substring of any subscription title/author
      subscriptions.forEach(sub => {
        if (sub.title.toLowerCase().includes(tagLower) || sub.author.toLowerCase().includes(tagLower)) {
          score += 2.0;
        }
      });
    });

    if (cand.genres) {
      cand.genres.forEach(genre => {
        const gLower = genre.toLowerCase();
        if (interestWeights[gLower]) {
          score += interestWeights[gLower] * 2.0;
        }
      });
    }

    return { candidate: cand, score };
  });

  // Sort candidates by score descending
  let sorted = scored
    .filter(item => item.score > -500)
    .sort((a, b) => b.score - a.score)
    .map(item => item.candidate);

  // Fallback / padding if user is subscribed to almost everything in pool
  if (sorted.length < 6) {
    const remaining = RECOMMENDATION_POOL.filter(cand => !subFeedUrls.has(cand.feedUrl.toLowerCase()) && !sorted.some(s => s.feedUrl === cand.feedUrl));
    sorted.push(...remaining);
  }

  return sorted.slice(0, 6);
}
