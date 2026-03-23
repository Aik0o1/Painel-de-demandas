import { prisma } from '@/lib/prisma';

class LoggerService {
    /**
     * Logs a system event to the database.
     * @param {string} actionType - 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
     * @param {string} resource - The resource being affected (e.g., 'Payments', 'Registry').
     * @param {string} resourceId - The ID of the resource.
     * @param {Object} details - { oldDoc, newDoc } or any other details.
     * @param {Object} user - The user object from the request (req.user or req.session.user).
     * @param {Object} req - The express/next request object to extract IP/UserAgent.
     */
    static async log(actionType, resource, resourceId, details, user, req = {}) {
        try {
            const ip = req.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) :
                (req.socket?.remoteAddress || 'unknown');

            const userAgent = req.headers ? req.headers['user-agent'] : 'unknown';

            const actorId = user._id || user.id;
            const actorName = user.name || user.full_name || user.email || 'System';

            await prisma.auditLog.create({
                data: {
                    action: actionType || 'UNKNOWN',
                    module: resource || 'UNKNOWN',
                    userId: actorId || null,
                    userName: actorName,
                    description: `Ação ${actionType} em ${resource}`,
                    metadata: {
                        resource_id: resourceId,
                        changes: {
                            before: details?.oldDoc || null,
                            after: details?.newDoc || null
                        }
                    },
                    ipAddress: ip,
                    userAgent: userAgent
                }
            });

        } catch (error) {
            console.error('FAILED TO CREATE AUDIT LOG:', error);
            // We do not throw error to avoid crashing the main business flow
        }
    }
}

export default LoggerService;
