"use client";

import { ActiveSessionsList } from "@/components/admin/ActiveSessionsList";
import { ShieldAlert } from "lucide-react";

export default function ActiveSessionsPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-primary" />
                Gerenciamento de Sessões Ativas
            </h1>

            <ActiveSessionsList />
        </div>
    );
}
