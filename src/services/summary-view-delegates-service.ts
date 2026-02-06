
'use server';

import { getSummaryViewDelegateLobs as getSummaryViewDelegateLobsStorage, saveSummaryViewDelegateLobs as saveSummaryViewDelegateLobsStorage } from '@/lib/local-storage';

/**
 * Retrieves the list of LOBs that have summary view access for delegates.
 * @returns A promise that resolves to an array of LOB name strings.
 */
export async function getSummaryViewDelegateLobs(): Promise<string[]> {
  try {
    return await getSummaryViewDelegateLobsStorage();
  } catch (error) {
    console.error("Error fetching summary view delegate LOBs from local storage: ", error);
    throw new Error("Failed to fetch summary view delegate configuration.");
  }
}

/**
 * Saves the list of LOBs with delegate summary view access to local storage.
 * This will overwrite the existing list.
 * @param lobs - An array of LOB name strings.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveSummaryViewDelegateLobs(lobs: string[]): Promise<void> {
  try {
    await saveSummaryViewDelegateLobsStorage(lobs);
    console.log('Successfully saved summary view delegate LOB list to local storage.');
  } catch (error) {
    console.error("Error saving summary view delegate LOBs to local storage: ", error);
    throw new Error("Failed to save summary view delegate configuration.");
  }
}
