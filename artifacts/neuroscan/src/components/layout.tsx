import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BrainCircuit, LayoutDashboard, ScanLine, History, Cpu, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/scan", label: "New Scan", icon: ScanLine },
    { href: "/history", label: "History", icon: History },
    { href: "/model", label: "Model Info", icon: Cpu },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">NeuroScan</span>
        </div>
        
        <div className="px-4 py-2">
          <Link href="/scan">
            <Button className="w-full justify-start gap-2 shadow-sm" size="lg">
              <ScanLine className="w-4 h-4" />
              Perform Scan
            </Button>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground text-center">
          <p>NeuroScan Research Tool</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">NeuroScan</span>
          </div>
          <Link href="/scan">
            <Button size="sm" className="gap-2">
              <ScanLine className="w-4 h-4" />
              Scan
            </Button>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
