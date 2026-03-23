"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserApproval } from "@/components/admin/UserApproval";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { apiGet } from "@/services/api";

export function UserManagement() {
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, email ou protocolo..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Total: {filteredUsers?.length || 0} usuários
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center p-8 text-muted-foreground">Carregando usuários...</div>
                ) : (
                    filteredUsers?.map((user: any) => (
                        <Card key={user.id} className="border border-border/50 bg-card overflow-hidden transition-all hover:border-border">
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
                                            <Badge className={
                                                user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                                                    user.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' :
                                                        'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                            }>
                                                {user.status === 'ACTIVE' ? 'Ativo' :
                                                    user.status === 'PENDING' ? 'Pendente' :
                                                        user.status === 'BLOCKED' ? 'Bloqueado' : 'Rejeitado'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                                            <span>{user.email}</span>
                                            <span>•</span>
                                            <span className="capitalize">{user.role.toLowerCase()}</span>
                                            <span>•</span>
                                            <span>{format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                                        </div>
                                    </div>
                                </div>

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
                            </CardContent>
                        </Card>
                    ))
                )}

                {!isLoading && filteredUsers?.length === 0 && (
                    <div className="text-center p-12 rounded-xl border border-dashed border-border/50 text-muted-foreground bg-muted/20">
                        Nenhum usuário encontrado.
                    </div>
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
