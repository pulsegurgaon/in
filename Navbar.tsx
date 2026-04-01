import { Link, useLocation } from "wouter";
import { Search, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground font-serif font-bold text-xl px-2 py-1 rounded-sm">P</div>
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">PulseGurgaon</span>
          </Link>
          <nav className="hidden md:flex gap-6 ml-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-foreground" : "text-muted-foreground"}`}>News</Link>
            <Link href="/blogs" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/blog") ? "text-foreground" : "text-muted-foreground"}`}>Blogs</Link>
            <Link href="/search" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/search" ? "text-foreground" : "text-muted-foreground"}`}>AI Search</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
