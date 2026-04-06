"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, FileText, Users, BarChart3 } from "lucide-react";

export default function PresidenciaPage() {
    return (
        <RoleGuard allowedSectorSlugs={['presidencia']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight mb-2">Presidência</h2>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                            Gestão estratégica e decisões institucionais.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">Estratégicos para a JUCEPI</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Decisões Pendentes</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">5</div>
                                <p className="text-xs text-muted-foreground">Aguardando parecer técnico</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Equipe</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">8</div>
                                <p className="text-xs text-muted-foreground">Membros da diretoria</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Desempenho Geral</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">94%</div>
                                <p className="text-xs text-muted-foreground">Metas do semestre</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Visão Geral Estratégica</CardTitle>
                            <CardDescription>
                                Acompanhamento dos principais indicadores de gestão da JUCEPI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md mt-4">
                            <p className="text-muted-foreground italic">Página em desenvolvimento: Os indicadores da Presidência estarão disponíveis em breve.</p>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
