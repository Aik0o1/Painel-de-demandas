"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    Server,
    Code,
    LifeBuoy,
    Wrench,
    X,
    Loader2,
    ClipboardCheck,
    User as UserIcon,
    Calendar,
    Edit2,
    History
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { FuturisticModal, FuturisticInput, FuturisticSelect, FuturisticTextarea, FuturisticButton } from "@/components/ui/futuristic-modal";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { apiGet, apiPost, apiPatch } from "@/services/api";
import AssigneeDialog from "@/components/sectors/ti/AssigneeDialog";

const formatDuration = (ms: number) => {
    if (!ms) return "0h 0m";
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

const TicketItem = ({ ticket, onAction }: { ticket: any, onAction: (id: string, action: string, reason?: string) => void }) => {
    return (
        <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                    ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                    {ticket.sub_sector === 'infrastructure' ? <Server className="w-5 h-5" /> :
                        ticket.sub_sector === 'development' ? <Code className="w-5 h-5" /> :
                            ticket.sub_sector === 'integration' ? <Wrench className="w-5 h-5" /> :
                                <LifeBuoy className="w-5 h-5" />}
                </div>
                <div>
                    <h4 className="font-semibold">{ticket.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                        <span className="text-xs text-muted-foreground">Solicitado por: {ticket.requester_name}</span>
                        {ticket.accumulated_time_ms > 0 && (
                            <Badge variant="secondary" className="text-xs ml-2">
                                Tempo: {formatDuration(ticket.accumulated_time_ms + (ticket.last_started_at ? (new Date().getTime() - new Date(ticket.last_started_at).getTime()) : 0))}
                            </Badge>
                        )}
                    </div>
                    {ticket.status === 'PAUSED' && ticket.pause_reason && (
                        <p className="text-xs text-amber-600 mt-1">⏸ Motivo da pausa: {ticket.pause_reason}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge className={`${ticket.status === 'OPEN' ? 'bg-green-500' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-600' :
                        ticket.status === 'PAUSED' ? 'bg-amber-500' : 'bg-gray-500'
                    }`}>
                    {ticket.status === 'OPEN' ? 'Aberto' :
                        ticket.status === 'IN_PROGRESS' ? 'Em Andamento' :
                            ticket.status === 'PAUSED' ? 'Pausado' : 'Concluído'}
                </Badge>

                {/* Action Buttons */}
                {ticket.status !== 'RESOLVED' && (
                    <div className="flex gap-2">
                        {(ticket.status === 'OPEN' || ticket.status === 'PAUSED') && (
                            <Button size="sm" onClick={() => onAction(ticket.id, 'IN_PROGRESS')}>
                                {ticket.status === 'PAUSED' ? 'Retomar' : 'Iniciar'}
                            </Button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                            <>
                                <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onAction(ticket.id, 'PAUSED')}>
                                    Pausar
                                </Button>
                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => onAction(ticket.id, 'RESOLVED')}>
                                    Concluir
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TicketList = ({ tickets, onAction }: { tickets: any[], onAction: any }) => {
    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Nenhuma demanda encontrada neste setor.</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {tickets.map((ticket) => (
                <TicketItem key={ticket.id} ticket={ticket} onAction={onAction} />
            ))}
        </div>
    );
};

export default function TiPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Categories Map
    const categoriesBySubSector: Record<string, string[]> = {
        support: ["Hardware", "Software", "Periféricos", "Acesso/Login", "Impressoras", "Outros"],
        infrastructure: ["Servidores", "Rede/Wifi", "Cabeamento", "VPN", "Segurança", "Backup"],
        integration: ["API", "Banco de Dados", "ERP", "Integração de Sistemas", "Webhooks"],
        development: ["Nova Funcionalidade", "Bug Fix", "Relatório", "Melhoria de Performance", "Refatoração"]
    };

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "Hardware",
        sub_sector: "support"
    });

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['tickets'],
        queryFn: async () => {
            return apiGet('/tickets');
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newTicket: any) => {
            return apiPost('/tickets', newTicket);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            setIsDialogOpen(false);
            toast.success("Demanda registrada com sucesso!");
            setFormData({ title: "", description: "", priority: "MEDIUM", category: "Hardware", sub_sector: "support" });
        },
        onError: () => toast.error("Erro ao registrar demanda.")
    });

    const assignMutation = useMutation({
        mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
            return apiPatch(`/tickets/${id}`, { assigned_to_id: userId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            setIsEditDialogOpen(false);
            setSelectedTicket(null);
            toast.success("Responsável atribuído com sucesso!");
        },
        onError: () => toast.error("Erro ao atribuir responsável.")
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    // Pause Dialog State
    const [pauseTicketId, setPauseTicketId] = useState<string | null>(null);
    const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
    const [pauseReason, setPauseReason] = useState("");

    // Status Mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
            return apiPatch(`/tickets/${id}`, { status, pause_reason: reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success("Status atualizado!");
            setIsPauseDialogOpen(false);
            setPauseReason("");
            setPauseTicketId(null);
        },
        onError: () => toast.error("Erro ao atualizar status.")
    });

    const handleAction = (id: string, action: string) => {
        if (action === 'PAUSED') {
            setPauseTicketId(id);
            setIsPauseDialogOpen(true);
        } else {
            statusMutation.mutate({ id, status: action });
        }
    };

    const confirmPause = () => {
        if (pauseTicketId && pauseReason.trim()) {
            statusMutation.mutate({ id: pauseTicketId, status: 'PAUSED', reason: pauseReason });
        } else {
            toast.warning("Por favor, informe o motivo da pausa.");
        }
    };

    // Active Tab State
    const [activeTab, setActiveTab] = useState("support");
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Filter tickets based on active tab
    const filteredTickets = tickets.filter((t: any) => t.sub_sector === activeTab);

    return (
        <RoleGuard allowedSectorSlugs={['ti']}>
            <DashboardLayout fullWidth>
                <div className="h-full text-foreground font-sans flex flex-col relative overflow-hidden">
                    {/* Ambient Background Glow */}
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px]  rounded-full blur-[120px] pointer-events-none z-0"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none z-0"></div>

                    <div className="relative z-10 flex flex-col h-full overflow-hidden">
                        {/* Header Section */}
                        <header className="px-5 pt-6 flex flex-col gap-4">
                            {/* Top Action Row */}
                            
                            {/* Title */}
                            <div className="flex flex-col gap-1">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Tecnologia da Informação
                                </h1>
                            </div>
                        </header>

                        {/* Navigation Tabs */}
                        <nav className="relative z-10 mt-6 border-b border-border w-full">
                            <div className="flex px-5 gap-8 overflow-x-auto no-scrollbar pb-0">
                                {[
                                    { id: 'support', label: 'Suporte' },
                                    { id: 'infrastructure', label: 'Infraestrutura' },
                                    { id: 'integration', label: 'Integração' },
                                    { id: 'development', label: 'Desenvolvimento' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className="flex flex-col items-center justify-center pb-3 min-w-[max-content] group relative outline-none"
                                    >
                                        <p className={`text-sm font-bold tracking-wide transition-colors ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                            {tab.label}
                                        </p>
                                        <div className={`absolute bottom-0 w-full h-[3px] rounded-t-full transition-colors ${activeTab === tab.id ? 'bg-primary shadow-glow' : 'bg-transparent group-hover:bg-border'}`}></div>
                                    </button>
                                ))}
                            </div>
                        </nav>

                        {/* Main Content */}
                        <main className="relative z-10 flex flex-col px-5 pt-8 gap-6 flex-1 overflow-y-auto no-scrollbar pb-6">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 rounded-full bg-[#137fec] shadow-[0_0_15px_rgba(19,127,236,0.25)]"></div>
                                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                                        {activeTab === 'support' ? 'Fila de Suporte' :
                                            activeTab === 'infrastructure' ? 'Infraestrutura' :
                                                activeTab === 'integration' ? 'Integração' : 'Desenvolvimento'}
                                    </h2>
                                </div>

                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nova Demanda
                                        </Button>
                                    </DialogTrigger>
                                    <FuturisticModal title="Registrar Nova Demanda">
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="space-y-2 group">
                                                <Label htmlFor="titulo" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">
                                                    Título
                                                </Label>
                                                <FuturisticInput
                                                    id="titulo"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    required
                                                    placeholder="Ex: Instalação de Impressora"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2 group">
                                                    <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">
                                                        Sub-Setor
                                                    </Label>
                                                    <FuturisticSelect
                                                        value={formData.sub_sector}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const defaultCat = categoriesBySubSector[val]?.[0] || "";
                                                            setFormData({ ...formData, sub_sector: val, category: defaultCat })
                                                        }}
                                                    >
                                                        <option value="support">Suporte</option>
                                                        <option value="infrastructure">Infraestrutura</option>
                                                        <option value="integration">Integração</option>
                                                        <option value="development">Desenvolvimento</option>
                                                    </FuturisticSelect>
                                                </div>
                                                <div className="space-y-2 group">
                                                    <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">
                                                        Prioridade
                                                    </Label>
                                                    <FuturisticSelect
                                                        value={formData.priority}
                                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                        className={
                                                            formData.priority === 'HIGH' ? 'text-orange-500' :
                                                                formData.priority === 'CRITICAL' ? 'text-red-500' :
                                                                    formData.priority === 'LOW' ? 'text-green-500' : 'text-yellow-500'
                                                        }
                                                    >
                                                        <option value="LOW" className="text-green-500">Baixa</option>
                                                        <option value="MEDIUM" className="text-yellow-500">Média</option>
                                                        <option value="HIGH" className="text-orange-500">Alta</option>
                                                        <option value="CRITICAL" className="text-red-500">Crítica</option>
                                                    </FuturisticSelect>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">
                                                    Categoria
                                                </Label>
                                                <FuturisticSelect
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                >
                                                    {categoriesBySubSector[formData.sub_sector]?.map((cat) => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </FuturisticSelect>
                                            </div>
                                            <div className="space-y-2 group">
                                                <Label htmlFor="descricao" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">
                                                    Descrição
                                                </Label>
                                                <FuturisticTextarea
                                                    id="descricao"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    rows={4}
                                                />
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <FuturisticButton type="submit" isLoading={createMutation.isPending}>
                                                    Registrar
                                                </FuturisticButton>
                                            </div>
                                        </form>
                                    </FuturisticModal>
                                </Dialog>
                            </div>

                            {/* Loading State */}
                            {isLoading && (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 dark:text-muted-foreground">Carregando demandas...</p>
                                </div>
                            )}

                            {/* Content */}
                            {!isLoading && filteredTickets.length === 0 ? (
                                // Empty State Card (Glassmorphism)
                                <div className="w-full rounded-2xl p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden group/card shadow-lg border border-border backdrop-blur-xl bg-card">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                                    <div className="relative w-24 h-24 flex items-center justify-center text-primary">
                                        <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                                        <div className="absolute inset-4 border border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                                        <ClipboardCheck className="w-10 h-10 animate-pulse" />
                                    </div>
                                    <div className="text-center relative z-10 space-y-2">
                                        <p className="text-foreground text-lg font-bold leading-tight tracking-tight">Nenhuma demanda encontrada</p>
                                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">Você está em dia com todas as solicitações. O sistema está operando com 100% de eficiência.</p>
                                    </div>
                                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['tickets'] })} className="relative z-10 mt-2 flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-8 bg-card hover:bg-muted border border-border text-primary text-sm font-bold tracking-wide transition-all hover:scale-105 active:scale-95">
                                        <span className="truncate">Atualizar Status</span>
                                    </button>
                                </div>
                            ) : (
                                // Ticket List (Clean Cards)
                                <div className="space-y-4">
                                    {filteredTickets.map((ticket: any) => (
                                        <div key={ticket.id} className="relative bg-card rounded-xl p-5 border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 justify-between">
                                            <div className="flex gap-4 items-start w-full sm:w-auto">
                                                {/* Priority/Sector Icon */}
                                                <div className={`flex-shrink-0 p-3 rounded-xl border ${ticket.priority === 'CRITICAL' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                    ticket.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                                        ticket.priority === 'MEDIUM' ? 'bg-primary/10 text-primary border-primary/20' :
                                                            'bg-success/10 text-success border-success/20'
                                                    }`}>
                                                    {ticket.sub_sector === 'infrastructure' ? <Server className="w-5 h-5" /> :
                                                        ticket.sub_sector === 'development' ? <Code className="w-5 h-5" /> :
                                                            ticket.sub_sector === 'integration' ? <Wrench className="w-5 h-5" /> :
                                                                <LifeBuoy className="w-5 h-5" />}
                                                </div>

                                                {/* Content */}
                                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-foreground font-semibold text-base leading-tight truncate">{ticket.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ticket.status === 'OPEN' ? 'bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400' :
                                                            ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-[#137fec]/10 border-blue-200 dark:border-[#137fec]/20 text-blue-700 dark:text-[#137fec]' :
                                                                ticket.status === 'PAUSED' ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' :
                                                                    'bg-gray-100 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20 text-gray-700 dark:text-muted-foreground'
                                                            }`}>
                                                            {ticket.status === 'OPEN' ? 'ABERTO' :
                                                                ticket.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' :
                                                                    ticket.status === 'PAUSED' ? 'PAUSADO' : 'CONCLUÍDO'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                                        {ticket.description || 'Nenhuma descrição fornecida para esta demanda.'}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                                        <Badge variant="secondary" className="font-normal bg-secondary/50 text-secondary-foreground">{ticket.category}</Badge>
                                                        <span className="flex items-center">
                                                            <span className="font-medium mr-1 text-foreground/80">Solicitante:</span> {ticket.requester_name}
                                                        </span>
                                                        {ticket.assigned_to && (
                                                            <span className="flex items-center text-primary font-medium">
                                                                <UserIcon className="w-3 h-3 mr-1" />
                                                                {ticket.assigned_to.name}
                                                            </span>
                                                        )}
                                                        {ticket.accumulated_time_ms > 0 && (
                                                            <span className="text-primary font-medium flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                                                ⏱ {formatDuration(ticket.accumulated_time_ms + (ticket.last_started_at ? (new Date().getTime() - new Date(ticket.last_started_at).getTime()) : 0))}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-[10px] text-muted-foreground hover:bg-muted/50 hover:text-primary px-2 transition-all duration-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTicket(ticket);
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <UserIcon className="w-3 h-3 mr-1" />
                                                            Atribuir Responsável
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            

                                            {/* Actions Footer */}
                                            {ticket.status !== 'RESOLVED' && (
                                                <div className="mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-border sm:border-t-0 flex sm:flex-col justify-end sm:justify-center items-end sm:items-center gap-2 shrink-0">
                                                    {(ticket.status === 'OPEN' || ticket.status === 'PAUSED') && (
                                                        <Button size="sm" onClick={() => handleAction(ticket.id, 'IN_PROGRESS')} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4">
                                                            {ticket.status === 'PAUSED' ? 'Retomar' : 'Iniciar'}
                                                        </Button>
                                                    )}
                                                    {ticket.status === 'IN_PROGRESS' && (
                                                        <div className="flex sm:flex-col gap-2 w-full">
                                                            <Button size="sm" variant="outline" className="w-full sm:w-auto text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-400/10 dark:border-amber-500/30" onClick={() => handleAction(ticket.id, 'PAUSED')}>
                                                                Pausar
                                                            </Button>
                                                            <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => handleAction(ticket.id, 'RESOLVED')}>
                                                                Concluir
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </main>

                        {/* Pause Dialog Reuse */}
                        <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
                            <DialogContent className="bg-background border-border text-foreground">
                                <DialogHeader>
                                    <DialogTitle>Pausar Demanda</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <p className="text-sm text-slate-500 dark:text-muted-foreground">Por favor, informe o motivo desta pausa para o registro de atividades.</p>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-gray-300">Motivo da Pausa</Label>
                                        <Textarea
                                            value={pauseReason}
                                            onChange={(e) => setPauseReason(e.target.value)}
                                            placeholder="Ex: Aguardando compra de peça, aguardando resposta do fornecedor..."
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsPauseDialogOpen(false)} className="text-slate-500 hover:text-foreground dark:text-muted-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">Cancelar</Button>
                                    <Button onClick={confirmPause} disabled={!pauseReason.trim() || statusMutation.isPending} className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white">
                                        Confirmar Pausa
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <AssigneeDialog
                            isOpen={isEditDialogOpen}
                            onClose={() => {
                                setIsEditDialogOpen(false);
                                setSelectedTicket(null);
                            }}
                            ticket={selectedTicket}
                            onAssign={async (userId) => {
                                if (selectedTicket) {
                                    await assignMutation.mutateAsync({ id: selectedTicket.id, userId });
                                }
                            }}
                        />
                    </div>
                </div>
                
                
            </DashboardLayout>
        </RoleGuard>
    );
}
