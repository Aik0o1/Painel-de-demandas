import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import {
    FuturisticModal,
    FuturisticInput,
    FuturisticSelect,
    FuturisticTextarea,
    FuturisticButton
} from "@/components/ui/futuristic-modal";

interface ProcessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    process?: any;
    onSave: (data: any) => Promise<void>;
}

export function ProcessDialog({ open, onOpenChange, process, onSave }: ProcessDialogProps) {
    const isEditing = !!process;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();
    const statusValue = watch("status");

    useEffect(() => {
        if (process) {
            setValue("process_number", process.process_number);
            setValue("title", process.title);
            setValue("party_name", process.party_name);
            setValue("court", process.court);

            // Fix: Format date for HTML input
            if (process.deadline_date) {
                const d = new Date(process.deadline_date);
                if (!isNaN(d.getTime())) {
                    setValue("deadline_date", d.toISOString().split('T')[0]);
                }
            }

            setValue("status", process.status);
            setValue("description", process.description);
        } else {
            reset();
            setValue("status", "OPEN");
        }
        register("status");
    }, [process, setValue, reset, register]);

    const onSubmit = async (data: any) => {
        await onSave({ ...process, ...data });
        onOpenChange(false);
        reset();
    };

    const onError = (errors: any) => {
        console.error("Form errors:", errors);
        toast.error("Por favor, preencha todos os campos obrigatórios.");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <FuturisticModal
                title={isEditing ? "Editar Processo" : "Novo Processo Jurídico"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <FuturisticInput
                                label="Título / Assunto"
                                placeholder="Ação civil pública..."
                                {...register("title", { required: true })}
                            />
                        </div>
                        <FuturisticInput
                            label="Nº Processo"
                            placeholder="00000.0000..."
                            className="font-mono text-xs"
                            {...register("process_number", { required: true })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Tribunal / Órgão"
                            placeholder="TJ-PI, TRT..."
                            {...register("court")}
                        />
                        <FuturisticInput
                            label="Prazo Fatal"
                            type="date"
                            {...register("deadline_date")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Partes Envolvidas"
                            placeholder="Autor vs Réu"
                            {...register("party_name", { required: true })}
                        />
                        <FuturisticSelect
                            label="Fase Atual"
                            value={statusValue}
                            onChange={(e) => setValue("status", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "OPEN", label: "Aberto / Inicial" },
                                { value: "IN_ANALYSIS", label: "Em Análise" },
                                { value: "SUSPENDED", label: "Suspenso" },
                                { value: "CLOSED", label: "Encerrado" },
                                { value: "ARCHIVED", label: "Arquivado" }
                            ]}
                        />
                    </div>

                    <FuturisticTextarea
                        label="Resumo do Caso"
                        placeholder="Detalhes importantes do processo..."
                        className="min-h-[100px]"
                        {...register("description")}
                    />

                    <div className="pt-2">
                        <FuturisticButton
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Cadastrar Processo"}
                        </FuturisticButton>
                    </div>
                </form>
            </FuturisticModal>
        </Dialog>
    );
}
