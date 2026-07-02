import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRemedies, getListRemediesQueryKey,
  useCreateRemedy, useUpdateRemedy, useDeleteRemedy,
} from "@workspace/api-client-react";
import type { Remedy } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["health", "career", "finance", "relationship", "spiritual"];
const CAT_COLORS: Record<string, string> = {
  health: "bg-emerald-500/20 text-emerald-400",
  career: "bg-blue-500/20 text-blue-400",
  finance: "bg-amber-500/20 text-amber-400",
  relationship: "bg-pink-500/20 text-pink-400",
  spiritual: "bg-violet-500/20 text-violet-400",
};

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function RemedyDialog({ open, item, onClose }: { open: boolean; item: Remedy | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateRemedy();
  const update = useUpdateRemedy();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: item?.title ?? "", category: item?.category ?? "spiritual", description: item?.description ?? "" },
  });

  async function onSubmit(v: FormValues) {
    try {
      if (item) await update.mutateAsync({ id: item.id, data: v });
      else await create.mutateAsync({ data: v });
      toast({ title: item ? "Updated" : "Created" });
      qc.invalidateQueries({ queryKey: getListRemediesQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Edit" : "New"} Remedy</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. Wear ruby on Sunday…" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem><FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>{item ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function RemediesPage() {
  const [catFilter, setCatFilter] = useState<string>("");
  const [dialogItem, setDialogItem] = useState<Remedy | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const params = catFilter ? { category: catFilter } : {};
  const { data = [], isLoading } = useListRemedies(params);
  const deleteMutation = useDeleteRemedy();

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: getListRemediesQueryKey() });
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Remedies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Remedial suggestions for health, career, finance, relationships & spiritual growth</p>
        </div>
        <Button onClick={() => setDialogItem("new")}><Plus className="w-4 h-4 mr-2" />Add Remedy</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={catFilter === "" ? "default" : "outline"} onClick={() => setCatFilter("")}>All</Button>
        {CATEGORIES.map((c) => <Button key={c} size="sm" variant={catFilter === c ? "default" : "outline"} onClick={() => setCatFilter(c)}>{c}</Button>)}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {data.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isOpen ? null : r.id); } }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{r.title}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full shrink-0", CAT_COLORS[r.category] ?? "bg-secondary text-secondary-foreground")}>{r.category}</span>
                      </div>
                      {r.description && !isOpen && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDialogItem(r)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t border-border/50">
                      {r.description ? (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.description}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No description provided.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {data.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No remedies yet.</div>}
        </div>
      )}

      <RemedyDialog open={dialogItem !== null} item={dialogItem === "new" ? null : dialogItem} onClose={() => setDialogItem(null)} />
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete remedy?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
