"use client";

import { useState, useMemo } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DemandDialog } from "@/components/dashboard/DemandDialog";
import { useDemands, DemandWithProfiles } from "@/hooks/useDemands";
import { useProfiles } from "@/hooks/useProfiles";
import { Skeleton } from "@/components/ui/skeleton";
import { isAfter, isBefore, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Search, SlidersHorizontal, Calendar,
    AlertTriangle, MessageSquare, Paperclip,
    CheckCircle2, Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DemandsPage() {
    const { demands, isLoading, createDemand, updateDemand, deleteDemand } = useDemands();
    const { profiles, isLoading: isLoadingProfiles } = useProfiles();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDemand, setEditingDemand] = useState<DemandWithProfiles | null>(null);
    const [isViewing, setIsViewing] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setAssigneeFilter('all');
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    const filteredDemands = useMemo(() => {
        return demands.filter((demand: DemandWithProfiles) => {
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesTitle = demand.title.toLowerCase().includes(searchLower);
                const matchesDesc = demand.description?.toLowerCase().includes(searchLower);
                if (!matchesTitle && !matchesDesc) return false;
            }
            if (statusFilter !== 'all' && demand.status !== statusFilter) return false;
            if (priorityFilter !== 'all' && demand.priority !== priorityFilter) return false;
            if (assigneeFilter !== 'all' && demand.assigned_to !== assigneeFilter) return false;
            if (demand.due_date) {
                const demandDate = new Date(demand.due_date);
                if (dateFrom && isBefore(demandDate, startOfDay(dateFrom))) return false;
                if (dateTo && isAfter(demandDate, endOfDay(dateTo))) return false;
            }
            return true;
        });
    }, [demands, search, statusFilter, priorityFilter, assigneeFilter, dateFrom, dateTo]);

    const handleEdit = (demand: DemandWithProfiles) => {
        setEditingDemand(demand);
        setIsViewing(false);
        setDialogOpen(true);
    };

    const handleView = (demand: DemandWithProfiles) => {
        setEditingDemand(demand);
        setIsViewing(true);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta demanda?')) {
            await deleteDemand.mutateAsync(id);
        }
    };

    const handleStatusChange = async (demandId: string, status: string) => {
        await updateDemand.mutateAsync({ id: demandId, status: status as any });
    };

    const handleSubmit = async (data: any) => {
        if (editingDemand) {
            await updateDemand.mutateAsync({ id: editingDemand.id, ...data });
        } else {
            await createDemand.mutateAsync(data);
        }
        setDialogOpen(false);
        setEditingDemand(null);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            Demandas
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                            Gerencie e acompanhe todas as solicitações.
                        </p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative group flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-gray-800 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                placeholder="Buscar demandas, IDs ou tags..."
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingDemand(null);
                                setIsViewing(false);
                                setDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nova Demanda
                        </Button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar md:no-scrollbar">
                        {[
                            { label: 'Todos', value: 'all' },
                            { label: 'Em Andamento', value: 'in_progress' },
                            { label: 'Pendentes', value: 'pending' },
                            { label: 'Concluídas', value: 'completed' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${statusFilter === filter.value
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                    : 'bg-white dark:bg-[#161E2E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-blue-500'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                    </div>
                ) : filteredDemands.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-80">
                        <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 bg-blue-500 opacity-20 blur-xl rounded-full animate-pulse"></div>
                            <CheckCircle2 className="relative w-full h-full text-blue-500 p-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-2">Tudo Limpo!</h3>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground max-w-xs mx-auto">
                            Não há demandas correspondentes aos filtros.
                        </p>
                        <Button
                            onClick={() => {
                                setEditingDemand(null);
                                setIsViewing(false);
                                setDialogOpen(true);
                            }}
                            className="mt-6 bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        >
                            Nova Demanda
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredDemands.map((demand: DemandWithProfiles) => (
                            <div
                                key={demand.id}
                                onClick={() => handleView(demand)}
                                className="relative group bg-card p-5 rounded-2xl border border-border overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                            >
                                {/* Animated Gradient Border/Glow on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                {/* Side Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${demand.status === 'in_progress' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' :
                                    demand.priority === 'critical' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' :
                                        demand.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-500'
                                    }`}></div>

                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono tracking-wider">
                                            #{demand.id.slice(-6).toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(demand.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${demand.status === 'in_progress'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                        : demand.priority === 'critical'
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                                            : demand.status === 'completed'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {demand.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                                        {demand.priority === 'critical' && <AlertTriangle className="w-3 h-3" />}
                                        {demand.status === 'completed' ? 'Concluída' :
                                            demand.status === 'in_progress' ? 'Em Andamento' :
                                                demand.status === 'pending' ? 'Pendente' : demand.status}
                                    </div>
                                </div>

                                <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-foreground line-clamp-1 pl-2 group-hover:text-blue-400 transition-colors">
                                    {demand.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4 line-clamp-2 pl-2 font-light leading-relaxed">
                                    {demand.description}
                                </p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 pl-2">
                                    <div className="flex -space-x-2">
                                        {[demand.creator, demand.assignee].filter(Boolean).map((p: any, i) => (
                                            <Avatar key={i} className="w-7 h-7 border-2 border-[#1e293b] ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all">
                                                <AvatarImage src={p.image} />
                                                <AvatarFallback className="bg-muted text-xs text-white">{p.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground group-hover:text-blue-400 transition-colors">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>0</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground group-hover:text-purple-400 transition-colors">
                                            <Paperclip className="w-3.5 h-3.5" />
                                            <span>0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Dialogs */}
                <DemandDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    demand={editingDemand}
                    profiles={profiles}
                    onSubmit={handleSubmit}
                    isLoading={updateDemand.isPending || createDemand.isPending}
                    isLoadingProfiles={isLoadingProfiles}
                    readOnly={isViewing}
                />
            </div>
        </DashboardLayout>
    );
}
