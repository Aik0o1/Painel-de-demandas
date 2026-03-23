import { useRef, useState } from "react";
import { User, Mail, Phone, Settings, Bell, History, Moon, Globe, LogOut, X, ChevronRight, Lock, CreditCard, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

import { apiPost } from "@/services/api";

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
    const { profile, isLoading, updateProfile } = useCurrentProfile();
    const { signOut, user } = useAuth();

    // Using user data or fallbacks
    const fullName = profile?.full_name || user?.name || "Usuário";
    const userRole = profile?.role || "Usuário";
    const userEmail = profile?.email || user?.email || "";
    const userCpf = profile?.cpf || "Não informado";

    // Editable states
    const [userPositionState, setUserPositionState] = useState("");
    const [userFunctionState, setUserFunctionState] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    // Update states when profile loads (only once or when profile changes)
    if (profile && !isInitialized) {
        setUserPositionState(profile.position || "");
        setUserFunctionState(profile.function || "");
        setIsInitialized(true);
    }

    // Derived values for display (prefer state if editing, otherwise fallback to empty string which means "Sem...", handled below)
    const displayPosition = userPositionState || "Sem cargo";
    const displayFunction = userFunctionState || "Sem função";

    // Status color mapping
    const isOnline = true; // Hardcoded for now as per design

    const handleSignOut = async () => {
        await apiPost('auth/logout', {});
        await signOut();
        onOpenChange(false);
    };

    const handleSaveProfile = () => {
        updateProfile.mutate({
            position: userPositionState,
            function: userFunctionState
        });
    };

    if (isLoading && !profile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md bg-transparent border-none shadow-none flex items-center justify-center p-0">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-md w-full overflow-hidden sm:max-w-md">
                <div className="relative flex flex-col w-full bg-background font-display text-foreground selection:bg-primary selection:text-white antialiased overflow-hidden rounded-2xl shadow-xl border border-border">
                    {/* Background Pattern Wrapper */}
                    <div className="absolute inset-0 bg-circuit-pattern pointer-events-none z-0 opacity-30"></div>

                    {/* Top App Bar */}
                    <div className="relative z-20 flex items-center justify-between p-4 pb-2 bg-muted/30">
                        <DialogClose className="text-white hover:text-primary transition-colors flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 outline-none">
                            <X className="w-5 h-5" />
                        </DialogClose>
                        <h2 className="text-white text-lg font-bold leading-tight tracking-wider flex-1 text-center pr-10 uppercase">Perfil</h2>
                    </div>

                    <div className="relative z-10 flex-1 overflow-y-auto max-h-[85vh] scroller-none">
                        {/* Profile Hero Section */}
                        <section className="flex flex-col items-center pt-6 pb-8 px-4 relative">
                            <div className="relative group cursor-pointer">
                                {/* Neon Ring */}
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-transparent opacity-75 blur-md group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative rounded-full p-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent shadow-md">
                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 border-4 border-background-dark bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        {profile?.image || user?.image ? (
                                            <img src={profile?.image || user?.image || ''} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-white/50" />
                                        )}
                                    </div>
                                </div>
                                {/* Online Badge */}
                                <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background-dark ring-2 ring-background-dark">
                                    <div className={`h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_#0da6f2] ${isOnline ? 'animate-pulse' : ''}`}></div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center mt-5 space-y-1">
                                <h1 className="text-white text-2xl font-bold tracking-tight text-center">{fullName}</h1>
                                <p className="text-primary/80 text-sm font-medium tracking-wide uppercase">{displayPosition}</p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-primary/10 border border-primary/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    <span className="text-xs text-primary font-semibold tracking-widest uppercase">Online</span>
                                </div>
                            </div>
                        </section>

                        {/* Content Scroll Area */}
                        <main className="flex-1 px-4 pb-8 space-y-6">
                            {/* Personal Info Card */}
                            <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 pt-5 pb-2">
                                    <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Briefcase className="text-primary w-5 h-5" />
                                        Informações Pessoais
                                    </h3>
                                </div>
                                <div className="px-5 pb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 pt-2">
                                    {/* Email */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                                        <Mail className="text-gray-400 w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col justify-center border-b border-white/5 pb-1 w-full overflow-hidden">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Email</span>
                                        <span className="text-white text-sm font-normal truncate" title={userEmail}>{userEmail}</span>
                                    </div>

                                    {/* CPF */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                                        <CreditCard className="text-gray-400 w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col justify-center border-b border-white/5 pb-1">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">CPF</span>
                                        <span className="text-white text-sm font-normal">{userCpf}</span>
                                    </div>

                                    {/* Position */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                                        <Briefcase className="text-gray-400 w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col justify-center w-full border-b border-white/5 pb-1">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Cargo</span>
                                        <select
                                            value={userPositionState}
                                            onChange={(e) => setUserPositionState(e.target.value)}
                                            className="bg-transparent border-none text-white text-sm font-normal p-0 focus:ring-0 w-full"
                                        >
                                            <option className="bg-surface-dark text-white/50" value="" disabled>Selecione</option>
                                            <option className="bg-surface-dark text-white" value="Gerente">Gerente</option>
                                            <option className="bg-surface-dark text-white" value="Analista">Analista</option>
                                            <option className="bg-surface-dark text-white" value="Coordenador">Coordenador</option>
                                            <option className="bg-surface-dark text-white" value="Diretor">Diretor</option>
                                            <option className="bg-surface-dark text-white" value="Estagiário">Estagiário</option>
                                            <option className="bg-surface-dark text-white" value="Técnico">Técnico</option>
                                            <option className="bg-surface-dark text-white" value="Assistente">Assistente</option>
                                        </select>
                                    </div>

                                    {/* Department / Function */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                                        <Settings className="text-gray-400 w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col justify-center w-full">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Função / Depto</span>
                                        <select
                                            value={userFunctionState}
                                            onChange={(e) => setUserFunctionState(e.target.value)}
                                            className="bg-transparent border-none text-white text-sm font-normal p-0 focus:ring-0 w-full"
                                        >
                                            <option className="bg-surface-dark text-white/50" value="" disabled>Selecione</option>
                                            <option className="bg-surface-dark text-white" value="Administrativo">Administrativo</option>
                                            <option className="bg-surface-dark text-white" value="Financeiro">Financeiro</option>
                                            <option className="bg-surface-dark text-white" value="Tecnologia">Tecnologia</option>
                                            <option className="bg-surface-dark text-white" value="Jurídico">Jurídico</option>
                                            <option className="bg-surface-dark text-white" value="Recursos Humanos">Recursos Humanos</option>
                                            <option className="bg-surface-dark text-white" value="Comunicação">Comunicação</option>
                                            <option className="bg-surface-dark text-white" value="Registro">Registro</option>
                                            <option className="bg-surface-dark text-white" value="Operacional">Operacional</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="px-5 pb-2 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={updateProfile.isPending}
                                        className="text-primary text-xs font-bold uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                                    </button>
                                </div>
                            </section>

                            {/* Settings Card */}
                            <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 pt-5 pb-2">
                                    <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Settings className="text-primary w-5 h-5" />
                                        Configurações
                                    </h3>
                                </div>
                                <div className="flex flex-col">
                                    {/* Security - Visual Only */}
                                    <button className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:text-white group-hover:bg-primary transition-all">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium text-white">Segurança & Senha</span>
                                        </div>
                                        <ChevronRight className="text-gray-500 group-hover:text-white w-5 h-5" />
                                    </button>

                                    {/* System - Visual Only */}
                                    <button className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group border-t border-white/5 w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:text-white group-hover:bg-primary transition-all">
                                                <Moon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium text-white">Aparência</span>
                                        </div>
                                        <ChevronRight className="text-gray-500 group-hover:text-white w-5 h-5" />
                                    </button>
                                </div>
                            </section>

                            {/* Logout Button */}
                            <button
                                onClick={handleSignOut}
                                className="w-full relative group overflow-hidden rounded-xl bg-transparent border border-destructive/30 p-4 transition-all duration-300 hover:border-destructive hover:shadow-md cursor-pointer mt-2"
                            >
                                <div className="absolute inset-0 bg-destructive/5 group-hover:bg-destructive/10 transition-colors"></div>
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    <LogOut className="text-destructive w-5 h-5" />
                                    <span className="text-destructive font-bold uppercase tracking-widest text-sm">Sair do Sistema</span>
                                </div>
                            </button>

                            {/* Version Info */}
                            <div className="text-center pb-4 mt-2">
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Versão 2.4.0 • Build 8921</p>
                            </div>
                        </main>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
