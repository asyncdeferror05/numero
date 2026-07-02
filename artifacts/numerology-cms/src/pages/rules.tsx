import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRules, getListRulesQueryKey,
  useCreateRule, useUpdateRule, useDeleteRule, useToggleRule,
  useListRuleTypes,
} from "@workspace/api-client-react";
import type { Rule } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
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
import { TagInput } from "@/components/tag-input";
import { Plus, Pencil, Trash2, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const RULE_TYPES = [
  "personality_number", "birthday_number", "destiny_number", "personal_year",
  "personal_month", "personal_day", "lo_shu", "missing_number", "repeated_number",
  "combination", "compatibility", "vehicle_number", "phone_number", "house_number",
  "remedy", "custom",
];

function parseJsonField(val: string): Record<string, unknown> {
  try { return JSON.parse(val) as Record<string, unknown>; } catch { return {}; }
}

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rule_type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  condition_json: z.string().min(1, "Condition is required"),
  keywords: z.array(z.string()).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  priority: z.coerce.number().int().min(1).default(100),
  is_active: z.boolean().optional(),
});
type RuleFormValues = z.infer<typeof ruleSchema>;

function RuleDialog({ open, rule, onClose }: { open: boolean; rule: Rule | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule();

  const existingResult = rule?.result_json as Record<string, unknown> | undefined;

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: rule?.name ?? "",
      rule_type: rule?.rule_type ?? "",
      description: rule?.description ?? "",
      condition_json: rule?.condition_json ? JSON.stringify(rule.condition_json, null, 2) : "{}",
      keywords: (existingResult?.keywords as string[]) ?? [],
      strengths: (existingResult?.strengths as string[]) ?? [],
      weaknesses: (existingResult?.weaknesses as string[]) ?? [],
      recommendations: (existingResult?.recommendations as string[]) ?? [],
      priority: rule?.priority ?? 100,
      is_active: rule?.is_active ?? true,
    },
  });

  const onSubmit = async (data: RuleFormValues) => {
    const result_json = {
      keywords: data.keywords ?? [],
      strengths: data.strengths ?? [],
      weaknesses: data.weaknesses ?? [],
      recommendations: data.recommendations ?? [],
    };
    const payload = {
      name: data.name,
      rule_type: data.rule_type,
      description: data.description,
      condition_json: parseJsonField(data.condition_json),
      result_json,
      priority: data.priority,
      is_active: data.is_active ?? true,
    };
    try {
      if (rule) {
        await updateMutation.mutateAsync({ id: rule.id, data: payload });
        toast({ title: "Rule updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Rule created" });
      }
      qc.invalidateQueries({ queryKey: getListRulesQueryKey() });
      onClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rule" : "New Rule"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Personal Year 5 Competition" data-testid="input-rule-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rule_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-rule-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RULE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} placeholder="Describe this rule..." rows={2} data-testid="input-rule-description" /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="condition_json" render={({ field }) => (
              <FormItem>
                <FormLabel>Condition (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} className="font-mono text-xs" rows={4} placeholder='{"year": 5}' data-testid="input-rule-condition" />
                </FormControl>
                <p className="text-xs text-muted-foreground">Example: {`{"year": 5}`} or {`{"birthday_number": 1}`}</p>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="keywords" render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add keywords..." /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="strengths" render={({ field }) => (
                <FormItem>
                  <FormLabel>Strengths</FormLabel>
                  <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add strengths..." /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="weaknesses" render={({ field }) => (
                <FormItem>
                  <FormLabel>Weaknesses</FormLabel>
                  <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add weaknesses..." /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="recommendations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add recommendations..." /></FormControl>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (lower = higher priority)</FormLabel>
                  <FormControl><Input {...field} type="number" min={1} data-testid="input-rule-priority" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-6">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-rule-active" /></FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-rule">
                Save Rule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function RulesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: rules, isLoading } = useListRules({
    search: search || undefined,
    rule_type: filterType || undefined,
  });
  const toggleMutation = useToggleRule();
  const deleteMutation = useDeleteRule();

  const handleToggle = async (rule: Rule) => {
    await toggleMutation.mutateAsync({ id: rule.id });
    qc.invalidateQueries({ queryKey: getListRulesQueryKey() });
    toast({ title: rule.is_active ? "Rule deactivated" : "Rule activated" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    qc.invalidateQueries({ queryKey: getListRulesQueryKey() });
    toast({ title: "Rule deleted" });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Rule Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage numerology interpretation rules</p>
        </div>
        <Button onClick={() => { setEditRule(null); setDialogOpen(true); }} data-testid="button-new-rule">
          <Plus className="w-4 h-4 mr-2" />New Rule
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-rules"
          />
        </div>
        <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-52" data-testid="select-filter-rule-type">
            <SelectValue placeholder="All rule types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {RULE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (rules?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No rules found. Create your first numerology rule.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules!.map((rule) => {
            const result = rule.result_json as Record<string, string[]>;
            const keywords: string[] = result?.keywords ?? [];
            const strengths: string[] = result?.strengths ?? [];
            const weaknesses: string[] = result?.weaknesses ?? [];
            const recommendations: string[] = result?.recommendations ?? [];
            const isOpen = expandedId === rule.id;
            return (
              <Card key={rule.id} data-testid={`rule-card-${rule.id}`} className={cn("border-border transition-colors", isOpen && "border-primary/30")}>
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isOpen ? null : rule.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isOpen ? null : rule.id); } }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{rule.name}</span>
                        <Badge variant="outline" className="text-xs">{rule.rule_type.replace(/_/g, " ")}</Badge>
                        <Badge variant="secondary" className="text-xs">P:{rule.priority}</Badge>
                        {!rule.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rule.description}</p>
                      )}
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{kw}</span>
                          ))}
                          {keywords.length > 5 && <span className="text-xs text-muted-foreground">+{keywords.length - 5}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={rule.is_active} onCheckedChange={() => handleToggle(rule)} data-testid={`switch-rule-active-${rule.id}`} />
                      <Button size="icon" variant="ghost" onClick={() => { setEditRule(rule); setDialogOpen(true); }} data-testid={`button-edit-rule-${rule.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(rule)} data-testid={`button-delete-rule-${rule.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t border-border/50 space-y-3">
                      {strengths.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Strengths</p>
                          <div className="flex flex-wrap gap-1.5">
                            {strengths.map((s, i) => <span key={i} className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>)}
                          </div>
                        </div>
                      )}
                      {weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Weaknesses</p>
                          <div className="flex flex-wrap gap-1.5">
                            {weaknesses.map((w, i) => <span key={i} className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">{w}</span>)}
                          </div>
                        </div>
                      )}
                      {recommendations.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Recommendations</p>
                          <div className="flex flex-wrap gap-1.5">
                            {recommendations.map((r, i) => <span key={i} className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">{r}</span>)}
                          </div>
                        </div>
                      )}
                      {keywords.length > 5 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">All Keywords</p>
                          <div className="flex flex-wrap gap-1.5">
                            {keywords.map((kw, i) => <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{kw}</span>)}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Condition</p>
                        <pre className="text-xs bg-muted rounded p-2 overflow-x-auto text-muted-foreground">{JSON.stringify(rule.condition_json, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RuleDialog open={dialogOpen} rule={editRule} onClose={() => setDialogOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete-rule">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
