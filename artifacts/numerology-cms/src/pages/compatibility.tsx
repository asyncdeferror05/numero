import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCompatibilityRules, getListCompatibilityRulesQueryKey,
  useCreateCompatibilityRule, useUpdateCompatibilityRule, useDeleteCompatibilityRule,
} from "@workspace/api-client-react";
import type { CompatibilityRule } from "@workspace/api-client-react";
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
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 8) return "bg-emerald-500/15 text-emerald-400";
  if (score >= 5) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

const schema = z.object({
  number_a: z.coerce.number().int().min(1).max(9),
  number_b: z.coerce.number().int().min(1).max(9),
  compatibility_score: z.coerce.number().int().min(1).max(10).optional(),
  interpretation: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function CompatDialog({ open, item, onClose }: { open: boolean; item: CompatibilityRule | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateCompatibilityRule();
  const update = useUpdateCompatibilityRule();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { number_a: item?.number_a ?? 1, number_b: item?.number_b ?? 1, compatibility_score: item?.compatibility_score ?? 5, interpretation: item?.interpretation ?? "" },
  });

  async function onSubmit(v: FormValues) {
    try {
      if (item) await update.mutateAsync({ id: item.id, data: v });
      else await create.mutateAsync({ data: v });
      toast({ title: item ? "Updated" : "Created" });
      qc.invalidateQueries({ queryKey: getListCompatibilityRulesQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Edit" : "New"} Compatibility Rule</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="number_a" render={({ field }) => (
                <FormItem><FormLabel>Number A</FormLabel><FormControl><Input type="number" min={1} max={9} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="number_b" render={({ field }) => (
                <FormItem><FormLabel>Number B</FormLabel><FormControl><Input type="number" min={1} max={9} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="compatibility_score" render={({ field }) => (
                <FormItem><FormLabel>Score (1–10)</FormLabel><FormControl><Input type="number" min={1} max={10} {...field} /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="interpretation" render={({ field }) => (
              <FormItem><FormLabel>Interpretation</FormLabel><FormControl><Textarea rows={4} placeholder="Describe the dynamic between these numbers…" {...field} /></FormControl></FormItem>
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

export function CompatibilityPage() {
  const [dialogItem, setDialogItem] = useState<CompatibilityRule | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data = [], isLoading } = useListCompatibilityRules({});
  const deleteMutation = useDeleteCompatibilityRule();

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: getListCompatibilityRulesQueryKey() });
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compatibility Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Numerological compatibility scores between number pairs</p>
        </div>
        <Button onClick={() => setDialogItem("new")}><Plus className="w-4 h-4 mr-2" />Add Rule</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {data.sort((a, b) => a.number_a - b.number_a || a.number_b - b.number_b).map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isOpen ? null : r.id); } }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{r.number_a}</div>
                      <span className="text-muted-foreground text-sm">×</span>
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{r.number_b}</div>
                    </div>
                    <div className={cn("text-xl font-bold w-8 text-center shrink-0 px-2 py-0.5 rounded", scoreBg(r.compatibility_score))}>{r.compatibility_score}</div>
                    <p className="text-sm text-muted-foreground flex-1 min-w-0 line-clamp-1">{r.interpretation || <span className="italic">No interpretation yet</span>}</p>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDialogItem(r)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t border-border/50 space-y-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Numbers</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{r.number_a}</div>
                            <span className="text-muted-foreground">×</span>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{r.number_b}</div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Score</p>
                          <div className={cn("text-2xl font-bold", scoreColor(r.compatibility_score))}>{r.compatibility_score}<span className="text-xs text-muted-foreground font-normal">/10</span></div>
                        </div>
                      </div>
                      {r.interpretation ? (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Interpretation</p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.interpretation}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No interpretation written yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {data.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No compatibility rules yet.</div>}
        </div>
      )}

      <CompatDialog open={dialogItem !== null} item={dialogItem === "new" ? null : dialogItem} onClose={() => setDialogItem(null)} />
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete rule?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
