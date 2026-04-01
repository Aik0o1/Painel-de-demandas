import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Wallet } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiGet, apiPut } from "@/services/api";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function BudgetCategoryGrid() {
    const { can } = usePermissions();
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [newLimit, setNewLimit] = useState("");
    const queryClient = useQueryClient();



    const { data: categories, isLoading } = useQuery({
        queryKey: ["budget-categories"],
        queryFn: async () => {
            return apiGet("/finance/budget-categories");
        },
    });

    const updateLimit = useMutation({
        mutationFn: async ({ id, total_allocated }: { id: string, total_allocated: number }) => {
            return apiPut("/finance/budget-categories", { id, total_allocated });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
            toast.success("Teto orçamentário atualizado!");
            setEditingCategory(null);
        },
        onError: () => {
            toast.error("Erro ao atualizar teto.");
        }
    });

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setNewLimit(category.total_allocated.toString());
    };

    const handleSave = () => {
        if (editingCategory && newLimit) {
            updateLimit.mutate({
                id: editingCategory.id || editingCategory._id,
                total_allocated: parseFloat(newLimit)
            });
        }
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[150px] rounded-xl" />
                ))}
            </div>
        );
    }

    // Pre-fill categories if empty (Mocking/Seeding logic usually goes to backend, but for visual verifying let's rely on backend returning empty or seed)
    // For this task, if no categories, we might want to suggest user to create one or seed them via API call if strictly needed.
    // Assuming Backend returns list.

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories?.map((cat: any) => {
                    const allocated = parseFloat(cat.total_allocated) || 0.01; // Avoid div by zero
                    const spent = parseFloat(cat.spent) || 0;
                    const rawPercentage = (spent / allocated) * 100;

                    // Use more precision for small percentages
                    const percentage = Math.min(100, Math.round(rawPercentage * 100) / 100) || 0;

                    // Determine color based on percentage
                    const getProgressColor = (pct: number) => {
                        if (pct >= 100) return "bg-red-600";
                        if (pct >= 80) return "bg-orange-500";
                        return "bg-neon-cyan";
                    };

                    return (
                        <Card key={cat.id || cat._id} className="border-neon-cyan/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
                                {can('financeira', 'update') && (
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs text-muted-foreground">Valor Alocado:</span>
                                        <span className="text-sm font-medium">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cat.total_allocated)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs text-muted-foreground">Valor Utilizado:</span>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cat.spent)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs text-muted-foreground">Saldo Restante:</span>
                                        <span className={cn("text-2xl font-bold", cat.remaining < 0 ? "text-destructive" : "text-neon-cyan")}>
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cat.remaining)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Utilizado: {percentage.toFixed(1)}%</span>
                                    </div>
                                    <Progress
                                        value={percentage}
                                        className="h-2 bg-muted"
                                        indicatorClassName={getProgressColor(percentage)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Teto Orçamentário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Input value={editingCategory?.name} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Novo Limite (R$)</Label>
                            <Input
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={updateLimit.isPending}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
