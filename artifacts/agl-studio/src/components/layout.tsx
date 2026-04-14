import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Flame, ArrowRightLeft, Wallet, Info, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/burn", label: "Burn Portal", icon: Flame },
    { href: "/transfers", label: "Transfers", icon: ArrowRightLeft },
    { href: "/wallet", label: "Wallet Lookup", icon: Wallet },
    { href: "/about", label: "Tokenomics", icon: Info },
  ];

  const NavLinks = () => (
    <div className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const active = location === item.href;
        return (
          <Link key={item.href} href={item.href} className={`flex items-center space-x-3 px-4 py-3 rounded-none border-l-2 transition-all ${active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            <item.icon className="h-5 w-5" />
            <span className="font-medium tracking-tight uppercase text-sm">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background text-foreground font-mono">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-none flex items-center justify-center text-background font-bold">
            AGL
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-widest text-primary glow-text">STUDIO<span className="text-muted-foreground text-xs ml-1">v6</span></h1>
          </div>
        </div>
        <div className="flex-1 py-6 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${health?.status === 'ok' ? 'bg-primary' : 'bg-destructive'} animate-pulse`} />
            <span>SYS: {health?.status === 'ok' ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-primary rounded-none flex items-center justify-center text-background font-bold text-xs">
            A
          </div>
          <h1 className="font-bold tracking-widest text-primary">AGL STUDIO</h1>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="border-primary/20 text-primary hover:bg-primary/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card border-r-border font-mono">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-lg tracking-widest text-primary">AGL STUDIO v6</h2>
            </div>
            <div className="py-6">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="relative z-10 p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
