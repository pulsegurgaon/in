import { Layout } from "../components/layout/Layout";
import { useListBlogs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Blogs() {
  const { data: blogsData, isLoading } = useListBlogs();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight">Editorial & Opinions</h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Deep dives, thoughtful analysis, and fresh perspectives from our editors and guest contributors.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col">
                <Skeleton className="h-[300px] w-full rounded-xl mb-6" />
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {blogsData?.blogs?.map((blog, index) => (
              <Link 
                key={blog.id} 
                href={`/blog/${blog.id}`}
                className="group flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative mb-6 rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
                  {blog.image ? (
                    <img 
                      src={blog.image} 
                      alt={blog.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card border">
                      <span className="font-serif text-4xl text-muted-foreground/30">Pulse</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-background text-foreground hover:bg-background shadow-sm font-semibold tracking-wide uppercase text-xs px-3 py-1">
                      {blog.category}
                    </Badge>
                  </div>
                </div>
                
                <h2 className="text-3xl font-serif font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
                  {blog.title}
                </h2>
                
                <p className="text-muted-foreground text-lg leading-relaxed mb-6 line-clamp-3">
                  {blog.excerpt}
                </p>
                
                <div className="mt-auto flex items-center text-sm font-semibold text-primary uppercase tracking-wider">
                  Read Article <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
            
            {(!blogsData?.blogs || blogsData.blogs.length === 0) && (
              <div className="col-span-full py-20 text-center border border-dashed rounded-2xl bg-muted/10">
                <h3 className="text-2xl font-serif font-bold mb-2">No blogs published yet</h3>
                <p className="text-muted-foreground">Check back later for fresh perspectives.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
