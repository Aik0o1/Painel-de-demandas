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
import { Edit, Trash2, Plus, Box } from "lucide-react";
import { InventoryDialog } from "./InventoryDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";

export function InventoryList() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['inventory_items'],
        queryFn: async () => {
            return apiGet('/inventory');
        }
    });

    const mutation = useMutation({
        mutationFn: async (newItem: any) => {
            const isUpdate = !!newItem.id;
            if (isUpdate) {
                return apiPut(`/inventory/${newItem.id}`, newItem);
            } else {
                return apiPost('/inventory', newItem);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            toast.success("Item salvo com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao salvar item: " + error.message);
        }
    });

    const handleSave = async (data: any) => {
        mutation.mutate(data);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiDelete(`/inventory/${id}`);
            toast.success("Item excluído");
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'GOOD': return 'default';
            case 'DAMAGED': return 'destructive';
            case 'MAINTENANCE': return 'secondary';
            case 'LOST': return 'outline';
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'GOOD': return 'Bom Estado';
            case 'DAMAGED': return 'Danificado';
            case 'MAINTENANCE': return 'Manutenção';
            case 'LOST': return 'Extraviado';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Inventário Patrimonial</h3>
                {can('administrativo', 'create') && (
                    <Button onClick={() => { setSelectedItem(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Item
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Local</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum item cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Box className="h-4 w-4 text-muted-foreground" />
                                        {item.name}
                                    </TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item.status) as any}>
                                            {getStatusLabel(item.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsDialogOpen(true); }}>
                                            {can('administrativo', 'update') ? <Edit className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                                        </Button>
                                        {can('administrativo', 'delete') && (
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

            <InventoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                item={selectedItem}
                onSave={handleSave}
            />
        </div>
    );
}
