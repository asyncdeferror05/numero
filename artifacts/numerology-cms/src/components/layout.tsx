import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ScrollText, 
  FunctionSquare, 
  Library, 
  Grid3X3, 
  FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    title: "Knowledge Engine",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Rules", href: "/rules", icon: ScrollText },
      { name: "Formulas", href: "/formulas", icon: FunctionSquare },
    ],
  },
  {
    title: "Lo Shu Grid",
    items: [
      { name: "Lo Shu CMS", href: "/lo-shu", icon: Grid3X3 },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "Knowledge Base", href: "/knowledge", icon: Library },
    ],
  },
  {
    title: "Tools",
    items: [
      { name: "Report Generator", href: "/reports", icon: FileText },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Force dark mode on body
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-lg font-serif font-bold text-primary">Numerology CMS</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-8 px-4">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-secondary"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
