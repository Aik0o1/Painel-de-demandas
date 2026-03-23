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
import { Edit, Trash2, Plus, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { RegistryDialog } from "./RegistryDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";

export function RegistryList() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['registry_items'],
        queryFn: async () => {
            return apiGet('/registry');
        }
    });

    const mutation = useMutation({
        mutationFn: async (newItem: any) => {
            const isUpdate = !!newItem.id;
            if (isUpdate) {
                return apiPut(`/registry/${newItem.id}`, newItem);
            } else {
                return apiPost('/registry', newItem);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registry_items'] });
            toast.success("Protocolo salvo com sucesso!");
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
            await apiDelete(`/registry/${id}`);
            toast.success("Protocolo excluído");
            queryClient.invalidateQueries({ queryKey: ['registry_items'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'REJECTED': return <AlertCircle className="h-4 w-4 text-destructive" />;
            case 'ANALYZING': return <Clock className="h-4 w-4 text-blue-500" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'ANALYZING': return 'Em Análise';
            case 'COMPLETED': return 'Concluído';
            case 'REJECTED': return 'Devolvido';
            default: return status;
        }
    };

    const getDocumentTypeLabel = (type: string) => {
        switch (type) {
            case 'DEED': return 'Escritura';
            case 'CERTIFICATION': return 'Certidão';
            case 'REGISTRATION': return 'Registro Imobiliário';
            case 'OTHER': return 'Outros';
            default: return type;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Fila de Protocolos</h3>
                {can('registro', 'create') && (
                    <Button onClick={() => { setSelectedItem(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Entrada
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Protocolo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Interessado</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Nenhum protocolo encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item: any) => (
                                <TableRow key={item.id} className="group">
                                    <TableCell className="font-mono font-bold">{item.protocol_number}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{getDocumentTypeLabel(item.document_type)}</span>
                                            {item.notes && (
                                                <span className="text-xs text-muted-foreground mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                                                    {item.notes}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.party_name}</TableCell>
                                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell className={item.deadline_date && new Date(item.deadline_date) < new Date() ? "text-destructive font-bold" : ""}>
                                        {item.deadline_date ? new Date(item.deadline_date).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(item.status)}
                                            <span>{getStatusLabel(item.status)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsDialogOpen(true); }}>
                                            {can('registro', 'update') ? <Edit className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                        </Button>
                                        {can('registro', 'delete') && (
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
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

            <RegistryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                item={selectedItem}
                onSave={handleSave}
            />
        </div>
    );
}
