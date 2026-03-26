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
import { Edit, Trash2, Plus, Monitor, AlertCircle, CheckCircle2 } from "lucide-react";
import TicketDialog from "./TicketDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";

export function TicketList() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['ti_tickets'],
        queryFn: async () => {
            return apiGet('/tickets');
        }
    });

    const mutation = useMutation({
        mutationFn: async (newItem: any) => {
            const isUpdate = !!newItem.id;
            if (isUpdate) {
                return apiPut(`/tickets/${newItem.id}`, newItem);
            } else {
                return apiPost('/tickets', newItem);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ti_tickets'] });
            toast.success("Chamado salvo com sucesso!");
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
            await apiDelete(`/tickets/${id}`);
            toast.success("Chamado excluído");
            queryClient.invalidateQueries({ queryKey: ['ti_tickets'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'OPEN': return 'destructive';
            case 'IN_PROGRESS': return 'secondary';
            case 'RESOLVED': return 'default';
            default: return 'outline';
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'CRITICAL' || priority === 'HIGH') return <AlertCircle className="h-4 w-4 text-red-500" />;
        return null;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Helpdesk / Chamados</h3>
                <Button onClick={() => { setSelectedTicket(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Chamado
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Assunto</TableHead>
                            <TableHead>Solicitante</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum chamado aberto.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket: any) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-muted-foreground" />
                                        {ticket.title}
                                    </TableCell>
                                    <TableCell>{ticket.requester_name}</TableCell>
                                    <TableCell>{ticket.category}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {getPriorityIcon(ticket.priority)}
                                            {ticket.priority}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.status) as any}>
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedTicket(ticket); setIsDialogOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(ticket.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TicketDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedTicket(null);
                }}
                ticket={selectedTicket}
                onSave={handleSave}
            />
        </div>
    );
}
