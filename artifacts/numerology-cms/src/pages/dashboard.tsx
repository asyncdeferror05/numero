import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, FunctionSquare, Library, Grid3X3, CheckCircle2, Clock, Hash } from "lucide-react";

const RULE_TYPE_LABELS: Record<string, string> = {
  personality_number: "Personality",
  birthday_number: "Birthday",
  destiny_number: "Destiny",
  personal_year: "Personal Year",
  personal_month: "Personal Month",
  personal_day: "Personal Day",
  lo_shu: "Lo Shu",
  missing_number: "Missing Number",
  repeated_number: "Repeated Number",
  combination: "Combination",
  compatibility: "Compatibility",
  vehicle_number: "Vehicle Number",
  phone_number: "Phone Number",
  house_number: "House Number",
  remedy: "Remedy",
  custom: "Custom",
};

function StatCard({ title, value, sub, icon: Icon, loading }: { title: string; value: number; sub?: string; icon: React.ElementType; loading: boolean }) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-primary opacity-70" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <>
            <p className="text-3xl font-bold text-foreground" data-testid={`stat-value-${title.toLowerCase().replace(/\s/g, "-")}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-serif text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Numerology knowledge engine overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Rules" value={stats?.totalRules ?? 0} sub={`${stats?.activeRules ?? 0} active`} icon={ScrollText} loading={isLoading} />
        <StatCard title="Formulas" value={stats?.totalFormulas ?? 0} sub={`${stats?.activeFormulas ?? 0} active`} icon={FunctionSquare} loading={isLoading} />
        <StatCard title="Knowledge Entries" value={stats?.totalKnowledgeEntries ?? 0} icon={Library} loading={isLoading} />
        <StatCard title="Lo Shu Rules" value={stats?.totalLoShuRules ?? 0} icon={Grid3X3} loading={isLoading} />
        <StatCard title="Number Meanings" value={stats?.totalNumberMeanings ?? 0} icon={Hash} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules by type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rules by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (stats?.rulesByType?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">No rules yet. Start by creating some rules.</p>
            ) : (
              <div className="space-y-2">
                {stats!.rulesByType.map((rt) => (
                  <div key={rt.type} className="flex items-center justify-between py-1.5 border-b border-border last:border-0" data-testid={`rule-type-row-${rt.type}`}>
                    <span className="text-sm text-foreground">{RULE_TYPE_LABELS[rt.type] ?? rt.type}</span>
                    <Badge variant="secondary" data-testid={`rule-type-count-${rt.type}`}>{rt.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (stats?.recentRules?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">No rules created yet.</p>
            ) : (
              <div className="space-y-2">
                {stats!.recentRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`recent-rule-${rule.id}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{RULE_TYPE_LABELS[rule.rule_type] ?? rule.rule_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.is_active ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
