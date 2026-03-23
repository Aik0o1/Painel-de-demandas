import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Scale, Gavel } from "lucide-react";
import { ProcessDialog } from "./ProcessDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";

export function ProcessList() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: processes = [], isLoading } = useQuery({
        queryKey: ['legal_processes'],
        queryFn: async () => {
            return apiGet('/processes');
        }
    });

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
        mutation.mutate(data);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiDelete(`/processes/${id}`);
            toast.success("Processo excluído");
            queryClient.invalidateQueries({ queryKey: ['legal_processes'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'OPEN': return 'default';
            case 'IN_ANALYSIS': return 'secondary';
            case 'CLOSED': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Processos Jurídicos</h3>
                {can('procuradoria', 'create') && (
                    <Button onClick={() => { setSelectedProcess(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Processo
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº Processo</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Partes</TableHead>
                            <TableHead>Tribunal</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Nenhum processo encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            processes.map((proc: any) => (
                                <TableRow key={proc.id} className="group">
                                    <TableCell className="font-mono">{proc.process_number}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Gavel className="h-4 w-4 text-muted-foreground" />
                                                {proc.title}
                                            </div>
                                            {proc.description && (
                                                <span className="text-xs text-muted-foreground mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                                                    {proc.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{proc.party_name}</TableCell>
                                    <TableCell>{proc.court}</TableCell>
                                    <TableCell className={proc.deadline_date && new Date(proc.deadline_date) < new Date() ? "text-destructive font-bold" : ""}>
                                        {proc.deadline_date ? new Date(proc.deadline_date).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(proc.status) as any}>
                                            {proc.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProcess(proc); setIsDialogOpen(true); }}>
                                            {can('procuradoria', 'update') ? <Edit className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                                        </Button>
                                        {can('procuradoria', 'delete') && (
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(proc.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProcessDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                process={selectedProcess}
                onSave={handleSave}
            />
        </div>
    );
}
