import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import {
    FuturisticModal,
    FuturisticInput,
    FuturisticSelect,
    FuturisticButton
} from "@/components/ui/futuristic-modal";

interface InventoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item?: any;
    onSave: (data: any) => Promise<void>;
}

export function InventoryDialog({ open, onOpenChange, item, onSave }: InventoryDialogProps) {
    const isEditing = !!item;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();

    // Watch fields for select components
    const categoryValue = watch("category");
    const statusValue = watch("status");

    useEffect(() => {
        if (item) {
            setValue("name", item.name);
            setValue("code", item.code);
            setValue("category", item.category);
            setValue("location", item.location);
            setValue("status", item.status);
            setValue("value", item.value);
        } else {
            reset();
            setValue("status", "GOOD");
            setValue("category", "FURNITURE");
        }
        register("status");
        register("category");
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
                title={isEditing ? "Editar Item" : "Novo Item de Patrimônio"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <FuturisticInput
                                label="Nome do Item"
                                placeholder="Cadeira, Mesa, Monitor..."
                                {...register("name", { required: true })}
                            />
                        </div>
                        <FuturisticInput
                            label="Código/Etiqueta"
                            placeholder="000123"
                            {...register("code", { required: true })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticSelect
                            label="Categoria"
                            value={categoryValue}
                            onChange={(e) => setValue("category", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "FURNITURE", label: "Mobiliário" },
                                { value: "ELECTRONICS", label: "Eletrônicos/TI" },
                                { value: "VEHICLE", label: "Veículos" },
                                { value: "OTHER", label: "Outros" }
                            ]}
                        />
                        <FuturisticInput
                            label="Localização Atual"
                            placeholder="Sala 101, Depósito..."
                            {...register("location", { required: true })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Valor Estimado (R$)"
                            type="number"
                            step="0.01"
                            {...register("value")}
                        />
                        <FuturisticSelect
                            label="Estado de Conservação"
                            value={statusValue}
                            onChange={(e) => setValue("status", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "GOOD", label: "Em Bom Estado" },
                                { value: "DAMAGED", label: "Danificado" },
                                { value: "MAINTENANCE", label: "Em Manutenção" },
                                { value: "LOST", label: "Extraviado" }
                            ]}
                        />
                    </div>

                    <div className="pt-2">
                        <FuturisticButton
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Cadastrar Item"}
                        </FuturisticButton>
                    </div>
                </form>
            </FuturisticModal>
        </Dialog>
    );
}
