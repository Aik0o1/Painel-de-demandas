"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ListTodo,
    ShieldCheck,
    BarChart3,
    MessageSquare,
    Banknote,
    Scale,
    FolderArchive,
    FileText,
    Cpu,
    Save,
    X,
    Check
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSectors } from "@/hooks/useSectors";

interface User {
    id: string;
    name: string;
    email: string;
    status: string;
    role: string;
    permissions: Record<string, { create: boolean; update: boolean; delete: boolean; read: boolean }>;
    protocolNumber?: string;
    sector_id?: string;
}

interface UserApprovalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

const MODULES = [
    { key: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { key: 'demandas', label: 'Demandas', icon: ListTodo },
    { key: 'admin', label: 'Admin', icon: ShieldCheck },
    { key: 'analytics', label: 'Análises', icon: BarChart3 },
    { key: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
    { key: 'financeira', label: 'Financeira', icon: Banknote },
    { key: 'procuradoria', label: 'Procuradoria', icon: Scale },
    { key: 'registro', label: 'Registro', icon: FolderArchive },
    { key: 'relatorios', label: 'Relatórios', icon: FileText },
    { key: 'ti', label: 'TI', icon: Cpu }
];

const ACTION_LABELS: Record<string, string> = {
    read: 'Visualizar',
    create: 'Criar',
    update: 'Editar',
    delete: 'Excluir'
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    ACTIVE: { label: 'Ativo', variant: 'default', className: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800' },
    PENDING: { label: 'Pendente', variant: 'secondary', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800' },
    BLOCKED: { label: 'Bloqueado', variant: 'destructive', className: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800' },
    REJECTED: { label: 'Rejeitado', variant: 'destructive', className: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800' },
};

import { apiPut } from "@/services/api";

export function UserApproval({ user, isOpen, onClose }: UserApprovalProps) {
    const queryClient = useQueryClient();
    const { sectors } = useSectors();
    const [status, setStatus] = useState<string>(user?.status || 'PENDING');
    const [role, setRole] = useState<string>(user?.role || 'ANALYST');
    const [sectorId, setSectorId] = useState<string>(user?.sector_id || 'none');
    const [permissions, setPermissions] = useState<any>(user?.permissions || {});

    useEffect(() => {
        if (user && isOpen) {
            setStatus(user.status);
            setRole(user.role);
            setSectorId(user.sector_id || 'none');
            setPermissions(user.permissions || {});
        }
    }, [user, isOpen]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => apiPut('admin/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success("Usuário atualizado com sucesso");
            onClose();
        },
        onError: () => toast.error("Erro ao atualizar usuário")
    });

    const handleSave = () => {
        if (!user) return;
        updateMutation.mutate({
            userId: user.id,
            status,
            role,
            sector_id: sectorId === 'none' ? null : sectorId,
            permissions
        });
    };

    const togglePermission = (module: string, action: string) => {
        setPermissions((prev: any) => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: !prev[module]?.[action]
            }
        }));
    };

    const selectAllModules = () => {
        const newPermissions: any = {};
        MODULES.forEach(m => {
            newPermissions[m.key] = { read: true, create: true, update: true, delete: true };
        });
        setPermissions(newPermissions);
    };

    const clearAllModules = () => {
        setPermissions({});
    };

    if (!user) return null;

    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col bg-background border border-border shadow-xl rounded-xl">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-semibold text-foreground">
                                Gerenciar Usuário
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                        </div>
                        <Badge className={cn("text-xs font-medium border", statusCfg.className)}>
                            {statusCfg.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left Panel – Settings */}
                    <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-6 flex flex-col gap-5 overflow-y-auto">
                        {/* User info */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{user.name}</p>
                                {user.protocolNumber && (
                                    <p className="text-xs text-muted-foreground font-mono">{user.protocolNumber}</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Role */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Função (Role)</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ANALYST">Analista</SelectItem>
                                    <SelectItem value="COORDINATOR">Coordenador</SelectItem>
                                    <SelectItem value="MANAGER">Gerente</SelectItem>
                                    <SelectItem value="DIRECTOR">Diretor</SelectItem>
                                    <SelectItem value="MASTER_ADMIN">Master Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sector */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Setor Atribuído</Label>
                            <Select value={sectorId} onValueChange={setSectorId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Nenhum setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem vínculo (Nenhum)</SelectItem>
                                    {sectors.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status da Conta</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pendente</SelectItem>
                                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                                    <SelectItem value="REJECTED">Rejeitado</SelectItem>
                                    <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-auto pt-4 space-y-2">
                            <Button
                                className="w-full"
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                            <Button variant="outline" className="w-full" onClick={onClose}>
                                Cancelar
                            </Button>
                        </div>
                    </aside>

                    {/* Right Panel – Permissions */}
                    <section className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-semibold text-foreground">Permissões por Módulo</h3>
                                <p className="text-xs text-muted-foreground">Configure o nível de acesso para cada área do sistema.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={selectAllModules} className="text-xs">
                                    <Check className="w-3 h-3 mr-1" /> Marcar tudo
                                </Button>
                                <Button size="sm" variant="ghost" onClick={clearAllModules} className="text-xs text-muted-foreground">
                                    <X className="w-3 h-3 mr-1" /> Limpar
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {MODULES.map((module) => {
                                    const Icon = module.icon;
                                    const modulePerms = permissions[module.key] || {};
                                    const hasAny = Object.values(modulePerms).some(Boolean);

                                    return (
                                        <Card key={module.key} className={cn(
                                            "border transition-colors",
                                            hasAny ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                                        )}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-md flex items-center justify-center",
                                                        hasAny ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-sm text-foreground">{module.label}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                                    {['read', 'create', 'update', 'delete'].map((action) => (
                                                        <label key={action} className="flex items-center gap-2 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                                                checked={modulePerms[action] || false}
                                                                onChange={() => togglePermission(module.key, action)}
                                                            />
                                                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                                                {ACTION_LABELS[action]}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
