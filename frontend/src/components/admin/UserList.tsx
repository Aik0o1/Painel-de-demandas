import { useState, useEffect } from "react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Lock, Trash2, Shield, Loader2, Settings, ShieldCheck, Network, UserPlus, Plus } from "lucide-react";
import { UserDialog } from "./UserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { useProfiles } from "@/hooks/useProfiles";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSectors } from "@/hooks/useSectors";
import { apiPost } from "@/services/api";

export function UserList() {
    // Connect to real data
    const { profiles, isLoading, error } = useProfiles();
    const { sectors } = useSectors();

    // Local state for UI management
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    // Helpers
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const handleStatusChange = async (targetUser: any, newStatus: string) => {
        try {
            await apiPost('/admin/users/update', { id: targetUser.id, updates: { status: newStatus } });
            toast.success(`Status atualizado para ${newStatus}`);
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error("Erro ao atualizar status");
        }
    };

    const handleSaveUser = async (updatedData: any) => {
        try {
            const updates: any = {
                role: updatedData.role,
                sector_id: updatedData.sector_id === "none" ? null : updatedData.sector_id,
            };
            if (updatedData.status) updates.status = updatedData.status;

            await apiPost('/admin/users/update', { id: updatedData.id, updates });
            toast.success("Usuário atualizado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (error: any) {
            console.error("Error saving user:", error);
            toast.error("Erro ao salvar usuário");
        }
    };

    const getSectorName = (sectorId: string | null) => {
        if (!sectorId) return "-";
        const sector = sectors.find((s: any) => s.id === sectorId);
        return sector ? sector.name : "Desconhecido";
    };

    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || '??';
    };

    const getRoleLabel = (role: string) => {
        const roles: Record<string, string> = {
            'MASTER_ADMIN': 'Master Admin',
            'DIRECTOR': 'Diretor',
            'MANAGER': 'Gerente',
            'COORDINATOR': 'Coordenador',
            'ANALYST': 'Analista'
        };
        return roles[role] || 'Usuário';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500">Erro ao carregar usuários.</div>;
    }

    return (
        <div className="relative">
            <div className="flex items-center justify-between px-2 mb-4">
                <div>
                    <h2 className="text-lg font-semibold">Gerenciamento</h2>
                    <p className="text-sm text-muted-foreground">Total de {profiles.length} usuários ativos</p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Usuário
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {profiles.map((user: any) => {
                    const isActive = !user.status || user.status === 'ACTIVE';
                    return (
                        <div key={user.id} className="glass-card p-5 rounded-3xl relative overflow-hidden group active:scale-[0.98] transition-all bg-card/40">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                                            {getInitials(user.name || user.full_name)}
                                        </div>
                                        {isActive && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background dark:border-background-dark neon-pulse"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground dark:text-slate-100">{user.name || user.full_name}</h3>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 text-slate-500 hover:text-primary transition-colors">
                                            <MoreHorizontal className="h-6 w-6" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsResetDialogOpen(true); }}>
                                            <Lock className="mr-2 h-4 w-4" /> Resetar Senha
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {isActive ? (
                                            <>
                                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'INACTIVE')}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Desativar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'BLOCKED')} className="text-red-600">
                                                    <Shield className="mr-2 h-4 w-4" /> Bloquear
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleStatusChange(user, 'ACTIVE')} className="text-green-600">
                                                <Shield className="mr-2 h-4 w-4" /> Ativar
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="mt-6 flex gap-2 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                    <ShieldCheck className="text-primary h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">{getRoleLabel(user.role)}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                    <Network className="text-purple-400 h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">{getSectorName(user.sector_id)}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                    Criado em: {new Date(user.created_at).toLocaleDateString()}
                                </span>
                                {isActive && (
                                    <div className="flex -space-x-2">
                                        {/* Placeholder for team members or similar visual */}
                                        <div className="w-6 h-6 rounded-full border border-background dark:border-background-dark bg-muted text-[8px] flex items-center justify-center text-white">+</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div className="border-2 border-dashed border-slate-300 dark:border-border/50 p-8 rounded-3xl flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-background/50 transition-colors" onClick={handleCreate}>
                    <UserPlus className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Adicionar novos registros</p>
                </div>
            </div>


            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={selectedUser}
                onSave={handleSaveUser}
            />

            <ResetPasswordDialog
                open={isResetDialogOpen}
                onOpenChange={setIsResetDialogOpen}
                user={selectedUser}
            />
        </div>
    );
}
