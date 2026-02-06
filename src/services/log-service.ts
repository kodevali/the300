
'use server';

import { addLogEntry, getLogs as getLogsStorage, clearLogs as clearLogsStorage } from '@/lib/local-storage';

export interface LogEntry {
    id: string;
    timestamp: string;
    user: {
        name: string;
        email: string;
        roles: string[];
    };
    action: string;
    details?: Record<string, any>;
}

/**
 * Records an action in the change log.
 * @param user - The user performing the action.
 * @param action - A description of the action.
 * @param details - Optional details about the action.
 */
export async function logAction(
    user: { name: string; email: string; roles: string[] },
    action: string,
    details?: Record<string, any>
): Promise<void> {
  try {
    await addLogEntry({ user, action, details });
  } catch (error) {
    console.error("Error writing to change log:", error);
    // We don't throw an error here to not disrupt the user's main action
  }
}

/**
 * Retrieves all log entries from local storage.
 * @returns A promise that resolves to an array of LogEntry objects.
 */
export async function getLogs(): Promise<Omit<LogEntry, 'id'>[]> {
  try {
    return await getLogsStorage();
  } catch (error) {
    console.error("Error fetching change logs:", error);
    throw new Error("Failed to retrieve change logs.");
  }
}

/**
 * Deletes all documents in the changelog.
 * This is an irreversible action.
 */
export async function clearAllLogs(): Promise<void> {
    try {
        await clearLogsStorage();
        console.log('Successfully cleared all change logs.');
    } catch (error) {
        console.error("Error clearing all change logs:", error);
        throw new Error("Failed to clear all change logs.");
    }
}
