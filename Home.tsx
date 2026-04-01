import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useListNews, useListAds, useListBlogs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, BookOpen, ExternalLink } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  technology: "bg-blue-600",
  india: "bg-orange-500",
  world: "bg-purple-600",
  finance: "bg-green-600",
  general: "bg-gray-600",
};

const CATEGORIES = ["All", "India", "World", "Technology", "Finance", "General"];

const PLACEHOLDER_IMAGES: Record<string, string> = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  india: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80",
  world: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
  finance: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  general: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category?.toLowerCase()] ?? "bg-gray-600";
}

function getPlaceholder(category: string) {
  return PLACEHOLDER_IMAGES[category?.toLowerCase()] ?? PLACEHOLDER_IMAGES["general"]!;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatBullets(summaryPoints: string[] | undefined, description: string | undefined) {
  if (summaryPoints && summaryPoints.length > 0) return summaryPoints.slice(0, 3);
  if (description) return [description.slice(0, 120)];
  return [];
}

export default function Home() {
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: newsData, isLoading } = useListNews(
    category === "All" ? { page, limit } : { category: category.toLowerCase(), page, limit }
  );
  const { data: adsData } = useListAds();
  const { data: blogsData } = useListBlogs({ limit: 5 });

  const articles = newsData?.articles ?? [];
  const totalPages = newsData?.pagination?.totalPages ?? 1;
  const activeAds = adsData?.ads?.filter((a) => a.enabled) ?? [];
  const recentBlogs = blogsData?.blogs ?? [];

  // Split ads: sidebar ads and feed ads
  const sidebarAds = activeAds.filter((a) => a.placement === "sidebar" || a.placement === "body");
  const feedAds = activeAds.filter((a) => a.placement === "feed");

  function changePage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-3 py-4">

        {/* Search bar - mobile only top */}
        <div className="relative mb-3 md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            className="pl-9 rounded-full bg-muted border-0 focus-visible:ring-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") window.location.href = `/search?q=${e.currentTarget.value}`;
            }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                category === c
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Main layout: news grid + sidebar */}
        <div className="flex flex-col md:flex-row gap-5">

          {/* ── News Feed (left) ── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                    <Skeleton className="h-36 w-full" />
                    <div className="p-2.5 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {articles.map((article, index) => {
                    const showAd = index > 0 && index % 6 === 0 && feedAds.length > 0;
                    const ad = showAd ? feedAds[Math.floor(index / 6) % feedAds.length] : null;
                    const imgSrc = article.image || getPlaceholder(article.category ?? "general");
                    const bullets = formatBullets(article.summaryPoints, article.description ?? undefined);

                    return (
                      <div key={article.id} className="contents">
                        {showAd && ad && (
                          <div className="col-span-2 my-1">
                            <a
                              href={ad.linkUrl ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 hover:bg-amber-100 transition-colors"
                            >
                              <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">Ad</span>
                              {ad.imageUrl && (
                                <img src={ad.imageUrl} alt={ad.title} className="h-12 w-20 object-cover rounded-lg shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{ad.title}</p>
                                {ad.description && <p className="text-xs text-gray-500 truncate">{ad.description}</p>}
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-auto" />
                            </a>
                          </div>
                        )}

                        <Link
                          href={`/article/${article.id}`}
                          className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="relative h-36 bg-muted overflow-hidden">
                            <img
                              src={imgSrc}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getPlaceholder(article.category ?? "general");
                              }}
                            />
                            <span className={`absolute bottom-2 left-2 text-[10px] font-bold uppercase text-white px-2 py-0.5 rounded-full ${getCategoryColor(article.category ?? "general")}`}>
                              {article.category ?? "General"}
                            </span>
                          </div>
                          <div className="p-2.5 flex flex-col flex-1">
                            <h2 className="text-[13px] font-bold leading-snug text-gray-900 mb-1.5 line-clamp-3">
                              {article.title}
                            </h2>
                            {bullets.length > 0 && (
                              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
                                {bullets.join(" • ")}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                              {timeAgo(article.publishedAt)} · {article.sourceName ?? "PulseGurgaon"}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}

                  {articles.length === 0 && (
                    <div className="col-span-2 py-16 text-center text-muted-foreground text-sm">
                      No articles found for this category.
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => changePage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-full bg-muted disabled:opacity-40 hover:bg-muted/80 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => changePage(p)}
                          className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                            page === p
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => changePage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-full bg-muted disabled:opacity-40 hover:bg-muted/80 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar (right) ── */}
          <div className="w-full md:w-72 shrink-0 space-y-5">

            {/* Desktop search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                className="pl-9 rounded-full bg-muted border-0 focus-visible:ring-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") window.location.href = `/search?q=${e.currentTarget.value}`;
                }}
              />
            </div>

            {/* Sidebar Ad slot 1 */}
            {sidebarAds[0] && (
              <SidebarAd ad={sidebarAds[0]} />
            )}

            {/* Latest Blogs */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-gray-900">Latest Blogs</h3>
              </div>
              <div className="divide-y">
                {recentBlogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-4 py-3">No blogs yet.</p>
                ) : (
                  recentBlogs.map((blog) => (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.id}`}
                      className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-snug">{blog.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(blog.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </Link>
                  ))
                )}
                <Link href="/blogs" className="block px-4 py-2.5 text-[11px] font-semibold text-primary hover:underline">
                  View all blogs →
                </Link>
              </div>
            </div>

            {/* Sidebar Ad slot 2 */}
            {sidebarAds[1] && (
              <SidebarAd ad={sidebarAds[1]} />
            )}

            {/* Empty ad placeholder (shows admin how to fill) */}
            {sidebarAds.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center text-xs text-gray-400">
                <p className="font-semibold mb-1">Ad Space</p>
                <p>Add sidebar ads from Admin Portal</p>
              </div>
            )}

            {/* About box */}
            <div className="bg-primary/5 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-primary mb-1">PulseGurgaon</p>
              <p className="text-[11px] text-gray-500">AI-powered news from Gurgaon and beyond. Auto-refreshed every 30 minutes.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-muted-foreground py-5 border-t mt-6">
          PulseGurgaon • AI Powered News
        </div>
      </div>
    </Layout>
  );
}

function SidebarAd({ ad }: { ad: { title: string; description?: string | null; imageUrl?: string | null; linkUrl?: string | null } }) {
  const inner = (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/50 text-white px-1.5 py-0.5 rounded z-10">Ad</span>
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-32 object-cover" />
      ) : null}
      <div className="p-3">
        <p className="text-xs font-bold text-gray-800 line-clamp-2">{ad.title}</p>
        {ad.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{ad.description}</p>}
      </div>
    </div>
  );

  if (ad.linkUrl) {
    return <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return inner;
}
