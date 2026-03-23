"use client";

import { OperationalDashboard } from "@/components/dashboard/views/OperationalDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <OperationalDashboard />
        </DashboardLayout>
    );
}
