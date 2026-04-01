import { Layout } from "../components/layout/Layout";
import { useGetNewsById, useListAds } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArticleDetail() {
  const { id } = useParams();
  const { data: article, isLoading } = useGetNewsById(Number(id));
  const { data: adsData } = useListAds();

  const activeAds = adsData?.ads?.filter(ad => ad.enabled) || [];
  const sidebarAd = activeAds.find(ad => ad.placement === 'sidebar') || activeAds[0];
  const bodyAd = activeAds.find(ad => ad.placement === 'body') || activeAds[1] || activeAds[0];

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Skeleton className="h-[400px] w-full rounded-xl mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you are looking for does not exist or has been removed.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="default" className="bg-primary hover:bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs">
                  {article.category}
                </Badge>
                {article.aiEnhanced && (
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                    AI Enhanced
                  </Badge>
                )}
                <div className="flex items-center text-sm text-muted-foreground ml-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(article.publishedAt).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-6 text-foreground">
                {article.title}
              </h1>
              
              {article.sourceName && (
                <div className="flex items-center text-sm font-medium mb-8">
                  <span className="text-muted-foreground mr-2">Source:</span>
                  <span className="text-foreground">{article.sourceName}</span>
                  {article.sourceUrl && (
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline flex items-center">
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </header>

            {article.image && (
              <figure className="mb-10 rounded-xl overflow-hidden border bg-muted">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-[300px] md:h-[450px] object-cover" 
                />
              </figure>
            )}

            {/* Quick Summary */}
            {article.summaryPoints && article.summaryPoints.length > 0 && (
              <div className="bg-muted/50 border rounded-xl p-6 mb-10">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <span className="w-1.5 h-6 bg-primary rounded-full mr-3"></span>
                  Quick Summary
                </h3>
                <ul className="space-y-3">
                  {article.summaryPoints.map((point, i) => (
                    <li key={i} className="flex items-start text-foreground/90">
                      <ArrowRight className="h-5 w-5 text-primary shrink-0 mr-3 mt-0.5" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Body Ad */}
            {bodyAd && (
              <div className="my-10 bg-muted border rounded-xl p-4 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Advertisement</div>
                {bodyAd.linkUrl ? (
                  <a href={bodyAd.linkUrl} target="_blank" rel="noopener noreferrer">
                    {bodyAd.imageUrl ? (
                      <img src={bodyAd.imageUrl} alt={bodyAd.title} className="w-full max-h-[250px] object-cover rounded-lg" />
                    ) : (
                      <div className="py-8 font-serif text-xl font-bold">{bodyAd.title}</div>
                    )}
                  </a>
                ) : (
                  <div>
                    {bodyAd.imageUrl ? (
                      <img src={bodyAd.imageUrl} alt={bodyAd.title} className="w-full max-h-[250px] object-cover rounded-lg" />
                    ) : (
                      <div className="py-8 font-serif text-xl font-bold">{bodyAd.title}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full Article Text */}
            <div className="prose prose-lg dark:prose-invert prose-headings:font-serif max-w-none mb-12 text-foreground/90 leading-relaxed">
              {article.fullArticle.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Timeline */}
            {article.timeline && article.timeline.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-serif font-bold mb-8">Timeline of Events</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {article.timeline.map((step, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold">
                        {step.step}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-5 rounded-xl shadow-sm">
                        <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vocabulary */}
            {article.vocabulary && article.vocabulary.length > 0 && (
              <div className="bg-card border rounded-xl overflow-hidden mb-12">
                <div className="bg-muted p-4 border-b flex items-center">
                  <BookOpen className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-bold text-lg">Key Vocabulary</h3>
                </div>
                <div className="p-0">
                  {article.vocabulary.map((vocab, i) => (
                    <div key={i} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <div className="font-bold text-primary mb-1">{vocab.word}</div>
                      <div className="text-sm text-foreground/80">{vocab.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {sidebarAd && (
              <div className="sticky top-24">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-2 text-right">Advertisement</div>
                <div className="bg-muted border rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                  {sidebarAd.linkUrl ? (
                    <a href={sidebarAd.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                      {sidebarAd.imageUrl ? (
                        <img src={sidebarAd.imageUrl} alt={sidebarAd.title} className="w-full h-auto object-cover" />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center p-6 text-center bg-card">
                          <h3 className="font-serif font-bold text-2xl">{sidebarAd.title}</h3>
                        </div>
                      )}
                    </a>
                  ) : (
                    <div>
                      {sidebarAd.imageUrl ? (
                        <img src={sidebarAd.imageUrl} alt={sidebarAd.title} className="w-full h-auto object-cover" />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center p-6 text-center bg-card">
                          <h3 className="font-serif font-bold text-2xl">{sidebarAd.title}</h3>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </Layout>
  );
}
