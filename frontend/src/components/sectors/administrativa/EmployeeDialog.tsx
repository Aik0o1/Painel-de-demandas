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

interface EmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee?: any;
    onSave: (data: any) => Promise<void>;
}

export function EmployeeDialog({ open, onOpenChange, employee, onSave }: EmployeeDialogProps) {
    const isEditing = !!employee;
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();

    useEffect(() => {
        if (employee) {
            setValue("full_name", employee.full_name);
            setValue("position", employee.position);
            setValue("department", employee.department);
            setValue("admission_date", employee.admission_date);
            setValue("status", employee.status);
        } else {
            reset();
            setValue("status", "ACTIVE");
        }
        register("status");
    }, [employee, setValue, reset, register]);

    const onSubmit = async (data: any) => {
        await onSave({ ...employee, ...data });
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
                title={isEditing ? "Editar Servidor" : "Novo Servidor"}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
                    <FuturisticInput
                        label="Nome Completo"
                        placeholder="Nome do colaborador"
                        {...register("full_name", { required: true })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Cargo / Função"
                            placeholder="Análista, Gerente..."
                            {...register("position", { required: true })}
                        />
                        <FuturisticInput
                            label="Departamento"
                            placeholder="Setor..."
                            {...register("department", { required: true })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FuturisticInput
                            label="Data de Admissão"
                            type="date"
                            {...register("admission_date", { required: true })}
                        />
                        <FuturisticSelect
                            label="Status Atual"
                            value={watch("status")}
                            onChange={(e) => setValue("status", e.target.value)}
                            placeholder="Selecione..."
                            options={[
                                { value: "ACTIVE", label: "Ativo" },
                                { value: "VACATION", label: "Férias" },
                                { value: "LEAVE", label: "Licença" },
                                { value: "INACTIVE", label: "Inativo" }
                            ]}
                        />
                    </div>

                    <div className="pt-2">
                        <FuturisticButton
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Cadastrar Servidor"}
                        </FuturisticButton>
                    </div>
                </form>
            </FuturisticModal>
        </Dialog>
    );
}
