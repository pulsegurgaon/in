import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "../components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetNewsStats,
  useListNews,
  useDeleteArticle,
  useListBlogs,
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  useGetTicker,
  useUpdateTicker,
  useListAds,
  useCreateAd,
  useUpdateAd,
  useDeleteAd,
  useRefreshNews,
  getListNewsQueryKey,
  getListBlogsQueryKey,
  getListAdsQueryKey,
  getGetTickerQueryKey,
  getGetNewsStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Trash2, Edit, Plus, BarChart3, Newspaper, FileText, Megaphone, MonitorPlay, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem("pulse_admin_token");
    if (!token) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("pulse_admin_token");
    setLocation("/admin");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your news platform content and settings.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="shrink-0 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 border mb-6 h-auto p-1 rounded-xl">
            <TabsTrigger value="stats" className="py-2.5 rounded-lg"><BarChart3 className="h-4 w-4 mr-2" />Stats</TabsTrigger>
            <TabsTrigger value="articles" className="py-2.5 rounded-lg"><Newspaper className="h-4 w-4 mr-2" />Articles</TabsTrigger>
            <TabsTrigger value="blogs" className="py-2.5 rounded-lg"><FileText className="h-4 w-4 mr-2" />Blogs</TabsTrigger>
            <TabsTrigger value="ticker" className="py-2.5 rounded-lg"><Megaphone className="h-4 w-4 mr-2" />Ticker</TabsTrigger>
            <TabsTrigger value="ads" className="py-2.5 rounded-lg"><MonitorPlay className="h-4 w-4 mr-2" />Ads</TabsTrigger>
            <TabsTrigger value="refresh" className="py-2.5 rounded-lg"><RefreshCw className="h-4 w-4 mr-2" />Refresh News</TabsTrigger>
          </TabsList>

          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="articles"><ArticlesTab /></TabsContent>
          <TabsContent value="blogs"><BlogsTab /></TabsContent>
          <TabsContent value="ticker"><TickerTab /></TabsContent>
          <TabsContent value="ads"><AdsTab /></TabsContent>
          <TabsContent value="refresh"><RefreshTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = useGetNewsStats();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-serif font-bold text-primary">{stats.totalArticles}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Blogs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-serif font-bold">{stats.totalBlogs}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Last Refreshed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            {stats.lastRefreshed ? new Date(stats.lastRefreshed).toLocaleString() : 'Never'}
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Articles by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(stats.categoryCounts || {}).map(([category, count]) => (
              <div key={category} className="bg-muted p-4 rounded-lg text-center">
                <div className="text-2xl font-bold mb-1">{count}</div>
                <div className="text-xs text-muted-foreground uppercase">{category}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArticlesTab() {
  const { data: newsData, isLoading } = useListNews({ limit: 50 });
  const deleteMutation = useDeleteArticle();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetNewsStatsQueryKey() });
          toast({ title: "Article deleted" });
        },
        onError: () => toast({ variant: "destructive", title: "Error deleting article" })
      }
    );
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Articles</CardTitle>
        <CardDescription>Recent articles fetched from news sources.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
            <div className="col-span-6">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-3">Published</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {newsData?.articles?.map((article) => (
              <div key={article.id} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-muted/50">
                <div className="col-span-6 font-medium line-clamp-1 pr-4">{article.title}</div>
                <div className="col-span-2 capitalize text-muted-foreground">{article.category}</div>
                <div className="col-span-3 text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString()}</div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(article.id)} disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BlogsTab() {
  const { data: blogsData, isLoading } = useListBlogs();
  const deleteMutation = useDeleteBlog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetNewsStatsQueryKey() });
          toast({ title: "Blog deleted" });
        },
        onError: () => toast({ variant: "destructive", title: "Error deleting blog" })
      }
    );
  };

  const openEdit = (blog: any) => {
    setEditingBlog(blog);
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditingBlog(null);
    setIsOpen(true);
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Blogs</CardTitle>
          <CardDescription>Editorial content created by admins.</CardDescription>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Blog</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
            <div className="col-span-5">Title</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y">
            {blogsData?.blogs?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No blogs found. Create one!</div>
            )}
            {blogsData?.blogs?.map((blog) => (
              <div key={blog.id} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-muted/50">
                <div className="col-span-5 font-medium line-clamp-1 pr-4">{blog.title}</div>
                <div className="col-span-3 capitalize text-muted-foreground">{blog.category}</div>
                <div className="col-span-2 text-muted-foreground">{new Date(blog.createdAt).toLocaleDateString()}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(blog)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(blog.id)} disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? "Edit Blog" : "Create New Blog"}</DialogTitle>
          </DialogHeader>
          <BlogForm blog={editingBlog} onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BlogForm({ blog, onSuccess }: { blog?: any, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: blog?.title || "",
    category: blog?.category || "",
    excerpt: blog?.excerpt || "",
    image: blog?.image || "",
    content: blog?.content || "",
  });

  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (blog) {
      updateMutation.mutate(
        { id: blog.id, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
            toast({ title: "Blog updated successfully" });
            onSuccess();
          },
          onError: () => toast({ variant: "destructive", title: "Error updating blog" })
        }
      );
    } else {
      createMutation.mutate(
        { data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetNewsStatsQueryKey() });
            toast({ title: "Blog created successfully" });
            onSuccess();
          },
          onError: () => toast({ variant: "destructive", title: "Error creating blog" })
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required placeholder="e.g. Technology, Opinion" />
        </div>
        <div className="space-y-2">
          <Label>Image URL (Optional)</Label>
          <Input value={formData.image || ""} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Excerpt (Short summary)</Label>
        <Textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} required rows={2} />
      </div>
      
      <div className="space-y-2">
        <Label>Content (Markdown supported)</Label>
        <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows={10} className="font-mono text-sm" />
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Blog"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TickerTab() {
  const { data: ticker, isLoading } = useGetTicker();
  const updateMutation = useUpdateTicker();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (ticker) {
      setText(ticker.text || "");
      setEnabled(!!ticker.enabled);
    }
  }, [ticker]);

  const handleSave = () => {
    updateMutation.mutate(
      { data: { text, enabled } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTickerQueryKey() });
          toast({ title: "Ticker updated successfully" });
        },
        onError: () => toast({ variant: "destructive", title: "Error updating ticker" })
      }
    );
  };

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Breaking News Ticker</CardTitle>
        <CardDescription>Manage the scrolling text banner at the top of the site.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Ticker</Label>
            <p className="text-sm text-muted-foreground">Show or hide the scrolling banner</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-primary" />
        </div>
        
        <div className="space-y-2">
          <Label>Ticker Text</Label>
          <Textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="BREAKING: Enter your scrolling news text here..." 
            rows={3}
          />
        </div>
        
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full bg-primary text-primary-foreground">
          {updateMutation.isPending ? "Saving..." : "Save Ticker Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdsTab() {
  const { data: adsData, isLoading } = useListAds();
  const deleteMutation = useDeleteAd();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
          toast({ title: "Ad deleted" });
        },
        onError: () => toast({ variant: "destructive", title: "Error deleting ad" })
      }
    );
  };

  const openEdit = (ad: any) => {
    setEditingAd(ad);
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditingAd(null);
    setIsOpen(true);
  };

  const toggleAd = (ad: any) => {
    // We need useUpdateAd to toggle
    // However, the component already imports it in the parent. Let's create a small function.
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Advertisements</CardTitle>
          <CardDescription>Configure ads shown between articles and in sidebars.</CardDescription>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Ad</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adsData?.ads?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              No advertisements found. Create one!
            </div>
          )}
          {adsData?.ads?.map((ad) => (
            <div key={ad.id} className={`border rounded-xl overflow-hidden flex flex-col ${ad.enabled ? 'border-primary/50 ring-1 ring-primary/20' : 'opacity-70'}`}>
              <div className="h-32 bg-muted relative flex items-center justify-center border-b">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground font-medium">No Image</span>
                )}
                <div className="absolute top-2 right-2 bg-background/90 text-xs px-2 py-1 rounded font-bold shadow-sm">
                  {ad.placement}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold mb-1 truncate">{ad.title}</h3>
                <p className="text-xs text-muted-foreground truncate mb-4">{ad.linkUrl || "No link"}</p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${ad.enabled ? 'bg-green-500' : 'bg-muted-foreground'}`}></span>
                    <span className="text-xs font-medium">{ad.enabled ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ad)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ad.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Advertisement" : "Create New Advertisement"}</DialogTitle>
          </DialogHeader>
          <AdForm ad={editingAd} onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AdForm({ ad, onSuccess }: { ad?: any, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: ad?.title || "",
    imageUrl: ad?.imageUrl || "",
    linkUrl: ad?.linkUrl || "",
    placement: ad?.placement || "feed",
    enabled: ad !== undefined ? ad.enabled : true,
  });

  const createMutation = useCreateAd();
  const updateMutation = useUpdateAd();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ad) {
      updateMutation.mutate(
        { id: ad.id, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
            toast({ title: "Ad updated successfully" });
            onSuccess();
          },
          onError: () => toast({ variant: "destructive", title: "Error updating ad" })
        }
      );
    } else {
      createMutation.mutate(
        { data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
            toast({ title: "Ad created successfully" });
            onSuccess();
          },
          onError: () => toast({ variant: "destructive", title: "Error creating ad" })
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Internal Title (for admin)</Label>
        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
      </div>
      
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
      </div>
      
      <div className="space-y-2">
        <Label>Target Link URL</Label>
        <Input value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} placeholder="https://..." />
      </div>
      
      <div className="space-y-2">
        <Label>Placement</Label>
        <Select value={formData.placement} onValueChange={(val) => setFormData({...formData, placement: val})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feed">News Feed (between cards)</SelectItem>
            <SelectItem value="sidebar">Article Sidebar</SelectItem>
            <SelectItem value="body">Inside Article Body</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/30">
        <Label className="cursor-pointer" htmlFor="ad-active">Active</Label>
        <Switch id="ad-active" checked={formData.enabled} onCheckedChange={checked => setFormData({...formData, enabled: checked})} className="data-[state=checked]:bg-primary" />
      </div>
      
      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="outline" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Advertisement"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RefreshTab() {
  const refreshMutation = useRefreshNews();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = () => {
    refreshMutation.mutate(undefined, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetNewsStatsQueryKey() });
        toast({ 
          title: "News Refreshed", 
          description: `${data.newArticles} new articles added and enhanced with AI.`
        });
      },
      onError: () => toast({ variant: "destructive", title: "Error refreshing news" })
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Manual Data Refresh</CardTitle>
        <CardDescription>Trigger the backend to fetch new articles from external sources and process them through AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-primary/10 p-6 rounded-full mb-4">
          <RefreshCw className={`h-12 w-12 text-primary ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Sync Latest News</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            This action fetches the latest articles from configured RSS feeds, categorizes them, 
            generates AI summaries, timelines, and extracts key vocabulary. 
            <strong>This process may take a minute or two.</strong>
          </p>
          <Button 
            size="lg" 
            onClick={handleRefresh} 
            disabled={refreshMutation.isPending}
            className="px-8 bg-primary text-primary-foreground font-bold text-lg h-14"
          >
            {refreshMutation.isPending ? "Processing..." : "Run News Sync"}
          </Button>
        </div>
        
        {refreshMutation.isSuccess && refreshMutation.data && (
          <div className="mt-8 p-4 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-500/20 w-full">
            <p className="font-semibold text-lg">{refreshMutation.data.message}</p>
            <p>Added {refreshMutation.data.newArticles} new articles to the database.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
