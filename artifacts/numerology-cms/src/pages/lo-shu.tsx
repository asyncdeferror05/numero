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
import { Plus, Pencil, Trash2 } from "lucide-react";

// ─── Missing Number ──────────────────────────────────────────────────────────

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
                  <FormControl><Input {...field} placeholder="Missing 1" data-testid="input-missing-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="strengths" render={({ field }) => (
              <FormItem><FormLabel>Strengths</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="Add strengths..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="weaknesses" render={({ field }) => (
              <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="Add weaknesses..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="recommendations" render={({ field }) => (
              <FormItem><FormLabel>Recommendations</FormLabel><FormControl><TagInput value={field.value} onChange={field.onChange} placeholder="Add recommendations..." /></FormControl></FormItem>
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
                  <FormLabel>Min Count</FormLabel>
                  <FormControl><Input {...field} type="number" min={2} data-testid="input-repeated-count" /></FormControl>
                  <FormMessage />
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
  interpretation: z.string().min(1),
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
      interpretation: rule?.interpretation ?? "",
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
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{rule ? "Edit Arrow Rule" : "New Arrow Rule"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Arrow Name</FormLabel>
                <FormControl><Input {...field} placeholder="Arrow of Determination" data-testid="input-arrow-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="numbers" render={() => (
              <FormItem>
                <FormLabel>Numbers in Arrow</FormLabel>
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
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="interpretation" render={({ field }) => (
              <FormItem>
                <FormLabel>Interpretation</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Strong determination and focus..." data-testid="input-arrow-interpretation" />
                </FormControl>
                <FormMessage />
              </FormItem>
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
        <p className="text-muted-foreground text-sm mt-1">Manage Lo Shu grid interpretation rules</p>
      </div>

      <Tabs defaultValue="missing">
        <TabsList>
          <TabsTrigger value="missing" data-testid="tab-missing">Missing Numbers</TabsTrigger>
          <TabsTrigger value="repeated" data-testid="tab-repeated">Repeated Numbers</TabsTrigger>
          <TabsTrigger value="arrows" data-testid="tab-arrows">Arrows</TabsTrigger>
        </TabsList>

        <TabsContent value="missing" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditMissing(null); setMissingDialog(true); }} data-testid="button-new-missing">
              <Plus className="w-4 h-4 mr-2" />New Rule
            </Button>
          </div>
          {loadingMissing ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (missingRules?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No missing number rules yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {missingRules!.map((rule) => (
                <Card key={rule.id} data-testid={`missing-rule-card-${rule.id}`}>
                  <CardContent className="py-3 px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center">{rule.missing_number}</div>
                        <div>
                          <span className="font-medium text-sm text-foreground">{rule.title}</span>
                          <div className="flex gap-1 mt-0.5">
                            {rule.weaknesses.slice(0, 3).map((w, i) => (
                              <span key={i} className="text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">{w}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditMissing(rule); setMissingDialog(true); }} data-testid={`button-edit-missing-${rule.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteMissingTarget(rule)} data-testid={`button-delete-missing-${rule.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="repeated" className="space-y-4 mt-4">
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
              {repeatedRules!.map((rule) => (
                <Card key={rule.id} data-testid={`repeated-rule-card-${rule.id}`}>
                  <CardContent className="py-3 px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-sm flex items-center justify-center">{rule.number}</div>
                        <div>
                          <span className="font-medium text-sm text-foreground">{rule.title}</span>
                          <span className="text-xs text-muted-foreground ml-2">×{rule.count}+</span>
                          <div className="flex gap-1 mt-0.5">
                            {rule.strengths.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditRepeated(rule); setRepeatedDialog(true); }} data-testid={`button-edit-repeated-${rule.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteRepeatedTarget(rule)} data-testid={`button-delete-repeated-${rule.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="arrows" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditArrow(null); setArrowDialog(true); }} data-testid="button-new-arrow">
              <Plus className="w-4 h-4 mr-2" />New Arrow
            </Button>
          </div>
          {loadingArrows ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (arrowRules?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No arrow rules yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {arrowRules!.map((rule) => (
                <Card key={rule.id} data-testid={`arrow-rule-card-${rule.id}`}>
                  <CardContent className="py-3 px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{rule.name}</span>
                          <div className="flex gap-1">
                            {rule.numbers.map((n) => (
                              <span key={n} className="w-6 h-6 rounded bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{rule.interpretation}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditArrow(rule); setArrowDialog(true); }} data-testid={`button-edit-arrow-${rule.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteArrowTarget(rule)} data-testid={`button-delete-arrow-${rule.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MissingDialog open={missingDialog} rule={editMissing} onClose={() => setMissingDialog(false)} />
      <RepeatedDialog open={repeatedDialog} rule={editRepeated} onClose={() => setRepeatedDialog(false)} />
      <ArrowDialog open={arrowDialog} rule={editArrow} onClose={() => setArrowDialog(false)} />

      {/* Delete confirms */}
      <AlertDialog open={!!deleteMissingTarget} onOpenChange={() => setDeleteMissingTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Rule</AlertDialogTitle><AlertDialogDescription>Delete "{deleteMissingTarget?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await deleteMissing.mutateAsync({ id: deleteMissingTarget!.id }); qc.invalidateQueries({ queryKey: getListMissingNumberRulesQueryKey() }); toast({ title: "Deleted" }); setDeleteMissingTarget(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteRepeatedTarget} onOpenChange={() => setDeleteRepeatedTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Rule</AlertDialogTitle><AlertDialogDescription>Delete "{deleteRepeatedTarget?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await deleteRepeated.mutateAsync({ id: deleteRepeatedTarget!.id }); qc.invalidateQueries({ queryKey: getListRepeatedNumberRulesQueryKey() }); toast({ title: "Deleted" }); setDeleteRepeatedTarget(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteArrowTarget} onOpenChange={() => setDeleteArrowTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Arrow</AlertDialogTitle><AlertDialogDescription>Delete "{deleteArrowTarget?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await deleteArrow.mutateAsync({ id: deleteArrowTarget!.id }); qc.invalidateQueries({ queryKey: getListArrowRulesQueryKey() }); toast({ title: "Deleted" }); setDeleteArrowTarget(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
