import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListHealthMappings, getListHealthMappingsQueryKey,
  useCreateHealthMapping, useUpdateHealthMapping, useDeleteHealthMapping,
} from "@workspace/api-client-react";
import type { HealthMapping } from "@workspace/api-client-react";
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
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITIES = ["mild", "moderate", "strong"];
const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-emerald-500/20 text-emerald-400",
  moderate: "bg-amber-500/20 text-amber-400",
  strong: "bg-red-500/20 text-red-400",
};

const schema = z.object({
  number: z.coerce.number().int().min(1).max(9),
  health_area: z.string().min(1),
  severity: z.string().min(1),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function HealthDialog({ open, item, onClose }: { open: boolean; item: HealthMapping | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateHealthMapping();
  const update = useUpdateHealthMapping();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { number: item?.number ?? 1, health_area: item?.health_area ?? "", severity: item?.severity ?? "mild", notes: item?.notes ?? "" },
  });

  async function onSubmit(v: FormValues) {
    try {
      if (item) await update.mutateAsync({ id: item.id, data: v });
      else await create.mutateAsync({ data: v });
      toast({ title: item ? "Updated" : "Created" });
      qc.invalidateQueries({ queryKey: getListHealthMappingsQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Edit" : "New"} Health Mapping</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem><FormLabel>Number (1–9)</FormLabel><FormControl><Input type="number" min={1} max={9} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="severity" render={({ field }) => (
                <FormItem><FormLabel>Severity</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="health_area" render={({ field }) => (
              <FormItem><FormLabel>Health Area</FormLabel><FormControl><Input placeholder="e.g. Heart, Blood Pressure…" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
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

export function HealthMappingsPage() {
  const [dialogItem, setDialogItem] = useState<HealthMapping | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data = [], isLoading } = useListHealthMappings({});
  const deleteMutation = useDeleteHealthMapping();

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: getListHealthMappingsQueryKey() });
    setDeleteId(null);
  }

  const grouped: Record<number, HealthMapping[]> = {};
  for (const m of data) {
    if (!grouped[m.number]) grouped[m.number] = [];
    grouped[m.number].push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Mappings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Health tendencies and risk areas by number</p>
        </div>
        <Button onClick={() => setDialogItem("new")}><Plus className="w-4 h-4 mr-2" />Add Mapping</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {data.map((m) => {
            const isOpen = expandedId === m.id;
            return (
              <Card key={m.id} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isOpen ? null : m.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isOpen ? null : m.id); } }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">{m.number}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{m.health_area}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0", SEVERITY_COLORS[m.severity] ?? "")}>{m.severity}</span>
                      </div>
                      {m.notes && !isOpen && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDialogItem(m)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t border-border/50 space-y-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Number</p>
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{m.number}</div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Severity</p>
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", SEVERITY_COLORS[m.severity] ?? "")}>{m.severity}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Health Area</p>
                          <p className="text-sm font-medium">{m.health_area}</p>
                        </div>
                      </div>
                      {m.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Notes</p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{m.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {data.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No health mappings yet.</div>}
        </div>
      )}

      <HealthDialog open={dialogItem !== null} item={dialogItem === "new" ? null : dialogItem} onClose={() => setDialogItem(null)} />
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete mapping?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
