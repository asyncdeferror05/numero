import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRelationshipMappings, getListRelationshipMappingsQueryKey,
  useCreateRelationshipMapping, useUpdateRelationshipMapping, useDeleteRelationshipMapping,
} from "@workspace/api-client-react";
import type { RelationshipMapping } from "@workspace/api-client-react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const REL_TYPES = ["marriage", "business", "friendship", "family", "romantic"];

const schema = z.object({
  number: z.coerce.number().int().min(1).max(9),
  relationship_type: z.string().min(1),
  interpretation: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function RelDialog({ open, item, onClose }: { open: boolean; item: RelationshipMapping | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateRelationshipMapping();
  const update = useUpdateRelationshipMapping();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { number: item?.number ?? 1, relationship_type: item?.relationship_type ?? "marriage", interpretation: item?.interpretation ?? "" },
  });

  async function onSubmit(v: FormValues) {
    try {
      if (item) await update.mutateAsync({ id: item.id, data: v });
      else await create.mutateAsync({ data: v });
      toast({ title: item ? "Updated" : "Created" });
      qc.invalidateQueries({ queryKey: getListRelationshipMappingsQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Edit" : "New"} Relationship Mapping</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem><FormLabel>Number (1–9)</FormLabel><FormControl><Input type="number" min={1} max={9} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="relationship_type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{REL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="interpretation" render={({ field }) => (
              <FormItem><FormLabel>Interpretation</FormLabel><FormControl><Textarea rows={3} placeholder="Describe relationship dynamics…" {...field} /></FormControl></FormItem>
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

export function RelationshipsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dialogItem, setDialogItem] = useState<RelationshipMapping | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const params: Record<string, unknown> = {};
  if (typeFilter) params.relationship_type = typeFilter;
  const { data = [], isLoading } = useListRelationshipMappings(params as Parameters<typeof useListRelationshipMappings>[0]);
  const deleteMutation = useDeleteRelationshipMapping();

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: getListRelationshipMappingsQueryKey() });
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relationship Mappings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">How each number behaves in marriage, business, friendship & more</p>
        </div>
        <Button onClick={() => setDialogItem("new")}><Plus className="w-4 h-4 mr-2" />Add Mapping</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={typeFilter === "" ? "default" : "outline"} onClick={() => setTypeFilter("")}>All</Button>
        {REL_TYPES.map((t) => (
          <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>{t}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {data.map((m) => (
            <Card key={m.id} className="group border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">{m.number}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-xs capitalize">{m.relationship_type}</Badge>
                  </div>
                  {m.interpretation && <p className="text-sm text-muted-foreground">{m.interpretation}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDialogItem(m)}><Pencil className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {data.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No mappings found.</div>}
        </div>
      )}

      <RelDialog open={dialogItem !== null} item={dialogItem === "new" ? null : dialogItem} onClose={() => setDialogItem(null)} />
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete mapping?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
