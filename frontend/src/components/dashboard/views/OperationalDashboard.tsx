import { useMemo, useState } from 'react';
import { DemandTable } from '@/components/dashboard/DemandTable';
import { DemandFilters } from '@/components/dashboard/DemandFilters';
import { DemandDialog } from '@/components/dashboard/DemandDialog';
import { useDemands, DemandWithProfiles } from '@/hooks/useDemands';
import { useProfiles } from '@/hooks/useProfiles';
import { Skeleton } from '@/components/ui/skeleton';
import { isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export function OperationalDashboard() {
    const { demands, isLoading, updateDemand, deleteDemand } = useDemands();
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
        return demands.filter((demand: any) => {
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesTitle = demand.title.toLowerCase().includes(searchLower);
                const matchesDesc = demand.description?.toLowerCase().includes(searchLower);
                if (!matchesTitle && !matchesDesc) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && demand.status !== statusFilter) return false;

            // Priority filter
            if (priorityFilter !== 'all' && demand.priority !== priorityFilter) return false;

            // Assignee filter
            if (assigneeFilter !== 'all' && demand.assigned_to !== assigneeFilter) return false;

            // Date Range filter
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
        if (!editingDemand) return;
        await updateDemand.mutateAsync({ id: editingDemand.id, ...data });
        setDialogOpen(false);
        setEditingDemand(null);
    };

    return (
        <div className="space-y-6">
            <DemandFilters
                search={search}
                onSearchChange={setSearch}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                priority={priorityFilter}
                onPriorityChange={setPriorityFilter}
                assignee={assigneeFilter}
                onAssigneeChange={setAssigneeFilter}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                profiles={profiles}
                onClearFilters={clearFilters}
            />

            {/* Table */}
            {isLoading ? (
                <Skeleton className="h-96 rounded-xl" />
            ) : (
                <div className="rounded-md border bg-card">
                    <DemandTable
                        demands={filteredDemands}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onView={handleView}
                    />
                </div>
            )}

            <DemandDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                demand={editingDemand}
                profiles={profiles}
                onSubmit={handleSubmit}
                isLoading={updateDemand.isPending}
                isLoadingProfiles={isLoadingProfiles}
                readOnly={isViewing}
            />
        </div>
    );
}
