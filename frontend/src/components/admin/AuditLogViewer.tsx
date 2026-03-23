import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ArrowRight } from "lucide-react";
import { AuditLogDetails } from "./AuditLogDetails";

export function AuditLogViewer() {
    const { logs: auditLogs, isLoading: isLoadingLogs } = useAuditLogs();
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const getActionColor = (action: string) => {
        if (!action) return "outline";
        const act = action.toUpperCase();
        if (act.includes("LOGIN")) return "default";
        if (act.includes("DELETE") || act.includes("FAILED")) return "destructive";
        if (act.includes("CREATE")) return "secondary"; // Green-ish usually or secondary
        if (act.includes("UPDATE")) return "secondary";
        return "outline";
    };

    if (isLoadingLogs) {
        return <Skeleton className="h-[400px] w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Log de Auditoria</CardTitle>
                <CardDescription>
                    Rastreamento completo de operações de sistema (Imutável).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Data/Hora</TableHead>
                                <TableHead className="w-[120px]">Ação</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Recurso</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLogs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro de auditoria encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                auditLogs?.map((log: any) => (
                                    <TableRow key={log._id || log.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {log.createdAt ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : (log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : '-')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action) as any} className="font-mono text-[10px]">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {log.userName || log.actor_name || 'Sistema'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <span className="font-semibold text-xs text-muted-foreground mr-1">
                                                [{log.module || log.resource}]
                                            </span>
                                            {/* Legacy support for resource_id if needed, or metadata extraction */}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedLog(log)}>
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-0 bg-transparent shadow-none overflow-hidden">
                    <AuditLogDetails log={selectedLog} onClose={() => setSelectedLog(null)} />
                </DialogContent>
            </Dialog>
        </Card>
    );
}
