import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFormulas, getListFormulasQueryKey,
  useCreateFormula, useUpdateFormula, useDeleteFormula,
  useDuplicateFormula, useActivateFormula, useTestFormula,
  useGetFormulaDslReference,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus, Pencil, Trash2, Copy, CheckCircle2, ChevronDown,
  ChevronRight, Zap, FlaskConical, BookOpen, Star,
} from "lucide-react";

export const FORMULA_TYPES = [
  { value: "birthday_number", label: "Birthday Number" },
  { value: "destiny_number", label: "Destiny Number" },
  { value: "personality_number", label: "Personality Number" },
  { value: "personal_year", label: "Personal Year" },
  { value: "personal_month", label: "Personal Month" },
  { value: "personal_day", label: "Personal Day" },
  { value: "vehicle_number", label: "Vehicle Number" },
  { value: "phone_number", label: "Phone Number" },
  { value: "house_number", label: "House Number" },
  { value: "name_number", label: "Name Number" },
  { value: "lo_shu", label: "Lo Shu" },
  { value: "custom", label: "Custom" },
];

// ─── DSL Reference Panel ──────────────────────────────────────────────────────

function DslReferencePanel({ onInsert }: { onInsert: (expr: string) => void }) {
  const { data: ref } = useGetFormulaDslReference();
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 px-2 h-7 text-muted-foreground hover:text-foreground">
          <BookOpen className="w-3 h-3" />
          DSL Reference
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {ref && (
          <div className="mt-2 rounded-md border border-border bg-muted/30 p-3 space-y-3 text-xs">
            <div>
              <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Variables</p>
              <div className="grid grid-cols-2 gap-1">
                {ref.variables.map((v) => (
                  <div key={v.name} className="flex gap-2">
                    <code className="text-primary font-mono shrink-0">{v.name}</code>
                    <span className="text-muted-foreground">{v.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Functions</p>
              <div className="space-y-1">
                {ref.functions.map((fn) => (
                  <div key={fn.name} className="flex gap-2">
                    <code className="text-amber-400 font-mono shrink-0 whitespace-nowrap">{fn.name}</code>
                    <span className="text-muted-foreground">{fn.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Examples</p>
              <div className="space-y-1.5">
                {ref.examples.map((ex) => (
                  <div key={ex.label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInsert(ex.expression)}
                      className="text-left group flex items-center gap-2 w-full hover:bg-muted/60 rounded px-1.5 py-0.5"
                    >
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0">{ex.label}</span>
                      <code className="text-primary font-mono truncate text-[10px]">{ex.expression}</code>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Inline Test Panel ────────────────────────────────────────────────────────

function TestPanel({ formula }: { formula: Formula }) {
  const testMutation = useTestFormula();
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState({ day: "15", month: "7", year: "1990", name: "", extra_input: "" });
  const [result, setResult] = useState<{ result: number | null; error?: string } | null>(null);
  const needsName = formula.formula_expression.includes("name") || formula.formula_expression.includes("pythagorean") || formula.formula_expression.includes("chaldean");
  const needsExtra = formula.formula_expression.includes("extraInput") || formula.formula_expression.includes("digitsOnly");

  const runTest = async () => {
    const res = await testMutation.mutateAsync({
      id: formula.id,
      data: {
        day: Number(inputs.day),
        month: Number(inputs.month),
        year: Number(inputs.year),
        name: inputs.name || undefined,
        extra_input: inputs.extra_input || undefined,
      },
    });
    setResult(res);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 px-2 h-7 text-muted-foreground hover:text-foreground">
          <FlaskConical className="w-3 h-3" />
          Test
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Day</label>
              <Input value={inputs.day} onChange={(e) => setInputs((p) => ({ ...p, day: e.target.value }))} className="h-7 text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Month</label>
              <Input value={inputs.month} onChange={(e) => setInputs((p) => ({ ...p, month: e.target.value }))} className="h-7 text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Year</label>
              <Input value={inputs.year} onChange={(e) => setInputs((p) => ({ ...p, year: e.target.value }))} className="h-7 text-xs" />
            </div>
          </div>
          {needsName && (
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={inputs.name} onChange={(e) => setInputs((p) => ({ ...p, name: e.target.value }))} className="h-7 text-xs" placeholder="Full Name" />
            </div>
          )}
          {needsExtra && (
            <div>
              <label className="text-xs text-muted-foreground">Extra Input (vehicle/phone/house)</label>
              <Input value={inputs.extra_input} onChange={(e) => setInputs((p) => ({ ...p, extra_input: e.target.value }))} className="h-7 text-xs" placeholder="DL-1234" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button type="button" size="sm" onClick={runTest} disabled={testMutation.isPending} className="h-7 text-xs">
              {testMutation.isPending ? "Running…" : "Run"}
            </Button>
            {result && (
              <div className="flex items-center gap-2">
                {result.error ? (
                  <span className="text-xs text-destructive">{result.error}</span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Result:</span>
                    <span className="text-2xl font-bold text-primary">{result.result}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Formula Dialog ───────────────────────────────────────────────────────────

const formulaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  formula_type: z.string().min(1, "Type is required"),
  formula_expression: z.string().min(1, "Expression is required"),
  description: z.string().optional(),
  version: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});
type FormulaFormValues = z.infer<typeof formulaSchema>;

function FormulaDialog({
  open, formula, defaultType, onClose,
}: { open: boolean; formula: Formula | null; defaultType?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateFormula();
  const updateMutation = useUpdateFormula();

  const form = useForm<FormulaFormValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      name: formula?.name ?? "",
      formula_type: formula?.formula_type ?? defaultType ?? "",
      formula_expression: formula?.formula_expression ?? "",
      description: formula?.description ?? "",
      version: formula?.version ?? 1,
      is_active: formula?.is_active ?? false,
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

  const insertExpression = (expr: string) => {
    form.setValue("formula_expression", expr);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formula ? "Edit Formula" : "New Formula"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Birthday Number V2" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="version" render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl><Input {...field} type="number" min={1} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="formula_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORMULA_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="formula_expression" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1">
                  <FormLabel className="mb-0">Expression</FormLabel>
                  <DslReferencePanel onInsert={insertExpression} />
                </div>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="reduce(day)"
                    className="font-mono text-sm min-h-[80px]"
                    rows={3}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Use functions like <code className="text-primary">reduce()</code>, <code className="text-primary">sumDigits()</code>, <code className="text-primary">pythagorean(name)</code>. Click DSL Reference for all options.
                </p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} placeholder="What does this formula calculate?" rows={2} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save Formula
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Formula Card ─────────────────────────────────────────────────────────────

function FormulaCard({
  formula,
  onEdit,
  onDelete,
  onDuplicate,
  onActivate,
}: {
  formula: Formula;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onActivate: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        formula.is_active
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-medium text-sm text-foreground">{formula.name}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{formula.version}</span>
            {formula.is_active && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                <Star className="w-3 h-3" />Active
              </span>
            )}
          </div>
          <code className="text-xs text-amber-400 bg-muted px-2 py-1 rounded inline-block font-mono max-w-full break-all">
            {formula.formula_expression}
          </code>
          {formula.description && (
            <p className="text-xs text-muted-foreground mt-1.5">{formula.description}</p>
          )}
          <div className="mt-3">
            <TestPanel formula={formula} />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!formula.is_active && (
            <Button
              size="sm"
              variant="outline"
              onClick={onActivate}
              className="text-xs h-7 px-2 border-primary/40 text-primary hover:bg-primary/10"
              title="Set as active version for this type"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Activate
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onDuplicate} title="Clone as new version" className="w-7 h-7">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit} className="w-7 h-7">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} className="w-7 h-7">
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FormulasPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: formulas, isLoading } = useListFormulas();
  const deleteMutation = useDeleteFormula();
  const duplicateMutation = useDuplicateFormula();
  const activateMutation = useActivateFormula();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFormula, setEditFormula] = useState<Formula | null>(null);
  const [defaultType, setDefaultType] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Formula | null>(null);

  const openNew = (type?: string) => {
    setEditFormula(null);
    setDefaultType(type);
    setDialogOpen(true);
  };

  const handleDuplicate = async (f: Formula) => {
    await duplicateMutation.mutateAsync({ id: f.id });
    qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
    toast({ title: "Formula cloned as new version" });
  };

  const handleActivate = async (f: Formula) => {
    await activateMutation.mutateAsync({ id: f.id });
    qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
    toast({ title: `"${f.name}" is now the active formula for ${f.formula_type.replace(/_/g, " ")}` });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
    toast({ title: "Formula deleted" });
    setDeleteTarget(null);
  };

  // Group formulas by type, ordered by type then version
  const grouped = (formulas ?? []).reduce<Record<string, Formula[]>>((acc, f) => {
    if (!acc[f.formula_type]) acc[f.formula_type] = [];
    acc[f.formula_type].push(f);
    return acc;
  }, {});

  const typeLabel = (type: string) => FORMULA_TYPES.find((t) => t.value === type)?.label ?? type.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Formula Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define calculation formulas — multiple versions per type, one active at a time
          </p>
        </div>
        <Button onClick={() => openNew()}>
          <Plus className="w-4 h-4 mr-2" />New Formula
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (formulas?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No formulas yet. Create your first formula to start dynamic calculations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, versions]) => {
            const hasActive = versions.some((v) => v.is_active);
            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{typeLabel(type)}</CardTitle>
                      <Badge variant={hasActive ? "default" : "secondary"} className="text-xs">
                        {versions.length} version{versions.length !== 1 ? "s" : ""}
                      </Badge>
                      {!hasActive && (
                        <span className="text-xs text-amber-400">⚠ No active formula</span>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openNew(type)} className="h-7 text-xs gap-1">
                      <Plus className="w-3 h-3" />Add Version
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {versions.map((formula) => (
                    <FormulaCard
                      key={formula.id}
                      formula={formula}
                      onEdit={() => { setEditFormula(formula); setDefaultType(undefined); setDialogOpen(true); }}
                      onDelete={() => setDeleteTarget(formula)}
                      onDuplicate={() => handleDuplicate(formula)}
                      onActivate={() => handleActivate(formula)}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Coverage summary */}
      {!isLoading && (formulas?.length ?? 0) > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Type Coverage</p>
            <div className="flex flex-wrap gap-2">
              {FORMULA_TYPES.map((t) => {
                const versions = grouped[t.value] ?? [];
                const active = versions.find((v) => v.is_active);
                return (
                  <div
                    key={t.value}
                    className={`text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : versions.length > 0
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                    onClick={() => !versions.length && openNew(t.value)}
                    title={active ? `Active: ${active.name}` : versions.length ? "Has formula but none active" : "No formula — click to create"}
                  >
                    {t.label}
                    {active ? " ✓" : versions.length ? " ⚠" : " +"}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <FormulaDialog
        open={dialogOpen}
        formula={editFormula}
        defaultType={defaultType}
        onClose={() => { setDialogOpen(false); setEditFormula(null); setDefaultType(undefined); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Formula</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
