import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListKnowledgeEntries, getListKnowledgeEntriesQueryKey,
  useCreateKnowledgeEntry, useUpdateKnowledgeEntry, useDeleteKnowledgeEntry,
} from "@workspace/api-client-react";
import type { KnowledgeEntry } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import { Plus, Pencil, Trash2, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Personality Numbers", "Birthday Numbers", "Destiny Numbers", "Personal Years",
  "Lo Shu", "Compatibility", "Remedies", "Health", "Career", "Finance", "Relationships", "Custom",
];

const entrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
});
type EntryFormValues = z.infer<typeof entrySchema>;

function EntryDialog({ open, entry, onClose }: { open: boolean; entry: KnowledgeEntry | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateKnowledgeEntry();
  const updateMutation = useUpdateKnowledgeEntry();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: entry?.title ?? "",
      category: entry?.category ?? "",
      content: entry?.content ?? "",
      tags: entry?.tags ?? [],
      is_published: entry?.is_published ?? false,
    },
  });

  const onSubmit = async (data: EntryFormValues) => {
    try {
      const payload = { ...data, tags: data.tags ?? [] };
      if (entry) {
        await updateMutation.mutateAsync({ id: entry.id, data: payload });
        toast({ title: "Entry updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Entry created" });
      }
      qc.invalidateQueries({ queryKey: getListKnowledgeEntriesQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Entry" : "New Knowledge Entry"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input {...field} placeholder="Entry title..." data-testid="input-entry-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-entry-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Write your knowledge base content here..." rows={8} data-testid="input-entry-content" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add tags..." />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="is_published" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-entry-published" /></FormControl>
                <FormLabel className="!mt-0">Published</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-entry">
                Save Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function KnowledgePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeEntry | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: entries, isLoading } = useListKnowledgeEntries({ search: search || undefined, category: category || undefined });
  const deleteMutation = useDeleteKnowledgeEntry();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    qc.invalidateQueries({ queryKey: getListKnowledgeEntriesQueryKey() });
    toast({ title: "Entry deleted" });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your numerology knowledge entries</p>
        </div>
        <Button onClick={() => { setEditEntry(null); setDialogOpen(true); }} data-testid="button-new-entry">
          <Plus className="w-4 h-4 mr-2" />New Entry
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-entries"
          />
        </div>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48" data-testid="select-filter-category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (entries?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No entries found. Create your first knowledge entry.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries!.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <Card key={entry.id} data-testid={`entry-card-${entry.id}`} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isOpen ? null : entry.id); } }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{entry.title}</span>
                        <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                        {entry.is_published && <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/20">Published</Badge>}
                      </div>
                      {!isOpen && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{entry.content}</p>}
                      {entry.tags.length > 0 && !isOpen && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entry.tags.slice(0, 4).map((tag, i) => (
                            <span key={i} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                          {entry.tags.length > 4 && <span className="text-xs text-muted-foreground">+{entry.tags.length - 4}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => { setEditEntry(entry); setDialogOpen(true); }} data-testid={`button-edit-entry-${entry.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(entry)} data-testid={`button-delete-entry-${entry.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-3 border-t border-border/50 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Content</p>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      </div>
                      {entry.tags.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.tags.map((tag, i) => (
                              <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EntryDialog open={dialogOpen} entry={editEntry} onClose={() => setDialogOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete-entry">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
