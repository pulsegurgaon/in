import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useSearchNews, useAiSearch, useGetNewsCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, Sparkles, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Search() {
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get("q") || "");
  const [isAiMode, setIsAiMode] = useState(false);
  const [category, setCategory] = useState("all");
  const [hasSearched, setHasSearched] = useState(!!query);

  const { data: categoriesData } = useGetNewsCategories();
  
  const { data: standardResults, isLoading: standardLoading } = useSearchNews(
    { q: query, category: category !== "all" ? category : undefined },
    { query: { enabled: !isAiMode && hasSearched && !!query } }
  );

  const aiSearchMutation = useAiSearch();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setHasSearched(true);
    
    if (isAiMode) {
      aiSearchMutation.mutate({ data: { query } });
    }
  };

  const handleSuggestClick = (topic: string) => {
    setQuery(topic);
    setIsAiMode(true);
    aiSearchMutation.mutate({ data: { query: topic } });
  };

  const isLoading = (isAiMode && aiSearchMutation.isPending) || (!isAiMode && standardLoading);
  const results = isAiMode ? aiSearchMutation.data?.articles : standardResults?.articles;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Find Your News</h1>
          <p className="text-muted-foreground text-lg">Search through our archives or ask our AI to find exactly what you need.</p>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm mb-12">
          <form onSubmit={handleSearch} className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <Label htmlFor="ai-mode" className="flex items-center gap-2 cursor-pointer text-base font-semibold">
                <Sparkles className={`h-5 w-5 ${isAiMode ? "text-primary" : "text-muted-foreground"}`} />
                <span className={isAiMode ? "text-primary" : ""}>AI Smart Search</span>
              </Label>
              <Switch 
                id="ai-mode" 
                checked={isAiMode} 
                onCheckedChange={setIsAiMode}
                className="data-[state=checked]:bg-primary" 
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isAiMode ? "Ask a question (e.g. What happened in tech last week?)" : "Search keywords..."}
                  className="pl-12 h-14 text-lg bg-background border-muted-foreground/20 focus-visible:ring-primary"
                />
              </div>
              
              {!isAiMode && (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full md:w-[200px] h-14 bg-background border-muted-foreground/20">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoriesData?.categories?.map(c => (
                      <SelectItem key={c.name} value={c.name.toLowerCase()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button type="submit" size="lg" className="h-14 px-8 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                Search
              </Button>
            </div>
            
            {isAiMode && (
              <div className="px-2 text-sm text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>AI search understands natural language and can synthesize answers from multiple articles.</p>
              </div>
            )}
          </form>
        </div>

        {/* AI Interpretation */}
        {isAiMode && aiSearchMutation.data?.interpretation && (
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Sparkles className="h-5 w-5 text-primary" />
            <AlertTitle className="font-serif font-bold text-lg mb-2">AI Summary</AlertTitle>
            <AlertDescription className="text-base leading-relaxed">
              {aiSearchMutation.data.interpretation}
            </AlertDescription>
          </Alert>
        )}

        {/* Suggested Topics */}
        {isAiMode && aiSearchMutation.data?.suggestedTopics && aiSearchMutation.data.suggestedTopics.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Related Topics to Explore</h3>
            <div className="flex flex-wrap gap-2">
              {aiSearchMutation.data.suggestedTopics.map((topic, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                  onClick={() => handleSuggestClick(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6 flex items-center">
              Results {results ? `(${results.length})` : ''}
            </h2>
            
            {isLoading ? (
              <div className="space-y-6">
                {[1,2,3].map(i => (
                  <div key={i} className="flex flex-col sm:flex-row gap-4 border rounded-xl p-4 bg-card">
                    <Skeleton className="h-32 w-full sm:w-48 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-3 py-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                {results.map((article) => (
                  <Link key={article.id} href={`/article/${article.id}`}>
                    <div className="group flex flex-col sm:flex-row gap-6 border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-colors p-4">
                      {article.image && (
                        <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden rounded-lg">
                          <img 
                            src={article.image} 
                            alt={article.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 py-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                            {article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {article.description}
                        </p>
                        <div className="mt-auto text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {article.sourceName}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border rounded-xl bg-muted/30">
                <SearchIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
