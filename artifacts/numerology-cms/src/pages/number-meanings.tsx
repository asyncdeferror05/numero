import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNumberMeanings, getListNumberMeaningsQueryKey,
  useCreateNumberMeaning, useUpdateNumberMeaning, useDeleteNumberMeaning,
} from "@workspace/api-client-react";
import type { NumberMeaning } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NUMBER_TYPES = ["personality", "birthday", "destiny", "personal_year", "personal_month", "personal_day", "vehicle", "phone", "house"];

const schema = z.object({
  number: z.coerce.number().int().min(1),
  number_type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  keywords_json: z.array(z.string()).optional(),
  strengths_json: z.array(z.string()).optional(),
  weaknesses_json: z.array(z.string()).optional(),
  recommendations_json: z.array(z.string()).optional(),
});
type FormValues = z.infer<typeof schema>;

function MeaningDialog({ open, item, onClose }: { open: boolean; item: NumberMeaning | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateNumberMeaning();
  const update = useUpdateNumberMeaning();
  const isEdit = !!item;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: item?.number ?? 1,
      number_type: item?.number_type ?? "personality",
      title: item?.title ?? "",
      description: item?.description ?? "",
      keywords_json: item?.keywords_json ?? [],
      strengths_json: item?.strengths_json ?? [],
      weaknesses_json: item?.weaknesses_json ?? [],
      recommendations_json: item?.recommendations_json ?? [],
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: item.id, data: values });
        toast({ title: "Updated" });
      } else {
        await create.mutateAsync({ data: values });
        toast({ title: "Created" });
      }
      qc.invalidateQueries({ queryKey: getListNumberMeaningsQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit" : "New"} Number Meaning</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem><FormLabel>Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="number_type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{NUMBER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. The Leader" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="keywords_json" render={({ field }) => (
              <FormItem><FormLabel>Keywords</FormLabel><FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add keyword…" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="strengths_json" render={({ field }) => (
              <FormItem><FormLabel>Strengths</FormLabel><FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add strength…" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="weaknesses_json" render={({ field }) => (
              <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add weakness…" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="recommendations_json" render={({ field }) => (
              <FormItem><FormLabel>Recommendations</FormLabel><FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add recommendation…" /></FormControl></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>{isEdit ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function NumberMeaningsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dialogItem, setDialogItem] = useState<NumberMeaning | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useListNumberMeanings(typeFilter ? { number_type: typeFilter } : {});
  const deleteMutation = useDeleteNumberMeaning();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Deleted" });
      qc.invalidateQueries({ queryKey: getListNumberMeaningsQueryKey() });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setDeleteId(null);
  }

  const grouped: Record<string, NumberMeaning[]> = {};
  for (const m of data) {
    if (!grouped[m.number_type]) grouped[m.number_type] = [];
    grouped[m.number_type].push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Number Meanings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All number interpretations — personality, birthday, destiny, personal year & more</p>
        </div>
        <Button onClick={() => setDialogItem("new")}><Plus className="w-4 h-4 mr-2" />New Meaning</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={typeFilter === "" ? "default" : "outline"} onClick={() => setTypeFilter("")}>All</Button>
        {NUMBER_TYPES.map((t) => (
          <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>{t}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">{type}</h2>
              <div className="space-y-2">
                {items.sort((a, b) => a.number - b.number).map((m) => {
                  const isOpen = expandedId === m.id;
                  return (
                    <Card key={m.id} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                      <CardContent className="p-0">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedId(isOpen ? null : m.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isOpen ? null : m.id); } }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                        >
                          <span className="text-2xl font-bold text-primary w-8 shrink-0">{m.number}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground">{m.title}</span>
                            {m.description && !isOpen && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.description}</p>}
                            {m.keywords_json.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {m.keywords_json.slice(0, 4).map((k) => <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>)}
                                {m.keywords_json.length > 4 && <Badge variant="outline" className="text-[10px]">+{m.keywords_json.length - 4}</Badge>}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDialogItem(m)}><Pencil className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                          <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                        </div>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-3 border-t border-border/50 space-y-3">
                            {m.description && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Description</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                              </div>
                            )}
                            {m.keywords_json.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Keywords</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.keywords_json.map((k, i) => <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{k}</span>)}
                                </div>
                              </div>
                            )}
                            {(m.strengths_json ?? []).length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Strengths</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(m.strengths_json ?? []).map((s, i) => <span key={i} className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>)}
                                </div>
                              </div>
                            )}
                            {(m.weaknesses_json ?? []).length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Weaknesses</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(m.weaknesses_json ?? []).map((w, i) => <span key={i} className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">{w}</span>)}
                                </div>
                              </div>
                            )}
                            {(m.recommendations_json ?? []).length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Recommendations</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(m.recommendations_json ?? []).map((r, i) => <span key={i} className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">{r}</span>)}
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
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No meanings found. Create your first one.</p>
            </div>
          )}
        </div>
      )}

      <MeaningDialog
        open={dialogItem !== null}
        item={dialogItem === "new" ? null : dialogItem}
        onClose={() => setDialogItem(null)}
      />
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete meaning?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
