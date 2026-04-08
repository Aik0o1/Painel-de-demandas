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
import { Edit, Trash2, Plus, FileText, Download } from "lucide-react";
import { ContractDialog } from "./ContractDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";

export function ContractsList() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: async () => {
            return apiGet('/contracts');
        }
    });

    const mutation = useMutation({
        mutationFn: async ({ payload, file }: { payload: any, file?: File }) => {
            const isUpdate = !!payload.id;
            let result;
            if (isUpdate) {
                result = await apiPut(`/contracts/${payload.id}`, payload);
            } else {
                result = await apiPost('/contracts', payload);
            }

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                await apiPost(`/contracts/${result.id || payload.id}/attachment`, formData);
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success("Contrato salvo com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao salvar contrato: " + error.message);
        }
    });

    const handleSave = async (payload: any, file?: File) => {
        mutation.mutate({ payload, file });
    };

    const handleDelete = async (id: string) => {
        try {
            await apiDelete(`/contracts/${id}`);
            toast.success("Contrato excluído");
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Contratos Ativos</h3>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        const headers = ["Título", "Fornecedor", "Valor", "Status"];
                        const csvContent = [
                            headers.join(","),
                            ...contracts.map((c: any) => [c.title, c.supplier, c.value, c.status].join(","))
                        ].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "contratos.csv";
                        link.click();
                    }}>
                        <FileText className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                    {can('financeira', 'create') && (
                        <Button onClick={() => { setSelectedContract(null); setIsDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Contrato
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contracts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum contrato encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contracts.map((contract: any) => (
                                <TableRow key={contract.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {contract.title}
                                    </TableCell>
                                    <TableCell>{contract.supplier}</TableCell>
                                    <TableCell>R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={contract.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {contract.status === 'ACTIVE' ? 'Ativo' : contract.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {contract.attachment_url && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(contract.attachment_url, '_blank')}
                                                    title="Ver Anexo"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    PDF
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedContract(contract);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                {can('financeira', 'update') ? (
                                                    <Edit className="h-4 w-4" />
                                                ) : (
                                                    <FileText className="h-4 w-4" />
                                                )}
                                            </Button>

                                            {can('financeira', 'delete') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(contract.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ContractDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                contract={selectedContract}
                onSave={handleSave}
            />
        </div>
    );
}
