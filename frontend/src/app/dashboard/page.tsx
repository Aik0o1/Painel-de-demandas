"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OperationalDashboard } from "@/components/dashboard/views/OperationalDashboard";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <OperationalDashboard />
        </DashboardLayout>
    );
}
