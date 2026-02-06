
'use server';

import { getSummaryViewLobs as getSummaryViewLobsStorage, saveSummaryViewLobs as saveSummaryViewLobsStorage } from '@/lib/local-storage';

/**
 * Retrieves the list of LOBs that have summary view access.
 * @returns A promise that resolves to an array of LOB name strings.
 */
export async function getSummaryViewLobs(): Promise<string[]> {
  try {
    return await getSummaryViewLobsStorage();
  } catch (error) {
    console.error("Error fetching summary view LOBs from local storage: ", error);
    throw new Error("Failed to fetch summary view configuration.");
  }
}

/**
 * Saves the list of LOBs with summary view access to local storage.
 * This will overwrite the existing list.
 * @param lobs - An array of LOB name strings.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveSummaryViewLobs(lobs: string[]): Promise<void> {
  try {
    await saveSummaryViewLobsStorage(lobs);
    console.log('Successfully saved summary view LOB list to local storage.');
  } catch (error) {
    console.error("Error saving summary view LOBs to local storage: ", error);
    throw new Error("Failed to save summary view configuration.");
  }
}
