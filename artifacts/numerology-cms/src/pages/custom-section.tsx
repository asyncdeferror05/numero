import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, FileText } from "lucide-react";

interface CustomNavItem {
  id: string;
  group: string;
  name: string;
  emoji: string;
}

const STORAGE_KEY = "cms_custom_nav";
const NOTES_KEY = "cms_custom_notes";

function loadCustomItems(): CustomNavItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomNavItem[]) : [];
  } catch {
    return [];
  }
}

function loadNotes(id: string): string {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const notes: Record<string, string> = raw ? JSON.parse(raw) : {};
    return notes[id] ?? "";
  } catch {
    return "";
  }
}

function saveNotes(id: string, content: string) {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const notes: Record<string, string> = raw ? JSON.parse(raw) : {};
    notes[id] = content;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {}
}

function EditSectionDialog({
  open,
  item,
  onClose,
  onSave,
}: {
  open: boolean;
  item: CustomNavItem;
  onClose: () => void;
  onSave: (name: string, emoji: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [emoji, setEmoji] = useState(item.emoji);

  useEffect(() => {
    setName(item.name);
    setEmoji(item.emoji);
  }, [item]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), emoji.trim() || "📁");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
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
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide block mb-1.5">Section Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CustomSectionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();

  const [items, setItems] = useState<CustomNavItem[]>(loadCustomItems);
  const [notes, setNotes] = useState(() => loadNotes(id));
  const [editOpen, setEditOpen] = useState(false);

  const section = items.find((i) => i.id === id);

  useEffect(() => {
    setNotes(loadNotes(id));
  }, [id]);

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setNotes(val);
    saveNotes(id, val);
  }

  function handleSave(name: string, emoji: string) {
    const updated = items.map((i) => (i.id === id ? { ...i, name, emoji } : i));
    setItems(updated);
    localStorage.setItem("cms_custom_nav", JSON.stringify(updated));
  }

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <FileText className="w-12 h-12 text-muted-foreground/40" />
        <div>
          <p className="text-lg font-medium">Section not found</p>
          <p className="text-sm text-muted-foreground mt-1">This section may have been deleted.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{section.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold">{section.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Custom section · {section.group}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Section
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Notes</p>
            <p className="text-xs text-muted-foreground">Use this space to document your numerology knowledge for this section. Changes save automatically.</p>
          </div>
          <Textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder={`Add your notes about "${section.name}" here…`}
            className="min-h-[320px] text-sm resize-y font-mono bg-muted/30"
          />
        </CardContent>
      </Card>

      {section && (
        <EditSectionDialog
          open={editOpen}
          item={section}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
