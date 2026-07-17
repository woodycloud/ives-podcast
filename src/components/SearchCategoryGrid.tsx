import React from "react";

interface Category {
  id: string;
  title: string;
  query: string;
  gradient: string;
}

const CATEGORIES: Category[] = [
  {
    id: "tech",
    title: "Tech & Future",
    query: "Technology",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "business",
    title: "Business & Finance",
    query: "Business",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "culture",
    title: "Culture & History",
    query: "History",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "news",
    title: "News & Society",
    query: "News",
    gradient: "from-rose-400 to-red-500",
  },
  {
    id: "science",
    title: "Science & Discovery",
    query: "Science",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    id: "design",
    title: "Arts & Design",
    query: "Design",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    id: "life",
    title: "Lifestyle & Health",
    query: "Health",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    id: "comedy",
    title: "Comedy & Humour",
    query: "Comedy",
    gradient: "from-fuchsia-400 to-rose-500",
  },
];

interface SearchCategoryGridProps {
  onSelectCategory: (query: string) => void;
}

export const SearchCategoryGrid: React.FC<SearchCategoryGridProps> = ({ onSelectCategory }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 px-1">Explore Popular Categories</h3>
      <div className="grid grid-cols-2 gap-3.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`category-${cat.id}`}
            onClick={() => onSelectCategory(cat.query)}
            className={`h-24 rounded-2xl bg-gradient-to-br ${cat.gradient} p-4 text-left flex flex-col justify-end text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 select-none group relative overflow-hidden`}
          >
            {/* Elegant glassmorphism circle design element in background */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300" />
            
            <span className="text-xs font-semibold uppercase tracking-wider opacity-85 font-sans">
              {cat.query}
            </span>
            <span className="text-sm font-bold tracking-wide mt-0.5">
              {cat.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
