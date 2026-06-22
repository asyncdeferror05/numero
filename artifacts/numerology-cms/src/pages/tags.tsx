import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRuleTags, getListRuleTagsQueryKey,
  useCreateRuleTag, useDeleteRuleTag,
  useListRuleCategories, getListRuleCategoriesQueryKey,
  useCreateRuleCategory, useUpdateRuleCategory, useDeleteRuleCategory,
} from "@workspace/api-client-react";
import type { RuleTag, RuleCategory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Pencil, Tag, FolderOpen } from "lucide-react";

const tagSchema = z.object({ name: z.string().min(1) });
const catSchema = z.object({ name: z.string().min(1), description: z.string().optional() });

function TagDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateRuleTag();
  const form = useForm({ resolver: zodResolver(tagSchema), defaultValues: { name: "" } });

  async function onSubmit(v: { name: string }) {
    try {
      await create.mutateAsync({ data: v });
      toast({ title: "Tag created" });
      qc.invalidateQueries({ queryKey: getListRuleTagsQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New Tag</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Tag Name</FormLabel><FormControl><Input placeholder="e.g. spiritual, career…" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CatDialog({ open, item, onClose }: { open: boolean; item: RuleCategory | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateRuleCategory();
  const update = useUpdateRuleCategory();
  const form = useForm({ resolver: zodResolver(catSchema), defaultValues: { name: item?.name ?? "", description: item?.description ?? "" } });

  async function onSubmit(v: { name: string; description?: string }) {
    try {
      if (item) await update.mutateAsync({ id: item.id, data: v });
      else await create.mutateAsync({ data: v });
      toast({ title: item ? "Updated" : "Created" });
      qc.invalidateQueries({ queryKey: getListRuleCategoriesQueryKey() });
      onClose();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{item ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
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

export function TagsPage() {
  const [tagDialog, setTagDialog] = useState(false);
  const [catDialog, setCatDialog] = useState<RuleCategory | null | "new">(null);
  const [deleteTag, setDeleteTag] = useState<number | null>(null);
  const [deleteCat, setDeleteCat] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: tags = [], isLoading: tagsLoading } = useListRuleTags();
  const { data: cats = [], isLoading: catsLoading } = useListRuleCategories();
  const deleteTagMut = useDeleteRuleTag();
  const deleteCatMut = useDeleteRuleCategory();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tags & Categories</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Organize rules with tags and categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />Rule Tags</CardTitle>
              <Button size="sm" onClick={() => setTagDialog(true)}><Plus className="w-3.5 h-3.5 mr-1" />New</Button>
            </div>
          </CardHeader>
          <CardContent>
            {tagsLoading ? <Skeleton className="h-20 w-full" /> : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="group flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-sm">
                    <span>{tag.name}</span>
                    <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100 ml-0.5 rounded-full" onClick={() => setDeleteTag(tag.id)}><Trash2 className="w-2.5 h-2.5 text-destructive" /></Button>
                  </div>
                ))}
                {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4 text-primary" />Rule Categories</CardTitle>
              <Button size="sm" onClick={() => setCatDialog("new")}><Plus className="w-3.5 h-3.5 mr-1" />New</Button>
            </div>
          </CardHeader>
          <CardContent>
            {catsLoading ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-2">
                {cats.map((cat) => (
                  <div key={cat.id} className="group flex items-center justify-between bg-secondary rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCatDialog(cat)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteCat(cat.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {cats.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TagDialog open={tagDialog} onClose={() => setTagDialog(false)} />
      <CatDialog open={catDialog !== null} item={catDialog === "new" ? null : catDialog} onClose={() => setCatDialog(null)} />

      <AlertDialog open={deleteTag !== null} onOpenChange={(o) => { if (!o) setDeleteTag(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete tag?</AlertDialogTitle><AlertDialogDescription>Removes from all assigned rules.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!deleteTag) return; await deleteTagMut.mutateAsync({ id: deleteTag }); qc.invalidateQueries({ queryKey: getListRuleTagsQueryKey() }); setDeleteTag(null); toast({ title: "Deleted" }); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCat !== null} onOpenChange={(o) => { if (!o) setDeleteCat(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete category?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!deleteCat) return; await deleteCatMut.mutateAsync({ id: deleteCat }); qc.invalidateQueries({ queryKey: getListRuleCategoriesQueryKey() }); setDeleteCat(null); toast({ title: "Deleted" }); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
