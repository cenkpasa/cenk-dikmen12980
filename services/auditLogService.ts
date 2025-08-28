import { db } from './dbService';
import { User, AuditLog } from '../types';

export const auditLogService = {
    logAction: async (user: User, action: string, entity: string, entityId: string, details?: string) => {
        try {
            const logEntry: AuditLog = {
                userId: user.id,
                userName: user.name,
                action,
                entity,
                entityId,
                timestamp: new Date().toISOString(),
                details,
            };
            await db.auditLogs.add(logEntry);
        } catch (error) {
            console.error("Failed to write to audit log:", error);
        }
    }
};
