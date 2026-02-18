
import { db } from '../db';
import { SystemLogDTO } from '../types';

export const LogService = {
    /**
     * Logs an event to the system logs.
     * @param level Severity level (INFO, WARN, ERROR)
     * @param module Module or Component name
     * @param action Short action description
     * @param details Detailed message or error stack
     */
    async log(level: 'INFO' | 'WARN' | 'ERROR', module: string, action: string, details: string | any): Promise<void> {
        try {
            const logEntry: SystemLogDTO = {
                timestamp: new Date().toISOString(),
                level,
                module,
                action,
                details: typeof details === 'object' ? JSON.stringify(details) : String(details)
            };

            await db.rawDb.systemLogs.add(logEntry);

            // Optional: Console output for debugging during dev
            if (import.meta.env?.DEV) {
                console.log(`[${module}] ${action}:`, details);
            }
        } catch (error) {
            // Fallback if logging fails (e.g. storage full)
            console.error('[LogService] Failed to write log:', error);
        }
    },

    async getLogs(limit: number = 100): Promise<SystemLogDTO[]> {
        return await db.rawDb.systemLogs
            .orderBy('timestamp')
            .reverse()
            .limit(limit)
            .toArray();
    },

    /**
     * Purges logs older than a specified number of days.
     * @param daysToKeep Number of days to keep logs. Default is 30.
     */
    async purgeOldLogs(daysToKeep: number = 30): Promise<void> {
        const now = new Date();
        const cutoffDate = new Date(now.setDate(now.getDate() - daysToKeep));
        const cutoffTimestamp = cutoffDate.toISOString(); // Timestamp is ISOString in DTO, but wait.

        // DB Schema says `timestamp` index.
        // In types.ts: timestamp: DateISOString.
        // In db.ts: systemLogs: '++id, timestamp, level, module'

        // If we store ISO strings, we can query by string comparison (lexicographical) which works for ISO dates.

        try {
            const deleteCount = await db.rawDb.systemLogs
                .where('timestamp')
                .below(cutoffTimestamp)
                .delete();

            if (deleteCount > 0) {
                console.log(`[LogService] Purged ${deleteCount} logs older than ${daysToKeep} days.`);
            }
        } catch (error) {
            console.error('[LogService] Failed to purge logs:', error);
        }
    }
};
