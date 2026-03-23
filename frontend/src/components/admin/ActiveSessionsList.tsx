"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldAlert, Trash2, Monitor, Smartphone, Tablet, User, Globe } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { UAParser } from "ua-parser-js";
import { Badge } from "@/components/ui/badge";

interface Session {
    _id: string;
    sessionId: string;
    user: {
        name: string;
        email: string;
        image?: string;
    };
    startTime: string;
    ipAddress: string;
    userAgent: string;
}

import { apiGet, apiPost } from "@/services/api";

export function ActiveSessionsList() {
    const { data: sessionData } = useSession();
    const queryClient = useQueryClient();
    const currentSessionId = (sessionData?.user as any)?.sessionId;

    const { data: sessions, isLoading } = useQuery<Session[]>({
        queryKey: ['admin-sessions'],
        queryFn: async () => apiGet('admin/sessions')
    });

    const terminateMutation = useMutation({
        mutationFn: async (sessionId: string) => apiPost('admin/sessions/terminate', { sessionId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
            toast.success("Sessão encerrada com sucesso!");
        },
        onError: () => {
            toast.error("Erro ao encerrar sessão.");
        }
    });

    const getDeviceIcon = (type?: string) => {
        if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
        if (type === 'tablet') return <Tablet className="w-4 h-4" />;
        return <Monitor className="w-4 h-4" />;
    };

    if (isLoading) return <div className="p-8 text-center">Carregando sessões...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Sessões Ativas
            </h2>

            <div className="grid gap-4">
                {sessions?.map((session) => {
                    const parser = new UAParser(session.userAgent);
                    const browser = parser.getBrowser();
                    const os = parser.getOS();
                    const device = parser.getDevice();
                    const isCurrentSession = session.sessionId === currentSessionId;

                    return (
                        <Card key={session.sessionId} className={`overflow-hidden glass-card border ${isCurrentSession ? 'border-primary/50 bg-primary/5' : 'border-white/5'}`}>
                            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${isCurrentSession ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg text-foreground">{session.user.name}</h3>
                                            {isCurrentSession && (
                                                <Badge variant="default" className="text-[10px] h-5">Sua Sessão Atual</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{session.user.email}</p>

                                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5" title={session.userAgent}>
                                                {getDeviceIcon(device.type)}
                                                <span className="font-medium">
                                                    {browser.name} {browser.version}
                                                </span>
                                                <span className="text-muted-foreground/60 mx-1">•</span>
                                                <span>{os.name} {os.version}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-muted/50 px-2 py-0.5 rounded border border-slate-200 dark:border-border">
                                                <Globe className="w-3 h-3" />
                                                IP: {session.ipAddress}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span>Iniciado em: {format(new Date(session.startTime), "PPP 'às' HH:mm", { locale: ptBR })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant={isCurrentSession ? "outline" : "destructive"}
                                    size="sm"
                                    onClick={() => {
                                        const message = isCurrentSession
                                            ? "ATENÇÃO: Você está prestes a encerrar sua própria sessão atual. Você será deslogado imediatamente. Deseja continuar?"
                                            : "Tem certeza que deseja derrubar esta sessão?";

                                        if (confirm(message)) {
                                            terminateMutation.mutate(session.sessionId);
                                        }
                                    }}
                                    disabled={terminateMutation.isPending}
                                    className={isCurrentSession ? "border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600" : ""}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {isCurrentSession ? "Encerrar Esta Sessão" : "Encerrar Sessão"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}

                {sessions?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                        Nenhuma sessão ativa encontrada.
                    </div>
                )}
            </div>
        </div>
    );
}
