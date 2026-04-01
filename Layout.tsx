import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Ticker } from "./Ticker";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <Ticker />
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 mt-12 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="font-serif text-lg font-bold text-foreground mb-2">PulseGurgaon</div>
          <p>© {new Date().getFullYear()} PulseGurgaon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
