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
import { Edit, Trash2, Plus, UserCircle } from "lucide-react";
import { EmployeeDialog } from "./EmployeeDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";

export function EmployeesList() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            return apiGet('/employees');
        }
    });

    const mutation = useMutation({
        mutationFn: async (newEmployee: any) => {
            const isUpdate = !!newEmployee.id;
            if (isUpdate) {
                return apiPut(`/employees/${newEmployee.id}`, newEmployee);
            } else {
                return apiPost('/employees', newEmployee);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success("Servidor salvo com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao salvar servidor: " + error.message);
        }
    });

    const handleSave = async (data: any) => {
        mutation.mutate(data);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiDelete(`/employees/${id}`);
            toast.success("Servidor excluído");
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default';
            case 'VACATION': return 'secondary';
            case 'LEAVE': return 'secondary';
            case 'INACTIVE': return 'destructive';
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Ativo';
            case 'VACATION': return 'Férias';
            case 'LEAVE': return 'Licença';
            case 'INACTIVE': return 'Inativo';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Quadro de Pessoal (RH)</h3>
                {can('administrativo', 'create') && (
                    <Button onClick={() => { setSelectedEmployee(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Servidor
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Cargo/Função</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Admissão</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum servidor encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp: any) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                                        {emp.full_name}
                                    </TableCell>
                                    <TableCell>{emp.position}</TableCell>
                                    <TableCell>{emp.department}</TableCell>
                                    <TableCell>{new Date(emp.admission_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(emp.status) as any}>
                                            {getStatusLabel(emp.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedEmployee(emp); setIsDialogOpen(true); }}>
                                            {can('administrativo', 'update') ? <Edit className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
                                        </Button>
                                        {can('administrativo', 'delete') && (
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(emp.id)}>
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

            <EmployeeDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                employee={selectedEmployee}
                onSave={handleSave}
            />
        </div>
    );
}
