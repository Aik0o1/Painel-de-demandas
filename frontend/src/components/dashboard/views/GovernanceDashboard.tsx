import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ShieldAlert, FileKey, Eye } from "lucide-react";

export function GovernanceDashboard() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    title="Incidentes Críticos"
                    value="0"
                    subtitle="Últimos 30 dias"
                    icon={<ShieldAlert className="h-4 w-4 text-green-500" />}
                />
                <MetricCard
                    title="Acessos Sensíveis"
                    value="24"
                    subtitle="Visualizações de dados restritos"
                    icon={<Eye className="h-4 w-4 text-blue-500" />}
                />
                <MetricCard
                    title="Alterações de Permissão"
                    value="3"
                    subtitle="Elevações de privilégio"
                    icon={<FileKey className="h-4 w-4 text-orange-500" />}
                />
            </div>

            <AuditLogViewer />
        </div>
    );
}
