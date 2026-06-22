import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ScrollText, FunctionSquare, Library, Grid3X3, FileText,
  Hash, Briefcase, Heart, Activity, Shield, Sparkles, Tag, FolderOpen, Users,
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
    title: "Number Library",
    items: [
      { name: "Number Meanings", href: "/number-meanings", icon: Hash },
      { name: "Tags & Categories", href: "/tags", icon: Tag },
    ],
  },
  {
    title: "Mappings",
    items: [
      { name: "Professions", href: "/professions", icon: Briefcase },
      { name: "Relationships", href: "/relationships", icon: Users },
      { name: "Health", href: "/health-mappings", icon: Activity },
      { name: "Compatibility", href: "/compatibility", icon: Heart },
      { name: "Remedies", href: "/remedies", icon: Sparkles },
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

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="w-60 border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <h1 className="text-base font-serif font-bold text-primary tracking-wide">Numerology CMS</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-5 px-3">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
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
