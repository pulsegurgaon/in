import { Layout } from "../components/layout/Layout";
import { useGetBlogById } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BlogDetail() {
  const { id } = useParams();
  const { data: blog, isLoading } = useGetBlogById(Number(id));

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-8 mx-auto" />
          <Skeleton className="h-16 w-full mb-8" />
          <Skeleton className="h-6 w-3/4 mb-12 mx-auto" />
          <Skeleton className="h-[500px] w-full rounded-2xl mb-12" />
          <div className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Blog Not Found</h1>
          <p className="text-muted-foreground mb-8">This article might have been removed or the link is incorrect.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="pb-24">
        {/* Header Section */}
        <header className="container mx-auto px-4 pt-16 pb-12 max-w-4xl text-center">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 mb-8 px-4 py-1.5 text-sm font-semibold tracking-wider uppercase border-0">
            {blog.category}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-8 text-foreground balance-text">
            {blog.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-serif italic">
            {blog.excerpt}
          </p>
          
          <div className="mt-10 flex items-center justify-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
            <span>Pulse Editorial</span>
            <span className="mx-4 text-primary">•</span>
            <time dateTime={blog.createdAt}>
              {new Date(blog.createdAt).toLocaleDateString(undefined, { 
                month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </time>
          </div>
        </header>

        {/* Hero Image */}
        {blog.image && (
          <div className="w-full max-w-6xl mx-auto px-4 mb-16">
            <figure className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={blog.image} 
                alt={blog.title} 
                className="w-full aspect-video md:aspect-[21/9] object-cover" 
              />
            </figure>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-xl dark:prose-invert prose-headings:font-serif prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-blockquote:border-l-primary prose-blockquote:font-serif prose-blockquote:text-xl prose-blockquote:italic max-w-none">
            {blog.content.split('\n\n').map((paragraph, i) => {
              if (paragraph.startsWith('# ')) {
                return <h1 key={i}>{paragraph.replace('# ', '')}</h1>;
              }
              if (paragraph.startsWith('## ')) {
                return <h2 key={i}>{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('> ')) {
                return <blockquote key={i}>{paragraph.replace('> ', '')}</blockquote>;
              }
              return <p key={i}>{paragraph}</p>;
            })}
          </div>
          
          <hr className="my-16 border-muted" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/30 rounded-2xl p-8 border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif text-2xl font-bold">
                P
              </div>
              <div>
                <h4 className="font-bold text-lg">Pulse Editorial</h4>
                <p className="text-sm text-muted-foreground">The collective voice of PulseGurgaon.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/blogs'}>
              More Articles
            </Button>
          </div>
        </div>
      </article>
    </Layout>
  );
}
