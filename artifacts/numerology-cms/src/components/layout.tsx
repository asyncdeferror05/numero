import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ScrollText, FunctionSquare, Library, Grid3X3, FileText,
  Hash, Briefcase, Heart, Activity, Sparkles, Tag, Users, Plus, Folder, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATIC_NAV = [
  {
    title: "Knowledge Engine",
    extensible: true,
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Rules", href: "/rules", icon: ScrollText },
      { name: "Formulas", href: "/formulas", icon: FunctionSquare },
    ],
  },
  {
    title: "Number Library",
    extensible: true,
    items: [
      { name: "Number Meanings", href: "/number-meanings", icon: Hash },
      { name: "Tags & Categories", href: "/tags", icon: Tag },
    ],
  },
  {
    title: "Mappings",
    extensible: true,
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
    extensible: false,
    items: [
      { name: "Lo Shu CMS", href: "/lo-shu", icon: Grid3X3 },
    ],
  },
  {
    title: "Content",
    extensible: true,
    items: [
      { name: "Knowledge Base", href: "/knowledge", icon: Library },
    ],
  },
  {
    title: "Tools",
    extensible: false,
    items: [
      { name: "Report Generator", href: "/reports", icon: FileText },
    ],
  },
];

const STORAGE_KEY = "cms_custom_nav";

interface CustomNavItem {
  id: string;
  group: string;
  name: string;
  emoji: string;
}

function loadCustomItems(): CustomNavItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomNavItem[]) : [];
  } catch {
    return [];
  }
}

function saveCustomItems(items: CustomNavItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function AddSectionDialog({
  open,
  groupTitle,
  onClose,
  onAdd,
}: {
  open: boolean;
  groupTitle: string;
  onClose: () => void;
  onAdd: (item: Omit<CustomNavItem, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ group: groupTitle, name: name.trim(), emoji: emoji.trim() || "📁" });
    setName("");
    setEmoji("📁");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Section under "{groupTitle}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="flex gap-3">
            <div className="w-20">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide block mb-1.5">Icon</label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="text-center text-xl h-10"
                maxLength={4}
                placeholder="📁"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide block mb-1.5">Section Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marriage Numbers"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>Add Section</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [customItems, setCustomItems] = useState<CustomNavItem[]>(loadCustomItems);
  const [addDialog, setAddDialog] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleAdd = useCallback((item: Omit<CustomNavItem, "id">) => {
    const newItem: CustomNavItem = {
      ...item,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setCustomItems((prev) => {
      const next = [...prev, newItem];
      saveCustomItems(next);
      return next;
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setCustomItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCustomItems(next);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="w-60 border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <h1 className="text-base font-serif font-bold text-primary tracking-wide">Numerology CMS</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-5 px-3">
            {STATIC_NAV.map((section) => {
              const sectionCustomItems = customItems.filter((c) => c.group === section.title);
              return (
                <div key={section.title}>
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {section.title}
                    </h3>
                    {section.extensible && (
                      <button
                        type="button"
                        onClick={() => setAddDialog(section.title)}
                        className="w-4 h-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title={`Add section to ${section.title}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
                    {sectionCustomItems.map((custom) => {
                      const href = `/custom/${custom.id}`;
                      const isActive = location === href;
                      return (
                        <div key={custom.id} className="group relative">
                          <Link
                            href={href}
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors pr-7",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                            )}
                          >
                            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-sm leading-none" aria-hidden="true">
                              {custom.emoji || <Folder className="w-3.5 h-3.5 text-muted-foreground" />}
                            </span>
                            <span className="truncate">{custom.name}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(custom.id); }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-all"
                            title="Remove section"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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

      <AddSectionDialog
        open={addDialog !== null}
        groupTitle={addDialog ?? ""}
        onClose={() => setAddDialog(null)}
        onAdd={handleAdd}
      />
    </div>
  );
}
