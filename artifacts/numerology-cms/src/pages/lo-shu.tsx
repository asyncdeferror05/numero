import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListMissingNumberRules, getListMissingNumberRulesQueryKey,
  useCreateMissingNumberRule, useUpdateMissingNumberRule, useDeleteMissingNumberRule,
  useListRepeatedNumberRules, getListRepeatedNumberRulesQueryKey,
  useCreateRepeatedNumberRule, useUpdateRepeatedNumberRule, useDeleteRepeatedNumberRule,
  useListArrowRules, getListArrowRulesQueryKey,
  useCreateArrowRule, useUpdateArrowRule, useDeleteArrowRule,
} from "@workspace/api-client-react";
import type { MissingNumberRule, RepeatedNumberRule, ArrowRule } from "@workspace/api-client-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

// ─── Expandable Card ─────────────────────────────────────────────────────────

function ExpandableCard({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-border transition-colors">
      <CardContent className="py-0 px-0">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((o) => !o); }}
          className="w-full flex items-center justify-between gap-4 px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg cursor-pointer select-none"
        >
          {header}
          <span className="text-muted-foreground shrink-0">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </div>
        {open && (
          <div className="px-5 pb-4 pt-1 border-t border-border/50">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Missing Number ───────────────────────────────────────────────────────────

const missingSchema = z.object({
  missing_number: z.coerce.number().int().min(1).max(9),
  title: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  is_active: z.boolean().optional(),
});
type MissingFormValues = z.infer<typeof missingSchema>;

function MissingDialog({ open, rule, onClose }: { open: boolean; rule: MissingNumberRule | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateMissingNumberRule();
  const updateMutation = useUpdateMissingNumberRule();
  const form = useForm<MissingFormValues>({
    resolver: zodResolver(missingSchema),
    defaultValues: {
      missing_number: rule?.missing_number ?? 1,
      title: rule?.title ?? "",
      strengths: rule?.strengths ?? [],
      weaknesses: rule?.weaknesses ?? [],
      recommendations: rule?.recommendations ?? [],
      is_active: rule?.is_active ?? true,
    },
  });

  const onSubmit = async (data: MissingFormValues) => {
    try {
      if (rule) {
        await updateMutation.mutateAsync({ id: rule.id, data });
        toast({ title: "Missing number rule updated" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Missing number rule created" });
      }
      qc.invalidateQueries({ queryKey: getListMissingNumberRulesQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{rule ? "Edit Missing Number Rule" : "New Missing Number Rule"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="missing_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Missing Number (1-9)</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                    <FormControl><SelectTrigger data-testid="select-missing-number"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{[1,2,3,4,5,6,7,8,9].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Missing 1 — No Drive" data-testid="input-missing-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="strengths" render={({ field }) => (
              <FormItem><FormLabel>Strengths</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="Add strength..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="weaknesses" render={({ field }) => (
              <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="Add weakness..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="recommendations" render={({ field }) => (
              <FormItem><FormLabel>Recommendations</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="Add recommendation..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" data-testid="button-save-missing">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Repeated Number ──────────────────────────────────────────────────────────

const repeatedSchema = z.object({
  number: z.coerce.number().int().min(1).max(9),
  count: z.coerce.number().int().min(2),
  title: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  is_active: z.boolean().optional(),
});
type RepeatedFormValues = z.infer<typeof repeatedSchema>;

function RepeatedDialog({ open, rule, onClose }: { open: boolean; rule: RepeatedNumberRule | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateRepeatedNumberRule();
  const updateMutation = useUpdateRepeatedNumberRule();
  const form = useForm<RepeatedFormValues>({
    resolver: zodResolver(repeatedSchema),
    defaultValues: {
      number: rule?.number ?? 1,
      count: rule?.count ?? 2,
      title: rule?.title ?? "",
      strengths: rule?.strengths ?? [],
      weaknesses: rule?.weaknesses ?? [],
      is_active: rule?.is_active ?? true,
    },
  });

  const onSubmit = async (data: RepeatedFormValues) => {
    try {
      if (rule) {
        await updateMutation.mutateAsync({ id: rule.id, data });
        toast({ title: "Repeated number rule updated" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Repeated number rule created" });
      }
      qc.invalidateQueries({ queryKey: getListRepeatedNumberRulesQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const COUNT_LABELS: Record<number, string> = { 2: "Double (×2)", 3: "Triple (×3)", 4: "Quadruple (×4)", 5: "Quintuple (×5)" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{rule ? "Edit Repeated Number Rule" : "New Repeated Number Rule"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{[1,2,3,4,5,6,7,8,9].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="count" render={({ field }) => (
                <FormItem>
                  <FormLabel>Occurrence</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {[2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{COUNT_LABELS[n]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Double 1" data-testid="input-repeated-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="strengths" render={({ field }) => (
              <FormItem><FormLabel>Strengths</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="leadership..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="weaknesses" render={({ field }) => (
              <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="ego..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" data-testid="button-save-repeated">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Arrow Rules ──────────────────────────────────────────────────────────────

const arrowSchema = z.object({
  name: z.string().min(1),
  numbers: z.array(z.number()).min(1, "At least one number required"),
  arrow_type: z.enum(["strength", "weakness"]).default("strength"),
  interpretation: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  is_active: z.boolean().optional(),
});
type ArrowFormValues = z.infer<typeof arrowSchema>;

function ArrowDialog({ open, rule, onClose }: { open: boolean; rule: ArrowRule | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateArrowRule();
  const updateMutation = useUpdateArrowRule();
  const [selectedNums, setSelectedNums] = useState<number[]>(rule?.numbers ?? []);

  const form = useForm<ArrowFormValues>({
    resolver: zodResolver(arrowSchema),
    defaultValues: {
      name: rule?.name ?? "",
      numbers: rule?.numbers ?? [],
      arrow_type: (rule?.arrow_type as "strength" | "weakness") ?? "strength",
      interpretation: rule?.interpretation ?? "",
      strengths: rule?.strengths ?? [],
      weaknesses: rule?.weaknesses ?? [],
      is_active: rule?.is_active ?? true,
    },
  });

  const toggleNum = (n: number) => {
    const next = selectedNums.includes(n) ? selectedNums.filter(x => x !== n) : [...selectedNums, n].sort();
    setSelectedNums(next);
    form.setValue("numbers", next);
  };

  const onSubmit = async (data: ArrowFormValues) => {
    try {
      if (rule) {
        await updateMutation.mutateAsync({ id: rule.id, data });
        toast({ title: "Arrow rule updated" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Arrow rule created" });
      }
      qc.invalidateQueries({ queryKey: getListArrowRulesQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{rule ? "Edit Arrow Rule" : "New Arrow Rule"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrow Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Arrow of Determination" data-testid="input-arrow-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="arrow_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="strength">Strength Arrow</SelectItem>
                      <SelectItem value="weakness">Weakness Arrow</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="numbers" render={() => (
              <FormItem>
                <FormLabel>Numbers in Arrow (e.g. 1-5-9)</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNum(n)}
                      className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${selectedNums.includes(n) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                      data-testid={`button-arrow-num-${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {selectedNums.length > 0 && (
                  <p className="text-xs text-muted-foreground">Selected: {selectedNums.join("-")}</p>
                )}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="interpretation" render={({ field }) => (
              <FormItem>
                <FormLabel>Interpretation</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe what this arrow means..." rows={3} data-testid="input-arrow-interpretation" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="strengths" render={({ field }) => (
              <FormItem><FormLabel>Strengths</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="determination..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="weaknesses" render={({ field }) => (
              <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="stubbornness..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" data-testid="button-save-arrow">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LoShuPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: missingRules, isLoading: loadingMissing } = useListMissingNumberRules();
  const { data: repeatedRules, isLoading: loadingRepeated } = useListRepeatedNumberRules();
  const { data: arrowRules, isLoading: loadingArrows } = useListArrowRules();

  const deleteMissing = useDeleteMissingNumberRule();
  const deleteRepeated = useDeleteRepeatedNumberRule();
  const deleteArrow = useDeleteArrowRule();

  const [missingDialog, setMissingDialog] = useState(false);
  const [editMissing, setEditMissing] = useState<MissingNumberRule | null>(null);
  const [deleteMissingTarget, setDeleteMissingTarget] = useState<MissingNumberRule | null>(null);

  const [repeatedDialog, setRepeatedDialog] = useState(false);
  const [editRepeated, setEditRepeated] = useState<RepeatedNumberRule | null>(null);
  const [deleteRepeatedTarget, setDeleteRepeatedTarget] = useState<RepeatedNumberRule | null>(null);

  const [arrowDialog, setArrowDialog] = useState(false);
  const [editArrow, setEditArrow] = useState<ArrowRule | null>(null);
  const [deleteArrowTarget, setDeleteArrowTarget] = useState<ArrowRule | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Lo Shu CMS</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage Lo Shu grid interpretation rules — click any card to expand its content</p>
      </div>

      <Tabs defaultValue="missing">
        <TabsList>
          <TabsTrigger value="missing" data-testid="tab-missing">Missing Numbers</TabsTrigger>
          <TabsTrigger value="repeated" data-testid="tab-repeated">Repeated Numbers</TabsTrigger>
          <TabsTrigger value="arrows" data-testid="tab-arrows">Arrows</TabsTrigger>
        </TabsList>

        {/* ── Missing Numbers ── */}
        <TabsContent value="missing" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditMissing(null); setMissingDialog(true); }} data-testid="button-new-missing">
              <Plus className="w-4 h-4 mr-2" />New Rule
            </Button>
          </div>
          {loadingMissing ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (missingRules?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No missing number rules yet. Click "New Rule" to add one.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {missingRules!.map((rule) => (
                <ExpandableCard
                  key={rule.id}
                  header={
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-destructive/15 text-destructive font-bold text-sm flex items-center justify-center shrink-0">
                        {rule.missing_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{rule.title}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {rule.weaknesses.slice(0, 3).map((w, i) => (
                            <span key={i} className="text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">{w}</span>
                          ))}
                          {!rule.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => { setEditMissing(rule); setMissingDialog(true); }} data-testid={`button-edit-missing-${rule.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteMissingTarget(rule)} data-testid={`button-delete-missing-${rule.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-sm">
                    {rule.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wide">Strengths</p>
                        <ul className="space-y-1">{rule.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>)}</ul>
                      </div>
                    )}
                    {rule.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1.5 uppercase tracking-wide">Weaknesses</p>
                        <ul className="space-y-1">{rule.weaknesses.map((w, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-destructive mt-0.5">•</span>{w}</li>)}</ul>
                      </div>
                    )}
                    {rule.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-400 mb-1.5 uppercase tracking-wide">Recommendations</p>
                        <ul className="space-y-1">{rule.recommendations.map((r, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-amber-400 mt-0.5">•</span>{r}</li>)}</ul>
                      </div>
                    )}
                    {rule.strengths.length === 0 && rule.weaknesses.length === 0 && rule.recommendations.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-3">No interpretation content yet. Click edit to add details.</p>
                    )}
                  </div>
                </ExpandableCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Repeated Numbers ── */}
        <TabsContent value="repeated" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditRepeated(null); setRepeatedDialog(true); }} data-testid="button-new-repeated">
              <Plus className="w-4 h-4 mr-2" />New Rule
            </Button>
          </div>
          {loadingRepeated ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (repeatedRules?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No repeated number rules yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {repeatedRules!.map((rule) => {
                const countLabel = { 2: "Double", 3: "Triple", 4: "Quadruple", 5: "Quintuple" }[rule.count] ?? `×${rule.count}`;
                return (
                  <ExpandableCard
                    key={rule.id}
                    header={
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                          {rule.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">{rule.title}</p>
                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">{countLabel}</Badge>
                            {!rule.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          </div>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {rule.strengths.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" onClick={() => { setEditRepeated(rule); setRepeatedDialog(true); }} data-testid={`button-edit-repeated-${rule.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteRepeatedTarget(rule)} data-testid={`button-delete-repeated-${rule.id}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm">
                      {rule.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wide">Strengths</p>
                          <ul className="space-y-1">{rule.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>)}</ul>
                        </div>
                      )}
                      {rule.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-destructive mb-1.5 uppercase tracking-wide">Weaknesses</p>
                          <ul className="space-y-1">{rule.weaknesses.map((w, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-destructive mt-0.5">•</span>{w}</li>)}</ul>
                        </div>
                      )}
                      {rule.strengths.length === 0 && rule.weaknesses.length === 0 && (
                        <p className="text-xs text-muted-foreground col-span-2">No interpretation content yet. Click edit to add details.</p>
                      )}
                    </div>
                  </ExpandableCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Arrow Rules ── */}
        <TabsContent value="arrows" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditArrow(null); setArrowDialog(true); }} data-testid="button-new-arrow">
              <Plus className="w-4 h-4 mr-2" />New Arrow
            </Button>
          </div>
          {loadingArrows ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (arrowRules?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No arrow rules yet. Click "New Arrow" to define one.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {arrowRules!.map((rule) => (
                <ExpandableCard
                  key={rule.id}
                  header={
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${rule.arrow_type === "strength" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                        {rule.arrow_type === "strength" ? "↑" : "↓"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">{rule.name}</p>
                          <div className="flex gap-1">
                            {rule.numbers.map((n) => (
                              <span key={n} className="w-5 h-5 rounded bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
                            ))}
                          </div>
                          <Badge variant="outline" className={`text-xs ${rule.arrow_type === "strength" ? "border-emerald-500/30 text-emerald-400" : "border-destructive/30 text-destructive"}`}>
                            {rule.arrow_type}
                          </Badge>
                          {!rule.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rule.interpretation}</p>
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => { setEditArrow(rule); setArrowDialog(true); }} data-testid={`button-edit-arrow-${rule.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteArrowTarget(rule)} data-testid={`button-delete-arrow-${rule.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-3 mt-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Interpretation</p>
                      <p className="text-sm text-foreground">{rule.interpretation}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {rule.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wide">Strengths</p>
                          <ul className="space-y-1">{rule.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>)}</ul>
                        </div>
                      )}
                      {rule.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-destructive mb-1.5 uppercase tracking-wide">Weaknesses</p>
                          <ul className="space-y-1">{rule.weaknesses.map((w, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-destructive mt-0.5">•</span>{w}</li>)}</ul>
                        </div>
                      )}
                    </div>
                    {rule.numbers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Activates when all present</p>
                        <div className="flex gap-1.5">
                          {rule.numbers.map((n, i) => (
                            <span key={n}>
                              <span className="w-7 h-7 inline-flex items-center justify-center rounded bg-primary/15 text-primary text-sm font-bold">{n}</span>
                              {i < rule.numbers.length - 1 && <span className="text-muted-foreground mx-0.5">—</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ExpandableCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MissingDialog open={missingDialog} rule={editMissing} onClose={() => { setMissingDialog(false); setEditMissing(null); }} />
      <RepeatedDialog open={repeatedDialog} rule={editRepeated} onClose={() => { setRepeatedDialog(false); setEditRepeated(null); }} />
      <ArrowDialog open={arrowDialog} rule={editArrow} onClose={() => { setArrowDialog(false); setEditArrow(null); }} />

      {/* Delete confirms */}
      <AlertDialog open={!!deleteMissingTarget} onOpenChange={() => setDeleteMissingTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Missing {deleteMissingTarget?.missing_number} rule?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!deleteMissingTarget) return;
              await deleteMissing.mutateAsync({ id: deleteMissingTarget.id });
              qc.invalidateQueries({ queryKey: getListMissingNumberRulesQueryKey() });
              toast({ title: "Rule deleted" });
              setDeleteMissingTarget(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRepeatedTarget} onOpenChange={() => setDeleteRepeatedTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete repeated number rule?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!deleteRepeatedTarget) return;
              await deleteRepeated.mutateAsync({ id: deleteRepeatedTarget.id });
              qc.invalidateQueries({ queryKey: getListRepeatedNumberRulesQueryKey() });
              toast({ title: "Rule deleted" });
              setDeleteRepeatedTarget(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteArrowTarget} onOpenChange={() => setDeleteArrowTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteArrowTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!deleteArrowTarget) return;
              await deleteArrow.mutateAsync({ id: deleteArrowTarget.id });
              qc.invalidateQueries({ queryKey: getListArrowRulesQueryKey() });
              toast({ title: "Arrow deleted" });
              setDeleteArrowTarget(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
