"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BudgetCategoryGrid } from "@/components/sectors/financeira/BudgetCategoryGrid";
import { ContractsList } from "@/components/sectors/financeira/ContractsList";
import { PaymentsTable } from "@/components/sectors/financeira/PaymentsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function FinanceiraPage() {
    return (
        <RoleGuard allowedSectorSlugs={['financeira']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight mb-2">Financeiro</h2>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                            Controle orçamentário, contratos e pagamentos.
                        </p>
                    </div>

                    <Tabs defaultValue="orcamento" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
                            <TabsTrigger value="contratos">Contratos</TabsTrigger>
                            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="orcamento" className="space-y-4">
                            <BudgetCategoryGrid />
                        </TabsContent>

                        <TabsContent value="contratos" className="space-y-4">
                            <ContractsList />
                        </TabsContent>

                        <TabsContent value="pagamentos" className="space-y-4">
                            <PaymentsTable />
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
