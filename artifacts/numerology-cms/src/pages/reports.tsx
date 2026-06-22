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
import { Loader2 } from "lucide-react";

// Lo Shu grid positions: row by row 4,9,2 / 3,5,7 / 8,1,6
const LO_SHU_GRID_POSITIONS = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

function LoShuGrid({ result }: { result: NumerologyReport["lo_shu"] }) {
  const counts: Record<number, number> = {};
  result.repeated_numbers.forEach((r) => { counts[r.number] = r.count; });
  result.missing_numbers.forEach((n) => { counts[n] = 0; });

  return (
    <div className="inline-grid grid-cols-3 gap-1" data-testid="lo-shu-grid">
      {LO_SHU_GRID_POSITIONS.flat().map((n) => {
        const count = counts[n] ?? 1;
        const isMissing = result.missing_numbers.includes(n);
        const isRepeated = result.repeated_numbers.some((r) => r.number === n);
        return (
          <div
            key={n}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-md border text-sm font-bold transition-colors
              ${isMissing ? "border-destructive/40 bg-destructive/10 text-destructive/60" : ""}
              ${isRepeated ? "border-accent/50 bg-accent/10 text-accent" : ""}
              ${!isMissing && !isRepeated ? "border-border bg-muted/40 text-foreground" : ""}
            `}
            data-testid={`lo-shu-cell-${n}`}
          >
            <span className="text-lg">{n}</span>
            {!isMissing && <span className="text-xs font-normal text-muted-foreground">×{count}</span>}
            {isMissing && <span className="text-xs font-normal">missing</span>}
          </div>
        );
      })}
    </div>
  );
}

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
        <p className="text-muted-foreground text-sm mt-1">Generate a complete numerology reading from the rule engine</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="John Doe" data-testid="input-report-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input {...field} type="date" data-testid="input-report-dob" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={generateReport.isPending} className="w-full" data-testid="button-generate-report">
                {generateReport.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6" data-testid="report-result">
          {/* Subject */}
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">{report.subject.name}</h2>
              <p className="text-sm text-muted-foreground">
                Born {new Date(report.subject.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {" · "}Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Calculated Numbers */}
          <Card data-testid="section-calculated-numbers">
            <CardHeader><CardTitle className="text-base">Calculated Numbers</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Birthday", value: report.numbers.birthday_number },
                  { label: "Destiny", value: report.numbers.destiny_number },
                  { label: "Personal Year", value: report.numbers.personal_year },
                  { label: "Personal Month", value: report.numbers.personal_month },
                  { label: "Personal Day", value: report.numbers.personal_day },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center p-4 rounded-lg bg-muted/40 border border-border" data-testid={`number-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                    <span className="text-3xl font-bold text-primary font-serif">{item.value}</span>
                    <span className="text-xs text-muted-foreground mt-1 text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interpretations */}
          {report.interpretations.length > 0 && (
            <div className="space-y-3" data-testid="section-interpretations">
              <h3 className="text-lg font-semibold font-serif">Interpretations</h3>
              {report.interpretations.map((interp) => (
                <Card key={interp.rule_id} data-testid={`interpretation-${interp.rule_id}`}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-foreground">{interp.rule_name}</span>
                          <Badge variant="outline" className="text-xs">{interp.rule_type.replace(/_/g, " ")}</Badge>
                        </div>
                        {interp.description && <p className="text-sm text-muted-foreground mb-2">{interp.description}</p>}
                        {interp.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {interp.keywords.map((kw, i) => (
                              <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{kw}</span>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                          {interp.strengths.length > 0 && (
                            <div>
                              <p className="font-medium text-green-400 mb-1">Strengths</p>
                              <ul className="space-y-0.5">{interp.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul>
                            </div>
                          )}
                          {interp.weaknesses.length > 0 && (
                            <div>
                              <p className="font-medium text-destructive mb-1">Weaknesses</p>
                              <ul className="space-y-0.5">{interp.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}</ul>
                            </div>
                          )}
                          {interp.recommendations.length > 0 && (
                            <div>
                              <p className="font-medium text-accent mb-1">Recommendations</p>
                              <ul className="space-y-0.5">{interp.recommendations.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {report.interpretations.length === 0 && (
                <p className="text-sm text-muted-foreground">No matching rules found for these numbers. Add rules in the Rule Builder.</p>
              )}
            </div>
          )}

          {/* Lo Shu */}
          <Card data-testid="section-lo-shu">
            <CardHeader><CardTitle className="text-base">Lo Shu Grid</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <LoShuGrid result={report.lo_shu} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4">
                <div>
                  <p className="font-medium text-foreground mb-2">Missing Numbers</p>
                  {report.lo_shu.missing_numbers.length === 0 ? (
                    <p className="text-muted-foreground text-xs">None</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {report.lo_shu.missing_numbers.map((n) => (
                        <span key={n} className="w-7 h-7 rounded-full bg-destructive/20 text-destructive text-xs font-bold flex items-center justify-center">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Repeated Numbers</p>
                  {report.lo_shu.repeated_numbers.length === 0 ? (
                    <p className="text-muted-foreground text-xs">None</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {report.lo_shu.repeated_numbers.map((r) => (
                        <span key={r.number} className="flex items-center gap-0.5 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded">
                          {r.number} <span className="opacity-70">×{r.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Active Arrows</p>
                  {report.lo_shu.active_arrows.length === 0 ? (
                    <p className="text-muted-foreground text-xs">None</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {report.lo_shu.active_arrows.map((a, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Lo Shu interpretations */}
              {(report.lo_shu.missing_interpretations.length > 0 || report.lo_shu.arrow_interpretations.length > 0) && (
                <div className="space-y-2 mt-3">
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lo Shu Interpretations</p>
                  {report.lo_shu.missing_interpretations.map((m) => (
                    <div key={m.id} className="p-3 bg-muted/40 rounded-md text-sm">
                      <p className="font-medium text-foreground mb-1">Missing {m.missing_number} — {m.title}</p>
                      {m.weaknesses.length > 0 && <p className="text-xs text-muted-foreground">Weaknesses: {m.weaknesses.join(", ")}</p>}
                      {m.recommendations.length > 0 && <p className="text-xs text-accent">Remedies: {m.recommendations.join(", ")}</p>}
                    </div>
                  ))}
                  {report.lo_shu.arrow_interpretations.map((a) => (
                    <div key={a.id} className="p-3 bg-muted/40 rounded-md text-sm">
                      <p className="font-medium text-foreground mb-1">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.interpretation}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
