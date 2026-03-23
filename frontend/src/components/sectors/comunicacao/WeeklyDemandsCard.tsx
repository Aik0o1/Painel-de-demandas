import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ListTodo, Save } from "lucide-react";
import { FuturisticButton, FuturisticTextarea } from "@/components/ui/futuristic-modal";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { apiGet, apiPost } from "@/services/api";

export function WeeklyDemandsCard() {
    const { can } = usePermissions();
    const [demands, setDemands] = useState("");
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['weekly_demands'],
        queryFn: async () => {
            return apiGet('/weekly-demands');
        }
    });

    useEffect(() => {
        if (data) {
            setDemands(data.content || "");
        }
    }, [data]);

    const mutation = useMutation({
        mutationFn: async (content: string) => {
            return apiPost('/weekly-demands', { content });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly_demands'] });
            toast.success("Demandas semanais salvas (Visível para todos)!");
        },
        onError: () => {
            toast.error("Erro ao salvar.");
        }
    });

    const handleSave = () => {
        mutation.mutate(demands);
    };

    if (isLoading) return (
        <Card className="h-full flex flex-col shadow-sm border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-muted/30">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-primary" />
                        Demandas da Semana
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Carregando...
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="bg-white dark:bg-[#151B26] rounded-2xl p-1 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 h-full min-h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4 text-left w-full">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <ListTodo className="h-5 w-5" />
                        <h3 className="font-display font-bold text-lg text-foreground dark:text-foreground">Demandas da Semana</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground font-medium ml-7">
                        Planejamento e entregas importantes (Sincronizado)
                    </p>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary mb-2 ml-1">Lista de Tarefas</h4>

                <div className="bg-slate-50 dark:bg-background/80 border border-slate-200 dark:border-primary/20 rounded-xl p-4 flex-1 mb-4 shadow-inner relative group flex flex-col hover:border-primary/40 transition-colors">
                    {/* Replaced FuturisticTextarea with native textarea for better centering control */}
                    <textarea
                        placeholder="Digite as demandas da semana aqui..."
                        className="flex-1 w-full h-full resize-none bg-transparent border-0 focus:ring-0 p-3 text-sm text-slate-700 dark:text-foreground placeholder:text-muted-foreground leading-relaxed font-normal focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                        value={demands}
                        onChange={(e) => setDemands(e.target.value)}
                        readOnly={!can('comunicacao', 'update')}
                    />
                    <div className="w-0.5 h-4 bg-primary animate-pulse absolute bottom-4 right-4 opacity-70"></div>
                </div>

                {can('comunicacao', 'update') && (
                    <button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className="w-full relative group overflow-hidden rounded-xl p-[1px]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-primary to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity"></span>
                        <div className="relative bg-primary text-primary-foreground rounded-[11px] px-4 py-3 flex items-center justify-center gap-2 group-hover:bg-opacity-90 transition-colors">
                            {mutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save className="text-white h-4 w-4" />
                            )}
                            <span className="text-white font-semibold text-base">
                                {mutation.isPending ? "Salvando..." : "Salvar Anotações"}
                            </span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
