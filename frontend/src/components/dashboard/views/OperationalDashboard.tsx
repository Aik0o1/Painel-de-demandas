'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
    Activity, CheckCircle2, Clock, AlertTriangle,
    Search, X, ListFilter, LayoutGrid, AlertCircle, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────
//  Tipos
// ────────────────────────────────────────────────────────
interface UnifiedItem {
    id: string;
    source: 'demands' | 'tickets' | 'processes' | 'projects' | 'finance' | 'registry';
    sector: string;
    sector_label: string;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    status_raw: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    priority_raw: string;
    due_date: string | null;
    created_at: string | null;
    updated_at: string | null;
    completed_at: string | null;
    assigned_users: { id: string; name: string }[];
    created_by: string | null;
    extra: Record<string, any>;
}

interface DashboardMetrics {
    counts: {
        total: number;
        completed: number;
        in_progress: number;
        pending: number;
        overdue: number;
        completion_rate: number;
        by_sector: Record<string, { total: number; completed: number }>;
    };
    trend: { date: string; total: number; completed: number }[];
}

// ────────────────────────────────────────────────────────
//  Fetch helpers
// ────────────────────────────────────────────────────────
async function fetchAllItems(): Promise<UnifiedItem[]> {
    const res = await fetch('/api/dashboard/all-items');
    if (!res.ok) throw new Error('Erro ao buscar itens');
    return res.json();
}

async function fetchMetrics(): Promise<DashboardMetrics> {
    const res = await fetch('/api/dashboard/metrics');
    if (!res.ok) throw new Error('Erro ao buscar métricas');
    return res.json();
}

// ────────────────────────────────────────────────────────
//  Constantes
// ────────────────────────────────────────────────────────
const SECTORS = [
    { key: 'all', label: 'Todos os Setores' },
    { key: 'geral', label: 'Geral' },
    { key: 'ti', label: 'TI' },
    { key: 'procuradoria', label: 'Procuradoria' },
    { key: 'comunicacao', label: 'Comunicação' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'registro', label: 'Registro' },
];

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
};

const SOURCE_LABELS: Record<string, string> = {
    demands: 'Demandas',
    tickets: 'TI',
    processes: 'Procuradoria',
    projects: 'Comunicação',
    finance: 'Financeiro',
    registry: 'Registro',
};

// ────────────────────────────────────────────────────────
//  Badges
// ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', map[status] || map.pending)}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const map: Record<string, string> = {
        low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', map[priority] || map.medium)}>
            {PRIORITY_LABELS[priority] || priority}
        </span>
    );
}

function SectorBadge({ sector, label }: { sector: string; label: string }) {
    const map: Record<string, string> = {
        geral: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        ti: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
        procuradoria: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        comunicacao: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
        financeiro: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        registro: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', map[sector] || 'bg-gray-100 text-gray-700')}>
            {label}
        </span>
    );
}

// ────────────────────────────────────────────────────────
//  Componente principal
// ────────────────────────────────────────────────────────
export function OperationalDashboard() {
    const { data: items = [], isLoading: isLoadingItems } = useQuery({
        queryKey: ['dashboard-all-items'],
        queryFn: fetchAllItems,
        refetchInterval: 30_000,
    });

    const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: fetchMetrics,
        refetchInterval: 60_000,
    });

    const metrics = metricsData?.counts;

    // Filtros
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sectorFilter, setSectorFilter] = useState('all');

    const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || sectorFilter !== 'all';

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setSectorFilter('all');
    };

    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (search) {
                const q = search.toLowerCase();
                if (!item.title?.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) return false;
            }
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
            if (sectorFilter !== 'all' && item.sector !== sectorFilter) return false;
            return true;
        });
    }, [items, search, statusFilter, priorityFilter, sectorFilter]);

    const isOverdue = (due: string | null, status: string) => {
        if (!due || status === 'completed') return false;
        return new Date(due) < new Date();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Painel Centralizado</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Visão unificada de todas as demandas, tickets, processos e projetos da JUCEPI.
                </p>
            </div>

            {/* Cards de Métricas */}
            {isLoadingMetrics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
            ) : metrics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total de Itens"
                        value={metrics.total}
                        subtitle="Todos os setores"
                        icon={<Activity className="h-5 w-5" />}
                        variant="primary"
                    />
                    <MetricCard
                        title="Taxa de Conclusão"
                        value={`${metrics.completion_rate}%`}
                        subtitle={`${metrics.completed} concluídos`}
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        variant="success"
                    />
                    <MetricCard
                        title="Em Andamento"
                        value={metrics.in_progress}
                        subtitle="Itens ativos"
                        icon={<Clock className="h-5 w-5" />}
                        variant="default"
                    />
                    <MetricCard
                        title="Pendentes / Atrasados"
                        value={`${metrics.pending} / ${metrics.overdue}`}
                        subtitle="Precisam de atenção"
                        icon={<AlertTriangle className="h-5 w-5" />}
                        variant={metrics.overdue > 0 ? 'danger' : 'warning'}
                    />
                </div>
            ) : null}

            {/* Breakdown por setor */}
            {metrics?.by_sector && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.entries(metrics.by_sector).map(([key, v]) => (
                        <button
                            key={key}
                            onClick={() => setSectorFilter(sectorFilter === key ? 'all' : key)}
                            className={cn(
                                'rounded-lg border p-2 text-left transition-all hover:shadow-sm',
                                sectorFilter === key ? 'border-primary bg-primary/5' : 'bg-card'
                            )}
                        >
                            <SectorBadge sector={key} label={SECTORS.find(s => s.key === key)?.label || key} />
                            <p className="mt-1 text-lg font-bold">{v.total}</p>
                            <p className="text-[10px] text-muted-foreground">{v.completed} concl.</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Filtros */}
            <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ListFilter className="w-4 h-4" />
                        Filtros
                        {hasFilters && <Badge variant="secondary" className="ml-1 text-xs">Ativos</Badge>}
                    </div>
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs">
                            <X className="h-3 w-3" /> Limpar filtros
                        </Button>
                    )}
                </div>
                <div className="flex flex-col md:flex-row flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título ou descrição..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={sectorFilter} onValueChange={setSectorFilter}>
                        <SelectTrigger className="w-full md:w-[185px]">
                            <SelectValue placeholder="Setor" />
                        </SelectTrigger>
                        <SelectContent>
                            {SECTORS.map((s) => (
                                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[175px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em Progresso</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-full md:w-[190px]">
                            <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Prioridades</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Contador */}
            <div className="flex items-center px-1">
                <p className="text-sm text-muted-foreground">
                    Exibindo <span className="font-semibold text-foreground">{filtered.length}</span> de{' '}
                    <span className="font-semibold text-foreground">{items.length}</span> itens
                </p>
            </div>

            {/* Tabela */}
            {isLoadingItems ? (
                <Skeleton className="h-96 rounded-xl" />
            ) : filtered.length === 0 ? (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
                    <p className="text-muted-foreground">Tente ajustar os filtros acima</p>
                </div>
            ) : (
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="w-[280px]">Título</TableHead>
                                    <TableHead>Setor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Prioridade</TableHead>
                                    <TableHead>Responsáveis</TableHead>
                                    <TableHead>Prazo</TableHead>
                                    <TableHead>Criado em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((item) => {
                                    const overdue = isOverdue(item.due_date, item.status);
                                    return (
                                        <TableRow key={`${item.source}-${item.id}`} className="border-border/50">
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <p className="font-medium leading-tight">{item.title}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    {item.extra?.process_number && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Nº {item.extra.process_number}
                                                        </p>
                                                    )}
                                                    {item.extra?.category && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.extra.category}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <SectorBadge sector={item.sector} label={item.sector_label} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={item.status} />
                                            </TableCell>
                                            <TableCell>
                                                <PriorityBadge priority={item.priority} />
                                            </TableCell>
                                            <TableCell>
                                                {item.assigned_users.length > 0 ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {item.assigned_users.slice(0, 2).map((u) => (
                                                            <span key={u.id} className="text-xs text-muted-foreground">
                                                                {u.name}
                                                            </span>
                                                        ))}
                                                        {item.assigned_users.length > 2 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                +{item.assigned_users.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : item.created_by ? (
                                                    <span className="text-xs text-muted-foreground">{item.created_by}</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.due_date ? (
                                                    <span className={cn('text-sm', overdue && 'text-destructive font-medium')}>
                                                        {format(new Date(item.due_date), 'dd/MM/yy', { locale: ptBR })}
                                                        {overdue && ' ⚠'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50 italic">Sem prazo</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.created_at ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(new Date(item.created_at), 'dd/MM/yy', { locale: ptBR })}
                                                    </span>
                                                ) : '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
