import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { maskCurrency, parseCurrency } from "@/lib/utils";

import { apiGet, apiPost, apiPut } from "@/services/api";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment?: any; // Add payment prop for editing
}

export function PaymentDialog({ open, onOpenChange, payment }: PaymentDialogProps) {
    const isEditing = !!payment;
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [supplier, setSupplier] = useState("");
    const [date, setDate] = useState("");
    const [categoryId, setCategoryId] = useState("");

    // Specific fields
    const [beneficiaries, setBeneficiaries] = useState("");
    const [passenger, setPassenger] = useState("");
    const [route, setRoute] = useState("");

    const queryClient = useQueryClient();

    // Reset or Populate form when opening/changing payment
    useEffect(() => {
        if (open) {
            if (payment) {
                setDescription(payment.description || "");
                setAmount(maskCurrency((payment.amount * 100).toString()));
                setSupplier(payment.supplier || "");
                // Fix: Ensure date is properly formatted for HTML input (YYYY-MM-DD)
                if (payment.date) {
                    const d = new Date(payment.date);
                    if (!isNaN(d.getTime())) {
                        setDate(d.toISOString().split('T')[0]);
                    }
                }
                setCategoryId(payment.category_id?.id || payment.category_id?._id || payment.category_id); // Handle populate or raw id

                if (payment.beneficiaries && payment.beneficiaries.length > 0) {
                    setBeneficiaries(payment.beneficiaries.join(', '));
                } else {
                    setBeneficiaries("");
                }

                setPassenger(payment.passenger || "");
                setRoute(payment.route || "");
                setFile(null); // Reset file input
            } else {
                resetForm();
            }
        }
    }, [open, payment]);

    const { data: categories } = useQuery({
        queryKey: ["budget-categories"],
        queryFn: async () => {
            return apiGet("/finance/budget-categories");
        }
    });

    const selectedCategory = useMemo(() =>
        categories?.find((c: any) => (c.id || c._id) === categoryId),
        [categories, categoryId]);

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (isEditing) {
                // For PUT, we can't use standard apiPut if we want to send FormData easily without modifying api.ts significantly for header overrides.
                // We'll trust our API service acts smart or fallback to fetch if needed. 
                // However, apiPost/apiPut wraps fetch. Let's see api.ts:
                // apiRequest converts FormData to body and deletes Content-Type.
                // So apiPut SHOULD work if we implement it, or we use a custom fetch here to target the ID.
                // Since apiPut logic in api.ts is: apiRequest(endpoint, 'PUT', ...), and apiRequest handles FormData...
                // existing apiPut(endpoint, data) -> passes data.
                // So: apiPut(`/finance/payments/${payment._id}`, formData) should work!

                // Wait, I need to import apiPut first.
                // Or I can just use a raw fetch wrapper here or modify imports.
                // Let's assume I add apiPut to imports or use apiRequest directly if exported? 
                // For now, let's use a direct fetch to be safe and avoiding modifying api.ts just for one import line if it wasn't there (it is there).
                // Actually apiPut IS exported in existing file imports? No, currently: import { apiGet, apiPost } from "@/services/api";
                // I need to add apiPut to imports.

                // For now, I'll simulate it or update imports.
                // Let's stick to using the same pattern. I will use a direct fetch call for the PUT to ensure FormData handling is correct without relying on unverified generic wrappers for PUT+FormData.

                return apiPut(`/finance/payments/${payment.id || payment._id}`, formData);
            } else {
                return apiPost("/finance/payments", formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
            toast.success(isEditing ? "Pagamento atualizado com sucesso!" : "Pagamento registrado com sucesso!");
            onOpenChange(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(`Erro: ${error.message}`);
        },
    });

    const resetForm = () => {
        setFile(null);
        setDescription("");
        setAmount("");
        setSupplier("");
        setDate("");
        setCategoryId("");
        setBeneficiaries("");
        setPassenger("");
        setRoute("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: File is mandatory only for NEW payments
        if (!isEditing && !file) {
            toast.error("É obrigatório anexar o comprovante (PDF).");
            return;
        }

        if (file && file.type !== "application/pdf") {
            toast.error("Apenas arquivos PDF são permitidos.");
            return;
        }

        if (!categoryId) {
            toast.error("Selecione um tipo de despesa.");
            return;
        }

        const formData = new FormData();
        formData.append("description", description);
        formData.append("amount", parseCurrency(amount).toString());
        formData.append("supplier", supplier);
        formData.append("date", date);
        formData.append("category_id", categoryId);

        if (file) {
            formData.append("file", file);
        }

        if (selectedCategory?.name?.toLowerCase().includes("diária")) {
            formData.append("beneficiaries", JSON.stringify(beneficiaries.split(',').map(s => s.trim())));
        }
        if (selectedCategory?.name?.toLowerCase().includes("passagen")) {
            formData.append("passenger", passenger);
            formData.append("route", route);
        }

        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Pagamento" : "Novo Pagamento"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Atualize os dados da despesa." : "Preencha os dados da despesa. O tipo define os campos obrigatórios."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <Label>Tipo de Despesa</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories?.map((cat: any) => (
                                    <SelectItem key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Aquisição de monitores"
                        />
                    </div>

                    {selectedCategory?.name?.toLowerCase().includes("diária") && (
                        <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
                            <Label className="text-primary font-medium">Beneficiários (Diárias)</Label>
                            <Textarea
                                placeholder="Nome dos servidores (separe por vírgula)"
                                value={beneficiaries}
                                onChange={(e) => setBeneficiaries(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">Separe múltiplos nomes por vírgula.</p>
                        </div>
                    )}

                    {selectedCategory?.name?.toLowerCase().includes("passagen") && (
                        <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
                            <Label className="text-primary font-medium">Dados da Passagem</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Passageiro</Label>
                                    <Input placeholder="Nome Completo" value={passenger} onChange={e => setPassenger(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Trecho</Label>
                                    <Input placeholder="THE -> BSB" value={route} onChange={e => setRoute(e.target.value)} required />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="supplier">Fornecedor</Label>
                        <Input
                            id="supplier"
                            required
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            placeholder="Fornecedor / Favorecido"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input
                                id="amount"
                                required
                                value={amount}
                                onChange={(e) => setAmount(maskCurrency(e.target.value))}
                                placeholder="0,00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">Comprovante (PDF)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="cursor-pointer"
                            />
                        </div>
                        {isEditing && !file && <p className="text-xs text-muted-foreground">Deixe vazio para manter o arquivo atual.</p>}
                        {file && <p className="text-xs text-muted-foreground">Arquivo selecionado: {file.name}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isEditing ? "Atualizar Pagamento" : "Salvar Pagamento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
