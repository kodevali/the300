
'use server';

import { getAdmins as getAdminsStorage, saveAdmins as saveAdminsStorage } from '@/lib/local-storage';

/**
 * Retrieves the list of admin emails from local storage.
 * @returns A promise that resolves to an array of admin email strings.
 */
export async function getAdmins(): Promise<string[]> {
  try {
    return await getAdminsStorage();
  } catch (error) {
    console.error("Error fetching admins from local storage: ", error);
    throw new Error("Failed to fetch admins from local storage.");
  }
}

/**
 * Saves the list of admin emails to local storage.
 * This will overwrite the existing list.
 * @param adminEmails - An array of admin email strings.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveAdmins(adminEmails: string[]): Promise<void> {
  try {
    await saveAdminsStorage(adminEmails.map(e => e.toLowerCase()));
    console.log('Successfully saved admin list to local storage.');
  } catch (error) {
    console.error("Error saving admins to local storage: ", error);
    throw new Error("Failed to save admins.");
  }
}
