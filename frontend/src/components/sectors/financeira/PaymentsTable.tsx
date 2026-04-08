import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

import { apiGet } from '@/services/api';
import { usePermissions } from "@/hooks/usePermissions";

import { useState } from "react";
import { PaymentDialog } from "./PaymentDialog";
import { Plus, Pencil, FileText as FileIcon } from "lucide-react";

export function PaymentsTable() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'emitido' | 'não_emitido'>('all');
    const pageSize = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['payments', page, statusFilter],
        queryFn: async () => {
            let url = `/finance/payments?page=${page}&limit=${pageSize}`;
            if (statusFilter !== 'all') {
                url += `&status=${statusFilter}`;
            }
            return apiGet(url);
        },
        placeholderData: (previousData) => previousData
    });

    const payments = data?.data || [];
    const meta = data?.meta || { totalPages: 1, page: 1, total: 0 };

    const handleCreate = () => {
        setSelectedPayment(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (payment: any) => {
        setSelectedPayment(payment);
        setIsDialogOpen(true);
    };

    if (isLoading) {
        return <Skeleton className="h-[200px] w-full rounded-lg" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-none">Contas Pagas</h3>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={statusFilter === 'all' ? 'default' : 'outline'} 
                        onClick={() => setStatusFilter('all')}
                        size="sm"
                    >
                        Todos
                    </Button>
                    <Button 
                        variant={statusFilter === 'emitido' ? 'default' : 'outline'} 
                        onClick={() => setStatusFilter('emitido')}
                        size="sm"
                    >
                        Emitido
                    </Button>
                    <Button 
                        variant={statusFilter === 'não_emitido' ? 'default' : 'outline'} 
                        onClick={() => setStatusFilter('não_emitido')}
                        size="sm"
                    >
                        Não Emitido
                    </Button>
                    {can('financeira', 'create') && (
                        <Button onClick={handleCreate} className="bg-neon-cyan hover:bg-neon-cyan/80 text-white font-bold ml-4">
                            <Plus className="mr-2 h-4 w-4" /> Novo Pagamento
                        </Button>
                    )}
                </div>
            </div>

            {!payments || payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border rounded-md">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum pagamento registrado.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead className="text-right">Comprovante</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment: any) => (
                                    <TableRow key={payment._id}>
                                        <TableCell className="font-medium">{payment.description}</TableCell>

                                        <TableCell>{payment.supplier}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {payment.category?.name || "Geral"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(payment.date), "dd/MM/yyyy", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            }).format(payment.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payment.attachment_url && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={payment.attachment_url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        PDF
                                                    </a>
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                                                {can('financeira', 'update') ? <Pencil className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground px-2">
                            Página {page} de {meta.totalPages} ({meta.total} registros)
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                disabled={page >= meta.totalPages}
                            >
                                Próxima
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                payment={selectedPayment}
            />
        </div>
    );
}
