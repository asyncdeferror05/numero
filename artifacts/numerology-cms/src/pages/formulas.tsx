import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFormulas, getListFormulasQueryKey,
  useCreateFormula, useUpdateFormula, useDeleteFormula,
  useDuplicateFormula, useToggleFormula,
} from "@workspace/api-client-react";
import type { Formula } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Copy } from "lucide-react";

const FORMULA_TYPES = [
  "birthday_number", "destiny_number", "personal_year", "personal_month",
  "personal_day", "lo_shu", "vehicle_number", "phone_number", "house_number", "custom",
];

const formulaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  formula_type: z.string().min(1, "Type is required"),
  formula_expression: z.string().min(1, "Expression is required"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});
type FormulaFormValues = z.infer<typeof formulaSchema>;

function FormulaDialog({ open, formula, onClose }: { open: boolean; formula: Formula | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateFormula();
  const updateMutation = useUpdateFormula();

  const form = useForm<FormulaFormValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      name: formula?.name ?? "",
      formula_type: formula?.formula_type ?? "",
      formula_expression: formula?.formula_expression ?? "",
      description: formula?.description ?? "",
      is_active: formula?.is_active ?? true,
    },
  });

  const onSubmit = async (data: FormulaFormValues) => {
    try {
      if (formula) {
        await updateMutation.mutateAsync({ id: formula.id, data });
        toast({ title: "Formula updated" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Formula created" });
      }
      qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{formula ? "Edit Formula" : "New Formula"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} placeholder="Birthday Number" data-testid="input-formula-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="formula_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-formula-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORMULA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="formula_expression" render={({ field }) => (
              <FormItem>
                <FormLabel>Expression</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="reduce(day)" className="font-mono text-sm" rows={3} data-testid="input-formula-expression" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} placeholder="Describe what this formula calculates..." rows={2} data-testid="input-formula-description" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-formula-active" /></FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-formula">
                Save Formula
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function FormulasPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: formulas, isLoading } = useListFormulas();
  const deleteMutation = useDeleteFormula();
  const duplicateMutation = useDuplicateFormula();
  const toggleMutation = useToggleFormula();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFormula, setEditFormula] = useState<Formula | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Formula | null>(null);

  const handleToggle = async (f: Formula) => {
    await toggleMutation.mutateAsync({ id: f.id });
    qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
    toast({ title: f.is_active ? "Formula deactivated" : "Formula activated" });
  };

  const handleDuplicate = async (f: Formula) => {
    await duplicateMutation.mutateAsync({ id: f.id });
    qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
    toast({ title: "Formula duplicated" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
    toast({ title: "Formula deleted" });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Formula Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Define and manage calculation formulas</p>
        </div>
        <Button onClick={() => { setEditFormula(null); setDialogOpen(true); }} data-testid="button-new-formula">
          <Plus className="w-4 h-4 mr-2" />New Formula
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (formulas?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No formulas yet. Create your first formula.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {formulas!.map((formula) => (
            <Card key={formula.id} data-testid={`formula-card-${formula.id}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{formula.name}</span>
                      <Badge variant="outline" className="text-xs">{formula.formula_type.replace(/_/g, " ")}</Badge>
                      {!formula.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    <code className="text-xs text-accent bg-muted px-2 py-0.5 rounded mt-1.5 inline-block font-mono">
                      {formula.formula_expression}
                    </code>
                    {formula.description && (
                      <p className="text-xs text-muted-foreground mt-1">{formula.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={formula.is_active} onCheckedChange={() => handleToggle(formula)} data-testid={`switch-formula-active-${formula.id}`} />
                    <Button size="icon" variant="ghost" onClick={() => handleDuplicate(formula)} data-testid={`button-duplicate-formula-${formula.id}`}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditFormula(formula); setDialogOpen(true); }} data-testid={`button-edit-formula-${formula.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(formula)} data-testid={`button-delete-formula-${formula.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormulaDialog open={dialogOpen} formula={editFormula} onClose={() => setDialogOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Formula</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete-formula">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
