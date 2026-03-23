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

interface RegistryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item?: any;
    onSave: (data: any) => Promise<void>;
}

export function RegistryDialog({ open, onOpenChange, item, onSave }: RegistryDialogProps) {
    const isEditing = !!item;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();

    const docType = watch("document_type");
    const statusValue = watch("status");

    useEffect(() => {
        if (item) {
            setValue("protocol_number", item.protocol_number);
            setValue("document_type", item.document_type);
            setValue("party_name", item.party_name);

            // Fix: Format date for HTML input
            if (item.deadline_date) {
                const d = new Date(item.deadline_date);
                if (!isNaN(d.getTime())) {
                    setValue("deadline_date", d.toISOString().split('T')[0]);
                }
            }

            setValue("status", item.status);
            setValue("notes", item.notes);
        } else {
            reset();
            setValue("status", "PENDING");
            // Auto-generate a dummy protocol for now or let backend handle it
            setValue("protocol_number", `PROT - ${Date.now().toString().slice(-6)} `);
        }
        register("status");
        register("document_type");
    }, [item, setValue, reset, register]);

    const onSubmit = async (data: any) => {
        await onSave({ ...item, ...data });
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
                title={isEditing ? "Editar Protocolo" : "Novo Protocolo"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Nº Protocolo"
                            placeholder="Gerado automaticamente..."
                            className="font-mono"
                            readOnly
                            {...register("protocol_number", { required: true })}
                        />
                        <FuturisticSelect
                            label="Tipo de Documento"
                            value={docType}
                            onChange={(e) => setValue("document_type", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "DEED", label: "Escritura" },
                                { value: "CERTIFICATION", label: "Certidão" },
                                { value: "REGISTRATION", label: "Registro Imobiliário" },
                                { value: "OTHER", label: "Outros" }
                            ]}
                        />
                    </div>

                    <FuturisticInput
                        label="Interessado (Nome/Razão Social)"
                        placeholder="Nome da pessoa ou empresa"
                        {...register("party_name", { required: true })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Prazo Legal"
                            type="date"
                            {...register("deadline_date")}
                        />
                        <FuturisticSelect
                            label="Status do Processo"
                            value={statusValue}
                            onChange={(e) => setValue("status", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "PENDING", label: "Pendente" },
                                { value: "ANALYZING", label: "Em Análise" },
                                { value: "COMPLETED", label: "Concluído" },
                                { value: "REJECTED", label: "Devolvido/Rejeitado" }
                            ]}
                        />
                    </div>

                    <FuturisticTextarea
                        label="Notas / Observações"
                        placeholder="Pendências, detalhes de análise..."
                        className="min-h-[100px]"
                        {...register("notes")}
                    />

                    <div className="pt-2">
                        <FuturisticButton
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Protocolar Entrada"}
                        </FuturisticButton>
                    </div>
                </form>
            </FuturisticModal>
        </Dialog>
    );
}
