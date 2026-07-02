import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProfessionMappings, getListProfessionMappingsQueryKey,
  useCreateProfessionMapping, useUpdateProfessionMapping, useDeleteProfessionMapping,
} from "@workspace/api-client-react";
import type { ProfessionMapping } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  number: z.coerce.number().int().min(1).max(9),
  profession: z.string().min(1),
  weight: z.coerce.number().min(0).max(10).optional(),
});
type FormValues = z.infer<typeof schema>;

function ProfessionDialog({ open, item, onClose }: { open: boolean; item: ProfessionMapping | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateProfessionMapping();
  const update = useUpdateProfessionMapping();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { number: item?.number ?? 1, profession: item?.profession ?? "", weight: item?.weight ?? 1 },
  });

  async function onSubmit(v: FormValues) {
    try {
      if (item) await update.mutateAsync({ id: item.id, data: v });
      else await create.mutateAsync({ data: v });
      toast({ title: item ? "Updated" : "Created" });
      qc.invalidateQueries({ queryKey: getListProfessionMappingsQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? "Edit" : "New"} Profession Mapping</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem><FormLabel>Number (1–9)</FormLabel><FormControl><Input type="number" min={1} max={9} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>Weight</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="profession" render={({ field }) => (
              <FormItem><FormLabel>Profession</FormLabel><FormControl><Input placeholder="e.g. Politician, Engineer…" {...field} /></FormControl><FormMessage /></FormItem>
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

export function ProfessionsPage() {
  const [dialogItem, setDialogItem] = useState<ProfessionMapping | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedNum, setExpandedNum] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data = [], isLoading } = useListProfessionMappings({});
  const deleteMutation = useDeleteProfessionMapping();

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: getListProfessionMappingsQueryKey() });
    setDeleteId(null);
  }

  const grouped: Record<number, ProfessionMapping[]> = {};
  for (const p of data) {
    if (!grouped[p.number]) grouped[p.number] = [];
    grouped[p.number].push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profession Mappings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Careers and occupations associated with each number</p>
        </div>
        <Button onClick={() => setDialogItem("new")}><Plus className="w-4 h-4 mr-2" />Add Mapping</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {[1,2,3,4,5,6,7,8,9].map((n) => {
            const items = grouped[n] ?? [];
            const isOpen = expandedNum === n;
            return (
              <Card key={n} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedNum(isOpen ? null : n)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedNum(isOpen ? null : n); } }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{n}</div>
                    <div className="flex-1 min-w-0">
                      {items.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No professions yet</span>
                      ) : (
                        <div>
                          <span className="text-sm font-medium">{items.length} profession{items.length > 1 ? "s" : ""}</span>
                          {!isOpen && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {items.slice(0, 4).map((p) => (
                                <span key={p.id} className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">{p.profession}</span>
                              ))}
                              {items.length > 4 && <span className="text-xs text-muted-foreground">+{items.length - 4} more</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                  {isOpen && items.length > 0 && (
                    <div className="px-4 pb-4 pt-3 border-t border-border/50">
                      <div className="flex flex-wrap gap-2">
                        {items.sort((a, b) => b.weight - a.weight).map((p) => (
                          <div key={p.id} className="group flex items-center gap-1.5 bg-secondary rounded-md px-2.5 py-1 text-sm">
                            <span>{p.profession}</span>
                            {p.weight !== 1 && <span className="text-[10px] text-muted-foreground">({p.weight})</span>}
                            <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100 ml-0.5" onClick={(e) => { e.stopPropagation(); setDialogItem(p); }}><Pencil className="w-2.5 h-2.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}><Trash2 className="w-2.5 h-2.5" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProfessionDialog open={dialogItem !== null} item={dialogItem === "new" ? null : dialogItem} onClose={() => setDialogItem(null)} />
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove profession?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
