
import { db } from '../db';

export const LogService = {
    /**
     * Purges logs older than a specified number of days.
     * @param daysToKeep Number of days to keep logs. Default is 30.
     */
    async purgeOldLogs(daysToKeep: number = 30): Promise<void> {
        const now = new Date();
        const cutoffDate = new Date(now.setDate(now.getDate() - daysToKeep));
        const cutoffTimestamp = cutoffDate.getTime();

        try {
            // Using IndexedDB index on 'timestamp' if available, or 'id' if timestamp is not indexed properly.
            // db.ts defines systemLogs: '++id, timestamp, level, module'
            // 'timestamp' is indexed.

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
