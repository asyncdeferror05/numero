import { useState } from "react";
import { useGenerateReport } from "@workspace/api-client-react";
import type { NumerologyReport } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Loader2, User, Briefcase, Heart, Activity, DollarSign,
  Plane, Sparkles, TrendingUp, Grid3X3, Brain, ChevronDown, ChevronRight,
} from "lucide-react";

// ─── Lo Shu Grid ────────────────────────────────────────────────────────────

const LO_SHU_GRID_POSITIONS = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

function LoShuGrid({ result }: { result: NumerologyReport["lo_shu"] }) {
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = 0;
  result.repeated_numbers.forEach((r) => { counts[r.number] = r.count; });
  // For numbers that appear exactly once (not in repeated or missing), count = 1
  result.missing_numbers.forEach((n) => { counts[n] = 0; });

  // Build count map from digit pool (most accurate)
  const poolCounts: Record<number, number> = {};
  if (result.digit_pool) {
    for (const d of result.digit_pool) {
      if (d >= 1 && d <= 9) poolCounts[d] = (poolCounts[d] ?? 0) + 1;
    }
  }

  const freqCounts = Object.keys(poolCounts).length > 0 ? poolCounts : counts;

  return (
    <div className="space-y-3">
      <div className="inline-grid grid-cols-3 gap-1.5">
        {LO_SHU_GRID_POSITIONS.flat().map((n) => {
          const freq = freqCounts[n] ?? 0;
          const isMissing = freq === 0;
          const isRepeated = freq > 1;
          return (
            <div key={n} className={`w-18 h-18 min-w-[4.5rem] min-h-[4.5rem] flex flex-col items-center justify-center rounded-md border text-sm font-bold gap-0.5
              ${isMissing ? "border-destructive/40 bg-destructive/10 text-destructive/60" : ""}
              ${isRepeated ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : ""}
              ${!isMissing && !isRepeated ? "border-border bg-muted/40 text-foreground" : ""}`}
            >
              <span className="text-xl leading-none">{n}</span>
              {!isMissing && (
                <span className={`text-[11px] font-normal leading-none ${isRepeated ? "text-amber-400" : "text-muted-foreground"}`}>
                  ×{freq}
                </span>
              )}
              {isMissing && <span className="text-[10px] font-normal text-destructive/60">absent</span>}
            </div>
          );
        })}
      </div>
      {result.digit_pool && result.digit_pool.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Digit pool: [{result.digit_pool.join(", ")}]
        </p>
      )}
    </div>
  );
}

// ─── Collapsible interpretation block ────────────────────────────────────────

function CollapsibleBlock({ title, badge, children, defaultOpen = false }: {
  title: string; badge?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {badge}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-4 py-3 bg-muted/10">{children}</div>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon, title, number, summary, children,
}: { icon: React.ElementType; title: string; number?: number; summary?: string; children?: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{title}</CardTitle>
              {number !== undefined && (
                <span className="text-2xl font-bold text-primary">{number}</span>
              )}
            </div>
            {summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{summary}</p>}
          </div>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function MeaningsList({ meanings }: { meanings: NumerologyReport["personality_analysis"]["meanings"] }) {
  if (meanings.length === 0) return null;
  const m = meanings[0];
  return (
    <div className="space-y-3 text-sm">
      {m.keywords_json.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {m.keywords_json.map((k) => <span key={k} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">{k}</span>)}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {m.strengths_json.length > 0 && (
          <div>
            <p className="text-xs font-medium text-emerald-400 mb-1">Strengths</p>
            <ul className="space-y-0.5">{m.strengths_json.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
          </div>
        )}
        {m.weaknesses_json.length > 0 && (
          <div>
            <p className="text-xs font-medium text-destructive mb-1">Weaknesses</p>
            <ul className="space-y-0.5">{m.weaknesses_json.map((w, i) => <li key={i} className="text-xs text-muted-foreground">• {w}</li>)}</ul>
          </div>
        )}
        {m.recommendations_json.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-400 mb-1">Recommendations</p>
            <ul className="space-y-0.5">{m.recommendations_json.map((r, i) => <li key={i} className="text-xs text-muted-foreground">• {r}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

const reportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
});
type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportsPage() {
  const { toast } = useToast();
  const generateReport = useGenerateReport();
  const [report, setReport] = useState<NumerologyReport | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { name: "", date_of_birth: "" },
  });

  const onSubmit = async (data: ReportFormValues) => {
    try {
      const result = await generateReport.mutateAsync({ data });
      setReport(result);
    } catch {
      toast({ title: "Error generating report", description: "Check your inputs and try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Report Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate a complete 8-section numerology reading from the rule engine</p>
      </div>

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Generate Report</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="John Doe" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input {...field} type="date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={generateReport.isPending} className="w-full">
                {generateReport.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : "Generate Report"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif">{report.subject.name}</h2>
              <p className="text-sm text-muted-foreground">
                Born {new Date(report.subject.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {" · "}Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Core Numbers */}
          <Card>
            <CardHeader><CardTitle className="text-base">Core Numbers</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Birthday", value: report.numbers.birthday_number },
                  { label: "Destiny", value: report.numbers.destiny_number },
                  { label: "Personal Year", value: report.numbers.personal_year },
                  { label: "Personal Month", value: report.numbers.personal_month },
                  { label: "Personal Day", value: report.numbers.personal_day },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-3xl font-bold text-primary font-serif">{item.value}</span>
                    <span className="text-xs text-muted-foreground mt-1 text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 8 Sections grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard icon={Brain} title="Personality" number={report.personality_analysis.number} summary={report.personality_analysis.summary}>
              <MeaningsList meanings={report.personality_analysis.meanings} />
            </SectionCard>

            <SectionCard icon={Briefcase} title="Career" number={report.career_analysis.number} summary={report.career_analysis.summary}>
              {report.career_analysis.professions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Professions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.career_analysis.professions.map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs">{p.profession}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <MeaningsList meanings={report.career_analysis.meanings} />
            </SectionCard>

            <SectionCard icon={Heart} title="Relationships" number={report.relationship_analysis.number} summary={report.relationship_analysis.summary}>
              {report.relationship_analysis.mappings.length > 0 && (
                <div className="space-y-2">
                  {report.relationship_analysis.mappings.map((m) => (
                    <div key={m.id} className="flex gap-2">
                      <Badge variant="outline" className="text-xs capitalize shrink-0">{m.relationship_type}</Badge>
                      {m.interpretation && <p className="text-xs text-muted-foreground">{m.interpretation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Activity} title="Health" number={report.health_analysis.number} summary={report.health_analysis.summary}>
              {report.health_analysis.health_areas.length > 0 && (
                <div className="space-y-1.5">
                  {report.health_analysis.health_areas.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${h.severity === "strong" ? "bg-red-500/20 text-red-400" : h.severity === "moderate" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{h.severity}</span>
                      <span className="font-medium">{h.health_area}</span>
                      {h.notes && <span className="text-muted-foreground line-clamp-1">{h.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={DollarSign} title="Finance" number={report.money_analysis.number} summary={report.money_analysis.summary}>
              <MeaningsList meanings={report.money_analysis.meanings} />
            </SectionCard>

            <SectionCard icon={Plane} title="Travel & Movement" number={report.travel_analysis.number} summary={report.travel_analysis.summary}>
              <MeaningsList meanings={report.travel_analysis.meanings} />
            </SectionCard>
          </div>

          {/* Remedies */}
          {report.remedies.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Recommended Remedies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.remedies.map((r) => (
                    <div key={r.id} className="p-3 bg-muted/40 rounded-md border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{r.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.category === "spiritual" ? "bg-violet-500/20 text-violet-400" : r.category === "health" ? "bg-emerald-500/20 text-emerald-400" : r.category === "career" ? "bg-blue-500/20 text-blue-400" : r.category === "finance" ? "bg-amber-500/20 text-amber-400" : "bg-pink-500/20 text-pink-400"}`}>{r.category}</span>
                      </div>
                      {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Future Predictions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Future Predictions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Personal Year", value: report.future_predictions.personal_year },
                  { label: "Personal Month", value: report.future_predictions.personal_month },
                  { label: "Personal Day", value: report.future_predictions.personal_day },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-2xl font-bold text-primary">{item.value}</span>
                    <span className="text-xs text-muted-foreground mt-1 text-center">{item.label}</span>
                  </div>
                ))}
              </div>
              {report.future_predictions.year_meaning.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Year Theme</p>
                  <p className="text-sm text-foreground font-medium">{report.future_predictions.year_meaning[0].title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.future_predictions.year_meaning[0].description}</p>
                </div>
              )}
              {report.future_predictions.month_meaning.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Month Theme</p>
                  <p className="text-sm text-foreground font-medium">{report.future_predictions.month_meaning[0].title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.future_predictions.month_meaning[0].description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lo Shu Grid — full section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Lo Shu Grid Analysis</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Grid built from DOB digits + Destiny ({report.numbers.destiny_number}) + Birthday ({report.numbers.birthday_number})
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Grid visual */}
              <LoShuGrid result={report.lo_shu} />

              {/* Summary row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Present numbers */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Present Numbers</p>
                  {report.lo_shu.digit_pool ? (
                    <div className="flex flex-wrap gap-1">
                      {[1,2,3,4,5,6,7,8,9].filter(n => !report.lo_shu.missing_numbers.includes(n)).map(n => (
                        <span key={n} className="w-6 h-6 rounded bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">—</p>}
                </div>

                {/* Missing */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Missing Numbers</p>
                  {report.lo_shu.missing_numbers.length === 0 ? (
                    <p className="text-xs text-emerald-400">None — all numbers present</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {report.lo_shu.missing_numbers.map((n) => (
                        <span key={n} className="w-6 h-6 rounded-full bg-destructive/20 text-destructive text-xs font-bold flex items-center justify-center">{n}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Repeated */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Repeated Numbers</p>
                  {report.lo_shu.repeated_numbers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {report.lo_shu.repeated_numbers.map((r) => (
                        <span key={r.number} className="flex items-center gap-1 bg-amber-500/15 text-amber-300 text-xs px-2 py-0.5 rounded font-medium">
                          {r.number} <span className="text-amber-400/70">{r.label ?? `×${r.count}`}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Arrows */}
              {report.lo_shu.active_arrows.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active Arrows</p>
                  <div className="flex flex-wrap gap-2">
                    {report.lo_shu.active_arrows.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-primary border-primary/30">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretations — collapsible per entry */}
              {report.lo_shu.missing_interpretations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Missing Number Analysis</p>
                  {report.lo_shu.missing_interpretations.map((m) => (
                    <CollapsibleBlock
                      key={m.id}
                      title={`Missing ${m.missing_number} — ${m.title}`}
                      badge={<span className="w-5 h-5 rounded-full bg-destructive/20 text-destructive text-xs font-bold flex items-center justify-center">{m.missing_number}</span>}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {m.strengths.length > 0 && (
                          <div>
                            <p className="font-semibold text-emerald-400 mb-1.5">Strengths</p>
                            <ul className="space-y-1">{m.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul>
                          </div>
                        )}
                        {m.weaknesses.length > 0 && (
                          <div>
                            <p className="font-semibold text-destructive mb-1.5">Weaknesses</p>
                            <ul className="space-y-1">{m.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}</ul>
                          </div>
                        )}
                        {m.recommendations.length > 0 && (
                          <div>
                            <p className="font-semibold text-amber-400 mb-1.5">Recommendations</p>
                            <ul className="space-y-1">{m.recommendations.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleBlock>
                  ))}
                </div>
              )}

              {report.lo_shu.repeated_interpretations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Repeated Number Analysis</p>
                  {report.lo_shu.repeated_interpretations.map((r) => (
                    <CollapsibleBlock
                      key={r.id}
                      title={`${r.title} (${r.number} ×${r.count})`}
                      badge={<Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">×{r.count}</Badge>}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {r.strengths.length > 0 && (
                          <div>
                            <p className="font-semibold text-emerald-400 mb-1.5">Strengths</p>
                            <ul className="space-y-1">{r.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul>
                          </div>
                        )}
                        {r.weaknesses.length > 0 && (
                          <div>
                            <p className="font-semibold text-destructive mb-1.5">Weaknesses</p>
                            <ul className="space-y-1">{r.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleBlock>
                  ))}
                </div>
              )}

              {report.lo_shu.arrow_interpretations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Arrow Analysis</p>
                  {report.lo_shu.arrow_interpretations.map((a) => (
                    <CollapsibleBlock
                      key={a.id}
                      title={a.name}
                      badge={
                        <Badge variant="outline" className={`text-xs ${a.arrow_type === "strength" ? "border-emerald-500/30 text-emerald-400" : "border-destructive/30 text-destructive"}`}>
                          {a.arrow_type}
                        </Badge>
                      }
                      defaultOpen
                    >
                      <div className="space-y-3">
                        <p className="text-sm text-foreground">{a.interpretation}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {a.numbers.map((n) => (
                            <span key={n} className="w-6 h-6 rounded bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {a.strengths.length > 0 && (
                            <div>
                              <p className="font-semibold text-emerald-400 mb-1.5">Strengths</p>
                              <ul className="space-y-1">{a.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul>
                            </div>
                          )}
                          {a.weaknesses.length > 0 && (
                            <div>
                              <p className="font-semibold text-destructive mb-1.5">Weaknesses</p>
                              <ul className="space-y-1">{a.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleBlock>
                  ))}
                </div>
              )}

              {report.lo_shu.missing_interpretations.length === 0 &&
               report.lo_shu.repeated_interpretations.length === 0 &&
               report.lo_shu.arrow_interpretations.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No interpretations yet. Add rules in <span className="text-primary">Lo Shu CMS</span> to see analysis here.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rule-based Interpretations */}
          {report.interpretations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold font-serif">Rule Engine Matches</h3>
              {report.interpretations.map((interp) => (
                <Card key={interp.rule_id}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{interp.rule_name}</span>
                      <Badge variant="outline" className="text-xs">{interp.rule_type.replace(/_/g, " ")}</Badge>
                    </div>
                    {interp.description && <p className="text-sm text-muted-foreground mb-2">{interp.description}</p>}
                    {interp.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">{interp.keywords.map((kw, i) => <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{kw}</span>)}</div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {interp.strengths.length > 0 && <div><p className="font-medium text-emerald-400 mb-1">Strengths</p><ul>{interp.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul></div>}
                      {interp.weaknesses.length > 0 && <div><p className="font-medium text-destructive mb-1">Weaknesses</p><ul>{interp.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}</ul></div>}
                      {interp.recommendations.length > 0 && <div><p className="font-medium text-amber-400 mb-1">Recommendations</p><ul>{interp.recommendations.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}</ul></div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
