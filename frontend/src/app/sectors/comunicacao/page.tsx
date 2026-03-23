"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectList } from "@/components/sectors/comunicacao/ProjectList";
import { WeeklyDemandsCard } from "@/components/sectors/comunicacao/WeeklyDemandsCard";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ComunicacaoPage() {
    return (
        <RoleGuard allowedSectorSlugs={['comunicacao']}>
            <DashboardLayout>
                <div className="relative">
                    <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-50"></div>
                    <div className="relative m-0 z-10 flex flex-col pb-24 space-y-6">
                        <header className="">
                            <h1 className="text-4xl font-bold tracking-tight mb-2">
                                Comunicação
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                                Gestão de projetos de mídia e demandas semanais.
                            </p>
                        </header>

                        <div className="grid gap-6 md:grid-cols-7 items-start">
                            <section className="md:col-span-4 lg:col-span-5">
                                <ProjectList />
                            </section>
                            <section className="md:col-span-3 lg:col-span-2 h-full">
                                <WeeklyDemandsCard />
                            </section>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
