import { prisma } from "@/lib/prisma";

interface AuditLogParams {
    action: string;
    action_type?: string;
    actor_name?: string;
    actor_email?: string;
    resource: string;
    resource_id?: string;
    details?: {
        before?: any;
        after?: any;
        extra?: any;
    };
    ip_address?: string;
}

export async function createAuditLog(params: AuditLogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action || (params.action_type ?? 'UNKNOWN'),
                module: params.resource || 'UNKNOWN',
                // Keep undefined if email matches, or let caller handle the relation ID
                // in most legacy Mongoose code it wasn't providing realistic user ID anyways
                userId: undefined,
                userName: params.actor_name || 'System',
                userEmail: params.actor_email,
                description: params.details ? JSON.stringify(params.details) : undefined,
                ipAddress: params.ip_address || '0.0.0.0',
                userAgent: 'System/Internal',
                metadata: {
                    resource_id: params.resource_id,
                    details: params.details,
                    action_type: params.action_type
                }
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
