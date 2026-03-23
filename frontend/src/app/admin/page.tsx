"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserManagement } from "@/components/admin/UserManagement";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { ActiveSessionsList } from "@/components/admin/ActiveSessionsList";
import { Settings } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'audit'>('users');

    return (
        <RoleGuard allowedRoles={['MASTER_ADMIN']}>
            <DashboardLayout>
                <div className="min-h-screen relative pb-32">
                    {/* Global Header */}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2">Administração</h1>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">Gestão Administrativa</p>
                        </div>

                    {/* Custom Tabs */}
                    <div className="flex p-1 bg-slate-200/50 dark:bg-background/50 rounded-xl max-w-fit mx-auto border border-white/5 mb-6">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users'
                                ? 'bg-white dark:bg-muted shadow-sm text-foreground'
                                : 'text-slate-500 hover:text-foreground'
                                }`}
                        >
                            Usuários
                        </button>
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sessions'
                                ? 'bg-white dark:bg-muted shadow-sm text-foreground'
                                : 'text-slate-500 hover:text-foreground'
                                }`}
                        >
                            Sessões Ativas
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'audit'
                                ? 'bg-white dark:bg-muted shadow-sm text-foreground'
                                : 'text-slate-500 hover:text-foreground'
                                }`}
                        >
                            Logs de Auditoria
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="animate-fade-in">
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'sessions' && (
                            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-card/40">
                                <ActiveSessionsList />
                            </div>
                        )}
                        {activeTab === 'audit' && (
                            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-card/40">
                                <h3 className="text-lg font-semibold mb-4">Logs do Sistema</h3>
                                <AuditLogViewer />
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
