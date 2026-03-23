"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeesList } from "@/components/sectors/administrativa/EmployeesList";
import { InventoryList } from "@/components/sectors/administrativa/InventoryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdministrativaPage() {
    return (
        <RoleGuard allowedSectorSlugs={['administrativa']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Administrativo</h2>
                        <p className="text-muted-foreground">
                            Gestão de colaboradores e patrimônio.
                        </p>
                    </div>

                    <Tabs defaultValue="colaboradores" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
                            <TabsTrigger value="patrimonio">Patrimônio</TabsTrigger>
                        </TabsList>

                        <TabsContent value="colaboradores" className="space-y-4">
                            <EmployeesList />
                        </TabsContent>

                        <TabsContent value="patrimonio" className="space-y-4">
                            <InventoryList />
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
