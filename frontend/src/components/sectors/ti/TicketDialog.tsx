import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/services/api";

interface TicketDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ticket?: any;
    onSave?: (data: any) => Promise<void>;
}

export default function TicketDialog({ isOpen, onClose, ticket, onSave }: TicketDialogProps) {
    const isEditing = !!ticket;
    const { user } = useAuth();
    const [tiUsers, setTiUsers] = useState<{ id: string, name: string }[]>([]);
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();

    useEffect(() => {
        if (isOpen) {
            const fetchTiUsers = async () => {
                try {
                    const users = await apiGet('/tickets/ti-users');
                    setTiUsers(users);
                } catch (error) {
                    console.error("Erro ao carregar técnicos de TI:", error);
                }
            };
            fetchTiUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (ticket) {
            setValue("title", ticket.title);
            setValue("description", ticket.description);
            setValue("requester_name", ticket.requester_name);
            setValue("category", ticket.category);
            setValue("priority", ticket.priority);
            setValue("status", ticket.status);
            setValue("assigned_to_id", ticket.assigned_to_id);
        } else {
            reset();
            setValue("status", "OPEN");
            setValue("priority", "MEDIUM");
            if (user?.name) {
                setValue("requester_name", user.name);
            }
        }
    }, [ticket, user, setValue, reset, isOpen]);

    const onSubmit = async (data: any) => {
        if (onSave) {
            await onSave({ ...ticket, ...data });
        }
        onClose();
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Chamado" : "Novo Chamado Técnico"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize o status ou detalhes do incidente."
                            : "Registre um novo incidente ou solicitação de serviço."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Assunto</Label>
                        <Input id="title" className="col-span-3" {...register("title", { required: true })} />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="requester_name" className="text-right">Solicitante</Label>
                        <Input id="requester_name" className="col-span-3" placeholder="Nome do usuário" {...register("requester_name", { required: true })} />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Categoria</Label>
                        <Select onValueChange={(val) => setValue("category", val)} defaultValue={ticket?.category}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HARDWARE">Hardware (PC, Impressora)</SelectItem>
                                <SelectItem value="SOFTWARE">Software / Sistema</SelectItem>
                                <SelectItem value="NETWORK">Rede / Internet</SelectItem>
                                <SelectItem value="ACCESS">Acessos e Senhas</SelectItem>
                                <SelectItem value="OTHER">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="priority" className="text-right">Prioridade</Label>
                        <Select onValueChange={(val) => setValue("priority", val)} defaultValue={ticket?.priority || "MEDIUM"}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Baixa</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="CRITICAL">Crítica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select onValueChange={(val) => setValue("status", val)} defaultValue={ticket?.status || "OPEN"}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPEN">Aberto</SelectItem>
                                <SelectItem value="IN_PROGRESS">Em Atendimento</SelectItem>
                                <SelectItem value="WAITING_USER">Aguardando Usuário</SelectItem>
                                <SelectItem value="RESOLVED">Resolvido</SelectItem>
                                <SelectItem value="CLOSED">Fechado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assigned_to_id" className="text-right">Atribuído a</Label>
                        <Select 
                            onValueChange={(val) => setValue("assigned_to_id", val === "none" ? null : val)} 
                            defaultValue={ticket?.assigned_to_id || ""}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione um técnico..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Não atribuído</SelectItem>
                                {tiUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descrição</Label>
                        <Textarea id="description" className="col-span-3" placeholder="Descreva o problema..." {...register("description")} />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
