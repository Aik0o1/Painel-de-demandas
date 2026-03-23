import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@/components/ui/dialog";
import {
    FuturisticModal,
    FuturisticInput,
    FuturisticSelect,
    FuturisticTextarea,
    FuturisticButton
} from "@/components/ui/futuristic-modal";

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: any;
    onSave: (data: any) => Promise<void>;
}

export function ProjectDialog({ open, onOpenChange, project, onSave }: ProjectDialogProps) {
    const isEditing = !!project;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting, errors } } = useForm();

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
        } else {
            reset();
            setValue("status", "PLANNING");
            setValue("priority", "MEDIUM");
        }
        register("status");
        register("priority");
    }, [project, setValue, reset, register]);

    const onSubmit = async (data: any) => {
        await onSave({ ...project, ...data });
        onOpenChange(false);
        reset();
    };

    const onError = (errors: any) => {
        console.error(errors);
        import('sonner').then(({ toast }) => toast.error("Por favor, preencha todos os campos obrigatórios."));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <FuturisticModal
                title={isEditing ? "Editar Projeto" : "Novo Projeto"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
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

                    <FuturisticTextarea
                        label="Descrição Detalhada"
                        placeholder="Objetivos, escopo e detalhes importantes..."
                        className="min-h-[100px]"
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
