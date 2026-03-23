import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Activity, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Skeleton } from "@/components/ui/skeleton";

export function ExecutiveDashboard() {
    const { metrics: stats, isLoading } = useDashboardMetrics();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-[400px] rounded-xl" />
            </div>
        );
    }

    const { counts, trend } = stats || { counts: {}, trend: [] };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total de Demandas"
                    value={counts.total?.toLocaleString() || "0"}
                    subtitle="Acumulado total"
                    icon={<Activity className="h-4 w-4 text-primary" />}
                    trend={{ value: 0, isPositive: true }} // Validar tendência real depois
                />
                <MetricCard
                    title="Taxa de Conclusão"
                    value={`${counts.completion_rate || 0}%`}
                    subtitle="Eficiência global"
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                    trend={{ value: 0, isPositive: true }}
                />
                <MetricCard
                    title="Em Andamento"
                    value={counts.in_progress?.toLocaleString() || "0"}
                    subtitle="Demandas ativas"
                    icon={<Clock className="h-4 w-4 text-blue-500" />}
                />
                <MetricCard
                    title="Pendentes"
                    value={counts.pending?.toLocaleString() || "0"}
                    subtitle="Aguardando início"
                    icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} // Changed to amber for warning
                    variant={counts.pending > 5 ? "danger" : "default"}
                />
            </div>

            <OverviewCharts data={trend} />
        </div>
    );
}
