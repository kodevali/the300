
'use server';

import { getLockStatus as getLockStatusStorage, getAllLockStatuses as getAllLockStatusesStorage, saveLockStatus as saveLockStatusStorage, unlockAllLobs as unlockAllLobsStorage } from '@/lib/local-storage';

/**
 * Retrieves the lock status for a specific Line of Business.
 * @param lob - The name of the Line of Business.
 * @returns A promise that resolves to true if locked, false otherwise.
 */
export async function getLockStatus(lob: string): Promise<boolean> {
  if (!lob) return false;
  try {
    return await getLockStatusStorage(lob);
  } catch (error) {
    console.error(`Error fetching lock status for ${lob}: `, error);
    throw new Error("Failed to fetch lock status from local storage.");
  }
}

/**
 * Retrieves all lock statuses from local storage.
 * @returns A promise that resolves to a record of LOB names to their lock status.
 */
export async function getAllLockStatuses(): Promise<Record<string, boolean>> {
  try {
    return await getAllLockStatusesStorage();
  } catch (error) {
    console.error(`Error fetching all lock statuses: `, error);
    throw new Error("Failed to fetch all lock statuses from local storage.");
  }
}

/**
 * Saves the lock status for a specific Line of Business.
 * @param lob - The name of the Line of Business.
 * @param isLocked - The lock status to save.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveLockStatus(lob: string, isLocked: boolean): Promise<void> {
   if (!lob) return;
  try {
    await saveLockStatusStorage(lob, isLocked);
    console.log(`Successfully saved lock status for ${lob} to local storage.`);
  } catch (error) {
    console.error(`Error saving lock status for ${lob}: `, error);
    throw new Error("Failed to save lock status.");
  }
}

/**
 * Unlocks all Lines of Business rosters.
 * It determines the LOBs from the users collection.
 * @returns A promise that resolves when all LOBs are unlocked.
 */
export async function unlockAllLobs(): Promise<void> {
    try {
        await unlockAllLobsStorage();
        console.log(`Successfully unlocked all LOB rosters.`);
    } catch (error) {
        console.error("Error unlocking all LOBs:", error);
        throw new Error("Failed to unlock all LOB rosters.");
    }
}
