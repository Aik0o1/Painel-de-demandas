import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Megaphone, Calendar } from "lucide-react";
import { ProjectDialog } from "./ProjectDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";

export function ProjectList() {
    const { can } = usePermissions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['communication_projects'],
        queryFn: async () => {
            return apiGet('/projects');
        }
    });

    const mutation = useMutation({
        mutationFn: async (newItem: any) => {
            const isUpdate = !!newItem.id;
            if (isUpdate) {
                return apiPut(`/projects/${newItem.id}`, newItem);
            } else {
                return apiPost('/projects', newItem);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communication_projects'] });
            toast.success("Projeto salvo com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao salvar: " + error.message);
        }
    });

    const handleSave = async (data: any) => {
        mutation.mutate(data);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiDelete(`/projects/${id}`);
            toast.success("Projeto excluído");
            queryClient.invalidateQueries({ queryKey: ['communication_projects'] });
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'default'; // dark/primary
            case 'IN_PROGRESS': return 'secondary'; // light gray
            case 'ON_HOLD': return 'destructive'; // red
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Concluído';
            case 'IN_PROGRESS': return 'Em Andamento';
            case 'ON_HOLD': return 'Pausado';
            case 'PLANNING': return 'Planejamento';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Projetos & Campanhas</h3>
                {can('comunicacao', 'create') && (
                    <Button onClick={() => { setSelectedProject(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Projeto
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.length === 0 ? (
                    <div className="col-span-full glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-muted flex items-center justify-center mb-3">
                            <Megaphone className="text-muted-foreground dark:text-slate-500" />
                        </div>
                        <p className="text-slate-500 dark:text-muted-foreground text-sm">Nenhum projeto encontrado.</p>
                        <button
                            className="mt-3 text-primary text-xs font-medium hover:underline"
                            onClick={() => { setSelectedProject(null); setIsDialogOpen(true); }}
                        >
                            Criar meu primeiro projeto
                        </button>
                    </div>
                ) : (
                    projects.map((proj: any) => (
                        <div key={proj.id} className="glass-panel rounded-xl p-4 border-l-4 border-l-primary shadow-lg relative group transition-all hover:scale-[1.02]">
                            <div className="absolute top-4 right-4 flex space-x-2">
                                <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${proj.status === 'COMPLETED' ? 'bg-green-400 shadow-green-400/60' :
                                    proj.status === 'IN_PROGRESS' ? 'bg-blue-400 shadow-blue-400/60' :
                                        'bg-yellow-400 shadow-yellow-400/60'
                                    }`}></span>
                            </div>
                            <h3 className="font-display text-base font-semibold text-foreground dark:text-foreground mb-1">{proj.title}</h3>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground block mb-0.5">Prioridade</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${proj.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' :
                                        proj.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                        }`}>
                                        {proj.priority === 'HIGH' ? 'Alta' : proj.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground block mb-0.5">Status</span>
                                    <span className="text-xs text-slate-700 dark:text-muted-foreground font-medium">{getStatusLabel(proj.status)}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground block mb-0.5">Prazo</span>
                                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(proj.start_date).toLocaleDateString()} - {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : 'Em aberto'}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground block mb-1">Responsáveis</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {proj.assigned_users && proj.assigned_users.length > 0 ? (
                                            proj.assigned_users.map((u: any) => (
                                                <div key={u.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
                                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-bold">
                                                        {u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-[10px] font-medium">{u.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">Sem responsáveis</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-border/50 flex justify-end gap-2">
                                {can('comunicacao', 'delete') && (
                                    <button
                                        onClick={() => handleDelete(proj.id)}
                                        className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        Excluir
                                    </button>
                                )}
                                <button
                                    onClick={() => { setSelectedProject(proj); setIsDialogOpen(true); }}
                                    className="text-xs font-medium text-primary hover:text-white transition-colors"
                                >
                                    {can('comunicacao', 'update') ? 'Editar' : 'Detalhes'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ProjectDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                project={selectedProject}
                onSave={handleSave}
            />
        </div>
    );
}
