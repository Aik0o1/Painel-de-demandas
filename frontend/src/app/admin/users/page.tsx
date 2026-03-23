"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, Filter, UserCheck, UserX, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserApproval } from "@/components/admin/UserApproval";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { apiGet } from "@/services/api";

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => apiGet('admin/users')
    });

    const filteredUsers = users?.filter((user: any) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.protocolNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Gerenciamento de Usuários
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Aprovação de contas e controle de permissões
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, email ou protocolo..."
                        className="pl-9 glass-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center p-8">Carregando usuários...</div>
                ) : (
                    filteredUsers?.map((user: any) => (
                        <Card key={user.id} className="glass-card border-white/5 overflow-hidden transition-all hover:border-white/10">
                            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                                        ${user.status === 'ACTIVE' ? 'bg-primary/20 text-primary' :
                                            user.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{user.name}</h3>
                                            {user.protocolNumber && (
                                                <Badge variant="outline" className="text-xs">{user.protocolNumber}</Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex gap-4">
                                            <span>{user.email}</span>
                                            <span>•</span>
                                            <span>{user.role}</span>
                                            <span>•</span>
                                            <span>Criado em {format(new Date(user.createdAt || user.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge className={
                                        user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                                            user.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' :
                                                'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                    }>
                                        {user.status === 'ACTIVE' ? 'Ativo' :
                                            user.status === 'PENDING' ? 'Pendente' :
                                                user.status === 'BLOCKED' ? 'Bloqueado' : 'Rejeitado'}
                                    </Badge>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsApprovalOpen(true);
                                        }}
                                    >
                                        <UserCog className="w-4 h-4 mr-2" />
                                        Gerenciar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <UserApproval
                user={selectedUser}
                isOpen={isApprovalOpen}
                onClose={() => setIsApprovalOpen(false)}
            />
        </div>
    );
}
