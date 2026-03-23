import { useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSectors } from "@/hooks/useSectors";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: any;
    onSave: (data: any) => Promise<void>;
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
    const isEditing = !!user;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();
    const { sectors, isLoading: isLoadingSectors } = useSectors();

    useEffect(() => {
        if (user) {
            setValue("full_name", user.full_name);
            setValue("email", user.email);
            setValue("role", user.role || 'ANALYST');
            setValue("sector_id", user.sector_id);
            setValue("status", user.status);
        } else {
            reset();
            setValue("role", "ANALYST");
        }
    }, [user, setValue, reset]);

    const onSubmit = async (data: any) => {
        try {
            await onSave({ ...user, ...data });
            onOpenChange(false);
            reset();
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };

    const selectedRole = watch("role");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Configure o acesso, departamento e função deste usuário."
                            : "Adicione um novo usuário ao sistema."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" className="col-span-3" {...register("full_name")} disabled={isEditing} />
                        {/* Note: Editing name/email might be restricted if sync'd with Auth */}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-3" {...register("email")} disabled={isEditing} />
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Função</Label>
                        <div className="col-span-3">
                            <Select
                                onValueChange={(val) => setValue("role", val)}
                                value={watch("role")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ANALYST">Analista (Acesso Padrão)</SelectItem>
                                    <SelectItem value="MANAGER">Gerente</SelectItem>
                                    <SelectItem value="COORDINATOR">Coordenador</SelectItem>
                                    <SelectItem value="DIRECTOR">Diretor (Admin do Setor)</SelectItem>
                                    <SelectItem value="MASTER_ADMIN">Master Admin (Acesso Total)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sector Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sector" className="text-right">Setor</Label>
                        <div className="col-span-3">
                            <Select
                                onValueChange={(val) => setValue("sector_id", val)}
                                value={watch("sector_id") || "none"}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingSectors ? "Carregando..." : "Selecione o setor"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectors.map((sector: any) => (
                                        <SelectItem key={sector.id} value={sector.id}>
                                            {sector.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="none">-- Sem Setor --</SelectItem>
                                </SelectContent>
                            </Select>
                            {selectedRole === 'MASTER_ADMIN' && (
                                <p className="text-xs text-muted-foreground mt-1">Master Admins têm acesso a todos os setores.</p>
                            )}
                        </div>
                    </div>

                    {/* Status (Only on Edit) */}
                    {isEditing && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <div className="col-span-3">
                                <Select
                                    onValueChange={(val) => setValue("status", val)}
                                    value={watch("status")}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                                        <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
