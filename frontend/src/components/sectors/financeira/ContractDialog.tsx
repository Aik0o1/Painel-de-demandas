import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import {
    FuturisticModal,
    FuturisticInput,
    FuturisticButton
} from "@/components/ui/futuristic-modal";

interface ContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract?: any;
    onSave: (data: any) => Promise<void>;
}

export function ContractDialog({ open, onOpenChange, contract, onSave }: ContractDialogProps) {
    const isEditing = !!contract;
    const { register, handleSubmit, reset, setValue, control, formState: { isSubmitting } } = useForm();

    useEffect(() => {
        if (contract) {
            setValue("title", contract.title);
            setValue("supplier", contract.supplier);
            setValue("value", maskCurrency((contract.value * 100).toString()));

            // Format dates for HTML5 date input (YYYY-MM-DD)
            if (contract.start_date) {
                const startDate = new Date(contract.start_date);
                if (!isNaN(startDate.getTime())) {
                    setValue("start_date", startDate.toISOString().split('T')[0]);
                }
            }
            if (contract.end_date) {
                const endDate = new Date(contract.end_date);
                if (!isNaN(endDate.getTime())) {
                    setValue("end_date", endDate.toISOString().split('T')[0]);
                }
            }

            setValue("status", contract.status);
        } else {
            reset();
            setValue("status", "ACTIVE");
        }
        register("status");
    }, [contract, setValue, reset, register]);

    const onSubmit = async (data: any) => {
        const payload = {
            ...contract,
            ...data,
            value: parseCurrency(data.value)
        };
        await onSave(payload);
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
                title={isEditing ? "Editar Contrato" : "Novo Contrato"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
                    <FuturisticInput
                        label="Título do Contrato"
                        placeholder="Ex: Prestação de Serviços Judiciais"
                        {...register("title", { required: true })}
                    />

                    <FuturisticInput
                        label="Fornecedor / Empresa"
                        placeholder="Nome da empresa contratada"
                        {...register("supplier", { required: true })}
                    />

                    <Controller
                        name="value"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <FuturisticInput
                                label="Valor Total (R$)"
                                placeholder="0,00"
                                value={field.value}
                                onChange={(e) => field.onChange(maskCurrency(e.target.value))}
                            />
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Data Início"
                            type="date"
                            {...register("start_date", { required: true })}
                        />
                        <FuturisticInput
                            label="Data Fim"
                            type="date"
                            {...register("end_date", { required: true })}
                        />
                    </div>

                    <div className="pt-2">
                        <FuturisticButton
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Registrar Contrato"}
                        </FuturisticButton>
                    </div>
                </form>
            </FuturisticModal>
        </Dialog>
    );
}
