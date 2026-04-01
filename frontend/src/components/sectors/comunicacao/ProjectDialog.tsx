import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@/components/ui/dialog";
import {
    FuturisticModal,
    FuturisticInput,
    FuturisticSelect,
    FuturisticTextarea,
    FuturisticButton
} from "@/components/ui/futuristic-modal";
import { useQuery } from "@tanstack/react-query";
import { userService, User } from "@/services/users";
import { useSectors } from "@/hooks/useSectors";

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: any;
    onSave: (data: any) => Promise<void>;
}

export function ProjectDialog({ open, onOpenChange, project, onSave }: ProjectDialogProps) {
    const isEditing = !!project;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting, errors } } = useForm();
    const { sectors } = useSectors();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Find communication sector to load its users
    const commSectorId = sectors.find((s: any) => s.slug === 'comunicacao')?.id;

    const { data: users = [] } = useQuery({
        queryKey: ['sector_users', commSectorId],
        queryFn: () => userService.getSectorUsers(commSectorId!),
        enabled: !!commSectorId
    });

    useEffect(() => {
        if (project) {
            setValue("title", project.title);
            setValue("description", project.description);

            // Format dates for HTML5 date input (YYYY-MM-DD)
            if (project.start_date) {
                const startDate = new Date(project.start_date);
                if (!isNaN(startDate.getTime())) {
                    setValue("start_date", startDate.toISOString().split('T')[0]);
                }
            }
            if (project.end_date) {
                const endDate = new Date(project.end_date);
                if (!isNaN(endDate.getTime())) {
                    setValue("end_date", endDate.toISOString().split('T')[0]);
                }
            }

            setValue("status", project.status);
            setValue("priority", project.priority);
            
            // Set initial responsibles
            if (project.assigned_users) {
                setSelectedUserIds(project.assigned_users.map((r: any) => r.id));
            } else if (project.assigned_to) {
                setSelectedUserIds(project.assigned_to);
            } else {
                setSelectedUserIds([]);
            }
        } else {
            reset();
            setValue("status", "PLANNING");
            setValue("priority", "MEDIUM");
            setSelectedUserIds([]);
        }
        register("status");
        register("priority");
    }, [project, setValue, reset, register]);

    const onSubmit = async (data: any) => {
        await onSave({ ...project, ...data, assigned_to: selectedUserIds });
        onOpenChange(false);
        reset();
    };

    const onError = (errors: any) => {
        console.error(errors);
        import('sonner').then(({ toast }) => toast.error("Por favor, preencha todos os campos obrigatórios."));
    };

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <FuturisticModal
                title={isEditing ? "Editar Projeto" : "Novo Projeto"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
                    <FuturisticInput
                        label="Título do Projeto"
                        placeholder="Nome da campanha ou projeto"
                        {...register("title", { required: true })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Data Início"
                            type="date"
                            {...register("start_date")}
                        />
                        <FuturisticInput
                            label="Previsão Fim"
                            type="date"
                            {...register("end_date")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticSelect
                            label="Prioridade"
                            value={watch("priority")}
                            onChange={(e) => setValue("priority", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "LOW", label: "Baixa" },
                                { value: "MEDIUM", label: "Média" },
                                { value: "HIGH", label: "Alta" }
                            ]}
                        />
                        <FuturisticSelect
                            label="Status Atual"
                            value={watch("status")}
                            onChange={(e) => setValue("status", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "PLANNING", label: "Planejamento" },
                                { value: "IN_PROGRESS", label: "Em Andamento" },
                                { value: "COMPLETED", label: "Concluído" },
                                { value: "ON_HOLD", label: "Pausado" }
                            ]}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Responsáveis Pelas Atividades</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-xl p-2 space-y-1 bg-gray-50/50 dark:bg-muted/30">
                            {users.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-2 italic text-center">Nenhum usuário encontrado no setor.</p>
                            ) : (
                                users.map((user: User) => (
                                    <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{user.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{user.email}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <FuturisticTextarea
                        label="Descrição Detalhada"
                        placeholder="Objetivos, escopo e detalhes importantes..."
                        className="min-h-[80px]"
                        {...register("description")}
                    />

                    <div className="pt-2">
                        <FuturisticButton
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Criar Projeto"}
                        </FuturisticButton>
                    </div>
                </form>
            </FuturisticModal>
        </Dialog>
    );
}
