
'use server';

import { getReasons as getReasonsStorage, saveReasons as saveReasonsStorage } from '@/lib/local-storage';

/**
 * Retrieves the list of reasons from local storage.
 * @returns A promise that resolves to an array of reason strings.
 */
export async function getReasons(): Promise<string[]> {
  try {
    return await getReasonsStorage();
  } catch (error) {
    console.error("Error fetching reasons from local storage: ", error);
    throw new Error("Failed to fetch reasons from local storage.");
  }
}

/**
 * Saves the list of reasons to local storage.
 * This will overwrite the existing list.
 * @param reasons - An array of reason strings.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveReasons(reasons: string[]): Promise<void> {
  try {
    await saveReasonsStorage(reasons);
    console.log('Successfully saved reasons list to local storage.');
  } catch (error) {
    console.error("Error saving reasons to local storage: ", error);
    throw new Error("Failed to save reasons.");
  }
}
