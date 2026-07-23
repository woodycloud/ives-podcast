export interface RecommendationShow {
  feedUrl: string;
  title: string;
  author: string;
  artwork: string;
  description: string;
  tags: string[];
}

export const RECOMMENDATION_POOL: RecommendationShow[] = [
  {
    title: "故事FM (Story FM)",
    author: "故事FM",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/a4/be/13/a4be139e-d311-66ca-68e1-5b7fb5570fa5/mza_10385972828458739679.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/storyfm",
    description: "Society & Culture (真实故事 / 社会与文化)",
    tags: ["story", "society", "culture", "life", "chinese", "社会", "文化", "生活", "故事", "纪实"]
  },
  {
    title: "声东击西 (ETW)",
    author: "声动活泼",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/58/b5/e0/58b5e003-81b3-6bf2-72e2-95f32b8fa21a/mza_13491456249568779948.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/shengdongjixi",
    description: "Tech & Culture (科技、社会与文化视野)",
    tags: ["tech", "culture", "society", "global", "chinese", "科技", "文化", "社会", "全球", "视野", "声动活泼"]
  },
  {
    title: "知行小酒馆",
    author: "有知有行",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/0f/f2/36/0ff236e7-00f7-66a7-ae7c-87b640e74f33/mza_16616421459463999902.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/zhixingxiaojiuguan",
    description: "Finance & Lifestyle (陪伴式的投资理财与生活漫谈)",
    tags: ["finance", "money", "investment", "lifestyle", "chinese", "理财", "投资", "搞钱", "生活", "财富", "有知有行"]
  },
  {
    title: "The Daily",
    author: "The New York Times",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/91/3c/64/913c640c-39a7-9877-c990-252fc9969efd/mza_10777592473859600100.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.simplecast.com/54nAGgIl",
    description: "News & Politics (New York Times Daily News Podcast)",
    tags: ["news", "politics", "world", "us", "current-events", "english", "新闻", "政治", "世界", "时政", "时事"]
  },
  {
    title: "TED Talks Daily",
    author: "TED",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/ae/16/81/ae168128-d88f-16b7-f0c2-3e28c460d3d5/mza_11679093405798935406.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.feedburner.com/tedtalksdaily",
    description: "Science, Tech & Education (TED talks on the go)",
    tags: ["science", "education", "tech", "ideas", "innovation", "english", "科学", "技术", "教育", "思想", "演讲", "TED"]
  },
  {
    title: "Huberman Lab",
    author: "Scicomm Media",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/9e/75/d9/9e75d9bd-5b3a-5909-5100-8809a7ca3393/mza_16698940608552309117.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.megaphone.fm/hubermanlab",
    description: "Health, Brain & Science (Neurobiology and actionable life protocols)",
    tags: ["health", "science", "brain", "neurobiology", "fitness", "sleep", "english", "健康", "科学", "大脑", "生物学", "神经科学", "健身"]
  },
  {
    title: "Lex Fridman Podcast",
    author: "Lex Fridman",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/b9/3d/8c/b93d8c1e-35ee-a859-9742-124b89f816c1/mza_14533088922370868884.jpg/600x600bb.jpg",
    feedUrl: "https://lexfridman.com/feed/podcast/",
    description: "Tech, AI & Philosophy (Deep conversations on intelligence and humanity)",
    tags: ["tech", "ai", "science", "philosophy", "intelligence", "engineering", "english", "科技", "智能", "人工智能", "哲学", "访谈", "科学"]
  },
  {
    title: "机核 GADIO 游戏广播",
    author: "机核 GCORES",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/e0/75/84/e0758410-b3e1-7ecf-4da3-0b70a7b46944/mza_10815598115685790473.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/gcores",
    description: "Games, Tech & Anime (最深入、最好玩的硬核游戏电台)",
    tags: ["games", "culture", "anime", "geek", "sci-fi", "chinese", "游戏", "文化", "动漫", "极客", "科幻", "机核"]
  },
  {
    title: "忽左忽右",
    author: "JustPod",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/5f/be/32/5fbe328c-e6bf-0442-5f65-24b58bd4162e/mza_3862215277894206584.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/huzuohuyou",
    description: "History, Culture & Books (中文播客世界的知识沙龙)",
    tags: ["history", "culture", "books", "literature", "society", "chinese", "历史", "文化", "书籍", "文学", "沙龙", "知识"]
  },
  {
    title: "不合时宜",
    author: "不合时宜",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/95/92/83/959283e3-7729-23c8-6936-a3ee27e7ca7f/mza_11978377759501552599.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/buheshiyi",
    description: "Society, Culture & Journalism (提供一些理解世界的另类视角)",
    tags: ["society", "culture", "journalism", "lifestyle", "global", "chinese", "社会", "文化", "世界", "女性", "视角", "探讨"]
  },
  {
    title: "半拿铁 | 商业故事电台",
    author: "刘飞、潇磊",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/cf/e6/7d/cfe67dae-df47-f472-8d7b-918933b9b4f9/mza_15510656376510343759.jpg/600x600bb.jpg",
    feedUrl: "https://feed.xyzcdn.net/semilatte",
    description: "Business & Company Histories (讲讲商业历史、公司的故事)",
    tags: ["business", "history", "economics", "company", "chinese", "商业", "历史", "经济", "企业", "故事", "半拿铁"]
  },
  {
    title: "Planet Money",
    author: "NPR",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/db/4b/56/db4b56f8-4127-ec17-3bf7-2da304896e00/mza_8314983050017122822.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.npr.org/510289/podcast.xml",
    description: "Business & Economics (Economic storytelling that explains the world)",
    tags: ["business", "economics", "finance", "storytelling", "english", "商业", "经济", "金融", "故事", "探索"]
  },
  {
    title: "Waveform: The MKBHD Podcast",
    author: "Vox Media Podcast Network",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/be/81/2a/be812a20-a292-6f2c-e145-2f96e2e0fb56/mza_15190989397683416049.jpg/600x600bb.jpg",
    feedUrl: "https://feeds.megaphone.fm/VMPN1745917899",
    description: "Tech, Gadgets & Smartphones (Ultimate tech podcast with Marques Brownlee)",
    tags: ["tech", "gadgets", "reviews", "hardware", "smartphones", "english", "科技", "硬件", "智能手机", "评测", "极客"]
  },
  {
    title: "Philosophize This!",
    author: "Stephen West",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/df/e0/75/dfe075fb-68df-4da3-aa55-2fffa66c303f/mza_16373756858273618146.jpg/600x600bb.jpg",
    feedUrl: "https://philosophizethis.libsyn.com/rss",
    description: "Philosophy, History & Ideas (Beginner-friendly deep dive into philosophy)",
    tags: ["philosophy", "history", "ideas", "thinkers", "education", "english", "哲学", "历史", "思想", "深度", "教育"]
  },
  {
    title: "Stuff You Should Know",
    author: "iHeartPodcasts",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/1e/8c/6f/1e8c6f1c-7201-1ee7-7fb4-0fa735079860/mza_1012970591572973752.jpg/600x600bb.jpg",
    feedUrl: "https://www.omnycontent.com/d/playlist/e73c991e-2401-4990-b14a-9e1100e44c22/a3348612-4217-48f8-80f0-a9b00028a306/6620ca62-3fc4-475a-b6df-a9b00028a314/podcast.rss",
    description: "Science, History, Trivia & Culture (If you've ever wanted to know about how anything works)",
    tags: ["science", "history", "culture", "trivia", "encyclopedic", "english", "科学", "历史", "文化", "百科", "常识"]
  }
];

export function getLocalRecommendations(
  subscriptions: { feedUrl: string; title: string; author: string }[],
  history: { podcastTitle: string; title: string }[]
): RecommendationShow[] {
  // Extract interests from subscriptions
  const subTags = new Set<string>();
  const subFeedUrls = new Set(subscriptions.map(s => s.feedUrl));

  subscriptions.forEach(sub => {
    const text = `${sub.title} ${sub.author}`.toLowerCase();
    // Simple split by non-alphanumeric/spaces or Chinese characters
    const words = text.split(/[\s,./()|&+-]+/);
    words.forEach(w => {
      if (w.length > 1) {
        subTags.add(w);
      }
    });
  });

  // Extract interests from history
  const historyTags = new Set<string>();
  history.forEach(hist => {
    const text = `${hist.podcastTitle || ""} ${hist.title || ""}`.toLowerCase();
    const words = text.split(/[\s,./()|&+-]+/);
    words.forEach(w => {
      if (w.length > 1) {
        historyTags.add(w);
      }
    });
  });

  // Score candidates
  const scored = RECOMMENDATION_POOL.map(cand => {
    // Base score has a tiny randomized factor to keep it fresh on each load
    let score = 1.0 + Math.random() * 0.2;

    // Filter out if user is already subscribed to this exact feed
    if (subFeedUrls.has(cand.feedUrl)) {
      score -= 100.0; // Heavily penalize
    }

    // Match tags
    cand.tags.forEach(tag => {
      // 1. Exact tag match in subTags
      if (subTags.has(tag)) {
        score += 2.5;
      }
      // 2. Substring matching for subscription text
      subscriptions.forEach(sub => {
        if (sub.title.toLowerCase().includes(tag) || sub.author.toLowerCase().includes(tag)) {
          score += 1.5;
        }
      });

      // 3. Exact tag match in historyTags
      if (historyTags.has(tag)) {
        score += 1.5;
      }
      // 4. Substring matching for history text
      history.forEach(hist => {
        if (
          (hist.podcastTitle || "").toLowerCase().includes(tag) || 
          (hist.title || "").toLowerCase().includes(tag)
        ) {
          score += 1.0;
        }
      });
    });

    return { candidate: cand, score };
  });

  // Filter out heavily penalized already-subscribed candidates unless we run out of choices
  let sorted = scored
    .filter(item => item.score > -50)
    .sort((a, b) => b.score - a.score)
    .map(item => item.candidate);

  // Fallback / padding: if we have fewer than 4 candidates left (because user subscribed to almost everything in the pool),
  // we can append some already subscribed ones at the end just to fill space
  if (sorted.length < 4) {
    const remaining = RECOMMENDATION_POOL.filter(cand => !sorted.some(s => s.feedUrl === cand.feedUrl));
    sorted.push(...remaining);
  }

  return sorted.slice(0, 6); // Return top 6 recommendations
}
