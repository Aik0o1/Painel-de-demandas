"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Folder, Search, CheckCircle, AlertCircle, Clock, MoreVertical, Edit, Eye, FileText, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { toast } from "sonner";
import { ProcessDialog } from "@/components/sectors/procuradoria/ProcessDialog";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ProcuradoriaPage() {
    // Clock State
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<any>(null);
    const queryClient = useQueryClient();

    // Data Fetching
    const { data: processes = [], isLoading } = useQuery({
        queryKey: ['legal_processes'],
        queryFn: async () => {
            return apiGet('/processes');
        }
    });

    // Mutations
    const mutation = useMutation({
        mutationFn: async (newItem: any) => {
            const isUpdate = !!newItem.id;
            if (isUpdate) {
                return apiPut(`/processes/${newItem.id}`, newItem);
            } else {
                return apiPost('/processes', newItem);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legal_processes'] });
            toast.success("Processo salvo com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao salvar: " + error.message);
        }
    });

    const handleSave = async (data: any) => {
        await mutation.mutateAsync(data);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este processo?")) return;
        try {
            await apiDelete(`/processes/${id}`);
            toast.success("Processo excluído");
            queryClient.invalidateQueries({ queryKey: ['legal_processes'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    // Helper functions for styling
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return "text-amber-500 bg-amber-500/10 border-amber-500/30";
            case 'IN_ANALYSIS': return "text-[#00f2ff] bg-[#00f2ff]/10 border-[#00f2ff]/30";
            case 'CLOSED': return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
            case 'SUSPENDED': return "text-rose-500 bg-rose-500/10 border-rose-500/30";
            default: return "text-muted-foreground bg-slate-400/10 border-slate-400/30";
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'OPEN': 'Em Aberto',
            'IN_ANALYSIS': 'Em Análise',
            'CHECKING': 'Verificação',
            'CLOSED': 'Concluído',
            'SUSPENDED': 'Suspenso',
            'ARCHIVED': 'Arquivado'
        };
        return labels[status] || status;
    };

    const checkUrgency = (dateString: string) => {
        if (!dateString) return null;
        const today = new Date();
        const target = new Date(dateString);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <div className="text-[10px] text-rose-500 uppercase font-bold">Vencido</div>;
        if (diffDays === 0) return <div className="text-[10px] text-rose-500 uppercase font-bold animate-pulse">Vencendo hoje</div>;
        if (diffDays <= 3) return <div className="text-[10px] text-amber-500 uppercase font-bold">Prazo Crítico ({diffDays}d)</div>;
        return <div className="text-[10px] text-emerald-500 uppercase">Em dia</div>;
    };

    // Stats Calculation
    const stats = {
        total: processes.length,
        inProgress: processes.filter((p: any) => ['OPEN', 'IN_ANALYSIS'].includes(p.status)).length,
        closed: processes.filter((p: any) => p.status === 'CLOSED').length,
        critical: processes.filter((p: any) => {
            if (!p.deadline_date || p.status === 'CLOSED') return false;
            const diff = new Date(p.deadline_date).getTime() - new Date().getTime();
            return diff > 0 && diff < (3 * 24 * 60 * 60 * 1000); // Less than 3 days
        }).length
    };

    // Filtered Data
    const filteredProcesses = processes.filter((p: any) =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.process_number?.includes(searchQuery)
    );



    return (
        <RoleGuard allowedSectorSlugs={['procuradoria']}>
            <DashboardLayout fullWidth={true}>
                <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden p-6 lg:p-6 flex flex-col">
                    {/* Background Effects */}
                    <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSI0OSIgdmlld0JveD0iMCAwIDI4IDQ5Ij48cGF0aCBkPSJNMTMuOTkgOS4yNWwxMyA3LjV2MTVsLTEzIDcuNUwxIDMxLjc1di0xNWwxMi45OS03LjV6TTMgMTcuMzN2MTMuMzRsMTEgNi4zNSAxMS02LjM1VjE3LjMzTDE0IDEwLjk4IDMgMTcuMzN6IiBmaWxsPSIjMDBmMmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')]"></div>                <header className="mb-12 relative">
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            Procuradoria
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                            Gestão de processos jurídicos e pareceres
                        </p>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { label: "Total Processos", value: stats.total, icon: Folder, color: "border-l-[#00f2ff]" },
                            { label: "Em Andamento", value: stats.inProgress, icon: Clock, color: "border-l-amber-500" },
                            { label: "Concluídos", value: stats.closed, icon: CheckCircle, color: "border-l-emerald-500" },
                            { label: "Prazos Críticos", value: stats.critical, icon: AlertCircle, color: "border-l-rose-500" }
                        ].map((stat, i) => (
                            <div key={i} className={`bg-card text-card-foreground border border-border p-4 rounded-xl border-l-4 ${stat.color} relative overflow-hidden group shadow-sm`}>
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <stat.icon className="w-10 h-10" />
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-mono">{stat.label}</div>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters and Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold border-b-2 border-primary pb-1">Processos Jurídicos</h2>
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="relative flex-grow md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                <input
                                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                                    placeholder="Filtrar processos..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => { setSelectedProcess(null); setIsDialogOpen(true); }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Processo
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm border border-border flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border transition-colors hover:bg-muted/50">
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono">Nº Processo</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono">Título / Assunto</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono">Partes Interessadas</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono">Tribunal</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono">Prazo</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono">Status</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground font-mono text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Carregando dados do sistema...</td>
                                        </tr>
                                    ) : filteredProcesses.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Nenhum processo encontrado no banco de dados.</td>
                                        </tr>
                                    ) : (
                                        filteredProcesses.map((proc: any) => (
                                            <tr key={proc.id} className="hover:bg-muted/50 transition-colors group hover:border-l-2 hover:border-l-primary">
                                                <td className="px-6 py-4 font-bold text-primary">{proc.process_number || proc.id?.slice(0, 8)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-foreground">{proc.title}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight truncate max-w-[150px]">{proc.description || 'Sem descrição'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2 items-center">
                                                        <div className="w-7 h-7 rounded-full bg-muted/80 border border-slate-600 flex items-center justify-center text-[10px]">{proc.party_name?.[0] || 'A'}</div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground ml-2">{proc.party_name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{proc.court || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-muted-foreground">{proc.deadline_date ? new Date(proc.deadline_date).toLocaleDateString() : '-'}</div>
                                                    {checkUrgency(proc.deadline_date)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(proc.status)}`}>
                                                        {getStatusLabel(proc.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => { setSelectedProcess(proc); setIsDialogOpen(true); }} className="p-1 hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDelete(proc.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}
                                </tbody>
                            </table>
                        </div>
                    </div>



                    <ProcessDialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        process={selectedProcess}
                        onSave={handleSave}
                    />
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
